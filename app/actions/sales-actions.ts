"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withTenantWhere, withTenantData } from '@/lib/tenant-db';
import { getSessionCompanyId, resolveActionCompanyId } from '@/lib/session';
import { logActivity } from '@/lib/audit';
import { createNotification } from '@/app/actions/notification-actions';

const saleSchema = z.object({
  userId: z.coerce.number().min(1),
  client: z.string().optional().nullable(),
  customerId: z.coerce.number().nullable().optional(),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().default('EFECTIVO'),
  remarks: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'COMPLETED', 'VOIDED']).default('COMPLETED'),
  items: z.array(z.object({
    productId: z.coerce.number(),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).default(0),
  })).min(1, 'Debes agregar al menos un producto'),
});

export async function createSale(data: {
  userId: any;
  client?: string | null;
  customerId?: any;
  discount?: number;
  paymentMethod?: string;
  remarks?: string | null;
  status?: 'PENDING' | 'COMPLETED';
  items: { productId: any; quantity: number; unitPrice: number; discount: number }[];
}) {
  try {
    const parsed = saleSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const { userId, client, customerId, discount = 0, paymentMethod = 'EFECTIVO', remarks, status = 'COMPLETED', items } = parsed.data;

    // Aislamiento Tenant: Obtener companyId (con fallback para SUPERADMIN)
    const companyId = (await getSessionCompanyId()) ?? (await resolveActionCompanyId());
    if (!companyId) {
      return { success: false, error: 'No autorizado o empresa no válida' };
    }

    // Si el estado es COMPLETED, validar stock para todos los productos en el tenant actual
    if (status === 'COMPLETED') {
      const settings = await prisma.companySetting.findUnique({ where: { companyId } });
      const allowNegativeStock = settings?.allowNegativeStock ?? false;

      for (const item of items) {
        const whereProduct = await withTenantWhere({ id: item.productId });
        const product = await prisma.product.findFirst({ where: whereProduct });
        if (!product) return { success: false, error: `Producto no encontrado o no autorizado` };
        if (!allowNegativeStock && product.quantityAvailable < item.quantity) {
          return {
            success: false,
            error: `Stock insuficiente para "${product.name}". Disponible: ${product.quantityAvailable} u.`
          };
        }
      }
    }

    // Calcular totales
    const subtotalBeforeDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Distribuir descuento global de forma proporcional o sumar los de fila
    let finalItems = items.map(item => {
      const rowSubtotal = item.quantity * item.unitPrice;
      let rowDiscount = item.discount;

      if (discount > 0 && subtotalBeforeDiscount > 0) {
        const propDiscount = Math.round(discount * (rowSubtotal / subtotalBeforeDiscount));
        rowDiscount += propDiscount;
      }

      const rowTotal = Math.max(0, rowSubtotal - rowDiscount);
      return {
        ...item,
        subtotal: rowSubtotal,
        discount: rowDiscount,
        total: rowTotal,
      };
    });

    const total = finalItems.reduce((sum, item) => sum + item.total, 0);

    const saleDetailData = finalItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discount: item.discount,
      total: item.total,
      companyId, // Asignar tenant
    }));

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    // Ejecutar transaccionalidad segura de consecutivos y actualización de inventario
    const result = await prisma.$transaction(async (tx) => {
      // 1. Consecutivo seguro por empresa y fecha
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const counter = await tx.invoiceCounter.upsert({
        where: {
          companyId_date: {
            companyId,
            date: startOfDay,
          }
        },
        update: {
          lastSeq: { increment: 1 }
        },
        create: {
          companyId,
          date: startOfDay,
          lastSeq: 1,
        }
      });

      const saleNumber = `VEN-${dateStr}-${String(counter.lastSeq).padStart(4, '0')}`;

      // 2. Crear Venta
      const createdSale = await tx.sale.create({
        data: {
          saleNumber,
          userId,
          client: client || null,
          customerId: customerId || null,
          discount,
          total,
          paymentMethod,
          status,
          remarks: remarks || null,
          companyId,
          details: { create: saleDetailData }
        }
      });

      // 3. Si se completó, reducir existencias
      const lowStockProducts: any[] = [];
      const settings = await tx.companySetting.findUnique({ where: { companyId } });
      const allowNegativeStock = settings?.allowNegativeStock ?? false;
      
      if (status === 'COMPLETED') {
        for (const item of finalItems) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newQty = product.quantityAvailable - item.quantity;
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantityAvailable: newQty,
                soldQuantity: { increment: item.quantity },
                status: newQty <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
              }
            });
            
            if (newQty <= 0) {
              lowStockProducts.push({ name: product.name, type: 'CERO', newQty });
            } else if (newQty <= 5) {
              lowStockProducts.push({ name: product.name, type: 'BAJO', newQty });
            }
          }
        }
      }

      return { id: createdSale.id, saleNumber, total, sale: createdSale, lowStockProducts };
    });

    await logActivity({
      module: 'SALES',
      action: 'CREATE',
      entity: 'Sale',
      entityId: result.id,
      description: `Registró la venta "${result.saleNumber}" en estado ${status} (Total: $${result.total.toLocaleString()})`,
      newValues: result.sale
    });

    const companyUsers = await prisma.user.findMany({
      where: { companyId },
      include: { role: true }
    });

    if (status === 'PENDING') {
      for (const user of companyUsers) {
        const isAdminOrSuper = user.role?.name === 'ADMIN' || user.role?.name === 'SUPERADMIN';
        const isCreator = user.id === userId;

        if (isCreator || isAdminOrSuper) {
          const msg = !isCreator && isAdminOrSuper
            ? `Se ha registrado la venta pendiente ${result.saleNumber} por $${result.total.toLocaleString('es-CO')} por un usuario.`
            : `Has registrado la venta pendiente ${result.saleNumber} por $${result.total.toLocaleString('es-CO')}. Completa el cobro en el módulo de Ventas.`;

          await createNotification(
            user.id,
            companyId,
            '⚠️ Venta Pendiente Registrada',
            msg,
            'WARNING'
          );
        }
      }
    } else {
      const admins = companyUsers.filter(u => u.roleId !== null);
      for (const admin of admins) {
        await createNotification(
          admin.id,
          companyId,
          'Venta Confirmada',
          `Se ha completado la venta ${result.saleNumber} por un total de $${result.total.toLocaleString('es-CO')}`,
          'SUCCESS'
        );
        
        for (const ls of result.lowStockProducts) {
          await createNotification(
            admin.id,
            companyId,
            ls.type === 'CERO' ? 'Stock Agotado' : 'Stock Bajo',
            `El producto "${ls.name}" ahora tiene ${ls.newQty} unidades disponibles.`,
            ls.type === 'CERO' ? 'ERROR' : 'WARNING'
          );
        }
      }
    }

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard');

    return { success: true, saleNumber: result.saleNumber, total: result.total };
  } catch (error: any) {
    console.error('[CREATE_SALE]', error);
    return { success: false, error: error.message ?? 'Error al registrar la venta' };
  }
}

export async function completePendingSale(saleIdInput: any, updateData?: {
  paymentMethod?: string;
  client?: string | null;
  customerId?: number | null;
  remarks?: string | null;
  discount?: number;
}) {
  const saleId = Number(saleIdInput);
  if (isNaN(saleId)) return { success: false, error: 'ID inválido' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sessionCompanyId = await getSessionCompanyId();

      const sale = await tx.sale.findFirst({
        where: sessionCompanyId ? { id: saleId, companyId: sessionCompanyId } : { id: saleId },
        include: { details: { include: { product: true } } }
      });

      if (!sale) throw new Error('Venta no encontrada o no autorizada');
      if (sale.status !== 'PENDING') throw new Error('La venta no está pendiente');

      const companyId = sale.companyId ?? (await resolveActionCompanyId());

      const settings = await tx.companySetting.findUnique({ where: { companyId } });
      const allowNegativeStock = settings?.allowNegativeStock ?? false;

      // Validar existencias
      for (const detail of sale.details) {
        if (!allowNegativeStock && detail.product.quantityAvailable < detail.quantity) {
          throw new Error(`Stock insuficiente para "${detail.product.name}". Disponible: ${detail.product.quantityAvailable} u.`);
        }
      }

      // Descontar inventario
      const lowStockProducts: any[] = [];
      for (const detail of sale.details) {
        let newQty = detail.product.quantityAvailable - detail.quantity;
        if (!allowNegativeStock && newQty < 0) {
          newQty = 0;
        }
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            quantityAvailable: newQty,
            soldQuantity: { increment: detail.quantity },
            status: newQty <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
          }
        });
        
        if (newQty <= 0) {
          lowStockProducts.push({ name: detail.product.name, type: 'CERO', newQty });
        } else if (newQty <= 5) {
          lowStockProducts.push({ name: detail.product.name, type: 'BAJO', newQty });
        }
      }

      // Recalcular total si el descuento cambió
      let total = sale.total;
      if (updateData && updateData.discount !== undefined) {
        const subtotal = sale.details.reduce((s, d) => s + d.subtotal, 0);
        const itemDiscounts = sale.details.reduce((s, d) => s + d.discount, 0);
        total = Math.max(0, subtotal - itemDiscounts - updateData.discount);
      }

      // Actualizar estado de la venta y datos finales
      const updated = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'COMPLETED',
          ...(updateData ? {
            paymentMethod: updateData.paymentMethod,
            client: updateData.client,
            customerId: updateData.customerId,
            remarks: updateData.remarks,
            discount: updateData.discount,
            total,
          } : {})
        }
      });

      return { oldValues: sale, newValues: updated, lowStockProducts, companyId };
    });

    // Auto-eliminar las notificaciones de venta pendiente asociadas
    try {
      await prisma.notification.deleteMany({
        where: {
          companyId: result.companyId,
          message: { contains: result.newValues.saleNumber }
        }
      });
    } catch {}

    await logActivity({
      module: 'SALES',
      action: 'UPDATE',
      entity: 'Sale',
      entityId: saleId,
      description: `Completó y cobró la venta pendiente "${result.newValues.saleNumber}" (Total final: $${result.newValues.total.toLocaleString()})`,
      oldValues: result.oldValues,
      newValues: result.newValues
    });

    const admins = await prisma.user.findMany({
      where: { companyId: result.companyId, role: { name: 'ADMIN' } }
    });
    for (const admin of admins) {
      await createNotification(
        admin.id,
        result.companyId,
        'Venta Confirmada',
        `Se ha completado la venta pendiente ${result.newValues.saleNumber} por $${result.newValues.total.toLocaleString()}`,
        'SUCCESS'
      );
      
      for (const ls of result.lowStockProducts) {
        await createNotification(
          admin.id,
          result.companyId,
          ls.type === 'CERO' ? 'Stock Agotado' : 'Stock Bajo',
          `El producto "${ls.name}" ahora tiene ${ls.newQty} unidades disponibles.`,
          ls.type === 'CERO' ? 'ERROR' : 'WARNING'
        );
      }
    }

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Error al completar la venta' };
  }
}

export async function voidSale(data: {
  saleId: any;
  voidedByUserId: any;
  reason: string;
}) {
  const saleId = Number(data.saleId);
  const voidedByUserId = Number(data.voidedByUserId);
  const { reason } = data;

  if (isNaN(saleId) || isNaN(voidedByUserId) || !reason) {
    return { success: false, error: 'Todos los campos son obligatorios para anular la venta' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sessionCompanyId = await getSessionCompanyId();

      const sale = await tx.sale.findFirst({
        where: sessionCompanyId ? { id: saleId, companyId: sessionCompanyId } : { id: saleId },
        include: { details: { include: { product: true } } }
      });

      if (!sale) throw new Error('Venta no encontrada o no autorizada');
      if (sale.status === 'VOIDED') throw new Error('La venta ya está anulada');

      // Si estaba completada, devolver existencias
      if (sale.status === 'COMPLETED') {
        for (const detail of sale.details) {
          const newQty = detail.product.quantityAvailable + detail.quantity;
          const newSold = Math.max(0, detail.product.soldQuantity - detail.quantity);
          await tx.product.update({
            where: { id: detail.productId },
            data: {
              quantityAvailable: newQty,
              soldQuantity: newSold,
              status: 'AVAILABLE',
            }
          });
        }
      }

      // Marcar como anulada
      const updated = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'VOIDED',
          voidedByUserId,
          voidedAt: new Date(),
          voidedReason: reason,
        }
      });

      return { oldValues: sale, newValues: updated };
    });

    await logActivity({
      module: 'SALES',
      action: 'VOID',
      entity: 'Sale',
      entityId: saleId,
      description: `Anuló la venta "${result.newValues.saleNumber}". Motivo: ${reason}`,
      oldValues: result.oldValues,
      newValues: result.newValues
    });

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Error al anular la venta' };
  }
}

export async function deleteSale(idInput: any) {
  const id = Number(idInput);
  if (isNaN(id)) return { success: false, error: 'ID inválido' };

  try {
    const sessionCompanyId = await getSessionCompanyId();

    const sale = await prisma.sale.findFirst({
      where: sessionCompanyId ? { id, companyId: sessionCompanyId } : { id },
      include: { details: true }
    });

    if (!sale) return { success: false, error: 'Venta no encontrada o no autorizada' };

    await prisma.$transaction(async (tx) => {
      // Devolver stock si estaba completada
      if (sale.status === 'COMPLETED') {
        for (const detail of sale.details) {
          const product = await tx.product.findFirst({
            where: { id: detail.productId }
          });
          if (product) {
            await tx.product.update({
              where: { id: detail.productId },
              data: {
                quantityAvailable: { increment: detail.quantity },
                soldQuantity: { decrement: detail.quantity },
                status: 'AVAILABLE',
              }
            });
          }
        }
      }
      // Borrar venta (Details se borran por cascade en Prisma)
      await tx.sale.delete({ where: { id } });
    });

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Error al eliminar la venta' };
  }
}

export async function getSalesReport(filters: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { startDate, endDate } = filters;
  const companyId = (await getSessionCompanyId()) ?? (await resolveActionCompanyId());
  if (!companyId) throw new Error('No autorizado o sin empresa');

  const where: any = { companyId };
  if (startDate && endDate) {
    where.createdAt = { gte: startDate, lte: endDate };
  }

  return prisma.sale.findMany({
    where,
    include: {
      user: { select: { name: true } },
      details: {
        include: { product: { select: { name: true, code: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

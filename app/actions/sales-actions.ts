"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const saleSchema = z.object({
  userId: z.string().min(1),
  client: z.string().optional(),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.string().default('EFECTIVO'),
  remarks: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'VOIDED']).default('COMPLETED'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.coerce.number().min(1),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).default(0), // Row-level discount
  })).min(1, 'Debes agregar al menos un producto'),
});

function generateSaleNumber(count: number): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `VEN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

export async function createSale(data: {
  userId: string;
  client?: string;
  discount?: number;
  paymentMethod?: string;
  remarks?: string;
  status?: 'PENDING' | 'COMPLETED';
  items: { productId: string; quantity: number; unitPrice: number; discount: number }[];
}) {
  const parsed = saleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { userId, client, discount = 0, paymentMethod = 'EFECTIVO', remarks, status = 'COMPLETED', items } = parsed.data;

  // If status is COMPLETED, validate stock for all items
  if (status === 'COMPLETED') {
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) return { success: false, error: `Producto no encontrado` };
      if (product.quantityAvailable < item.quantity) {
        return {
          success: false,
          error: `Stock insuficiente para "${product.name}". Disponible: ${product.quantityAvailable} u.`
        };
      }
    }
  }

  const count = await prisma.sale.count();
  const saleNumber = generateSaleNumber(count);

  // Calculate totals
  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  
  // Distribute global discount proportionally if provided, or sum item-level discounts
  let finalItems = items.map(item => {
    const rowSubtotal = item.quantity * item.unitPrice;
    let rowDiscount = item.discount;

    if (discount > 0 && subtotalBeforeDiscount > 0) {
      // Add proportional global discount to any item-level discount
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
  }));

  // Perform transaction
  await prisma.$transaction(async (tx) => {
    // Create Sale
    const createdSale = await tx.sale.create({
      data: {
        saleNumber,
        userId,
        client: client || null,
        discount,
        total,
        paymentMethod,
        status,
        remarks: remarks || null,
        details: { create: saleDetailData }
      }
    });

    // If status is COMPLETED, update inventory
    if (status === 'COMPLETED') {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newQty = Math.max(0, product.quantityAvailable - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantityAvailable: newQty,
              soldQuantity: { increment: item.quantity },
              status: newQty === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
            }
          });
        }
      }
    }
  });

  revalidatePath('/dashboard/sales');
  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard');

  return { success: true, saleNumber, total };
}

export async function completePendingSale(saleId: string) {
  if (!saleId) return { success: false, error: 'ID inválido' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { details: { include: { product: true } } }
      });

      if (!sale) throw new Error('Venta no encontrada');
      if (sale.status !== 'PENDING') throw new Error('La venta no está pendiente');

      // Validate stock
      for (const detail of sale.details) {
        if (detail.product.quantityAvailable < detail.quantity) {
          throw new Error(`Stock insuficiente para "${detail.product.name}". Disponible: ${detail.product.quantityAvailable} u.`);
        }
      }

      // Update products stock
      for (const detail of sale.details) {
        const newQty = Math.max(0, detail.product.quantityAvailable - detail.quantity);
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            quantityAvailable: newQty,
            soldQuantity: { increment: detail.quantity },
            status: newQty === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
          }
        });
      }

      // Update sale status
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'COMPLETED' }
      });

      return { success: true, error: null };
    });

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Error al completar la venta' };
  }
}

export async function voidSale(data: {
  saleId: string;
  voidedByUserId: string;
  reason: string;
}) {
  const { saleId, voidedByUserId, reason } = data;
  if (!saleId || !voidedByUserId || !reason) {
    return { success: false, error: 'Todos los campos son obligatorios para anular la venta' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { details: { include: { product: true } } }
      });

      if (!sale) throw new Error('Venta no encontrada');
      if (sale.status === 'VOIDED') throw new Error('La venta ya está anulada');

      // If it was completed, restore the stock
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

      // Update status and register void details
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'VOIDED',
          voidedByUserId,
          voidedAt: new Date(),
          voidedReason: reason,
        }
      });

      return { success: true };
    });

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Error al anular la venta' };
  }
}

export async function deleteSale(id: string) {
  if (!id) return { success: false };

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { details: true }
    });

    if (!sale) return { success: false, error: 'Venta no encontrada' };

    await prisma.$transaction(async (tx) => {
      // If it was completed, restore stock
      if (sale.status === 'COMPLETED') {
        for (const detail of sale.details) {
          const product = await tx.product.findUnique({ where: { id: detail.productId } });
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
      // Delete the sale (onDelete Cascade deletes details)
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
  const where: any = {};
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

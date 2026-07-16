"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withTenantWhere, withTenantData } from '@/lib/tenant-db';
import { getSessionCompanyId } from '@/lib/session';
import { ProductStatus } from '@prisma/client';
import { logActivity } from '@/lib/audit';

const productSchema = z.object({
  code: z.string().min(2, 'El código es obligatorio'),
  name: z.string().min(2, 'El nombre es obligatorio'),
  categoryId: z.coerce.number().min(1, 'La categoría es obligatoria'),
  supplierId: z.coerce.number().min(1, 'El proveedor es obligatorio'),
  quantityAvailable: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  productGroupId: z.coerce.number().nullable().optional(),
});

export async function createProduct(formData: FormData) {
  try {
    const parsed = productSchema.safeParse({
      code: formData.get('code'),
      name: formData.get('name'),
      categoryId: formData.get('categoryId'),
      supplierId: formData.get('supplierId'),
      quantityAvailable: formData.get('quantityAvailable'),
      unitCost: formData.get('unitCost'),
      salePrice: formData.get('salePrice'),
      productGroupId: formData.get('productGroupId') ? Number(formData.get('productGroupId')) : null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Validar código único por empresa
    const whereCode = await withTenantWhere({ code: parsed.data.code });
    const existingCode = await prisma.product.findFirst({ where: whereCode });
    if (existingCode) {
      return { success: false, error: 'Ya existe un producto con el mismo código' };
    }

    const quantity = parsed.data.quantityAvailable;
    const status = quantity === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE;

    const data = await withTenantData({
      code: parsed.data.code,
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      supplierId: parsed.data.supplierId,
      quantityAvailable: quantity,
      unitCost: parsed.data.unitCost,
      salePrice: parsed.data.salePrice,
      status,
      soldQuantity: 0,
      productGroupId: parsed.data.productGroupId || null,
    });

    const newProduct = await prisma.product.create({ data });

    await logActivity({
      module: 'PRODUCTS',
      action: 'CREATE',
      entity: 'Product',
      entityId: newProduct.id,
      description: `Creó el producto "${newProduct.name}" (Código: ${newProduct.code})`,
      newValues: newProduct
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    console.error('[CREATE_PRODUCT]', error);
    return { success: false, error: error.message ?? 'Error al crear el producto' };
  }
}

export async function updateProduct(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) return { success: false, error: 'ID inválido' };

    const parsed = productSchema.safeParse({
      code: formData.get('code'),
      name: formData.get('name'),
      categoryId: formData.get('categoryId'),
      supplierId: formData.get('supplierId'),
      quantityAvailable: formData.get('quantityAvailable'),
      unitCost: formData.get('unitCost'),
      salePrice: formData.get('salePrice'),
      productGroupId: formData.get('productGroupId') ? Number(formData.get('productGroupId')) : null,
    });

    if (!parsed.success || !id) {
      return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Validar Tenant
    const whereCheck = await withTenantWhere({ id });
    const product = await prisma.product.findFirst({ where: whereCheck });
    if (!product) return { success: false, error: 'Producto no encontrado o no autorizado' };

    // Validar código único por empresa
    const whereExisting = await withTenantWhere({
      code: parsed.data.code,
      id: { not: id }
    });
    const existing = await prisma.product.findFirst({ where: whereExisting });
    if (existing) {
      return { success: false, error: 'Ya existe otro producto con el mismo código' };
    }

    const quantity = parsed.data.quantityAvailable;
    const status = quantity === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.AVAILABLE;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        categoryId: parsed.data.categoryId,
        supplierId: parsed.data.supplierId,
        quantityAvailable: quantity,
        unitCost: parsed.data.unitCost,
        salePrice: parsed.data.salePrice,
        status,
        productGroupId: parsed.data.productGroupId || null,
      },
    });

    await logActivity({
      module: 'PRODUCTS',
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      description: `Actualizó el producto "${updated.name}" (Código: ${updated.code})`,
      oldValues: product, // Obtenido en la línea 93
      newValues: updated
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    console.error('[UPDATE_PRODUCT]', error);
    return { success: false, error: error.message ?? 'Error al actualizar el producto' };
  }
}

export async function deleteProduct(idInput: any) {
  const id = Number(idInput);
  if (isNaN(id)) return { success: false, error: 'ID inválido' };

  try {
    const whereCheck = await withTenantWhere({ id });
    const product = await prisma.product.findFirst({ where: whereCheck });
    if (!product) return { success: false, error: 'Producto no encontrado o no autorizado' };

    // Verificar si hay ventas asociadas
    const salesCount = await prisma.saleDetail.count({ where: { productId: id } });
    if (salesCount > 0) {
      return { success: false, error: 'No se puede eliminar el producto porque tiene ventas registradas' };
    }

    await prisma.product.delete({ where: { id } });

    await logActivity({
      module: 'PRODUCTS',
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      description: `Eliminó el producto "${product.name}" (Código: ${product.code})`,
      oldValues: product
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE_PRODUCT]', error);
    return { success: false, error: error.message ?? 'Error al eliminar el producto' };
  }
}

export async function quickSellProduct(data: {
  productId: any;
  quantity: number;
  discount?: number;
  userId: any;
}) {
  const productId = Number(data.productId);
  const userId = Number(data.userId);
  const { quantity, discount = 0 } = data;

  if (isNaN(productId) || isNaN(userId)) {
    return { success: false, error: 'IDs inválidos' };
  }

  try {
    const whereProduct = await withTenantWhere({ id: productId });
    const product = await prisma.product.findFirst({ where: whereProduct });
    if (!product) return { success: false, error: 'Producto no encontrado o no autorizado' };
    if (product.quantityAvailable < quantity) {
      return { success: false, error: `Stock insuficiente. Disponible: ${product.quantityAvailable} unidades.` };
    }

    const companyId = await getSessionCompanyId();
    if (!companyId) return { success: false, error: 'No autorizado o sin empresa' };

    // Verificar si la empresa tiene el módulo de Ventas habilitado
    const salesModule = await prisma.module.findUnique({ where: { name: 'Ventas' } });
    const hasSalesModule = salesModule
      ? !!(await prisma.companyModule.findFirst({
          where: { companyId, moduleId: salesModule.id }
        }))
      : false;

    // Si la empresa NO tiene el módulo Ventas: completar directamente + descontar stock
    // Si la empresa SÍ tiene el módulo Ventas: dejar en PENDING sin descontar (el usuario completa en Ventas)
    const saleStatus = hasSalesModule ? 'PENDING' : 'COMPLETED';

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    const unitPrice = product.salePrice;
    const subtotal = unitPrice * quantity;
    const total = Math.max(0, subtotal - discount);

    // Ejecutar transaccionalidad segura ante concurrencia
    const result = await prisma.$transaction(async (tx) => {
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

      await tx.sale.create({
        data: {
          saleNumber,
          userId,
          discount,
          total,
          companyId,
          status: saleStatus,
          details: {
            create: [{
              productId,
              quantity,
              unitPrice,
              subtotal,
              discount,
              total,
              companyId,
            }]
          }
        }
      });

      // Si no tiene módulo Ventas: descontar stock inmediatamente
      if (!hasSalesModule) {
        const newQty = Math.max(0, product.quantityAvailable - quantity);
        await tx.product.update({
          where: { id: productId },
          data: {
            quantityAvailable: newQty,
            soldQuantity: { increment: quantity },
            status: newQty === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
          }
        });
      }

      return { saleNumber, total };
    });

    await logActivity({
      module: 'PRODUCTS',
      action: 'CREATE',
      entity: 'Sale',
      entityId: productId,
      description: hasSalesModule
        ? `Venta rápida "${result.saleNumber}" creada como PENDIENTE desde Productos. Requiere completarse en el módulo Ventas.`
        : `Venta rápida "${result.saleNumber}" completada automáticamente desde Productos. Stock descontado.`,
    });

    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard');
    return { success: true, saleNumber: result.saleNumber, total: result.total, hasSalesModule };
  } catch (error: any) {
    console.error('[QUICK_SELL]', error);
    return { success: false, error: error.message ?? 'Error al registrar la venta rápida' };
  }
}


"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const productSchema = z.object({
  code: z.string().min(2, 'El código es obligatorio'),
  name: z.string().min(2, 'El nombre es obligatorio'),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  supplierId: z.string().min(1, 'El proveedor es obligatorio'),
  quantityAvailable: z.coerce.number().min(0),
  unitCost: z.coerce.number().min(0),
  salePrice: z.coerce.number().min(0),
  productGroupId: z.string().nullable().optional(),
});

export async function createProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    supplierId: formData.get('supplierId'),
    quantityAvailable: formData.get('quantityAvailable'),
    unitCost: formData.get('unitCost'),
    salePrice: formData.get('salePrice'),
    productGroupId: formData.get('productGroupId') || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const quantity = parsed.data.quantityAvailable;
  const status = quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';

  await prisma.product.create({
    data: {
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
    },
  });

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const parsed = productSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    categoryId: formData.get('categoryId'),
    supplierId: formData.get('supplierId'),
    quantityAvailable: formData.get('quantityAvailable'),
    unitCost: formData.get('unitCost'),
    salePrice: formData.get('salePrice'),
    productGroupId: formData.get('productGroupId') || null,
  });

  if (!parsed.success || !id) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
  }

  const quantity = parsed.data.quantityAvailable;
  const status = quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';

  await prisma.product.update({
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

  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function deleteProduct(id: string) {
  if (!id) return { success: false };
  await prisma.product.delete({ where: { id } });
  revalidatePath('/dashboard/products');
  return { success: true };
}

export async function quickSellProduct(data: {
  productId: string;
  quantity: number;
  discount?: number;
  userId: string;
}) {
  const { productId, quantity, discount = 0, userId } = data;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { success: false, error: 'Producto no encontrado' };
  if (product.quantityAvailable < quantity) {
    return { success: false, error: `Stock insuficiente. Disponible: ${product.quantityAvailable} unidades.` };
  }

  // Generate sale number
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const count = await prisma.sale.count();
  const saleNumber = `VEN-${dateStr}-${String(count + 1).padStart(4, '0')}`;

  const unitPrice = product.salePrice;
  const subtotal = unitPrice * quantity;
  const total = Math.max(0, subtotal - discount);

  await prisma.$transaction([
    prisma.sale.create({
      data: {
        saleNumber,
        userId,
        discount,
        total,
        details: {
          create: [{
            productId,
            quantity,
            unitPrice,
            subtotal,
            discount,
            total,
          }]
        }
      }
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        quantityAvailable: { decrement: quantity },
        soldQuantity: { increment: quantity },
        status: product.quantityAvailable - quantity <= 0 ? 'OUT_OF_STOCK' : 'AVAILABLE',
      }
    })
  ]);

  revalidatePath('/dashboard/products');
  revalidatePath('/dashboard/sales');
  return { success: true, saleNumber, total };
}

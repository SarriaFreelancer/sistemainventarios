'use server';

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { resolveActionCompanyId, getSessionCompanyId } from '@/lib/session';

export async function createPurchaseOrder(data: {
  supplierId: number;
  expectedDelivery?: Date;
  lines: Array<{
    productId?: number;
    description?: string;
    itemType: 'MATERIA_PRIMA' | 'PRODUCTO_VENTA' | 'SERVICIO' | 'ACTIVO_FIJO' | 'INSUMO' | 'PAPELERIA' | 'GASTO_ADMINISTRATIVO' | 'OTROS';
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) throw new Error('No autorizado');
  const companyId = await resolveActionCompanyId();

  let subtotal = 0;
  let taxAmount = 0;

  data.lines.forEach((line) => {
    const lineTotal = line.quantity * line.unitPrice;
    subtotal += lineTotal;
    taxAmount += lineTotal * (line.taxRate || 0) / 100;
  });

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber: `PO-${Date.now()}`,
      supplierId: data.supplierId,
      expectedDelivery: data.expectedDelivery,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      companyId,
      status: 'DRAFT',
      lines: {
        create: data.lines.map((line) => ({
          productId: line.productId,
          description: line.description,
          itemType: line.itemType,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          total: line.quantity * line.unitPrice,
          companyId,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      module: 'PURCHASES',
      entity: 'PurchaseOrder',
      entityId: order.id,
      description: `Orden de compra ${order.orderNumber} creada`,
      userId: Number(session.user.id),
      companyId,
    },
  });

  return order;
}

export async function sendPurchaseOrder(id: number) {
  const companyId = await resolveActionCompanyId();
  const order = await prisma.purchaseOrder.update({
    where: { id, companyId: companyId! },
    data: { status: 'SENT' },
  });
  return order;
}

export async function createPurchaseReceipt(
  orderId: number,
  receivedItems: Array<{ lineId: number; productId: number; quantity: number }>
) {
  const session = await getAuthSession();
  const companyId = await resolveActionCompanyId();

  const receipt = await prisma.purchaseReceipt.create({
    data: {
      receiptNumber: `REC-${Date.now()}`,
      purchaseOrderId: orderId,
      status: 'COMPLETE',
      companyId: companyId!,
      items: {
        create: receivedItems.map((item) => ({
          productId: item.productId,
          quantityReceived: item.quantity,
          companyId: companyId!,
        })),
      },
    },
  });

  // Update order lines and product stock
  for (const item of receivedItems) {
    await prisma.purchaseOrderLine.update({
      where: { id: item.lineId },
      data: { receivedQuantity: { increment: item.quantity } },
    });

    await prisma.product.update({
      where: { id: item.productId },
      data: { quantityAvailable: { increment: item.quantity } },
    });
  }

  // Create Inventory Entry
  await prisma.inventoryEntry.create({
    data: {
      purchaseReceiptId: receipt.id,
      companyId: companyId!,
      items: {
        create: receivedItems.map((item) => ({
          productId: item.productId,
          quantityAdded: item.quantity,
          companyId: companyId!,
        })),
      },
    },
  });

  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: 'RECEIVED' },
  });

  return receipt;
}

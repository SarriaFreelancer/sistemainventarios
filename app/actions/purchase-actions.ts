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
  receivedItems: Array<{ lineId: number; productId: number | null; description: string; quantity: number }>
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
          description: item.description,
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

    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { quantityAvailable: { increment: item.quantity } },
      });
    }
  }

  // Create Inventory Entry only for physical products
  const physicalItems = receivedItems.filter(i => i.productId != null);
  if (physicalItems.length > 0) {
    await prisma.inventoryEntry.create({
      data: {
        purchaseReceiptId: receipt.id,
        companyId: companyId!,
        items: {
          create: physicalItems.map((item) => ({
            productId: item.productId as number,
            quantityAdded: item.quantity,
            companyId: companyId!,
          })),
        },
      },
    });
  }

  await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: { status: 'RECEIVED' },
  });

  return receipt;
}

export async function updatePurchaseOrderStatus(id: number, status: 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED') {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    
    const order = await prisma.purchaseOrder.update({
      where: { id, companyId: companyId! },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        module: "COMPRAS",
        entity: "PurchaseOrder",
        entityId: order.id,
        description: `Orden de compra ${order.orderNumber} cambió a estado ${status}`,
        userId: Number(session.user.id),
        companyId: order.companyId,
      },
    });

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePurchaseInvoiceStatus(id: number, status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED') {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    
    const invoice = await prisma.purchaseInvoice.update({
      where: { id, companyId: companyId! },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        module: "COMPRAS",
        entity: "PurchaseInvoice",
        entityId: invoice.id,
        description: `Factura ${invoice.invoiceNumber} cambió a estado ${status}`,
        userId: Number(session.user.id),
        companyId: invoice.companyId,
      },
    });

    return { success: true, invoice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

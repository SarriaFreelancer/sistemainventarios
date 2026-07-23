"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId, getSessionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Número de factura requerido"),
  supplierId: z.number(),
  purchaseOrderId: z.number().optional().nullable(),
  purchaseReceiptId: z.number().optional().nullable(),
  totalAmount: z.number().min(0),
  dueDate: z.string().optional(),
});

export async function createPurchaseInvoice(data: z.infer<typeof CreateInvoiceSchema>) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const parsedData = CreateInvoiceSchema.parse(data);

    // 1. Crear Factura
    const invoice = await prisma.purchaseInvoice.create({
      data: {
        invoiceNumber: parsedData.invoiceNumber,
        supplierId: parsedData.supplierId,
        purchaseOrderId: parsedData.purchaseOrderId,
        purchaseReceiptId: parsedData.purchaseReceiptId,
        total: parsedData.totalAmount, // <-- Corregido
        dueDate: parsedData.dueDate ? new Date(parsedData.dueDate) : null,
        companyId,
        status: "PENDING",
      },
    });

    // 2. Crear inmediatamente la Cuenta por Pagar (AccountsPayable)
    await prisma.accountsPayable.create({
      data: {
        purchaseInvoiceId: invoice.id,
        amount: invoice.total, 
        paidAmount: 0,
        dueDate: invoice.dueDate || new Date(),
        companyId,
        status: "PENDING",
      },
    });

    // 3. Auditoría
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        module: "COMPRAS",
        entity: "PurchaseInvoice",
        entityId: invoice.id,
        description: `Factura ${invoice.invoiceNumber} registrada por ${invoice.total}`, // <-- Corregido
        userId: Number(session.user.id),
        companyId,
      },
    });

    revalidatePath("/dashboard/compras/facturas");
    revalidatePath("/dashboard/compras/cuentas-por-pagar");
    return { success: true, invoice };
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    return { success: false, error: error.message };
  }
}

export async function createPurchasePayment(payableId: number, amount: number, paymentMethod: string, reference?: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const payable = await prisma.accountsPayable.findUnique({
      where: { id: payableId },
      include: { purchaseInvoice: true },
    });

    if (!payable || payable.companyId !== companyId) throw new Error("Cuenta no encontrada");
    if (payable.status === "PAID") throw new Error("Esta cuenta ya está pagada");

    const newAmountPaid = payable.paidAmount + amount;
    const isFullyPaid = newAmountPaid >= payable.amount;

    // Crear registro de pago
    const payment = await prisma.purchasePayment.create({
      data: {
        accountsPayableId: payable.id,
        amount,
        paymentMethod: paymentMethod as any,
        reference,
        companyId: companyId!,
      },
    });

    await prisma.accountsPayable.update({
      where: { id: payable.id },
      data: {
        paidAmount: newAmountPaid,
        status: isFullyPaid ? "PAID" : "PARTIAL",
      },
    });

    // Actualizar estado de la factura
    if (isFullyPaid) {
      await prisma.purchaseInvoice.update({
        where: { id: payable.purchaseInvoiceId },
        data: { status: "PAID" },
      });
    }

    revalidatePath("/dashboard/compras/cuentas-por-pagar");
    return { success: true, payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId, getSessionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const RequestItemSchema = z.object({
  productId: z.number().optional().nullable(),
  description: z.string().min(1, "Descripción obligatoria"),
  quantity: z.number().min(1, "Cantidad debe ser mayor a 0"),
  itemType: z.enum([
    "MATERIA_PRIMA",
    "PRODUCTO_VENTA",
    "SERVICIO",
    "ACTIVO_FIJO",
    "INSUMO",
    "PAPELERIA",
    "GASTO_ADMINISTRATIVO",
    "OTROS",
  ]),
});

const CreatePurchaseRequestSchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
  items: z.array(RequestItemSchema).min(1, "Debe agregar al menos un ítem"),
});

export async function createPurchaseRequest(data: z.infer<typeof CreatePurchaseRequestSchema>) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const parsedData = CreatePurchaseRequestSchema.parse(data);

    // Generar prefijo de solicitud
    const count = await prisma.purchaseRequest.count({
      where: { companyId },
    });
    const requestNum = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const request = await prisma.purchaseRequest.create({
      data: {
        requestNumber: requestNum,
        status: "DRAFT",
        userId: Number(session.user.id),
        companyId,
        items: {
          create: parsedData.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            itemType: item.itemType,
            companyId,
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        module: "COMPRAS",
        entity: "PurchaseRequest",
        entityId: request.id,
        description: `Solicitud de compra ${requestNum} creada`,
        userId: Number(session.user.id),
        companyId,
      },
    });

    revalidatePath("/dashboard/compras/solicitudes");
    return { success: true, request };
  } catch (error: any) {
    console.error("Error creating purchase request:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePurchaseRequestStatus(id: number, status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CANCELLED") {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    
    const request = await prisma.purchaseRequest.update({
      where: { id, companyId: companyId! },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        module: "COMPRAS",
        entity: "PurchaseRequest",
        entityId: request.id,
        description: `Solicitud de compra ${request.requestNumber} cambió a ${status}`,
        userId: Number(session.user.id),
        companyId: request.companyId,
      },
    });

    revalidatePath("/dashboard/compras/solicitudes");
    return { success: true, request };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

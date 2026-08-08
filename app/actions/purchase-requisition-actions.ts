"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId, getSessionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const RequisitionItemSchema = z.object({
  productId: z.number().optional().nullable(),
  description: z.string().min(1, "Descripción es obligatoria"),
  quantity: z.number().min(1, "Cantidad debe ser mayor a 0"),
  unit: z.string().default("UN"),
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
  notes: z.string().optional(),
});

const CreateRequisitionSchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  notes: z.string().optional(),
  items: z.array(RequisitionItemSchema).min(1, "Debe agregar al menos un ítem"),
});

export async function createInternalRequisition(data: z.infer<typeof CreateRequisitionSchema>) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const parsedData = CreateRequisitionSchema.parse(data);

    // Generar prefijo de requisición basado en el último registro
    const lastRequisition = await prisma.internalRequisition.findFirst({
      where: { companyId, requisitionNum: { startsWith: `REQ-${new Date().getFullYear()}-` } },
      orderBy: { id: 'desc' }
    });
    let nextNum = 1;
    if (lastRequisition && lastRequisition.requisitionNum) {
      const parts = lastRequisition.requisitionNum.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    const requisitionNum = `REQ-${new Date().getFullYear()}-${String(nextNum).padStart(4, "0")}`;

    const requisition = await prisma.internalRequisition.create({
      data: {
        requisitionNum,
        priority: parsedData.priority,
        notes: parsedData.notes,
        userId: Number(session.user.id),
        companyId,
        items: {
          create: parsedData.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            itemType: item.itemType,
            notes: item.notes,
            companyId,
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        module: "COMPRAS",
        entity: "InternalRequisition",
        entityId: requisition.id,
        description: `Requisición interna ${requisitionNum} creada`,
        userId: Number(session.user.id),
        companyId,
      },
    });

    revalidatePath("/dashboard/compras/requisiciones");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating internal requisition:", error);
    return { success: false, error: error.message };
  }
}

export async function updateRequisitionStatus(id: number, status: "PENDING_BOSS" | "APPROVED" | "REJECTED" | "CANCELLED") {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");

    const requisition = await prisma.internalRequisition.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        module: "COMPRAS",
        entity: "InternalRequisition",
        entityId: requisition.id,
        description: `Requisición interna ${requisition.requisitionNum} cambió a estado ${status}`,
        userId: Number(session.user.id),
        companyId: requisition.companyId,
      },
    });

    revalidatePath("/dashboard/compras/requisiciones");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

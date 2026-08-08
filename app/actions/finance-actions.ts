"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification-actions";

async function notifyAdmins(companyId: number, title: string, message: string) {
  // Buscar a los usuarios con rol SUPERADMIN o ADMIN en la compañía
  const admins = await prisma.user.findMany({
    where: {
      companyId,
      role: {
        name: { in: ["SUPERADMIN", "ADMIN"] }
      }
    }
  });

  for (const admin of admins) {
    await createNotification(admin.id, companyId, title, message, "INFO");
  }
}

export async function createIncome(data: { description: string; amount: number; category: any; date?: string }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const income = await prisma.income.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date ? new Date(data.date) : new Date(),
        companyId,
      },
    });

    // Auditoría detallada
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        module: "FINANZAS",
        entity: "Income",
        entityId: income.id,
        description: `Ingreso manual registrado: ${income.description} por valor de $${income.amount}`,
        userId: Number(session.user.id),
        companyId,
      },
    });

    await notifyAdmins(companyId!, "Nuevo Ingreso", `Se ha registrado un nuevo ingreso por $${income.amount}: ${income.description}`);

    revalidatePath("/dashboard/finanzas");
    revalidatePath("/dashboard/finanzas/ingresos-gastos");

    return { success: true, income };
  } catch (error: any) {
    console.error("Error creating income:", error);
    return { success: false, error: error.message };
  }
}

export async function createExpense(data: { description: string; amount: number; category: any; date?: string }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date ? new Date(data.date) : new Date(),
        companyId,
      },
    });

    // Auditoría detallada
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        module: "FINANZAS",
        entity: "Expense",
        entityId: expense.id,
        description: `Gasto manual registrado: ${expense.description} por valor de $${expense.amount} (${expense.category})`,
        userId: Number(session.user.id),
        companyId,
      },
    });

    await notifyAdmins(companyId!, "Nuevo Gasto", `Se ha registrado un nuevo gasto por $${expense.amount}: ${expense.description}`);

    revalidatePath("/dashboard/finanzas");
    revalidatePath("/dashboard/finanzas/ingresos-gastos");

    return { success: true, expense };
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return { success: false, error: error.message };
  }
}

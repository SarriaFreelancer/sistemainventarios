"use server";

import { prisma } from "@/lib/prisma";
import { getSessionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createPosition(data: { name: string; baseSalary: number }) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) throw new Error("No company found in session");

    const newPosition = await prisma.position.create({
      data: {
        name: data.name,
        baseSalary: data.baseSalary,
        companyId,
      },
    });

    revalidatePath("/dashboard/rrhh/cargos");
    revalidatePath("/dashboard/rrhh/empleados");
    return { success: true, position: newPosition };
  } catch (error: any) {
    console.error("Error creating position:", error);
    return { success: false, error: error.message };
  }
}

"use server";

import { platformDb } from "@/lib/db-manager";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";

export async function toggleCompanyAccess(companyId: number, currentStatus: string) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    
    await platformDb.company.update({
      where: { id: companyId },
      data: { status: newStatus }
    });

    revalidatePath('/dashboard/settings');
    return { success: true, newStatus };
  } catch (error: any) {
    console.error('Error toggling company access:', error);
    return { success: false, error: 'Fallo al cambiar el estado de la empresa' };
  }
}

"use server";

import { platformDb } from "@/lib/db-manager";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

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

export async function getPlanSettings() {
  try {
    const keys = [
      "plan_basico_max_users", "plan_basico_max_products", "plan_basico_modules", "plan_basico_max_sales_per_month",
      "plan_intermedio_max_users", "plan_intermedio_max_products", "plan_intermedio_modules", "plan_intermedio_max_sales_per_month",
      "plan_premium_max_users", "plan_premium_max_products", "plan_premium_modules", "plan_premium_max_sales_per_month"
    ];
    
    const settings = await platformDb.setting.findMany({
      where: { key: { in: keys } }
    });
    
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    // Fetch all available modules for the UI
    const allModules = await platformDb.module.findMany({ where: { isActive: true } });
    
    return { success: true, data: settingsMap, allModules };
  } catch (error) {
    console.error("Error fetching plan settings:", error);
    return { success: false, error: "Error al obtener las configuraciones de planes" };
  }
}

export async function savePlanSettings(settings: Record<string, string>) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Save each key using upsert
    for (const [key, value] of Object.entries(settings)) {
      await platformDb.setting.upsert({
        where: { key },
        update: { value: value.toString() },
        create: { key, value: value.toString() }
      });
    }

    // Propagate limits to existing companies
    const plans = ['basico', 'intermedio', 'premium'];
    for (const plan of plans) {
      const maxUsers = settings[`plan_${plan}_max_users`];
      const maxProducts = settings[`plan_${plan}_max_products`];
      const maxSales = settings[`plan_${plan}_max_sales_per_month`];

      const dataToUpdate: any = {};
      if (maxUsers !== undefined) dataToUpdate.maxUsers = parseInt(maxUsers, 10) || null;
      if (maxProducts !== undefined) dataToUpdate.maxProducts = parseInt(maxProducts, 10) || null;
      if (maxSales !== undefined) dataToUpdate.maxSalesPerMonth = parseInt(maxSales, 10) || null;

      const aliases: Record<string, string[]> = {
        'basico': ['basico', 'basic'],
        'intermedio': ['intermedio', 'intermediate'],
        'premium': ['premium']
      };

      if (Object.keys(dataToUpdate).length > 0) {
        await prisma.company.updateMany({
          where: { planId: { in: aliases[plan] } },
          data: dataToUpdate
        });
      }
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error saving plan settings:", error);
    return { success: false, error: "Error al guardar las configuraciones de planes" };
  }
}

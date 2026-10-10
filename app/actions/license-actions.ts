"use server";

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

    await prisma.company.update({
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
      "plan_basico_max_users", "plan_basico_max_products", "plan_basico_modules", "plan_basico_max_sales_per_month", "plan_basico_price",
      "plan_intermedio_max_users", "plan_intermedio_max_products", "plan_intermedio_modules", "plan_intermedio_max_sales_per_month", "plan_intermedio_price",
      "plan_premium_max_users", "plan_premium_max_products", "plan_premium_modules", "plan_premium_max_sales_per_month", "plan_premium_price",
      "plan_enterprise_2_sedes_max_users", "plan_enterprise_2_sedes_max_products", "plan_enterprise_2_sedes_max_branches", "plan_enterprise_2_sedes_modules", "plan_enterprise_2_sedes_max_sales_per_month", "plan_enterprise_2_sedes_price",
      "plan_enterprise_5_sedes_max_users", "plan_enterprise_5_sedes_max_products", "plan_enterprise_5_sedes_max_branches", "plan_enterprise_5_sedes_modules", "plan_enterprise_5_sedes_max_sales_per_month", "plan_enterprise_5_sedes_price",
      "plan_enterprise_10_sedes_max_users", "plan_enterprise_10_sedes_max_products", "plan_enterprise_10_sedes_max_branches", "plan_enterprise_10_sedes_modules", "plan_enterprise_10_sedes_max_sales_per_month", "plan_enterprise_10_sedes_price",
      "plan_enterprise_unlimited_max_users", "plan_enterprise_unlimited_max_products", "plan_enterprise_unlimited_max_branches", "plan_enterprise_unlimited_modules", "plan_enterprise_unlimited_max_sales_per_month", "plan_enterprise_unlimited_price"
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });

    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    // Fetch all available modules for the UI
    const allModules = await prisma.module.findMany({ where: { isActive: true } });

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
      await prisma.setting.upsert({
        where: { key },
        update: { value: value.toString() },
        create: { key, value: value.toString() }
      });
    }

    // Propagate limits to existing companies
    const plans = ['basico', 'intermedio', 'premium', 'enterprise_2_sedes', 'enterprise_5_sedes', 'enterprise_10_sedes', 'enterprise_unlimited'];
    for (const plan of plans) {
      const maxUsers = settings[`plan_${plan}_max_users`];
      const maxProducts = settings[`plan_${plan}_max_products`];
      const maxSales = settings[`plan_${plan}_max_sales_per_month`];
      const maxBranches = settings[`plan_${plan}_max_branches`];

      const dataToUpdate: any = {};
      if (maxUsers !== undefined) dataToUpdate.maxUsers = parseInt(maxUsers, 10) || null;
      if (maxProducts !== undefined) dataToUpdate.maxProducts = parseInt(maxProducts, 10) || null;
      if (maxSales !== undefined) dataToUpdate.maxSalesPerMonth = parseInt(maxSales, 10) || null;
      if (maxBranches !== undefined) dataToUpdate.maxBranches = parseInt(maxBranches, 10) || null;

      const aliases: Record<string, string[]> = {
        'basico': ['basico', 'basic'],
        'intermedio': ['intermedio', 'intermediate'],
        'premium': ['premium'],
        'enterprise_2_sedes': ['enterprise_2', 'enterprise_2_sedes'],
        'enterprise_5_sedes': ['enterprise_5', 'enterprise_5_sedes'],
        'enterprise_10_sedes': ['enterprise_10', 'enterprise_10_sedes'],
        'enterprise_unlimited': ['enterprise_unlimited', 'enterprise'],
      };

      if (Object.keys(dataToUpdate).length > 0 && aliases[plan]) {
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

export async function updateCompanyPlan(companyId: number, newPlanId: string) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado. Se requieren permisos de SuperAdmin.' };
  }

  try {
    const isEnterprise = newPlanId.toLowerCase().includes('enterprise');

    const planLimits = await getPlanSettings();
    const settings: Record<string, string> = (planLimits.success && planLimits.data) ? planLimits.data : {};

    const prefix = `plan_${newPlanId.toLowerCase()}`;
    const maxUsers = settings[`${prefix}_max_users`] ? parseInt(settings[`${prefix}_max_users`], 10) : (isEnterprise ? 999 : 5);
    const maxProducts = settings[`${prefix}_max_products`] ? parseInt(settings[`${prefix}_max_products`], 10) : (isEnterprise ? 999999 : 1000);
    const maxSales = settings[`${prefix}_max_sales_per_month`] ? parseInt(settings[`${prefix}_max_sales_per_month`], 10) : 999999;
    const maxBranches = isEnterprise
      ? (settings[`${prefix}_max_branches`] ? parseInt(settings[`${prefix}_max_branches`], 10) : 2)
      : 1;

    await prisma.company.update({
      where: { id: companyId },
      data: {
        planId: newPlanId.toLowerCase(),
        isEnterprise,
        maxUsers,
        maxProducts,
        maxSalesPerMonth: maxSales,
        maxBranches
      }
    });

    // Sincronizar módulos asignados si el plan tiene módulos configurados
    const modulesJson = settings[`${prefix}_modules`];
    if (modulesJson) {
      try {
        const moduleIds: number[] = JSON.parse(modulesJson);
        if (Array.isArray(moduleIds) && moduleIds.length > 0) {
          await prisma.companyModule.deleteMany({
            where: { companyId }
          });
          for (const moduleId of moduleIds) {
            await prisma.companyModule.create({
              data: { companyId, moduleId }
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Error syncing modules for plan:", e);
      }
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/enterprise');

    return { success: true, message: `Plan de la empresa actualizado a ${newPlanId.toUpperCase()}` };
  } catch (error: any) {
    console.error("Error updating company plan:", error);
    return { success: false, error: error.message || "Error al actualizar el plan de la empresa" };
  }
}


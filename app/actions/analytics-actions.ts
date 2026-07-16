"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";

export async function getSystemAnalytics() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };
    
    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    const companyId = session.user.companyId ? Number(session.user.companyId) : null;
    
    // Fechas clave
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filtro de empresa para ADMIN
    const tenantWhere = !isSuperAdmin ? { companyId } : {};
    
    // 1. Usuarios conectados hoy (LoginHistory exitosos)
    const activeUsersToday = await prisma.loginHistory.groupBy({
      by: ["userId"],
      where: {
        status: "SUCCESS",
        createdAt: { gte: startOfToday },
        ...tenantWhere
      }
    });
    
    // 2. Usuarios activos esta semana
    const activeUsersWeek = await prisma.loginHistory.groupBy({
      by: ["userId"],
      where: {
        status: "SUCCESS",
        createdAt: { gte: oneWeekAgo },
        ...tenantWhere
      }
    });
    
    // 3. Intentos fallidos de login hoy
    const failedLoginsToday = await prisma.loginHistory.count({
      where: {
        status: "FAILED",
        createdAt: { gte: startOfToday },
        ...tenantWhere
      }
    });
    
    // 4. Conteo de acciones de auditoría (CRUD hoy)
    const productsCreatedToday = await prisma.auditLog.count({
      where: { module: "PRODUCTS", action: "CREATE", createdAt: { gte: startOfToday }, ...tenantWhere }
    });
    const productsUpdatedToday = await prisma.auditLog.count({
      where: { module: "PRODUCTS", action: "UPDATE", createdAt: { gte: startOfToday }, ...tenantWhere }
    });
    const salesCreatedToday = await prisma.auditLog.count({
      where: { module: "SALES", action: "CREATE", createdAt: { gte: startOfToday }, ...tenantWhere }
    });
    
    // 5. Ranking de Empresas más activas (últimos 30 días) - Solo para Superadmin
    let topCompanies: any[] = [];
    if (isSuperAdmin) {
      const activeCompanies = await prisma.auditLog.groupBy({
        by: ["companyId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      });
      
      for (const item of activeCompanies) {
        if (item.companyId) {
          const company = await prisma.company.findUnique({
            where: { id: item.companyId },
            select: { name: true }
          });
          topCompanies.push({
            name: company?.name || "Desconocida",
            logsCount: item._count.id
          });
        }
      }
    }
    
    // 6. Ranking de Módulos más utilizados (porcentaje de logs de los últimos 30 días)
    const modulesUsage = await prisma.auditLog.groupBy({
      by: ["module"],
      _count: { id: true },
      where: { ...tenantWhere },
      orderBy: { _count: { id: "desc" } }
    });
    
    const totalLogs = modulesUsage.reduce((sum, item) => sum + item._count.id, 0);
    const modulesAnalytics = modulesUsage.map(m => ({
      name: m.module,
      count: m._count.id,
      percentage: totalLogs > 0 ? Math.round((m._count.id / totalLogs) * 100) : 0
    }));
    
    // 7. Actividad por horas (distribución de transacciones/logs)
    const hourlyActivity = await prisma.auditLog.findMany({
      where: { createdAt: { gte: oneWeekAgo }, ...tenantWhere },
      select: { createdAt: true }
    });
    
    const hoursDistribution = Array(24).fill(0);
    hourlyActivity.forEach(log => {
      const hr = new Date(log.createdAt).getHours();
      hoursDistribution[hr]++;
    });
    
    // 8. Crecimiento mensual (Ventas y altas de productos)
    const sales6Months = await prisma.sale.findMany({
      where: { status: "COMPLETED", ...tenantWhere },
      select: { total: true, createdAt: true }
    });
    
    const monthlySales: Record<string, number> = {};
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    sales6Months.forEach(sale => {
      const d = new Date(sale.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlySales[key] = (monthlySales[key] || 0) + sale.total;
    });
    
    return {
      success: true,
      analytics: {
        usersToday: activeUsersToday.length,
        usersWeek: activeUsersWeek.length,
        failedLogins: failedLoginsToday,
        crudStats: {
          productsCreated: productsCreatedToday,
          productsUpdated: productsUpdatedToday,
          salesCreated: salesCreatedToday
        },
        topCompanies,
        modules: modulesAnalytics,
        hours: hoursDistribution,
        monthlySales: Object.entries(monthlySales).map(([month, total]) => ({ month, total })).slice(-6)
      }
    };
  } catch (error: any) {
    console.error("[GET_ANALYTICS_ERROR]", error);
    return { success: false, error: error.message || "Error al compilar las estadísticas" };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { withTenantWhere } from "@/lib/tenant-db";

export async function getAuditLogs(
  page = 1,
  limit = 20,
  search = "",
  filterModule = "",
  companyIdFilter: string | number = "",
  searchField = "ALL" // "ALL" | "DESCRIPTION" | "USER" | "ACTION"
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    const userCompanyId = session.user.companyId ? Number(session.user.companyId) : null;

    // Si es superadmin y mandó un filtro de empresa específico:
    let tenantFilter: any = {};
    if (isSuperAdmin) {
      if (companyIdFilter && companyIdFilter !== "ALL") {
        tenantFilter = { companyId: Number(companyIdFilter) };
      }
    } else {
      tenantFilter = userCompanyId ? { companyId: userCompanyId } : await withTenantWhere({});
    }

    let whereClause: any = { ...tenantFilter };

    if (filterModule && filterModule !== "ALL") {
      whereClause.module = filterModule;
    }

    // Filtro de búsqueda estructurado
    if (search.trim()) {
      const q = search.trim();
      if (searchField === "DESCRIPTION") {
        whereClause.description = { contains: q };
      } else if (searchField === "USER") {
        whereClause.OR = [
          { user: { name: { contains: q } } },
          { user: { email: { contains: q } } }
        ];
      } else if (searchField === "ACTION") {
        whereClause.action = { contains: q };
      } else {
        // ALL
        whereClause.OR = [
          { module: { contains: q } },
          { action: { contains: q } },
          { description: { contains: q } },
          { user: { name: { contains: q } } },
          { user: { email: { contains: q } } }
        ];
      }
    }

    // Si es superadmin, obtenemos las empresas para el selector
    let companiesList: { id: number; name: string }[] = [];
    if (isSuperAdmin) {
      companiesList = await prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, logs, successfulLoginsToday, failedLoginsToday, actionsToday] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.loginHistory.count({
        where: {
          status: "SUCCESS",
          createdAt: { gte: todayStart },
          ...tenantFilter
        }
      }),
      prisma.loginHistory.count({
        where: {
          status: "FAILED",
          createdAt: { gte: todayStart },
          ...tenantFilter
        }
      }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: todayStart },
          ...tenantFilter
        }
      })
    ]);

    return {
      success: true,
      logs: JSON.parse(JSON.stringify(logs)),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      companiesList,
      stats: {
        successfulLoginsToday,
        failedLoginsToday,
        actionsToday,
        totalHistorical: total
      }
    };
  } catch (error: any) {
    console.error("[GET_AUDIT_LOGS]", error);
    return { success: false, error: error.message || "Error al cargar los registros de auditoría" };
  }
}

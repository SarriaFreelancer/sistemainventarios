"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { withTenantWhere } from "@/lib/tenant-db";

export async function getAuditLogs(page = 1, limit = 20, search = "") {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };
    
    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    
    // Filtro base: si no es superadmin, aplicar aislamiento de tenant
    let whereClause: any = {};
    if (!isSuperAdmin) {
      whereClause = await withTenantWhere({});
    }
    
    // Filtro de búsqueda (por módulo, acción, descripción o usuario)
    if (search) {
      whereClause.OR = [
        { module: { contains: search } },
        { action: { contains: search } },
        { description: { contains: search } },
        { user: { name: { contains: search } } }
      ];
    }
    
    const total = await prisma.auditLog.count({ where: whereClause });
    
    const logs = await prisma.auditLog.findMany({
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
    });
    
    return {
      success: true,
      logs: JSON.parse(JSON.stringify(logs)), // Evitar problemas de serialización de Date/Decimal de Prisma
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error: any) {
    console.error("[GET_AUDIT_LOGS]", error);
    return { success: false, error: error.message || "Error al cargar los registros de auditoría" };
  }
}

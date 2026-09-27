"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";

// Helper para validar permisos y obtener contexto de usuario y empresa
async function getCompanyAndUser() {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("No autenticado");

  const userId = Number(session.user.id);
  const companyId = session.user.companyId ? Number(session.user.companyId) : undefined;
  const isSuperAdmin = session.user.role === "SUPERADMIN";

  return {
    userId,
    companyId,
    role: session.user.role,
    isSuperAdmin,
  };
}

// 1. Obtener Sedes de la Empresa
export async function getBranches() {
  try {
    const { companyId, isSuperAdmin } = await getCompanyAndUser();

    if (!companyId && !isSuperAdmin) {
      return { success: false, error: "No se encontró empresa asociada" };
    }

    const whereClause: any = {};
    if (companyId) {
      whereClause.companyId = companyId;
    }

    let branches = await prisma.branch.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            products: true,
            sales: true,
            warehouses: true,
            users: true,
          },
        },
        warehouses: {
          select: {
            id: true,
            name: true,
            code: true,
            isDefault: true,
          },
        },
      },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    });

    // Si la empresa tiene sedes configuradas pero aún no tiene la Sede Principal registrada, la inicializamos
    if (branches.length === 0 && companyId) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, city: true, address: true },
      });

      const mainBranch = await prisma.branch.create({
        data: {
          name: "Sede Principal",
          code: "SEDE-MAIN",
          city: company?.city || "Principal",
          address: company?.address || "Sede Principal",
          isMain: true,
          active: true,
          companyId,
        },
        include: {
          _count: {
            select: {
              products: true,
              sales: true,
              warehouses: true,
              users: true,
            },
          },
          warehouses: true,
        },
      });

      // Asociar bodegas existentes sin branchId a la Sede Principal
      await prisma.warehouse.updateMany({
        where: { companyId, branchId: null },
        data: { branchId: mainBranch.id },
      });

      branches = [mainBranch as any];
    }

    return { success: true, branches };
  } catch (error: any) {
    console.error("[GET_BRANCHES]", error);
    return { success: false, error: error.message || "Error al obtener sedes" };
  }
}

// 2. Crear Nueva Sede
export async function createBranch(data: {
  name: string;
  code?: string;
  city?: string;
  address?: string;
  phone?: string;
  createWarehouse?: boolean;
}) {
  try {
    const { userId, companyId, isSuperAdmin } = await getCompanyAndUser();

    if (!companyId && !isSuperAdmin) {
      return { success: false, error: "No se encontró empresa asociada" };
    }

    const targetCompanyId = companyId!;

    const company = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      include: {
        _count: { select: { branches: true } },
      },
    });

    if (!company) {
      return { success: false, error: "Empresa no encontrada" };
    }

    // Validar límite de sedes según plan / cuota Enterprise
    const currentBranchesCount = company._count.branches;
    const maxBranches = company.maxBranches || 1;

    if (!isSuperAdmin && !company.isEnterprise && currentBranchesCount >= maxBranches) {
      return {
        success: false,
        error: `Has alcanzado el límite de sedes (${maxBranches}) permitido para tu plan actual. Solicita una ampliación o plan Enterprise.`,
        limitReached: true,
      };
    }

    if (!isSuperAdmin && company.isEnterprise && currentBranchesCount >= maxBranches) {
      return {
        success: false,
        error: `Has alcanzado el límite de ${maxBranches} sedes habilitadas. Solicita una nueva sede a soporte para ampliar tu cuota.`,
        limitReached: true,
      };
    }

    const branchCode = data.code?.trim() || `SEDE-${Date.now().toString().slice(-4)}`;

    const branch = await prisma.branch.create({
      data: {
        name: data.name.trim(),
        code: branchCode,
        city: data.city?.trim() || null,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        isMain: currentBranchesCount === 0,
        active: true,
        companyId: targetCompanyId,
      },
    });

    // Crear bodega automática vinculada a esta sede si está activado
    if (data.createWarehouse !== false) {
      await prisma.warehouse.create({
        data: {
          name: `Bodega ${branch.name}`,
          code: `BOD-${branch.code || branch.id}`,
          type: "GENERAL",
          address: branch.address || null,
          city: branch.city || null,
          isDefault: currentBranchesCount === 0,
          companyId: targetCompanyId,
          branchId: branch.id,
        },
      });
    }

    await logActivity({
      userId,
      module: "ENTERPRISE",
      action: "CREATE_BRANCH",
      entity: "Branch",
      entityId: branch.id,
      description: `Creación de nueva sede: ${branch.name} (${branch.code})`,
    });

    revalidatePath("/dashboard/enterprise");
    revalidatePath("/dashboard/settings");

    return { success: true, branch };
  } catch (error: any) {
    console.error("[CREATE_BRANCH]", error);
    return { success: false, error: error.message || "Error al crear la sede" };
  }
}

// 3. Actualizar Sede
export async function updateBranch(
  branchId: number,
  data: {
    name?: string;
    code?: string;
    city?: string;
    address?: string;
    phone?: string;
    active?: boolean;
  }
) {
  try {
    const { userId, companyId, isSuperAdmin } = await getCompanyAndUser();

    const existingBranch = await prisma.branch.findUnique({
      where: { id: branchId },
    });

    if (!existingBranch) {
      return { success: false, error: "Sede no encontrada" };
    }

    if (!isSuperAdmin && companyId && existingBranch.companyId !== companyId) {
      return { success: false, error: "No tienes permiso para modificar esta sede" };
    }

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: {
        name: data.name !== undefined ? data.name.trim() : existingBranch.name,
        code: data.code !== undefined ? data.code.trim() : existingBranch.code,
        city: data.city !== undefined ? data.city?.trim() : existingBranch.city,
        address: data.address !== undefined ? data.address?.trim() : existingBranch.address,
        phone: data.phone !== undefined ? data.phone?.trim() : existingBranch.phone,
        active: data.active !== undefined ? data.active : existingBranch.active,
      },
    });

    await logActivity({
      userId,
      module: "ENTERPRISE",
      action: "UPDATE_BRANCH",
      entity: "Branch",
      entityId: branchId,
      description: `Actualización de sede: ${updated.name}`,
    });

    revalidatePath("/dashboard/enterprise");
    revalidatePath("/dashboard/settings");

    return { success: true, branch: updated };
  } catch (error: any) {
    console.error("[UPDATE_BRANCH]", error);
    return { success: false, error: error.message || "Error al actualizar la sede" };
  }
}

// 4. Solicitar Nueva Sede (Workflow de Aprobación Comercial Enterprise)
export async function requestBranch(data: {
  branchName: string;
  city?: string;
  address?: string;
  phone?: string;
  justification: string;
}) {
  try {
    const { userId, companyId } = await getCompanyAndUser();

    if (!companyId) {
      return { success: false, error: "No se encontró empresa asociada" };
    }

    if (!data.branchName?.trim() || !data.justification?.trim()) {
      return { success: false, error: "El nombre de la sede y la justificación son obligatorios." };
    }

    const request = await prisma.branchRequest.create({
      data: {
        companyId,
        requestedById: userId,
        branchName: data.branchName.trim(),
        city: data.city?.trim() || null,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        justification: data.justification.trim(),
        status: "PENDING",
      },
      include: {
        company: { select: { name: true } },
        requestedBy: { select: { name: true, email: true } },
      },
    });

    await logActivity({
      userId,
      module: "ENTERPRISE",
      action: "REQUEST_BRANCH",
      entity: "BranchRequest",
      entityId: request.id,
      description: `Solicitud de nueva sede: ${data.branchName}`,
    });

    revalidatePath("/dashboard/settings");

    return { success: true, request };
  } catch (error: any) {
    console.error("[REQUEST_BRANCH]", error);
    return { success: false, error: error.message || "Error al solicitar sede" };
  }
}

// 5. Obtener Solicitudes de Sedes
export async function getBranchRequests() {
  try {
    const { companyId, isSuperAdmin } = await getCompanyAndUser();

    const whereClause: any = {};
    if (!isSuperAdmin) {
      if (!companyId) return { success: false, error: "No autorizado" };
      whereClause.companyId = companyId;
    }

    const requests = await prisma.branchRequest.findMany({
      where: whereClause,
      include: {
        company: { select: { id: true, name: true, planId: true, isEnterprise: true, maxBranches: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, requests };
  } catch (error: any) {
    console.error("[GET_BRANCH_REQUESTS]", error);
    return { success: false, error: error.message || "Error al obtener solicitudes" };
  }
}

// 6. Revisar / Aprobar / Rechazar Solicitud de Sede (SuperAdmin)
export async function reviewBranchRequest(data: {
  requestId: number;
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}) {
  try {
    const { userId, isSuperAdmin } = await getCompanyAndUser();

    if (!isSuperAdmin) {
      return { success: false, error: "Solo el SuperAdministrador puede aprobar solicitudes de sedes." };
    }

    const request = await prisma.branchRequest.findUnique({
      where: { id: data.requestId },
      include: { company: true },
    });

    if (!request) {
      return { success: false, error: "Solicitud no encontrada" };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: `Esta solicitud ya fue ${request.status === "APPROVED" ? "aprobada" : "rechazada"}.` };
    }

    if (data.status === "APPROVED") {
      // 1. Activar Enterprise y aumentar cuota de sedes
      const newMaxBranches = Math.max((request.company.maxBranches || 1) + 1, 2);
      await prisma.company.update({
        where: { id: request.companyId },
        data: {
          isEnterprise: true,
          planId: "ENTERPRISE",
          maxBranches: newMaxBranches,
        },
      });

      // 2. Crear la Sede Aprobada
      const newBranch = await prisma.branch.create({
        data: {
          name: request.branchName,
          code: `SEDE-${Date.now().toString().slice(-4)}`,
          city: request.city,
          address: request.address,
          phone: request.phone,
          companyId: request.companyId,
          active: true,
        },
      });

      // 3. Crear bodega inicial para la sede
      await prisma.warehouse.create({
        data: {
          name: `Bodega ${newBranch.name}`,
          code: `BOD-${newBranch.code}`,
          type: "GENERAL",
          address: newBranch.address,
          city: newBranch.city,
          companyId: request.companyId,
          branchId: newBranch.id,
        },
      });

      // 4. Actualizar estado de la solicitud
      await prisma.branchRequest.update({
        where: { id: data.requestId },
        data: {
          status: "APPROVED",
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      });

      await logActivity({
        userId,
        module: "SUPERADMIN",
        action: "APPROVE_BRANCH_REQUEST",
        entity: "BranchRequest",
        entityId: request.id,
        description: `Aprobación de sede: ${request.branchName} para la empresa ${request.company.name}`,
      });
    } else {
      // Rechazar
      await prisma.branchRequest.update({
        where: { id: data.requestId },
        data: {
          status: "REJECTED",
          reviewedById: userId,
          reviewedAt: new Date(),
          rejectionReason: data.rejectionReason?.trim() || "No cumple con los requisitos comerciales.",
        },
      });

      await logActivity({
        userId,
        module: "SUPERADMIN",
        action: "REJECT_BRANCH_REQUEST",
        entity: "BranchRequest",
        entityId: request.id,
        description: `Rechazo de solicitud de sede: ${request.branchName}. Motivo: ${data.rejectionReason}`,
      });
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/enterprise");

    return { success: true };
  } catch (error: any) {
    console.error("[REVIEW_BRANCH_REQUEST]", error);
    return { success: false, error: error.message || "Error al procesar solicitud" };
  }
}

// 7. Importar / Replicar Productos desde Sede Principal a una Sede Destino
export async function importProductsFromMain(data: {
  targetBranchId: number;
  productIds?: number[];
  copyStock?: boolean;
}) {
  try {
    const { userId, companyId } = await getCompanyAndUser();

    if (!companyId) {
      return { success: false, error: "No se encontró empresa asociada" };
    }

    const targetBranch = await prisma.branch.findUnique({
      where: { id: data.targetBranchId },
      include: { warehouses: true },
    });

    if (!targetBranch || targetBranch.companyId !== companyId) {
      return { success: false, error: "Sede destino no válida" };
    }

    // Buscar productos de la sede principal (branchId null o con isMain: true)
    const mainBranch = await prisma.branch.findFirst({
      where: { companyId, isMain: true },
    });

    const whereFilter: any = {
      companyId,
      OR: [
        { branchId: null },
        ...(mainBranch ? [{ branchId: mainBranch.id }] : []),
      ],
    };

    if (data.productIds && data.productIds.length > 0) {
      whereFilter.id = { in: data.productIds };
    }

    const sourceProducts = await prisma.product.findMany({
      where: whereFilter,
    });

    if (sourceProducts.length === 0) {
      return { success: false, error: "No hay productos en la sede principal para migrar." };
    }

    // Obtener bodega destino
    let targetWarehouse = targetBranch.warehouses[0];
    if (!targetWarehouse) {
      targetWarehouse = await prisma.warehouse.create({
        data: {
          name: `Bodega ${targetBranch.name}`,
          code: `BOD-${targetBranch.code || targetBranch.id}`,
          companyId,
          branchId: targetBranch.id,
        },
      });
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const prod of sourceProducts) {
      const derivedCode = `${prod.code}-S${targetBranch.id}`;

      // Verificar si ya fue importado
      const exists = await prisma.product.findFirst({
        where: {
          companyId,
          branchId: targetBranch.id,
          OR: [{ code: derivedCode }, { mainProductId: prod.id }],
        },
      });

      if (exists) {
        skippedCount++;
        continue;
      }

      const newProd = await prisma.product.create({
        data: {
          name: prod.name,
          code: derivedCode,
          categoryId: prod.categoryId,
          supplierId: prod.supplierId,
          unitCost: prod.unitCost,
          salePrice: prod.salePrice,
          quantityAvailable: data.copyStock ? prod.quantityAvailable : 0,
          status: (data.copyStock && prod.quantityAvailable > 0) ? "AVAILABLE" : "OUT_OF_STOCK",
          type: prod.type,
          productGroupId: prod.productGroupId,
          companyId,
          branchId: targetBranch.id,
          isInheritedFromMain: true,
          mainProductId: prod.id,
        },
      });

      // Crear registro de stock en la bodega de la sede destino
      await prisma.warehouseStock.create({
        data: {
          productId: newProd.id,
          warehouseId: targetWarehouse.id,
          physical: data.copyStock ? prod.quantityAvailable : 0,
          companyId,
        },
      });

      createdCount++;
    }

    await logActivity({
      userId,
      module: "ENTERPRISE",
      action: "IMPORT_PRODUCTS_BRANCH",
      entity: "Branch",
      entityId: targetBranch.id,
      description: `Importación de ${createdCount} productos a sede ${targetBranch.name} (Omitidos: ${skippedCount})`,
    });

    revalidatePath("/dashboard/enterprise");
    revalidatePath("/dashboard/products");

    return {
      success: true,
      createdCount,
      skippedCount,
      message: `Se importaron ${createdCount} productos a la sede ${targetBranch.name}.`,
    };
  } catch (error: any) {
    console.error("[IMPORT_PRODUCTS_FROM_MAIN]", error);
    return { success: false, error: error.message || "Error al migrar productos a la sede" };
  }
}

// 8. Métricas y Analytics del Master Consolidated Dashboard Enterprise
export async function getEnterpriseMasterDashboardData(filters?: {
  branchId?: number | "ALL";
  period?: "today" | "week" | "month" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { companyId, isSuperAdmin } = await getCompanyAndUser();

    if (!companyId && !isSuperAdmin) {
      return { success: false, error: "No autenticado o sin empresa asignada" };
    }

    const targetCompanyId = companyId!;

    // 1. Obtener todas las sedes de la empresa
    const allBranches = await prisma.branch.findMany({
      where: { companyId: targetCompanyId },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    });

    // 2. Determinar rango de fechas
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1); // inicio de mes por defecto
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const period = filters?.period || "month";

    if (period === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    } else if (period === "year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else if (period === "custom" && filters?.startDate && filters?.endDate) {
      start = new Date(filters.startDate);
      end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
    }

    // 3. Filtrar ventas dentro del rango de fechas
    const saleWhere: any = {
      companyId: targetCompanyId,
      status: "COMPLETED",
      createdAt: { gte: start, lte: end },
    };

    if (filters?.branchId && filters.branchId !== "ALL") {
      saleWhere.branchId = Number(filters.branchId);
    }

    const sales = await prisma.sale.findMany({
      where: saleWhere,
      include: {
        branch: { select: { id: true, name: true, city: true } },
        details: {
          include: {
            product: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    // 4. Calcular KPIs Consolidados
    let totalRevenue = 0;
    let totalSalesCount = sales.length;

    // Métricas por Sede
    const branchStatsMap: Record<
      string,
      {
        branchId: number | null;
        branchName: string;
        city: string;
        revenue: number;
        salesCount: number;
        topProducts: Record<string, { name: string; qty: number; revenue: number }>;
      }
    > = {};

    // Inicializar mapa con todas las sedes registradas
    allBranches.forEach((b) => {
      branchStatsMap[b.id] = {
        branchId: b.id,
        branchName: b.name,
        city: b.city || "N/A",
        revenue: 0,
        salesCount: 0,
        topProducts: {},
      };
    });

    // Agregar entrada para ventas sin sede explícita (Sede Principal histórica)
    const unassignedKey = "unassigned";
    branchStatsMap[unassignedKey] = {
      branchId: null,
      branchName: "Sede Principal (Base)",
      city: "Principal",
      revenue: 0,
      salesCount: 0,
      topProducts: {},
    };

    // Procesar cada venta
    sales.forEach((sale) => {
      totalRevenue += sale.total;
      const key = sale.branchId ? String(sale.branchId) : unassignedKey;

      if (!branchStatsMap[key]) {
        branchStatsMap[key] = {
          branchId: sale.branchId,
          branchName: sale.branch?.name || "Sede No Asignada",
          city: sale.branch?.city || "N/A",
          revenue: 0,
          salesCount: 0,
          topProducts: {},
        };
      }

      branchStatsMap[key].revenue += sale.total;
      branchStatsMap[key].salesCount += 1;

      // Procesar productos vendidos
      sale.details.forEach((item) => {
        if (item.product) {
          const pKey = String(item.product.id);
          if (!branchStatsMap[key].topProducts[pKey]) {
            branchStatsMap[key].topProducts[pKey] = {
              name: item.product.name,
              qty: 0,
              revenue: 0,
            };
          }
          branchStatsMap[key].topProducts[pKey].qty += item.quantity;
          branchStatsMap[key].topProducts[pKey].revenue += item.subtotal || item.total;
        }
      });
    });

    // 5. Ranking de Sedes (Ordenado de mayor a menor recaudación)
    const branchRanking = Object.values(branchStatsMap)
      .filter((b) => b.revenue > 0 || (b.branchId !== null && allBranches.some((ab) => ab.id === b.branchId)))
      .map((b) => {
        const topProductList = Object.values(b.topProducts).sort((a, b) => b.qty - a.qty);
        const bestProduct = topProductList[0] || { name: "Sin ventas", qty: 0, revenue: 0 };
        const share = totalRevenue > 0 ? (b.revenue / totalRevenue) * 100 : 0;

        return {
          branchId: b.branchId,
          branchName: b.branchName,
          city: b.city,
          revenue: b.revenue,
          salesCount: b.salesCount,
          marketShare: Number(share.toFixed(1)),
          topProduct: bestProduct.name,
          topProductQty: bestProduct.qty,
          topProductRevenue: bestProduct.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const topSellingBranch = branchRanking[0] || null;

    // 6. Inventario Consolidado por Sede
    const productsByBranch = await prisma.product.groupBy({
      by: ["branchId"],
      where: { companyId: targetCompanyId },
      _count: { id: true },
      _sum: { quantityAvailable: true },
    });

    const allProducts = await prisma.product.findMany({
      where: { companyId: targetCompanyId },
      select: {
        id: true,
        branchId: true,
        quantityAvailable: true,
        unitCost: true,
        salePrice: true,
      },
    });

    let totalInventoryValue = 0;
    let totalStockCount = 0;
    const branchInventoryBreakdown: Record<string, { branchName: string; count: number; stock: number; valuation: number }> = {};

    allBranches.forEach((b) => {
      branchInventoryBreakdown[b.id] = {
        branchName: b.name,
        count: 0,
        stock: 0,
        valuation: 0,
      };
    });

    allProducts.forEach((p) => {
      const stock = p.quantityAvailable || 0;
      const value = stock * (p.unitCost || 0);
      totalInventoryValue += value;
      totalStockCount += stock;

      const key = p.branchId ? String(p.branchId) : (allBranches[0] ? String(allBranches[0].id) : "main");
      if (branchInventoryBreakdown[key]) {
        branchInventoryBreakdown[key].count += 1;
        branchInventoryBreakdown[key].stock += stock;
        branchInventoryBreakdown[key].valuation += value;
      }
    });

    // 7. Agrupación de Ventas en el tiempo (para gráfico comparativo de sedes)
    // Generar timeline de días o meses según el período
    const salesTimelineMap: Record<string, Record<string, number>> = {};

    sales.forEach((sale) => {
      const dateKey = sale.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      const branchName = sale.branch?.name || "Sede Principal";

      if (!salesTimelineMap[dateKey]) {
        salesTimelineMap[dateKey] = { date: dateKey as any };
      }
      salesTimelineMap[dateKey][branchName] = (salesTimelineMap[dateKey][branchName] || 0) + sale.total;
    });

    const timelineData = Object.values(salesTimelineMap).sort((a: any, b: any) =>
      a.date.localeCompare(b.date)
    );

    return {
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalSalesCount,
          topSellingBranch: topSellingBranch ? topSellingBranch.branchName : "N/A",
          topSellingBranchRevenue: topSellingBranch ? topSellingBranch.revenue : 0,
          totalStockCount,
          totalInventoryValue,
          activeBranchesCount: allBranches.length,
        },
        branchRanking,
        branchInventoryBreakdown: Object.values(branchInventoryBreakdown),
        timelineData,
        branches: allBranches,
      },
    };
  } catch (error: any) {
    console.error("[GET_ENTERPRISE_DASHBOARD_DATA]", error);
    return { success: false, error: error.message || "Error al obtener analítica Enterprise" };
  }
}

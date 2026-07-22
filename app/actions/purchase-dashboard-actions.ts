"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";

/**
 * Retorna el gasto total del mes actual y el mes anterior
 */
export async function getSpendingKPIs() {
  const session = await getAuthSession();
  const companyId = await getSessionCompanyId();
  if (!session?.user?.id) throw new Error("No autenticado");

  const companyFilter = companyId ? { companyId } : {};

  const now = new Date();
  
  // Primer día del mes actual
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Primer día del mes anterior
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Órdenes del mes actual
  const currentMonthOrders = await prisma.purchaseOrder.aggregate({
    where: {
      ...companyFilter,
      status: { notIn: ["DRAFT", "CANCELLED"] },
      createdAt: { gte: currentMonthStart }
    },
    _sum: { total: true }
  });

  // Órdenes del mes anterior
  const prevMonthOrders = await prisma.purchaseOrder.aggregate({
    where: {
      ...companyFilter,
      status: { notIn: ["DRAFT", "CANCELLED"] },
      createdAt: { gte: previousMonthStart, lt: currentMonthStart }
    },
    _sum: { total: true }
  });

  const currentSpend = currentMonthOrders._sum.total || 0;
  const prevSpend = prevMonthOrders._sum.total || 0;

  let variation = 0;
  if (prevSpend > 0) {
    variation = ((currentSpend - prevSpend) / prevSpend) * 100;
  } else if (currentSpend > 0) {
    variation = 100;
  }

  return {
    currentSpend,
    prevSpend,
    variation: Math.round(variation)
  };
}

/**
 * Retorna el histórico de gastos de los últimos 6 meses
 */
export async function getMonthlySpendings() {
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...companyFilter,
      status: { notIn: ["DRAFT", "CANCELLED"] },
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      total: true,
      createdAt: true
    }
  });

  // Agrupar en JS
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const grouped: Record<string, number> = {};

  // Inicializar últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    grouped[key] = 0;
  }

  orders.forEach(order => {
    const d = new Date(order.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (grouped[key] !== undefined) {
      grouped[key] += order.total;
    }
  });

  return Object.keys(grouped).map(month => ({
    month,
    gasto: grouped[month]
  }));
}

/**
 * Retorna los top proveedores por volumen de gasto
 */
export async function getTopSuppliers() {
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const topSuppliers = await prisma.purchaseOrder.groupBy({
    by: ['supplierId'],
    where: {
      ...companyFilter,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    },
    _sum: { total: true },
    orderBy: {
      _sum: { total: 'desc' }
    },
    take: 5
  });

  // Traer los nombres
  const supplierIds = topSuppliers.map(t => t.supplierId);
  const suppliersInfo = await prisma.supplier.findMany({
    where: { id: { in: supplierIds } },
    select: { id: true, companyName: true }
  });

  return topSuppliers.map(ts => {
    const info = suppliersInfo.find(s => s.id === ts.supplierId);
    return {
      name: info?.companyName || "Desconocido",
      gasto: ts._sum.total || 0
    };
  });
}

/**
 * Retorna el gasto por categoría de producto
 */
export async function getPurchasesByCategory() {
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // Al no poder hacer joins directos fáciles en Prisma groupBy, obtenemos las líneas
  // y cruzamos en JS
  const lines = await prisma.purchaseOrderLine.findMany({
    where: {
      ...companyFilter,
      purchaseOrder: {
        status: { notIn: ["DRAFT", "CANCELLED"] }
      },
      productId: { not: null }
    },
    select: {
      total: true,
      product: {
        select: {
          category: {
            select: { name: true }
          }
        }
      }
    }
  });

  const grouped: Record<string, number> = {};

  lines.forEach(line => {
    const cat = line.product?.category?.name || "Sin Categoría";
    if (!grouped[cat]) grouped[cat] = 0;
    grouped[cat] += line.total;
  });

  return Object.keys(grouped)
    .map(name => ({ name, value: grouped[name] }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Retorna los productos más comprados en cantidad
 */
export async function getTopProducts() {
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const lines = await prisma.purchaseOrderLine.groupBy({
    by: ['productId'],
    where: {
      ...companyFilter,
      productId: { not: null },
      purchaseOrder: {
        status: { notIn: ["DRAFT", "CANCELLED"] }
      }
    },
    _sum: { quantity: true, total: true },
    orderBy: {
      _sum: { quantity: 'desc' }
    },
    take: 5
  });

  const productIds = lines.map(l => l.productId as number);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true }
  });

  return lines.map(line => {
    const p = products.find(prod => prod.id === line.productId);
    return {
      name: p?.name || "Desconocido",
      cantidad: line._sum.quantity || 0,
      gasto: line._sum.total || 0
    };
  });
}

"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";

export interface DashboardFilterInput {
  dateFrom?: string | null;
  dateTo?: string | null;
  preset?: 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
}

export async function getFilteredDashboardData(input: DashboardFilterInput) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    const companyId = await getSessionCompanyId();
    const companyFilter = companyId ? { companyId } : {};

    // 1. Calcular límites del rango de fechas
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const now = new Date();

    if (input.preset === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'last7') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'last30') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (input.preset === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (input.preset === 'custom' || input.dateFrom || input.dateTo) {
      if (input.dateFrom) {
        startDate = new Date(input.dateFrom);
        startDate.setHours(0, 0, 0, 0);
      }
      if (input.dateTo) {
        endDate = new Date(input.dateTo);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Filtro de ventas por fecha
    const saleDateFilter: any = { ...companyFilter };
    if (startDate || endDate) {
      saleDateFilter.createdAt = {};
      if (startDate) saleDateFilter.createdAt.gte = startDate;
      if (endDate) saleDateFilter.createdAt.lte = endDate;
    }

    // 2. Consultas a la base de datos
    const [
      productCount,
      categoryCount,
      supplierCount,
      filteredSalesCount,
      salesAgg,
      recentSalesList,
      allFilteredSales,
      productsData,
      outOfStockProducts,
      lowStockProducts,
      groupsWithProducts,
      // New CRM and Finances queries
      newCustomersCount,
      totalCustomersCount,
      expensesAgg,
      incomesAgg,
      allExpenses,
      allIncomes
    ] = await Promise.all([
      prisma.product.count({ where: companyFilter }),
      prisma.category.count({ where: companyFilter }),
      prisma.supplier.count({ where: companyFilter }),
      prisma.sale.count({ where: saleDateFilter }),
      prisma.sale.aggregate({
        where: saleDateFilter,
        _sum: { total: true }
      }),
      prisma.sale.findMany({
        where: saleDateFilter,
        select: {
          id: true,
          saleNumber: true,
          client: true,
          paymentMethod: true,
          total: true,
          createdAt: true,
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.sale.findMany({
        where: saleDateFilter,
        select: {
          id: true,
          total: true,
          createdAt: true,
          details: {
            select: {
              quantity: true,
              unitPrice: true,
              product: {
                select: {
                  name: true,
                  unitCost: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.product.findMany({
        where: companyFilter,
        select: { unitCost: true, salePrice: true, quantityAvailable: true }
      }),
      prisma.product.findMany({
        where: { ...companyFilter, quantityAvailable: { lte: 0 } },
        select: { id: true, name: true, code: true, quantityAvailable: true },
        take: 5
      }),
      prisma.product.findMany({
        where: { ...companyFilter, quantityAvailable: { gt: 0, lte: 10 } },
        select: { id: true, name: true, code: true, quantityAvailable: true },
        take: 5
      }),
      prisma.productGroup.findMany({
        where: companyFilter,
        include: { _count: { select: { products: true } } }
      }),
      prisma.customer.count({ where: saleDateFilter }),
      prisma.customer.count({ where: companyFilter }),
      prisma.expense.aggregate({
        where: { ...companyFilter, ...(startDate || endDate ? { date: { gte: startDate || undefined, lte: endDate || undefined } } : {}) },
        _sum: { amount: true }
      }),
      prisma.income.aggregate({
        where: { ...companyFilter, ...(startDate || endDate ? { date: { gte: startDate || undefined, lte: endDate || undefined } } : {}) },
        _sum: { amount: true }
      }),
      prisma.expense.findMany({
        where: { ...companyFilter, ...(startDate || endDate ? { date: { gte: startDate || undefined, lte: endDate || undefined } } : {}) },
        select: { date: true, amount: true }
      }),
      prisma.income.findMany({
        where: { ...companyFilter, ...(startDate || endDate ? { date: { gte: startDate || undefined, lte: endDate || undefined } } : {}) },
        select: { date: true, amount: true }
      })
    ]);

    const totalSalesAmount = Number(salesAgg._sum.total ?? 0);
    const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
    const totalIncomes = Number(incomesAgg._sum.amount ?? 0);

    // Cálculos de costo e inventario
    const totalCostValue = productsData.reduce((sum, p) => sum + (Number(p.unitCost) * p.quantityAvailable), 0);
    const totalSaleValue = productsData.reduce((sum, p) => sum + (Number(p.salePrice) * p.quantityAvailable), 0);
    const profitMargin = totalCostValue > 0 ? (((totalSaleValue - totalCostValue) / totalCostValue) * 100) : 0;

    // 3. Procesar datos de tendencia de ventas (Día o Mes según el rango seleccionado)
    const salesTrendMap: Record<string, { label: string; dateObj: Date; revenue: number; cost: number }> = {};
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const isShortRange = (startDate && endDate)
      ? ((endDate.getTime() - startDate.getTime()) <= 31 * 24 * 3600 * 1000)
      : false;

    // Pre-poblar todos los días/meses del período para que Recharts trace una curva continua ($0 en días sin ventas)
    if (startDate && endDate && isShortRange) {
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        const label = `${curr.getDate()} ${monthNames[curr.getMonth()]}`;
        salesTrendMap[key] = { label, dateObj: new Date(curr), revenue: 0, cost: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    } else if (startDate && endDate && !isShortRange) {
      const curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${String(curr.getFullYear()).slice(-2)}`;
        salesTrendMap[key] = { label, dateObj: new Date(curr), revenue: 0, cost: 0 };
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (input.preset === 'all' || !startDate) {
      // Para "Todo el histórico", poblar al menos los últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const curr = new Date();
        curr.setMonth(curr.getMonth() - i);
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${String(curr.getFullYear()).slice(-2)}`;
        salesTrendMap[key] = { label, dateObj: new Date(curr.getFullYear(), curr.getMonth(), 1), revenue: 0, cost: 0 };
      }
    }

    for (const sale of allFilteredSales) {
      const d = new Date(sale.createdAt);
      let key: string;

      if (startDate && endDate && isShortRange) {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!salesTrendMap[key]) {
        const label = isShortRange
          ? `${d.getDate()} ${monthNames[d.getMonth()]}`
          : `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
        salesTrendMap[key] = { label, dateObj: d, revenue: 0, cost: 0 };
      }

      salesTrendMap[key].revenue += sale.total;
      let saleCost = 0;
      for (const det of sale.details) {
        saleCost += det.quantity * (det.product?.unitCost ?? 0);
      }
      salesTrendMap[key].cost += saleCost;
    }

    const salesTrendData = Object.values(salesTrendMap)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(item => ({
        month: item.label,
        revenue: Math.round(item.revenue),
        cost: Math.round(item.cost)
      }));

    // Tendencia de Ingresos vs Gastos
    const financialTrendMap: Record<string, { label: string; dateObj: Date; incomes: number; expenses: number }> = {};

    if (startDate && endDate && isShortRange) {
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        const label = `${curr.getDate()} ${monthNames[curr.getMonth()]}`;
        financialTrendMap[key] = { label, dateObj: new Date(curr), incomes: 0, expenses: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    } else if (startDate && endDate && !isShortRange) {
      const curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${String(curr.getFullYear()).slice(-2)}`;
        financialTrendMap[key] = { label, dateObj: new Date(curr), incomes: 0, expenses: 0 };
        curr.setMonth(curr.getMonth() + 1);
      }
    } else if (input.preset === 'all' || !startDate) {
      for (let i = 5; i >= 0; i--) {
        const curr = new Date();
        curr.setMonth(curr.getMonth() - i);
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${String(curr.getFullYear()).slice(-2)}`;
        financialTrendMap[key] = { label, dateObj: new Date(curr.getFullYear(), curr.getMonth(), 1), incomes: 0, expenses: 0 };
      }
    }

    // Agregar Incomes a financialTrendMap
    for (const income of allIncomes) {
      const d = new Date(income.date);
      let key = (startDate && endDate && isShortRange)
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!financialTrendMap[key]) {
        const label = isShortRange ? `${d.getDate()} ${monthNames[d.getMonth()]}` : `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
        financialTrendMap[key] = { label, dateObj: d, incomes: 0, expenses: 0 };
      }
      financialTrendMap[key].incomes += income.amount;
    }

    // Agregar Gastos a financialTrendMap
    for (const exp of allExpenses) {
      const d = new Date(exp.date);
      let key = (startDate && endDate && isShortRange)
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!financialTrendMap[key]) {
        const label = isShortRange ? `${d.getDate()} ${monthNames[d.getMonth()]}` : `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
        financialTrendMap[key] = { label, dateObj: d, incomes: 0, expenses: 0 };
      }
      financialTrendMap[key].expenses += exp.amount;
    }

    const financialTrendData = Object.values(financialTrendMap)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(item => ({
        month: item.label,
        incomes: Math.round(item.incomes),
        expenses: Math.round(item.expenses)
      }));

    // 4. Calcular Top 5 Productos más Vendidos en este Período Filtrado
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const sale of allFilteredSales) {
      for (const detail of sale.details) {
        const pName = detail.product?.name ?? 'Producto';
        if (!productSalesMap[pName]) {
          productSalesMap[pName] = { name: pName, quantity: 0, revenue: 0 };
        }
        productSalesMap[pName].quantity += detail.quantity;
        productSalesMap[pName].revenue += detail.quantity * detail.unitPrice;
      }
    }

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 20 ? p.name.slice(0, 17) + '...' : p.name,
        quantity: p.quantity,
        revenue: p.revenue
      }));

    // Distribución por grupos
    const groupDistribution = groupsWithProducts.map(g => ({
      name: g.name,
      count: g._count.products
    }));

    return {
      success: true,
      data: {
        productCount,
        categoryCount,
        supplierCount,
        saleCount: filteredSalesCount,
        totalHistoricalSales: totalSalesAmount,
        profitMargin,
        salesTrendData: salesTrendData.length > 0 ? salesTrendData : [
          { month: 'Sin datos', revenue: 0, cost: 0 }
        ],
        financialTrendData: financialTrendData.length > 0 ? financialTrendData : [
          { month: 'Sin datos', incomes: 0, expenses: 0 }
        ],
        topProducts,
        groupDistribution,
        recentSales: recentSalesList.map(s => ({
          id: s.id,
          saleNumber: s.saleNumber,
          client: s.client,
          paymentMethod: s.paymentMethod,
          total: s.total,
          createdAt: s.createdAt,
          user: s.user
        })),
        outOfStockProducts,
        lowStockProducts,
        filterInfo: {
          preset: input.preset || 'all',
          dateFrom: startDate ? startDate.toISOString().split('T')[0] : null,
          dateTo: endDate ? endDate.toISOString().split('T')[0] : null
        },
        // Extra data for new charts
        newCustomersCount,
        totalCustomersCount,
        totalExpenses,
        totalIncomes
      }
    };
  } catch (error: any) {
    console.error("[GET_FILTERED_DASHBOARD]", error);
    return { success: false, error: error.message || "Error al filtrar los datos del dashboard" };
  }
}

export async function getGlobalDashboardData(input: DashboardFilterInput) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return { success: false, error: "No autenticado" };
    }

    if (session.user.role !== 'SUPERADMIN') {
      return { success: false, error: "Acceso no autorizado. Se requieren permisos de Superadmin." };
    }

    // 1. Calcular límites de rango de fechas
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    if (input.preset === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'last7') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'last30') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (input.preset === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (input.preset === 'lastMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (input.preset === 'custom' || input.dateFrom || input.dateTo) {
      if (input.dateFrom) {
        startDate = new Date(input.dateFrom);
        startDate.setHours(0, 0, 0, 0);
      }
      if (input.dateTo) {
        endDate = new Date(input.dateTo);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const saleDateFilter: any = {};
    if (startDate || endDate) {
      saleDateFilter.createdAt = {};
      if (startDate) saleDateFilter.createdAt.gte = startDate;
      if (endDate) saleDateFilter.createdAt.lte = endDate;
    }

    // 2. Consultas Multi-Empresa
    const [
      companies,
      totalUsersCount,
      totalCustomersCount,
      totalProductsCount,
      globalSalesAgg,
      globalSalesCount,
      allFilteredSales,
      allProductsData,
      outOfStockCount,
      lowStockCount
    ] = await Promise.all([
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          isTrial: true,
          trialStartedAt: true,
          trialEndsAt: true,
          planId: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              products: true,
              customers: true,
              sales: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count(),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.sale.aggregate({
        where: saleDateFilter,
        _sum: { total: true }
      }),
      prisma.sale.count({ where: saleDateFilter }),
      prisma.sale.findMany({
        where: saleDateFilter,
        select: {
          id: true,
          companyId: true,
          total: true,
          createdAt: true,
          company: {
            select: {
              id: true,
              name: true
            }
          },
          details: {
            select: {
              quantity: true,
              unitPrice: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  unitCost: true,
                  company: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.product.findMany({
        select: {
          unitCost: true,
          salePrice: true,
          quantityAvailable: true,
          companyId: true
        }
      }),
      prisma.product.count({
        where: { quantityAvailable: { lte: 0 } }
      }),
      prisma.product.count({
        where: { quantityAvailable: { gt: 0, lte: 10 } }
      })
    ]);

    const totalGlobalRevenue = Number(globalSalesAgg._sum.total ?? 0);

    // Métricas de empresas
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.status === 'ACTIVE').length;
    const trialCompanies = companies.filter(c => c.isTrial).length;
    const paidCompanies = companies.filter(c => !c.isTrial && c.status === 'ACTIVE').length;

    // Métricas de inventario global
    const globalTotalCost = allProductsData.reduce((acc, p) => acc + (Number(p.unitCost || 0) * (p.quantityAvailable || 0)), 0);
    const globalTotalValuation = allProductsData.reduce((acc, p) => acc + (Number(p.salePrice || 0) * (p.quantityAvailable || 0)), 0);

    // 3. Ventas e ingresos por empresa en el período
    const companySalesMap: Record<number, { companyId: number; name: string; revenue: number; salesCount: number; productCount: number; userCount: number }> = {};

    companies.forEach(c => {
      companySalesMap[c.id] = {
        companyId: c.id,
        name: c.name,
        revenue: 0,
        salesCount: 0,
        productCount: c._count.products,
        userCount: c._count.users
      };
    });

    for (const sale of allFilteredSales) {
      if (sale.companyId && companySalesMap[sale.companyId]) {
        companySalesMap[sale.companyId].revenue += sale.total;
        companySalesMap[sale.companyId].salesCount += 1;
      }
    }

    const companyRevenueRanking = Object.values(companySalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .map(c => ({
        companyId: c.companyId,
        name: c.name.length > 22 ? c.name.slice(0, 19) + '...' : c.name,
        fullName: c.name,
        revenue: Math.round(c.revenue),
        salesCount: c.salesCount,
        productCount: c.productCount,
        userCount: c.userCount
      }));

    // Distribución de Productos por Empresa (para gráfico de barras / pie)
    const companyProductsDistribution = companies
      .map(c => ({
        name: c.name.length > 20 ? c.name.slice(0, 18) + '...' : c.name,
        fullName: c.name,
        productCount: c._count.products,
        userCount: c._count.users,
        customerCount: c._count.customers
      }))
      .sort((a, b) => b.productCount - a.productCount);

    // 4. Tendencia de ventas global en el período
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const isShortRange = (startDate && endDate)
      ? ((endDate.getTime() - startDate.getTime()) <= 31 * 24 * 3600 * 1000)
      : false;

    const globalSalesTrendMap: Record<string, { label: string; dateObj: Date; revenue: number; cost: number; orders: number }> = {};

    if (startDate && endDate && isShortRange) {
      const curr = new Date(startDate);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
        const label = `${curr.getDate()} ${monthNames[curr.getMonth()]}`;
        globalSalesTrendMap[key] = { label, dateObj: new Date(curr), revenue: 0, cost: 0, orders: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    } else if (startDate && endDate && !isShortRange) {
      const curr = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (curr <= endDate) {
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${String(curr.getFullYear()).slice(-2)}`;
        globalSalesTrendMap[key] = { label, dateObj: new Date(curr), revenue: 0, cost: 0, orders: 0 };
        curr.setMonth(curr.getMonth() + 1);
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const curr = new Date();
        curr.setMonth(curr.getMonth() - i);
        const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
        const label = `${monthNames[curr.getMonth()]} ${String(curr.getFullYear()).slice(-2)}`;
        globalSalesTrendMap[key] = { label, dateObj: new Date(curr.getFullYear(), curr.getMonth(), 1), revenue: 0, cost: 0, orders: 0 };
      }
    }

    for (const sale of allFilteredSales) {
      const d = new Date(sale.createdAt);
      let key = (startDate && endDate && isShortRange)
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!globalSalesTrendMap[key]) {
        const label = isShortRange
          ? `${d.getDate()} ${monthNames[d.getMonth()]}`
          : `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
        globalSalesTrendMap[key] = { label, dateObj: d, revenue: 0, cost: 0, orders: 0 };
      }

      globalSalesTrendMap[key].revenue += sale.total;
      globalSalesTrendMap[key].orders += 1;
      let saleCost = 0;
      for (const det of sale.details) {
        saleCost += det.quantity * (det.product?.unitCost ?? 0);
      }
      globalSalesTrendMap[key].cost += saleCost;
    }

    const globalSalesTrend = Object.values(globalSalesTrendMap)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(item => ({
        month: item.label,
        revenue: Math.round(item.revenue),
        cost: Math.round(item.cost),
        orders: item.orders
      }));

    // 5. Top 10 Productos Más Vendidos a Nivel Global (con empresa)
    const globalProductSalesMap: Record<string, {
      id: number;
      name: string;
      companyName: string;
      quantity: number;
      revenue: number;
    }> = {};

    for (const sale of allFilteredSales) {
      for (const detail of sale.details) {
        if (!detail.product) continue;
        const pId = detail.product.id;
        const pName = detail.product.name;
        const cName = detail.product.company?.name || sale.company?.name || "Empresa";
        const mapKey = `${pId}_${cName}`;

        if (!globalProductSalesMap[mapKey]) {
          globalProductSalesMap[mapKey] = {
            id: pId,
            name: pName,
            companyName: cName,
            quantity: 0,
            revenue: 0
          };
        }
        globalProductSalesMap[mapKey].quantity += detail.quantity;
        globalProductSalesMap[mapKey].revenue += detail.quantity * detail.unitPrice;
      }
    }

    const topGlobalProducts = Object.values(globalProductSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 6. Lista de Empresas con métricas clave y días de prueba
    const companySummaryList = companies.map(c => {
      let trialDaysRemaining: number | null = null;
      if (c.isTrial && c.trialEndsAt) {
        const diff = new Date(c.trialEndsAt).getTime() - new Date().getTime();
        trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
      }

      const salesData = companySalesMap[c.id];

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        planId: c.planId || 'Standard',
        isTrial: c.isTrial,
        trialDaysRemaining,
        productsCount: c._count.products,
        usersCount: c._count.users,
        customersCount: c._count.customers,
        totalSalesRevenue: salesData?.revenue || 0,
        totalSalesCount: salesData?.salesCount || 0,
        createdAt: c.createdAt
      };
    });

    return {
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        trialCompanies,
        paidCompanies,
        totalUsersCount,
        totalCustomersCount,
        totalProductsCount,
        totalGlobalRevenue,
        globalSalesCount,
        outOfStockCount,
        lowStockCount,
        globalTotalCost,
        globalTotalValuation,
        companyRevenueRanking,
        companyProductsDistribution,
        globalSalesTrend: globalSalesTrend.length > 0 ? globalSalesTrend : [{ month: 'Sin datos', revenue: 0, cost: 0, orders: 0 }],
        topGlobalProducts,
        companySummaryList,
        filterInfo: {
          preset: input.preset || 'all',
          dateFrom: startDate ? startDate.toISOString().split('T')[0] : null,
          dateTo: endDate ? endDate.toISOString().split('T')[0] : null
        }
      }
    };
  } catch (error: any) {
    console.error("[GET_GLOBAL_DASHBOARD]", error);
    return { success: false, error: error.message || "Error al obtener las métricas globales del dashboard" };
  }
}

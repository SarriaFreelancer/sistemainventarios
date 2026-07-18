import { prisma } from '@/lib/prisma';
import { LayoutDashboard, Package, Tags, Factory, AlertTriangle, DollarSign, ShoppingCart, Sparkles, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { DashboardCharts } from '@/components/dashboard-charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { redirect } from 'next/navigation';
import { getAuthSession } from '../../auth';
import { getSessionCompanyId } from '@/lib/session';

export const revalidate = 0; // Disable caching to keep data fresh

export default async function DashboardHomePage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/auth/login');

  // Verify module access
  let allowedModules: any[] = [];
  const tenantId = await getSessionCompanyId() || -1;

  if (session.user.role === 'SUPERADMIN') {
    allowedModules = await prisma.module.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  } else if (session.user.role === 'ADMIN') {
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: tenantId },
      include: { module: true },
    });
    allowedModules = companyModules.map(cm => cm.module).filter(m => m.isActive);
  } else {
    const roleModules = await prisma.roleModule.findMany({
      where: { role: { name: session.user.role as any } },
      include: { module: true },
    });
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: tenantId },
      include: { module: true },
    });
    const companyModuleIds = new Set(companyModules.map(cm => cm.moduleId));
    allowedModules = roleModules.filter(rm => companyModuleIds.has(rm.moduleId)).map(rm => rm.module).filter(m => m.isActive);
  }

  const hasDashboardAccess = session.user.role === 'SUPERADMIN' || allowedModules.some(m => m.href === '/dashboard' || m.name.toLowerCase() === 'dashboard');
  
  if (!hasDashboardAccess) {
    if (allowedModules.length > 0) {
      redirect(allowedModules[0].href || '/dashboard/sales');
    } else {
      // If no modules are assigned at all, stay on a blank layout or redirect out
      redirect('/auth/login');
    }
  }

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // ── Queries ──
  const [
    productCount,
    categoryCount,
    supplierCount,
    saleCount,
    productsData,
    recentSales,
    outOfStockProducts,
    lowStockProducts
  ] = await Promise.all([
    prisma.product.count({ where: companyFilter }),
    prisma.category.count({ where: companyFilter }),
    prisma.supplier.count({ where: companyFilter }),
    prisma.sale.count({ where: companyFilter }),
    prisma.product.findMany({
      where: companyFilter,
      include: { category: true }
    }),
    prisma.sale.findMany({
      where: companyFilter,
      include: { user: true, details: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.product.findMany({
      where: { ...companyFilter, quantityAvailable: 0 },
      take: 4,
    }),
    prisma.product.findMany({
      where: {
        ...companyFilter,
        quantityAvailable: {
          gt: 0,
          lte: 10,
        }
      },
      take: 4,
    })
  ]);

  // ── Financial Calculations ──
  // Base cost of current inventory = sum(unitCost * quantityAvailable)
  const totalCostValue = productsData.reduce((sum, p) => sum + (p.unitCost * p.quantityAvailable), 0);
  // Sale value of current inventory = sum(salePrice * quantityAvailable)
  const totalSaleValue = productsData.reduce((sum, p) => sum + (p.salePrice * p.quantityAvailable), 0);
  
  // Total historical revenue from sales
  const salesSummary = await prisma.sale.aggregate({
    where: companyFilter,
    _sum: { total: true }
  });
  const totalHistoricalSales = Number(salesSummary._sum.total ?? 0);

  // Profit margin calculation (based on current inventory pricing)
  const profitMargin = totalCostValue > 0
    ? (((totalSaleValue - totalCostValue) / totalCostValue) * 100)
    : 0;

  // ── Chart 1: Sales by Month (last 6 months) ──
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const historicalSales = await prisma.sale.findMany({
    where: { ...companyFilter, createdAt: { gte: sixMonthsAgo } },
    include: {
      details: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthlyDataMap: Record<string, { revenue: number; cost: number }> = {};

  // Initialize last 6 months in map
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(baseDate().getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyDataMap[key] = { revenue: 0, cost: 0 };
  }

  // Populate data
  for (const sale of historicalSales) {
    const date = new Date(sale.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyDataMap[key]) {
      monthlyDataMap[key].revenue += sale.total;
      
      // Calculate base cost of this sale
      let saleCost = 0;
      for (const detail of sale.details) {
        saleCost += detail.quantity * (detail.product?.unitCost ?? 0);
      }
      monthlyDataMap[key].cost += saleCost;
    }
  }

  const salesByMonth = Object.entries(monthlyDataMap).map(([key, data]) => {
    const [year, month] = key.split('-');
    const monthName = monthNames[parseInt(month, 10) - 1];
    return {
      month: `${monthName} ${year.slice(-2)}`,
      revenue: Math.round(data.revenue),
      cost: Math.round(data.cost)
    };
  });

  // ── Chart 2: Top Products ──
  const topProductsRaw = await prisma.product.findMany({
    where: companyFilter,
    orderBy: { soldQuantity: 'desc' },
    take: 5
  });

  const topProducts = topProductsRaw.map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 17) + '...' : p.name,
    quantity: p.soldQuantity,
    revenue: p.soldQuantity * p.salePrice
  }));

  // ── Chart 3: Product Group Distribution ──
  const groupsWithProducts = await prisma.productGroup.findMany({
    where: companyFilter,
    include: { _count: { select: { products: true } } }
  });

  const groupDistribution = groupsWithProducts.map(g => ({
    name: g.name,
    count: g._count.products
  }));

  // Helper for actual date reference
  function baseDate() {
    return new Date();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Header Premium ── */}
      <div className="p-8 rounded-[32px] bg-card border border-border shadow-md shadow-primary/5 relative overflow-hidden transition-colors duration-500">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="h-3 w-3 animate-pulse text-primary" />
              GNS Gestión de Negocios
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Bienvenido al Sistema de Gestión
            </h1>
            <p className="text-sm text-muted-foreground">
              Supervisa el rendimiento comercial, existencias y actividades de auditoría en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-muted border border-border px-4 py-3 rounded-2xl">
            <Calendar className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha de Sistema</p>
              <p className="text-xs font-bold text-foreground">
                {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Productos */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Productos Catálogo</p>
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{productCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Organizados en <span className="font-bold text-foreground">{categoryCount} categorías</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Proveedores */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Proveedores</p>
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
              <Factory className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{supplierCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Contactos comerciales registrados</p>
          </div>
        </div>

        {/* KPI 3: Total Ventas */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Ventas Registradas</p>
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {totalHistoricalSales.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              En <span className="font-bold text-foreground">{saleCount} facturaciones</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Alert Stock */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-red-500/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Productos sin Existencias</p>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className={`text-3xl font-black ${outOfStockProducts.length > 0 ? 'text-red-500' : 'text-foreground'}`}>
              {outOfStockProducts.length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Requieren reabastecimiento urgente</p>
          </div>
        </div>
      </div>

      {/* ── Gráficos de Recharts ── */}
      <div className="space-y-6">
        <DashboardCharts
          salesByMonth={salesByMonth}
          topProducts={topProducts}
          groupDistribution={groupDistribution}
          marginPct={profitMargin}
        />
      </div>

      {/* ── Sección de Stock e Historial de Ventas Recientes ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Panel Izquierdo: Alertas de Stock (Poco/Agotado) */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Alertas de Stock
            </CardTitle>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Estado Crítico</span>
          </CardHeader>
          <CardContent className="p-0 pt-4 space-y-4">
            {/* Agotados */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 inline-block animate-ping" />
                Agotados ({outOfStockProducts.length})
              </p>
              {outOfStockProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">¡Todo el catálogo tiene disponibilidad!</p>
              ) : (
                <div className="grid gap-2">
                  {outOfStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-red-500/5 border border-red-500/10 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500">{p.code}</span>
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-red-500">0 unidades</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Poco Stock */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                Existencias Bajas (1 a 10 u.)
              </p>
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">No hay productos con existencias críticamente bajas.</p>
              ) : (
                <div className="grid gap-2">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">{p.code}</span>
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-600">{p.quantityAvailable} unidades</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel Derecho: Últimas Ventas */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Últimas Ventas Registradas
            </CardTitle>
            <Link href="/dashboard/sales" className="text-xs font-semibold text-primary hover:underline">
              Ver Historial
            </Link>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No se han registrado ventas recientemente.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{sale.saleNumber}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliente: <span className="font-semibold text-foreground">{sale.client ?? 'Venta Directa'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-primary">
                        {sale.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </p>
                      <span className="inline-block text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                        {sale.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

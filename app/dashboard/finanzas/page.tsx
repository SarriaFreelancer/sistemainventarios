import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Package, DollarSign, Wallet, ArrowUpRight, PlusCircle } from 'lucide-react';
import { FinanzasFilters } from './components/finanzas-filters';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const metadata = {
  title: 'Finanzas · GNS',
  description: 'Vista detallada del estado financiero, costos y ganancias.',
};

export default async function FinanzasPage(props: { searchParams: Promise<{ preset?: string, from?: string, to?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // Date filters
  const preset = searchParams.preset || 'all';
  let dateFilter: any = {};
  
  if (preset !== 'all') {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    if (preset === 'today') startDate = startOfDay(now);
    else if (preset === 'yesterday') {
      startDate = startOfDay(subDays(now, 1));
      endDate = endOfDay(subDays(now, 1));
    }
    else if (preset === '7days') startDate = startOfDay(subDays(now, 7));
    else if (preset === '30days') startDate = startOfDay(subDays(now, 30));
    else if (preset === 'custom' && searchParams.from && searchParams.to) {
      startDate = startOfDay(new Date(searchParams.from));
      endDate = endOfDay(new Date(searchParams.to));
    } else {
      startDate = startOfDay(now);
    }

    dateFilter = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [expenseSummary, sales, products, recentExpenses, incomesSummary] = await Promise.all([
    prisma.expense.aggregate({
      where: { ...companyFilter, ...(preset !== 'all' ? { date: dateFilter } : {}) },
      _sum: { amount: true }
    }),
    prisma.sale.findMany({
      where: { ...companyFilter, ...(preset !== 'all' ? { createdAt: dateFilter } : {}) },
      include: {
        details: { include: { product: true } }
      }
    }),
    prisma.product.findMany({
      where: companyFilter
    }),
    prisma.expense.findMany({
      where: { ...companyFilter, ...(preset !== 'all' ? { date: dateFilter } : {}) },
      orderBy: { date: 'desc' },
      take: 5
    }),
    prisma.income.aggregate({
      where: { ...companyFilter, ...(preset !== 'all' ? { date: dateFilter } : {}) },
      _sum: { amount: true }
    }),
  ]);

  const totalExpenses = Number(expenseSummary._sum.amount ?? 0);
  const totalManualIncomes = Number(incomesSummary._sum.amount ?? 0);
  
  // ── 1. Ganancias y Costo de Ventas (COGS) ──
  let totalRevenue = 0;
  let totalCOGS = 0;

  for (const sale of sales) {
    totalRevenue += sale.total;
    for (const detail of sale.details) {
      if (detail.product) {
        totalCOGS += detail.quantity * detail.product.unitCost;
      }
    }
  }
  
  totalRevenue += totalManualIncomes;

  const grossProfit = totalRevenue - totalCOGS; // Ganancia Bruta (Ingresos - Costo de la mercancía vendida)
  const netProfit = grossProfit - totalExpenses; // Ganancia Neta (Ganancia Bruta - Gastos operativos)

  // ── 2. Valorización de Inventario (Costos Estáticos) ──
  let invRawMaterial = 0;
  let invSales = 0;

  for (const p of products) {
    const val = p.quantityAvailable * p.unitCost;
    if (val > 0) {
      if (p.type === 'RAW_MATERIAL') {
        invRawMaterial += val;
      } else {
        invSales += val; // Productos terminados o para venta directa
      }
    }
  }

  const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Estado Financiero</h1>
          <p className="text-sm text-muted-foreground mt-1">Análisis detallado de costos, ingresos y rentabilidad.</p>
        </div>
        <Link 
          href="/dashboard/finanzas/ingresos-gastos"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusCircle size={16} />
          Movimientos Manuales
        </Link>
      </div>

      {/* ── Filtros ── */}
      <FinanzasFilters />

      {/* ── KPIs Principales: Ganancias y Pérdidas (P&L) ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Ingresos por Ventas */}
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ingresos Totales</p>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{formatter.format(totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Ventas brutas registradas.</p>
          </div>
        </div>

        {/* Costo de Mercancía Vendida */}
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between group hover:border-amber-500/30 transition-all">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Costo de Ventas</p>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
              <Package size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{formatter.format(totalCOGS)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Costo de los productos ya vendidos.</p>
          </div>
        </div>

        {/* Gastos Operativos */}
        <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm flex flex-col justify-between group hover:border-rose-500/30 transition-all">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gastos Operativos</p>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{formatter.format(totalExpenses)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Servicios, nóminas, etc.</p>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="rounded-[24px] border-2 border-primary/40 bg-card p-6 shadow-sm flex flex-col justify-between group hover:border-primary transition-all relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Ganancia Neta</p>
            <div className="p-2 bg-primary/20 text-primary rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-black text-foreground">{formatter.format(netProfit)}</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
              Rentabilidad Real (Ingresos - Costos - Gastos)
            </p>
          </div>
        </div>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* ── Desglose de Costos de Inventario Actual ── */}
        <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Valorización de Inventario</h2>
              <p className="text-xs text-muted-foreground">Capital invertido en stock actual</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
              <div>
                <p className="text-xs font-bold text-foreground">Materia Prima</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Insumos para producción</p>
              </div>
              <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">{formatter.format(invRawMaterial)}</p>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
              <div>
                <p className="text-xs font-bold text-foreground">Mercancía para Venta</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Productos terminados y comerciales</p>
              </div>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatter.format(invSales)}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 mt-2">
              <p className="text-xs font-bold text-foreground">Total Inmovilizado</p>
              <p className="text-lg font-black text-primary">{formatter.format(invRawMaterial + invSales)}</p>
            </div>
          </div>
        </div>

        {/* ── Gastos Recientes ── */}
        <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
                <ArrowUpRight size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Gastos Recientes</h2>
                <p className="text-xs text-muted-foreground">Últimos egresos registrados</p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {recentExpenses.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentExpenses.map((expense) => (
                  <div key={expense.id} className="py-3.5 first:pt-0 last:pb-0 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-foreground">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {expense.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-extrabold text-rose-500">
                      -{formatter.format(expense.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">No hay gastos registrados aún.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

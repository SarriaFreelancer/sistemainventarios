"use client";

import React, { useState, useTransition } from "react";
import {
  Package,
  Factory,
  ShoppingCart,
  AlertTriangle,
  Sparkles,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Clock,
  AlertCircle,
  ChevronDown,
  Check
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getFilteredDashboardData, DashboardFilterInput } from "@/app/actions/dashboard-actions";
import { errorAlert } from "@/lib/sweetalert";

const DashboardCharts = dynamic(
  () => import("@/components/dashboard-charts").then((m) => m.DashboardCharts),
  {
    loading: () => <div className="h-[400px] rounded-2xl bg-muted/30 animate-pulse" />
  }
);

const WelcomeTour = dynamic(
  () => import("@/components/welcome-tour").then((m) => m.WelcomeTour)
);

interface DashboardClientProps {
  initialData: any;
  allowedModules: any[];
  userId: string;
  tourCompleted: boolean;
}

export function DashboardClient({
  initialData,
  allowedModules,
  userId,
  tourCompleted
}: DashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const [preset, setPreset] = useState<DashboardFilterInput['preset']>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);

  const handleApplyFilter = (selectedPreset: DashboardFilterInput['preset'], customFrom?: string, customTo?: string) => {
    setPreset(selectedPreset);
    if (selectedPreset === 'custom') {
      setShowCustomRange(true);
      if (!customFrom && !customTo) return;
    } else {
      setShowCustomRange(false);
    }

    startTransition(async () => {
      const res = await getFilteredDashboardData({
        preset: selectedPreset,
        dateFrom: customFrom || dateFrom,
        dateTo: customTo || dateTo
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        errorAlert("Error", res.error || "No se pudieron obtener las métricas filtradas");
      }
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFrom && !dateTo) {
      errorAlert("Atención", "Por favor selecciona al menos una fecha de inicio o fin");
      return;
    }
    handleApplyFilter('custom', dateFrom, dateTo);
  };

  const getActiveFilterLabel = () => {
    switch (preset) {
      case 'today': return 'Filtrado por: Hoy';
      case 'yesterday': return 'Filtrado por: Ayer';
      case 'last7': return 'Filtrado por: Últimos 7 Días';
      case 'last30': return 'Filtrado por: Últimos 30 Días';
      case 'thisMonth': return 'Filtrado por: Este Mes';
      case 'lastMonth': return 'Filtrado por: Mes Anterior';
      case 'custom': return `Filtrado por: ${dateFrom || 'Inicio'} al ${dateTo || 'Fin'}`;
      default: return 'Histórico General (Todo el tiempo)';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!tourCompleted && (
        <WelcomeTour modules={allowedModules.map((m) => m.name)} userId={userId} />
      )}

      {/* ── Header Premium con Selector de Calendario y Fechas ── */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-card border border-border shadow-md shadow-primary/5 relative overflow-hidden transition-colors duration-500 space-y-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
              GNS Gestión de Negocios
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Bienvenido al Sistema de Gestión
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Supervisa las ventas, existencias e inventario filtrando por cualquier fecha o período.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-muted/60 border border-border px-4 py-3 rounded-2xl shrink-0">
              <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Período Seleccionado</p>
                <p className="text-xs font-black text-foreground truncate max-w-[200px]">
                  {getActiveFilterLabel()}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleApplyFilter('all')}
              disabled={isPending}
              className="px-4 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-foreground text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
              title="Restablecer a Todo el Histórico"
            >
              <RefreshCw className={`h-4 w-4 text-primary ${isPending ? 'animate-spin' : ''}`} />
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        {/* ── BARRA DE BOTONES RÁPIDOS Y CALENDARIO DE FILTRADO ── */}
        <div className="relative z-10 pt-4 border-t border-border/60 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Filter size={14} className="text-primary" />
              Filtrar Gráficos e Información por Fecha:
            </p>
            {isPending && (
              <span className="text-xs font-bold text-primary animate-pulse flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Actualizando datos...
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {[
              { id: 'all', label: 'Todo el Histórico' },
              { id: 'today', label: 'Hoy' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'last7', label: 'Últimos 7 Días' },
              { id: 'last30', label: 'Últimos 30 Días' },
              { id: 'thisMonth', label: 'Este Mes' },
              { id: 'lastMonth', label: 'Mes Anterior' },
              { id: 'custom', label: 'Rango / Fecha Específica' },
            ].map((item) => {
              const isSelected = preset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleApplyFilter(item.id as any)}
                  disabled={isPending}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border shadow-sm ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary scale-[1.03] shadow-md"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {isSelected && <Check size={12} />}
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Formulario de Rango de Fechas Personalizado / Calendario */}
          {(showCustomRange || preset === 'custom') && (
            <form onSubmit={handleCustomSubmit} className="p-4 rounded-2xl bg-muted/40 border border-border/80 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="space-y-1.5 flex-1 w-full">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <CalendarIcon size={12} className="text-primary" /> Fecha Inicial (Desde)
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5 flex-1 w-full">
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <CalendarIcon size={12} className="text-primary" /> Fecha Final (Hasta)
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <Filter size={14} />
                  Aplicar Rango
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── KPI Cards Dinámicas ── */}
      <div id="tour-dashboard-kpi" className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* KPI 1: Productos */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Productos Catálogo</p>
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{data.productCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Organizados en <span className="font-bold text-foreground">{data.categoryCount} categorías</span>
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
            <p className="text-3xl font-black text-foreground">{data.supplierCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Contactos comerciales registrados</p>
          </div>
        </div>

        {/* KPI 3: Total Ventas Filtradas */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Ventas en el Período</p>
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground truncate">
              {Number(data.totalHistoricalSales ?? 0).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              En <span className="font-bold text-foreground">{data.saleCount} facturaciones</span> ({preset === 'all' ? 'Histórico' : 'Filtrado'})
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
            <p className={`text-3xl font-black ${(data.outOfStockProducts?.length ?? 0) > 0 ? "text-red-500" : "text-foreground"}`}>
              {data.outOfStockProducts?.length ?? 0}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Requieren reabastecimiento urgente</p>
          </div>
        </div>
      </div>

      {/* ── Gráficos de Recharts Dinámicos Filtrados por Fecha ── */}
      <div id="tour-dashboard-stats" className={`space-y-6 transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <DashboardCharts
          salesByMonth={data.salesTrendData || []}
          financialTrendData={data.financialTrendData || []}
          topProducts={data.topProducts || []}
          groupDistribution={data.groupDistribution || []}
          marginPct={data.profitMargin || 0}
          totalExpenses={data.totalExpenses || 0}
          totalIncomes={data.totalIncomes || 0}
          newCustomersCount={data.newCustomersCount || 0}
          totalCustomersCount={data.totalCustomersCount || 0}
        />
      </div>

      {/* ── Sección de Stock e Historial de Ventas Recientes en el Período ── */}
      <div className={`grid gap-6 lg:grid-cols-2 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* Panel Izquierdo: Alertas de Stock */}
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
                Agotados ({(data.outOfStockProducts?.length ?? 0)})
              </p>
              {(data.outOfStockProducts?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">¡Todo el catálogo tiene disponibilidad!</p>
              ) : (
                <div className="grid gap-2">
                  {data.outOfStockProducts.map((p: any) => (
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
              {(data.lowStockProducts?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">No hay productos con existencias críticamente bajas.</p>
              ) : (
                <div className="grid gap-2">
                  {data.lowStockProducts.map((p: any) => (
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

        {/* Panel Derecho: Ventas Recientes en el Período */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              Ventas Registradas en el Período
            </CardTitle>
            <Link href="/dashboard/sales" className="text-xs font-semibold text-primary hover:underline">
              Ver Todas
            </Link>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {(data.recentSales?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">
                No se registraron ventas en la fecha/período seleccionado.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {data.recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{sale.saleNumber}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString("es-CO", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliente: <span className="font-semibold text-foreground">{sale.client ?? "Venta Directa"}</span>
                        {sale.user?.name ? <span className="ml-2 text-[10px] text-primary">({sale.user.name})</span> : null}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-primary">
                        {sale.total.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0
                        })}
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

      {/* ── ACCESOS DIRECTOS INTELIGENTES (AL FINAL) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6 pt-6 border-t border-border/50">
        {allowedModules.some(m => m.name.toLowerCase() === 'ventas' || m.name.toLowerCase() === 'dashboard') && (
          <Link 
            href="/dashboard/sales" 
            className="group relative overflow-hidden p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <ShoppingCart size={20} />
              </div>
              <span className="font-extrabold text-sm text-foreground tracking-wide">Nueva Venta</span>
            </div>
          </Link>
        )}
        {allowedModules.some(m => m.name.toLowerCase() === 'productos' || m.name.toLowerCase() === 'dashboard') && (
          <Link 
            href="/dashboard/products" 
            className="group relative overflow-hidden p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Package size={20} />
              </div>
              <span className="font-extrabold text-sm text-foreground tracking-wide">Inventario</span>
            </div>
          </Link>
        )}
        {allowedModules.some(m => m.name.toLowerCase() === 'crm' || m.name.toLowerCase() === 'dashboard') && (
          <Link 
            href="/dashboard/crm" 
            className="group relative overflow-hidden p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Factory size={20} />
              </div>
              <span className="font-extrabold text-sm text-foreground tracking-wide">Clientes CRM</span>
            </div>
          </Link>
        )}
        {allowedModules.some(m => m.name.toLowerCase() === 'finanzas' || m.name.toLowerCase() === 'dashboard') && (
          <Link 
            href="/dashboard/finanzas" 
            className="group relative overflow-hidden p-4 rounded-xl bg-card border border-border shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-300"
          >
            <div className="relative z-10 flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <AlertCircle size={20} />
              </div>
              <span className="font-extrabold text-sm text-foreground tracking-wide">Finanzas</span>
            </div>
          </Link>
        )}
      </div>

    </div>
  );
}

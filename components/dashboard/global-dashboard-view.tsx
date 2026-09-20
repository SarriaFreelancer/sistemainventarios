"use client";

import React from "react";
import {
  Building2,
  Users,
  Package,
  TrendingUp,
  DollarSign,
  Globe,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  BarChart3,
  Boxes,
  Briefcase,
  Layers,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const COLORS = [
  "#0055FF", // Azul
  "#00C853", // Verde
  "#FF6D00", // Naranja
  "#7C00FF", // Violeta
  "#FF007F", // Rosa
  "#00E5FF", // Cian
  "#D50000", // Rojo
  "#AEEA00", // Lima
  "#3D5AFE", // Índigo
  "#F50057"  // Fucsia
];

export interface GlobalDashboardData {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  paidCompanies: number;
  totalUsersCount: number;
  totalCustomersCount: number;
  totalProductsCount: number;
  totalGlobalRevenue: number;
  globalSalesCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  globalTotalCost: number;
  globalTotalValuation: number;
  companyRevenueRanking: {
    companyId: number;
    name: string;
    fullName: string;
    revenue: number;
    salesCount: number;
    productCount: number;
    userCount: number;
  }[];
  companyProductsDistribution: {
    name: string;
    fullName: string;
    productCount: number;
    userCount: number;
    customerCount: number;
  }[];
  globalSalesTrend: {
    month: string;
    revenue: number;
    cost: number;
    orders: number;
  }[];
  topGlobalProducts: {
    id: number;
    name: string;
    companyName: string;
    quantity: number;
    revenue: number;
  }[];
  companySummaryList: {
    id: number;
    name: string;
    status: string;
    planId: string;
    isTrial: boolean;
    trialDaysRemaining: number | null;
    productsCount: number;
    usersCount: number;
    customersCount: number;
    totalSalesRevenue: number;
    totalSalesCount: number;
    createdAt: string | Date;
  }[];
  filterInfo: {
    preset: string;
    dateFrom?: string | null;
    dateTo?: string | null;
  };
}

interface GlobalDashboardViewProps {
  data: GlobalDashboardData;
  isPending?: boolean;
}

export function GlobalDashboardView({ data, isPending = false }: GlobalDashboardViewProps) {
  // Datos para gráfico de pastel de estado de empresas
  const companyStatusData = [
    { name: "Suscripción Activa", value: data.paidCompanies || 0, color: "#00C853" },
    { name: "Período de Prueba (Trial)", value: data.trialCompanies || 0, color: "#FF6D00" },
    { name: "Inactivas / Suspendidas", value: Math.max(0, data.totalCompanies - data.activeCompanies), color: "#D50000" }
  ].filter(d => d.value > 0);

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

      {/* ── BANNER SUPERADMIN GLOBAL ── */}
      <div className="p-5 rounded-[24px] bg-gradient-to-r from-primary/10 via-indigo-500/10 to-blue-500/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Globe className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              Modo Global SaaS Activo
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-extrabold uppercase tracking-wide">
                SUPERADMIN CONSOLE
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supervisando métricas consolidadas en tiempo real de todas las empresas y cuentas registradas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/companies"
            className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Gestionar Empresas
          </Link>
          <Link
            href="/dashboard/modules"
            className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            Módulos Globales
          </Link>
        </div>
      </div>

      {/* ── 4 KPI CARDS GLOBALES DE ALTO IMPACTO ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 1: Total Empresas */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Empresas SaaS</p>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{data.totalCompanies}</p>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="font-bold text-emerald-600">{data.activeCompanies} activas</span>
              <span>·</span>
              <span className="font-bold text-amber-600">{data.trialCompanies} en prueba</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Facturación Global */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Facturación Global</p>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground truncate">
              {Number(data.totalGlobalRevenue ?? 0).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0
              })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              En <span className="font-bold text-foreground">{data.globalSalesCount} ventas</span> registradas en el período
            </p>
          </div>
        </div>

        {/* KPI 3: Catálogo Global */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Catálogo Global</p>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{data.totalProductsCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Valorización: <span className="font-bold text-foreground">{Number(data.globalTotalValuation ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Usuarios y CRM Ecosistema */}
        <div className="p-6 rounded-[24px] bg-card border border-border shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Usuarios & Clientes</p>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-foreground">{data.totalUsersCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Usuarios activos y <span className="font-bold text-foreground">{data.totalCustomersCount} clientes</span> CRM
            </p>
          </div>
        </div>

      </div>

      {/* ── FILA 1 DE GRÁFICOS: TENDENCIA GLOBAL Y FACTURACIÓN POR EMPRESA ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* Gráfico 1: Tendencia Global de Ventas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tendencia de Ventas Global SaaS
              </CardTitle>
              <p className="text-xs text-muted-foreground">Evolución de ingresos y costos consolidados en el período</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
              {data.globalSalesCount} Transacciones
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.globalSalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="globalRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0055FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0055FF" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="globalCostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF1744" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF1744" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                      return `$${val}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(17, 24, 39, 0.95)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    formatter={(val: any) => [
                      Number(val).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
                      ""
                    ]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Area type="monotone" dataKey="revenue" name="Ingresos Globales" stroke="#0055FF" strokeWidth={2.5} fillOpacity={1} fill="url(#globalRevenueGrad)" />
                  <Area type="monotone" dataKey="cost" name="Costos Globales" stroke="#FF1744" strokeWidth={2} fillOpacity={1} fill="url(#globalCostGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Distribución de Empresas SaaS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-500" />
                Estado del Ecosistema
              </CardTitle>
              <p className="text-xs text-muted-foreground">Distribución de planes y estados</p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companyStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {companyStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(17, 24, 39, 0.95)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-border/50 text-xs">
              {companyStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── FILA 2 DE GRÁFICOS: RANKING DE FACTURACIÓN Y PRODUCTOS POR EMPRESA ── */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Gráfico 3: Ranking de Facturación por Empresa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Ventas por Empresa (En el Período)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Empresas con mayor facturación registrada</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {data.companyRevenueRanking.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-12">No hay empresas registradas</p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.companyRevenueRanking.slice(0, 7)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                        return `$${val}`;
                      }}
                    />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(17, 24, 39, 0.95)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                      formatter={(val: any) => [
                        Number(val).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
                        "Facturación"
                      ]}
                    />
                    <Bar dataKey="revenue" name="Ventas" fill="#00C853" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 4: Total Productos por Empresa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-500" />
                Total Productos por Empresa
              </CardTitle>
              <p className="text-xs text-muted-foreground">Distribución de SKUs e inventario activo</p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {data.companyProductsDistribution.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-12">No hay productos registrados</p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.companyProductsDistribution.slice(0, 7)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(17, 24, 39, 0.95)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                    />
                    <Bar dataKey="productCount" name="Productos" fill="#0055FF" radius={[6, 6, 0, 0]}>
                      {data.companyProductsDistribution.slice(0, 7).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── FILA 3: TOP PRODUCTOS GLOBALES Y SALUD DE EMPRESAS ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Panel Izquierdo: Top 10 Productos Más Vendidos a Nivel Global */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/60">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Top 10 Productos Más Vendidos (Global)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Los artículos con mayor rotación en toda la plataforma</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
              Ranking SaaS
            </span>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {data.topGlobalProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">
                No hay ventas registradas en el período seleccionado.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {data.topGlobalProducts.map((p, idx) => (
                  <div key={p.id + '-' + idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        idx === 0 ? "bg-amber-500 text-white shadow-sm" :
                        idx === 1 ? "bg-slate-300 dark:bg-slate-700 text-foreground" :
                        idx === 2 ? "bg-amber-700 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Building2 size={10} className="text-primary" />
                          <span className="font-semibold text-foreground/80">{p.companyName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-primary">
                        {Number(p.revenue).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground">{p.quantity} unidades</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel Derecho: Directorio de Empresas y Estado */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/60">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Resumen de Empresas y Licencias
              </CardTitle>
              <p className="text-xs text-muted-foreground">Estado de suscripciones y volumen operativo</p>
            </div>
            <Link href="/dashboard/companies" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Ver Todas <ArrowUpRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {data.companySummaryList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">
                No hay empresas registradas.
              </p>
            ) : (
              <div className="divide-y divide-border/60 max-h-[360px] overflow-y-auto pr-1">
                {data.companySummaryList.slice(0, 8).map((comp) => (
                  <div key={comp.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground">{comp.name}</span>
                        {comp.isTrial ? (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Prueba {comp.trialDaysRemaining !== null ? `(${comp.trialDaysRemaining}d)` : ""}
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {comp.productsCount} productos · {comp.usersCount} usuarios · {comp.customersCount} clientes
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-foreground">
                        {Number(comp.totalSalesRevenue).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {comp.totalSalesCount} ventas
                      </p>
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

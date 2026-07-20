"use client";

import React, { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

interface AnalyticsData {
  usersToday: number;
  usersWeek: number;
  failedLogins: number;
  crudStats: {
    productsCreated: number;
    productsUpdated: number;
    salesCreated: number;
    revenue?: number;
  };
  topCompanies: { name: string; logsCount: number }[];
  modules: { name: string; count: number; percentage: number }[];
  hours: number[];
  monthlySales: { month: string; total: number }[];
}

interface AnalyticsClientProps {
  analytics: AnalyticsData;
  isSuperAdmin: boolean;
}

// Paleta de colores para gráficos
const CHART_COLORS = [
  "#0055FF", // Azul Fuerte
  "#00C853", // Verde Fuerte
  "#FF1744", // Coral Fuerte
  "#FF007F", // Rosa Fuerte
  "#7C00FF", // Violeta Fuerte
  "#00E5FF", // Cian Fuerte
  "#D50000", // Rojo Fuerte
  "#AEEA00", // Lima Fuerte
  "#3D5AFE", // Índigo Fuerte
  "#F50057"  // Fucsia Fuerte
];

// Formateador de moneda COP
const formatCOP = (val: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(val);

// Tooltip de Ventas
const SalesTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-3 shadow-xl text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">
          {formatCOP(payload[0]?.value || 0)}
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip de horas
const HoursTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-3 shadow-xl text-xs">
        <p className="font-bold text-foreground mb-1">
          {label}:00 – {label}:59
        </p>
        <p className="text-primary font-semibold">
          {payload[0]?.value} eventos
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsClient({ analytics, isSuperAdmin }: AnalyticsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");

  const handleDateChange = () => {
    const params = new URLSearchParams(searchParams);
    if (startDate) params.set("start", startDate);
    else params.delete("start");
    
    if (endDate) params.set("end", endDate);
    else params.delete("end");

    router.push(`${pathname}?${params.toString()}`);
  };

  // Preparar datos de horas para el heatmap
  const hourlyData = analytics.hours.map((count, i) => ({
    hora: i.toString().padStart(2, "0"),
    eventos: count,
  }));

  const isFiltered = !!startDate || !!endDate;
  const suffix = isFiltered ? "en el periodo" : "hoy";

  // Tarjetas de resumen superiores
  const summaryCards = [
    {
      label: `Ingresos ${suffix}`,
      value: formatCOP(analytics.crudStats.revenue || 0),
      icon: LucideIcons.CircleDollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: `Usuarios activos ${suffix}`,
      value: analytics.usersToday,
      icon: LucideIcons.UserCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: `Ventas ${suffix}`,
      value: analytics.crudStats.salesCreated,
      icon: LucideIcons.ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    {
      label: `Productos creados ${suffix}`,
      value: analytics.crudStats.productsCreated,
      icon: LucideIcons.Boxes,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      label: `Ediciones ${suffix}`,
      value: analytics.crudStats.productsUpdated,
      icon: LucideIcons.Pencil,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: `Intentos fallidos ${suffix}`,
      value: analytics.failedLogins,
      icon: LucideIcons.ShieldOff,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Filtros de Fecha */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2">
          <LucideIcons.Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Rango de fechas:</span>
        </div>
        <input 
          type="date" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <span className="text-muted-foreground text-sm">hasta</span>
        <input 
          type="date" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button 
          onClick={handleDateChange}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
        >
          Filtrar
        </button>
        {isFiltered && (
          <button 
            onClick={() => {
              setStartDate("");
              setEndDate("");
              router.push(pathname);
            }}
            className="h-9 px-4 rounded-lg bg-secondary/20 text-foreground text-sm font-semibold hover:bg-secondary/30 transition"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── Tarjetas Resumen Superiores ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`bg-card rounded-2xl border ${card.border} p-4 shadow-sm flex flex-col gap-2 hover:shadow-md transition`}
          >
            <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon size={18} className={card.color} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">
                {card.value.toLocaleString("es-CO")}
              </p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 leading-tight">
                {card.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Fila 2: Gráfico de Ventas Mensuales + Uso de Módulos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área de Ventas Mensuales */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
            <LucideIcons.TrendingUp size={16} className="text-primary" />
            Ventas Mensuales (últimos 6 meses)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Evolución del ingreso por ventas completadas en el periodo.
          </p>

          {analytics.monthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analytics.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<SalesTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.2 }} />
                <Bar
                  dataKey="total"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <LucideIcons.BarChart3 size={36} className="mx-auto mb-2 opacity-30" />
                <p>Sin datos de ventas aún</p>
              </div>
            </div>
          )}
        </div>

        {/* Módulos más usados (Pie Chart) */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
            <LucideIcons.LayoutGrid size={16} className="text-primary" />
            Módulos más usados
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Distribución de actividad por módulo del sistema.
          </p>

          {analytics.modules.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={analytics.modules.slice(0, 6)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {analytics.modules.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [`${v} eventos`, name]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-1.5 mt-2">
                {analytics.modules.slice(0, 5).map((mod, i) => (
                  <div key={mod.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-foreground font-semibold truncate max-w-[90px]">
                        {mod.name}
                      </span>
                    </div>
                    <span className="text-muted-foreground font-bold">{mod.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <LucideIcons.PieChart size={36} className="mx-auto mb-2 opacity-30" />
                <p>Sin datos de módulos</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fila 3: Mapa de Calor por Horas + Empresas más activas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa de calor horario */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5 shadow-sm">
          <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
            <LucideIcons.Clock size={16} className="text-primary" />
            Actividad por Hora del Día
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Distribución de acciones registradas según la hora (últimos 7 días).
          </p>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hora"
                tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
              <Tooltip content={<HoursTooltip />} />
              <Bar dataKey="eventos" radius={[4, 4, 0, 0]} maxBarSize={18}>
                {hourlyData.map((entry, i) => {
                  const max = Math.max(...analytics.hours);
                  const intensity = max > 0 ? entry.eventos / max : 0;
                  const opacity = 0.2 + intensity * 0.8;
                  return (
                    <Cell
                      key={i}
                      fill="var(--primary)"
                      fillOpacity={opacity}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Leyenda de picos */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/20 inline-block" />
              Baja actividad
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary/60 inline-block" />
              Actividad media
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary inline-block" />
              Pico de actividad
            </div>
          </div>
        </div>

        {/* Panel lateral: Empresas + Stats adicionales */}
        <div className="space-y-4">
          {/* Top Empresas (solo Superadmin) */}
          {isSuperAdmin && analytics.topCompanies.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
                <LucideIcons.Building size={15} className="text-primary" />
                Empresas más activas
              </h3>
              <div className="space-y-2">
                {analytics.topCompanies.map((company, i) => {
                  const max = analytics.topCompanies[0]?.logsCount || 1;
                  const pct = Math.round((company.logsCount / max) * 100);
                  return (
                    <div key={company.name} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate max-w-[130px]">
                          {i + 1}. {company.name}
                        </span>
                        <span className="text-muted-foreground font-bold">
                          {company.logsCount} logs
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumen de Seguridad */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
              <LucideIcons.Shield size={15} className="text-primary" />
              Estado de Seguridad
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <LucideIcons.CheckCircle size={14} className="text-emerald-500" />
                  Logins exitosos hoy
                </div>
                <span className="text-xs font-extrabold text-emerald-500">
                  {analytics.usersToday}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <LucideIcons.XCircle size={14} className="text-rose-500" />
                  Intentos fallidos hoy
                </div>
                <span className="text-xs font-extrabold text-rose-500">
                  {analytics.failedLogins}
                </span>
              </div>
              <div className="border-t border-border/60 pt-2">
                <div
                  className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 ${
                    analytics.failedLogins === 0
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : analytics.failedLogins < 5
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  }`}
                >
                  {analytics.failedLogins === 0 ? (
                    <>
                      <LucideIcons.ShieldCheck size={14} />
                      Sistema seguro — Sin anomalías
                    </>
                  ) : analytics.failedLogins < 5 ? (
                    <>
                      <LucideIcons.AlertTriangle size={14} />
                      Revisión recomendada
                    </>
                  ) : (
                    <>
                      <LucideIcons.ShieldAlert size={14} />
                      Alerta de seguridad activa
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from 'react';
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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, PieChart as PieIcon, BarChart3, AlertCircle } from 'lucide-react';

const COLORS = [
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

interface SalesByMonth {
  month: string;
  revenue: number;
  cost: number;
}

interface FinancialTrend {
  month: string;
  incomes: number;
  expenses: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface GroupDistribution {
  name: string;
  count: number;
}

interface DashboardChartsProps {
  salesByMonth: SalesByMonth[];
  financialTrendData?: FinancialTrend[];
  topProducts: TopProduct[];
  groupDistribution: GroupDistribution[];
  marginPct: number;
  totalExpenses?: number;
  totalIncomes?: number;
  newCustomersCount?: number;
  totalCustomersCount?: number;
}

export function DashboardCharts({
  salesByMonth,
  financialTrendData = [],
  topProducts,
  groupDistribution,
  marginPct,
  totalExpenses = 0,
  totalIncomes = 0,
  newCustomersCount = 0,
  totalCustomersCount = 0,
}: DashboardChartsProps) {
  const financialData = [
    { name: 'Ingresos', value: totalIncomes, fill: COLORS[1] },
    { name: 'Egresos', value: totalExpenses, fill: COLORS[2] }
  ];
  const totalFinance = totalIncomes + totalExpenses;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      
      {/* ── Gráfico 1: Ventas por Mes (AreaChart) ── */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tendencia de Ventas (Últimos Meses)
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ingresos vs. Costos de ventas en pesos colombianos</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
            Margen Promedio: {marginPct.toFixed(1)}%
          </span>
        </CardHeader>
        <CardContent className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[4]} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={COLORS[4]} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
              <YAxis 
                width={50}
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                tickFormatter={(value) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short", maximumFractionDigits: 1 }).format(value)}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  color: 'var(--foreground)'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" name="Ingresos" dataKey="revenue" stroke={COLORS[0]} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" name="Costos" dataKey="cost" stroke={COLORS[4]} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCost)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Nuevo Gráfico: Tendencia de Finanzas (BarChart) ── */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ingresos vs Egresos
            </CardTitle>
            <p className="text-xs text-muted-foreground">Flujo de caja general</p>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] mt-4">
          {financialTrendData.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground text-sm italic">
              Sin datos financieros
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                <YAxis 
                  width={40}
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                  tickFormatter={(value) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    color: 'var(--foreground)'
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar name="Ingresos" dataKey="incomes" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar name="Egresos" dataKey="expenses" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>


      {/* ── Gráfico 2: Distribución por Grupos (PieChart Donut) ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            Grupos de Productos
          </CardTitle>
          <p className="text-xs text-muted-foreground">Distribución del catálogo actual por línea de producto</p>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col justify-center items-center relative">
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groupDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {groupDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Scrollable list of legends below */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] max-h-16 overflow-y-auto mt-2 w-full custom-scrollbar">
            {groupDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-semibold text-foreground truncate max-w-[80px]">{entry.name} ({entry.count})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Gráfico 3: Productos más Vendidos (BarChart) ── */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Top 5 Productos más Vendidos
          </CardTitle>
          <p className="text-xs text-muted-foreground">Productos de mayor rotación según volumen vendido</p>
        </CardHeader>
        <CardContent className="h-[280px] mt-4">
          {topProducts.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-muted-foreground text-sm italic">
              <ShoppingBag className="h-8 w-8 opacity-25 mb-2" />
              Aún no hay registros de ventas.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: 'var(--foreground)', fontSize: 10, fontWeight: 500 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)'
                  }}
                />
                <Bar dataKey="quantity" name="Unidades Vendidas" radius={[0, 8, 8, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}

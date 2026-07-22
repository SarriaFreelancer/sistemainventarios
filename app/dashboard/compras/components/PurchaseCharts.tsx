"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface PurchaseChartsProps {
  monthlySpendings: Array<{ month: string; gasto: number }>;
  topSuppliers: Array<{ name: string; gasto: number }>;
  purchasesByCategory: Array<{ name: string; value: number }>;
  topProducts: Array<{ name: string; cantidad: number; gasto: number }>;
}

export function PurchaseCharts({ 
  monthlySpendings, 
  topSuppliers, 
  purchasesByCategory, 
  topProducts 
}: PurchaseChartsProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card p-3 shadow-md">
          <p className="font-medium text-foreground">{label || payload[0].name}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
              {p.name}: {p.name === 'cantidad' ? p.value : formatCurrency(p.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-8">
      
      {/* 1. Gasto Mensual (Evolución) */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Gasto Histórico (Últimos 6 meses)</h3>
          <p className="text-sm text-muted-foreground">Evolución de compras consolidadas</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySpendings} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="opacity-30" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `$${value/1000000}M`} 
                tick={{ fontSize: 12, fill: '#6b7280' }} 
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="gasto" 
                name="Gasto Total" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Top Proveedores (Volumen de Gasto) */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Top 5 Proveedores</h3>
          <p className="text-sm text-muted-foreground">Volumen de gasto por aliado estratégico</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSuppliers} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="opacity-30" />
              <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000000}M`} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="gasto" name="Gasto Total" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Compras por Categoría */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Distribución por Categorías</h3>
          <p className="text-sm text-muted-foreground">Concentración del presupuesto de compras</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={purchasesByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {purchasesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top Productos (Cantidades) */}
      <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">Top Productos más Solicitados</h3>
          <p className="text-sm text-muted-foreground">Productos y servicios con mayor rotación</p>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="opacity-30" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" name="Cantidad Comprada" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

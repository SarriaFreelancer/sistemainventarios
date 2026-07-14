import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Finanzas · Dulche Dorelle',
  description: 'Vista previa del estado financiero y contable.',
};

export default async function FinanzasPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const [expenseSummary, salesSummary, recentExpenses] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.sale.aggregate({ _sum: { total: true } }),
    prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 5 }),
  ]);

  const totalExpenses = Number(expenseSummary._sum.amount ?? 0);
  const totalRevenue = Number(salesSummary._sum.total ?? 0);
  const netProfit = totalRevenue - totalExpenses;

  const formatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Ingresos totales</p>
          <p className="mt-4 text-3xl font-bold text-foreground">{formatter.format(totalRevenue)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Ventas acumuladas históricas.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Gastos registrados</p>
          <p className="mt-4 text-3xl font-bold text-foreground">{formatter.format(totalExpenses)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Costos y gastos operativos.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Beneficio Neto</p>
          <p className="mt-4 text-3xl font-bold text-foreground">{formatter.format(netProfit)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Ingresos menos gastos.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Gastos recientes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Últimos registros de gastos del negocio.</p>
        <div className="mt-6 grid gap-3">
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <div key={expense.id} className="rounded-3xl border border-border/70 bg-muted p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-foreground">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">{expense.category}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatter.format(expense.amount)}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString('es-CO')}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay gastos registrados aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}

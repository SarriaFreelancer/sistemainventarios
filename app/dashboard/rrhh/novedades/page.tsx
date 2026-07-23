import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, PlusCircle, MinusCircle, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { NewNoveltyModal } from './components/NewNoveltyModal';

export const metadata = {
  title: 'Novedades de Nómina · RRHH',
};

export default async function NoveltiesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // Fetch novelties
  const novelties = await prisma.employeeNovelty.findMany({
    where: companyFilter,
    include: {
      employee: {
        select: { firstName: true, lastName: true, documentId: true }
      },
      appliedPayroll: {
        select: { code: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch active employees for the modal
  const employees = await prisma.employee.findMany({
    where: { ...companyFilter, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, documentId: true },
    orderBy: { firstName: 'asc' }
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/rrhh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Novedades de Nómina</h1>
            <p className="mt-1 text-muted-foreground">
              Registra bonos, comisiones, horas extras o descuentos para tus empleados.
            </p>
          </div>
        </div>
        <NewNoveltyModal employees={employees} />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por empleado o descripción..."
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Empleado</th>
                <th className="px-6 py-4 font-medium">Descripción</th>
                <th className="px-6 py-4 font-medium">Tipo y Valor</th>
                <th className="px-6 py-4 font-medium">Frecuencia</th>
                <th className="px-6 py-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {novelties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay novedades registradas.
                  </td>
                </tr>
              ) : (
                novelties.map((novelty) => (
                  <tr key={novelty.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">
                        {novelty.employee.firstName} {novelty.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">CC: {novelty.employee.documentId}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {novelty.description}
                    </td>
                    <td className="px-6 py-4">
                      {novelty.type === 'BONUS' ? (
                        <div className="flex items-center gap-2 text-emerald-500 font-medium">
                          <PlusCircle className="h-4 w-4" />
                          {formatCurrency(novelty.amount)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-500 font-medium">
                          <MinusCircle className="h-4 w-4" />
                          {formatCurrency(novelty.amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {novelty.isRecurring ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600">
                          <RefreshCw className="h-3 w-3" />
                          Recurrente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-600">
                          Único uso
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {novelty.isRecurring ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          Activa
                        </span>
                      ) : novelty.appliedPayrollId ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            Aplicada
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">En nómina {novelty.appliedPayroll?.code}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                          <Clock className="h-4 w-4" />
                          Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

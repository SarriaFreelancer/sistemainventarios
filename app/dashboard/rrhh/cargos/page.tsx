import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Search, Briefcase, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NewPositionModal } from './components/NewPositionModal';

export const metadata = {
  title: 'Cargos · RRHH · GNS',
};

export default async function PositionsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const positions = await prisma.position.findMany({
    where: companyFilter,
    include: {
      _count: {
        select: { employees: true }
      }
    },
    orderBy: { name: 'asc' },
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/rrhh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              Cargos
            </h1>
            <p className="mt-1 text-muted-foreground">
              Administra los roles de tu empresa y sus salarios base asignados.
            </p>
          </div>
        </div>
        <NewPositionModal />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar cargo por nombre..."
            className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Nombre del Cargo</th>
                <th className="px-6 py-4 font-medium">Salario Base</th>
                <th className="px-6 py-4 font-medium text-center">Empleados Activos</th>
                <th className="px-6 py-4 font-medium">Creado en</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No hay cargos registrados. Crea uno para comenzar.
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{position.name}</span>
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      {formatCurrency(position.baseSalary)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {position._count.employees}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(position.createdAt).toLocaleDateString('es-CO')}
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

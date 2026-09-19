import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Briefcase, ArrowLeft } from 'lucide-react';
import { NewEmployeeModal } from './components/NewEmployeeModal';
import { EmployeesTable } from './components/EmployeesTable';

export const metadata = {
  title: 'Directorio de Empleados · RRHH',
};

export default async function EmployeesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const employees = await prisma.employee.findMany({
    where: companyFilter,
    include: { position: true },
    orderBy: { firstName: 'asc' },
  });

  const positions = await prisma.position.findMany({
    where: companyFilter,
    orderBy: { name: 'asc' },
  });

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Directorio de Empleados</h1>
            <p className="mt-1 text-muted-foreground">
              Gestiona la información del personal y sus condiciones laborales.
            </p>
          </div>
        </div>
        <NewEmployeeModal positions={positions} />
      </div>

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Total Empleados</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{employees.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Briefcase className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium">Activos</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{employees.filter(e => e.status === 'ACTIVE').length}</p>
        </div>
      </div>

      {/* Tabla Interactiva de Empleados con Búsqueda y Cuenta Bancaria */}
      <EmployeesTable employees={employees as any} />
    </div>
  );
}

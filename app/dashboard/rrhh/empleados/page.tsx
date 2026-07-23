import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Users, Briefcase, Mail, MoreVertical, ArrowLeft } from 'lucide-react';
import { NewEmployeeModal } from './components/NewEmployeeModal';
import { EmployeeActions } from './components/EmployeeActions';

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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'INACTIVE': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'SUSPENDED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'TERMINATED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'SUSPENDED': return 'Suspendido';
      case 'TERMINATED': return 'Liquidado';
      default: return status;
    }
  };

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

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, documento o cargo..."
              className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Empleado</th>
                <th className="px-6 py-4 font-medium">Documento</th>
                <th className="px-6 py-4 font-medium">Cargo y Dpto.</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No hay empleados registrados en el sistema.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            {emp.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {emp.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {emp.documentId}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{emp.position?.name || 'Sin asignar'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{emp.department || 'General'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(emp.status)}`}>
                        {getStatusLabel(emp.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <EmployeeActions employeeId={emp.id} currentStatus={emp.status} />
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

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FileText, ChevronRight, Filter, Calendar, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Requisiciones Internas · GNS',
};

export default async function InternalRequisitionsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const requisitions = await prisma.internalRequisition.findMany({
    where: companyFilter,
    include: {
      user: true,
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'PENDING_BOSS': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'CONVERTED_TO_PURCHASE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'CANCELLED': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'Borrador';
      case 'PENDING_BOSS': return 'Pend. Autorización';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      case 'CONVERTED_TO_PURCHASE': return 'En Compras';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'URGENT': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case 'HIGH': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Requisiciones Internas
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">Fase 0</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Solicita materiales o insumos desde cualquier área para aprobación.
          </p>
        </div>
        <Link
          href="/dashboard/compras/requisiciones/nueva"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Requisición
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por número o solicitante..." 
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {requisitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay requisiciones</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Las requisiciones internas sirven para que las áreas soliciten recursos a compras.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Requisición</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Solicitante</th>
                  <th className="px-6 py-4 font-medium">Ítems</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requisitions.map((req) => (
                  <tr key={req.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{req.requisitionNum}</span>
                        {getPriorityIcon(req.priority)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(req.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {req.user.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {req._count.items}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/compras/requisiciones/${req.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        Ver Detalle
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

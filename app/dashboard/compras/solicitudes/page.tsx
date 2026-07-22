import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, ShieldCheck, ChevronRight, Filter, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Solicitudes de Compra · GNS',
};

export default async function PurchaseRequestsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const requests = await prisma.purchaseRequest.findMany({
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
      case 'PENDING_APPROVAL': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'CANCELLED': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'Borrador';
      case 'PENDING_APPROVAL': return 'Pendiente';
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Solicitudes de Compra</h1>
          <p className="mt-1 text-muted-foreground">
            Revisa y gestiona las solicitudes de compras internas del equipo.
          </p>
        </div>
        <Link
          href="/dashboard/compras/solicitudes/nueva"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Solicitud
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
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay solicitudes</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              No hay solicitudes de compra generadas aún.
            </p>
            <Link
              href="/dashboard/compras/solicitudes/nueva"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Crear Solicitud
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">No. Solicitud</th>
                  <th className="px-6 py-4 font-medium">Solicitante</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Prioridad</th>
                  <th className="px-6 py-4 font-medium">Ítems</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {req.requestNumber}
                    </td>
                    <td className="px-6 py-4">
                      {req.user.name || req.user.email}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(req.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground font-medium">{req.priority}</span>
                    </td>
                    <td className="px-6 py-4">
                      {req._count.items}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/compras/solicitudes/${req.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
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

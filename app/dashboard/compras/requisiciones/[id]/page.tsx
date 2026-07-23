import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, AlertCircle, Calendar, User } from 'lucide-react';
import { notFound } from 'next/navigation';
import { RequisitionActions } from './RequisitionActions';

export const metadata = {
  title: 'Detalle de Requisición · GNS',
};

export default async function RequisitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const requisition = await prisma.internalRequisition.findUnique({
    where: { id, companyId: companyId || undefined },
    include: {
      user: true,
      items: {
        include: { product: true }
      }
    }
  });

  if (!requisition) return notFound();

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

  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      case 'URGENT': return 'Urgente';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/requisiciones"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Requisición {requisition.requisitionNum}
            <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(requisition.status)}`}>
              {getStatusLabel(requisition.status)}
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Detalles y recursos solicitados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Ítems Solicitados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Descripción</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium text-center">Cant.</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requisition.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {item.product?.name || item.description}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {item.itemType}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-foreground">
                        {item.quantity} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {requisition.notes && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Observaciones Generales
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                {requisition.notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Resumen</h3>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> Solicitante:</span>
              <span className="font-semibold text-foreground">{requisition.user.name}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha:</span>
              <span className="font-semibold text-foreground">{new Date(requisition.createdAt).toLocaleDateString('es-CO')}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Prioridad:</span>
              <span className="font-semibold text-foreground">{getPriorityLabel(requisition.priority)}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Acciones</h3>
            <RequisitionActions requisitionId={requisition.id} status={requisition.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

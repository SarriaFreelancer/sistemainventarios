import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, PackageCheck, ChevronRight, Filter, Calendar, ArrowLeft, Plus } from 'lucide-react';
import { NewReceiptModal } from './components/NewReceiptModal';

export const metadata = {
  title: 'Recepciones de Mercancía · GNS',
};

export default async function PurchaseReceiptsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const receipts = await prisma.purchaseReceipt.findMany({
    where: companyFilter,
    include: {
      purchaseOrder: {
        include: { supplier: true }
      },
      _count: {
        select: { items: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const pendingOrders = await prisma.purchaseOrder.findMany({
    where: { 
      ...companyFilter,
      status: 'SENT',
    },
    include: {
      supplier: true,
      lines: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PARTIAL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'COMPLETE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Pendiente';
      case 'PARTIAL': return 'Parcial';
      case 'COMPLETE': return 'Completa';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/compras"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Recepciones de Mercancía</h1>
            <p className="mt-1 text-muted-foreground">
              Registra las entregas de los proveedores para alimentar el inventario.
            </p>
          </div>
        </div>
        <NewReceiptModal pendingOrders={pendingOrders} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar recepción o proveedor..." 
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <PackageCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay recepciones</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Aún no has registrado ninguna entrega de mercancía.
            </p>
            <div className="mt-6">
              <NewReceiptModal pendingOrders={pendingOrders} />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">No. Documento</th>
                  <th className="px-6 py-4 font-medium">Orden de Compra</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Fecha Recepción</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {rec.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {rec.purchaseOrder.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      {rec.purchaseOrder.supplier.companyName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(rec.receivedDate).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(rec.status)}`}>
                        {getStatusLabel(rec.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/compras/recepciones/${rec.id}`}
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

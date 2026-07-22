import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Truck, Calendar, DollarSign, ChevronRight, Filter, ArrowLeft } from 'lucide-react';
import { NewPurchaseOrderModal } from './components/NewPurchaseOrderModal';

export const metadata = {
  title: 'Órdenes de Compra · GNS',
};

export default async function PurchaseOrdersPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const orders = await prisma.purchaseOrder.findMany({
    where: companyFilter,
    include: {
      supplier: true,
      _count: {
        select: { lines: true, receipts: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const suppliers = await prisma.supplier.findMany({
    where: companyFilter,
    orderBy: { companyName: 'asc' },
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'SENT': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'RECEIVED': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'Borrador';
      case 'SENT': return 'Enviada';
      case 'RECEIVED': return 'Recibida';
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Órdenes de Compra</h1>
            <p className="mt-1 text-muted-foreground">
              Emite documentos formales de compra hacia tus proveedores.
            </p>
          </div>
        </div>
        <NewPurchaseOrderModal suppliers={suppliers} />
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar orden por número o proveedor..." 
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay órdenes</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Aún no has creado ninguna orden de compra. Crea tu primera orden para comenzar a gestionar el abastecimiento.
            </p>
            <Link
              href="/dashboard/compras/ordenes/nueva"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Crear orden
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">No. Orden</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Fecha Esperada</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{order.supplier.companyName}</span>
                        <span className="text-xs text-muted-foreground">{order._count.lines} ítems</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString('es-CO') : 'Sin fecha'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {new Intl.NumberFormat('es-CO').format(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/compras/ordenes/${order.id}`}
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

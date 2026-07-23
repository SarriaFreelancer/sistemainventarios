import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, DollarSign, ReceiptText } from 'lucide-react';
import { PurchaseOrderActions } from './PurchaseOrderActions';

export const metadata = {
  title: 'Detalle de Orden de Compra · GNS',
};

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const order = await prisma.purchaseOrder.findUnique({
    where: { id, companyId: companyId || undefined },
    include: {
      supplier: true,
      lines: {
        include: { product: true }
      }
    }
  });

  if (!order) return notFound();

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

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/ordenes"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Orden {order.orderNumber}
            <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Revisa los detalles y toma acción sobre esta orden de compra.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Líneas de la Orden</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Descripción</th>
                    <th className="px-4 py-3 font-medium text-center">Cant.</th>
                    <th className="px-4 py-3 font-medium text-right">Precio Unit.</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {line.product?.name || line.description}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {line.quantity}
                      </td>
                      <td className="px-4 py-4 text-right text-muted-foreground">
                        {formatCurrency(line.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-foreground">
                        {formatCurrency(line.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex flex-col items-end gap-2 text-sm border-t border-border pt-4">
              <div className="flex w-64 justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex w-64 justify-between text-muted-foreground">
                <span>Impuestos (IVA):</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="flex w-64 justify-between font-bold text-base text-foreground pt-2 border-t border-border">
                <span>Total Orden:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Resumen</h3>
            
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4"/> Proveedor:</span>
              <span className="font-semibold text-foreground ml-6">{order.supplier.companyName}</span>
              <span className="text-xs text-muted-foreground ml-6">{order.supplier.email}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha Emisión:</span>
              <span className="font-semibold text-foreground">{new Date(order.createdAt).toLocaleDateString('es-CO')}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha Entrega:</span>
              <span className="font-semibold text-foreground">{order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString('es-CO') : 'No definida'}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Acciones</h3>
            <PurchaseOrderActions orderId={order.id} status={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

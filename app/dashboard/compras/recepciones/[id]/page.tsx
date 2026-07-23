import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackageCheck, Calendar, Building2, FileText } from 'lucide-react';

export const metadata = {
  title: 'Detalle de Recepción · GNS',
};

export default async function PurchaseReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const receipt = await prisma.purchaseReceipt.findUnique({
    where: { id, companyId: companyId || undefined },
    include: {
      purchaseOrder: {
        include: { supplier: true }
      },
      items: {
        include: { product: true }
      }
    }
  });

  if (!receipt) return notFound();

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
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/recepciones"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Recepción {receipt.receiptNumber}
            <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(receipt.status)}`}>
              {getStatusLabel(receipt.status)}
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Detalle de la mercancía ingresada al inventario.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Ítems Recibidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Producto</th>
                    <th className="px-4 py-3 font-medium text-center rounded-tr-lg">Cant. Recibida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {receipt.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4 font-medium text-foreground">
                        {item.product?.name || item.description || "Ítem General"}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-emerald-600">
                        {item.quantityReceived}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Resumen</h3>
            
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/> Orden de Compra:</span>
              <span className="font-semibold text-foreground ml-6">{receipt.purchaseOrder.orderNumber}</span>
            </div>

            <div className="flex flex-col gap-1 text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4"/> Proveedor:</span>
              <span className="font-semibold text-foreground ml-6">{receipt.purchaseOrder.supplier.companyName}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha Recepción:</span>
              <span className="font-semibold text-foreground">{new Date(receipt.receivedDate).toLocaleDateString('es-CO')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

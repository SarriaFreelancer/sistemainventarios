import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Calendar, FileText, DollarSign } from 'lucide-react';
import { InvoiceActions } from './InvoiceActions';

export const metadata = {
  title: 'Detalle de Factura · GNS',
};

export default async function PurchaseInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id, companyId: companyId || undefined },
    include: {
      supplier: true,
      purchaseOrder: true,
      purchaseReceipt: true,
    }
  });

  if (!invoice) return notFound();

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PARTIAL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Por Pagar';
      case 'PARTIAL': return 'Abonada';
      case 'PAID': return 'Pagada';
      case 'CANCELLED': return 'Anulada';
      default: return status;
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/facturas"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Factura {invoice.invoiceNumber}
            <span className={`text-sm px-3 py-1 rounded-full border ${getStatusColor(invoice.status)}`}>
              {getStatusLabel(invoice.status)}
            </span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Revisa los detalles y registra pagos de esta cuenta por pagar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Información Financiera</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <span className="text-sm text-muted-foreground block mb-1">Subtotal</span>
                <span className="text-xl font-semibold text-foreground">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <span className="text-sm text-muted-foreground block mb-1">Impuestos (IVA)</span>
                <span className="text-xl font-semibold text-foreground">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="col-span-2 bg-primary/10 p-4 rounded-xl border border-primary/20">
                <span className="text-sm text-primary font-medium block mb-1">Total Factura</span>
                <span className="text-3xl font-bold text-primary">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Resumen</h3>
            
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4"/> Proveedor:</span>
              <span className="font-semibold text-foreground ml-6">{invoice.supplier.companyName}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Fecha Emisión:</span>
              <span className="font-semibold text-foreground">{new Date(invoice.issueDate).toLocaleDateString('es-CO')}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Vencimiento:</span>
              <span className="font-semibold text-foreground">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-CO') : 'N/A'}</span>
            </div>

            {invoice.purchaseOrder && (
              <div className="flex items-center justify-between text-sm pt-2">
                <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4"/> Orden Asoc.:</span>
                <span className="font-semibold text-foreground">{invoice.purchaseOrder.orderNumber}</span>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-foreground border-b border-border pb-3">Acciones</h3>
            <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

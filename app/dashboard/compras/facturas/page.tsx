import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, FileText, Filter, ChevronRight, DollarSign, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Facturas de Proveedores · GNS',
};

export default async function PurchaseInvoicesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const invoices = await prisma.purchaseInvoice.findMany({
    where: companyFilter,
    include: {
      supplier: true,
      purchaseOrder: true,
      purchaseReceipt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Facturas de Proveedores</h1>
            <p className="mt-1 text-muted-foreground">
              Registra las facturas recibidas (Cuentas por Pagar).
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/compras/facturas/nueva"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 gap-2"
        >
          <Plus className="h-4 w-4" />
          Registrar Factura
        </Link>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay facturas</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Registra las cuentas de cobro o facturas electrónicas de tus proveedores.
            </p>
            <Link
              href="/dashboard/compras/facturas/nueva"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Crear Factura
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">N° Factura</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Origen (PO/REC)</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4">
                      {inv.supplier.companyName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {inv.purchaseOrder?.orderNumber || inv.purchaseReceipt?.receiptNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {new Intl.NumberFormat('es-CO').format(inv.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(inv.status)}`}>
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </button>
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

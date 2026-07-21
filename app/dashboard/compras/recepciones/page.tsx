import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PackagePlus, Search, Calendar, ChevronRight, Filter } from 'lucide-react';

export const metadata = {
  title: 'Recepciones · GNS',
};

export default async function PurchaseReceiptsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  if (!companyId) redirect('/dashboard');

  const receipts = await prisma.purchaseReceipt.findMany({
    where: { companyId },
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

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Recepciones de Compra</h1>
          <p className="mt-1 text-muted-foreground">
            Historial de recepciones e ingresos al inventario.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por número de recepción u orden..." 
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
              <PackagePlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay recepciones</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Aún no has registrado ninguna recepción de compras. Las recepciones se crean desde el detalle de una Orden de Compra.
            </p>
            <Link
              href="/dashboard/compras/ordenes"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ir a Órdenes
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">No. Recepción</th>
                  <th className="px-6 py-4 font-medium">Orden Asoc.</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Ítems</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {receipt.purchaseOrder.orderNumber}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {receipt.purchaseOrder.supplier.companyName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(receipt.receivedDate).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {receipt._count.items}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {receipt.status === 'COMPLETE' ? 'Completa' : 'Parcial'}
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

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PurchaseReceiptForm } from '../components/PurchaseReceiptForm';

export const metadata = {
  title: 'Nueva Recepción · GNS',
};

export default async function NewPurchaseReceiptPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // Traer las Órdenes de Compra que estén ENVIADAS o PARCIALMENTE RECIBIDAS
  const pendingOrders = await prisma.purchaseOrder.findMany({
    where: { 
      ...companyFilter,
      status: { in: ['SENT'] },
      // Aquí podríamos incluir PARTIAL si tuviéramos un estado PARTIAL_RECEIVED explícito en PO, 
      // pero usaremos 'SENT' por ahora basado en la lógica inicial.
    },
    include: {
      supplier: true,
      lines: {
        where: {
          // Filtrar las líneas que todavía no han sido recibidas en su totalidad
          // Para Prisma directo esto requiere un poco de JS o campos calculados si no podemos filtrarlo.
          // Nos traeremos todas las líneas.
        },
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/recepciones"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Recibir Mercancía</h1>
          <p className="text-muted-foreground">Selecciona una Orden de Compra (PO) e ingresa lo recibido al inventario.</p>
        </div>
      </div>

      <PurchaseReceiptForm pendingOrders={pendingOrders} />
    </div>
  );
}

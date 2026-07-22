import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PurchaseInvoiceForm } from '../components/PurchaseInvoiceForm';

export const metadata = {
  title: 'Nueva Factura de Compra · GNS',
};

export default async function NewPurchaseInvoicePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const suppliers = await prisma.supplier.findMany({
    where: { ...companyFilter, status: 'ACTIVE' },
    select: { id: true, companyName: true },
    orderBy: { companyName: 'asc' },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/facturas"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Registrar Factura (CXP)</h1>
          <p className="text-muted-foreground">Carga los datos de cobro enviados por el proveedor.</p>
        </div>
      </div>

      <PurchaseInvoiceForm suppliers={suppliers} />
    </div>
  );
}

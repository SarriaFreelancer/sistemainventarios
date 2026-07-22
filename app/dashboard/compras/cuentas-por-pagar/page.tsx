import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import { AccountsPayableClient } from './components/AccountsPayableClient';
import { Download } from 'lucide-react';

export const metadata = {
  title: 'Cuentas por Pagar (AP) · GNS',
};

export default async function AccountsPayablePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const payables = await prisma.accountsPayable.findMany({
    where: companyFilter,
    include: {
      supplier: true,
      purchaseInvoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cuentas por Pagar</h1>
          <p className="mt-1 text-muted-foreground">
            Gestión de cartera con proveedores (Accounts Payable) y registro de pagos.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center rounded-xl bg-card border border-border px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent gap-2"
        >
          <Download className="h-4 w-4" />
          Exportar Reporte
        </button>
      </div>

      <AccountsPayableClient payables={payables} />
    </div>
  );
}

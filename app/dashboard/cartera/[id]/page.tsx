import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { getCreditOperationById } from '@/app/actions/credit-actions';
import { CreditDetailClient } from '@/components/cartera/credit-detail-client';

export const metadata = {
  title: 'Detalle de Crédito · Cartera GNS',
};

export default async function CreditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const resolvedParams = await params;
  const opId = Number(resolvedParams.id);
  if (!opId || isNaN(opId)) notFound();

  const res = await getCreditOperationById(opId);
  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <CreditDetailClient operation={res.data} userRole={session.user.role} />
    </div>
  );
}

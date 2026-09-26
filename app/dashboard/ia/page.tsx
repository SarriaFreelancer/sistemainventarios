import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getTenantBusinessMetrics } from '@/app/actions/ai-actions';
import { IaClient } from './ia-client';

export const metadata = {
  title: 'Asistente IA · GNS SarriaTech',
  description: 'Consultor inteligente con Groq LPU para optimización de inventarios, costos, stock y consejos de negocio.',
};

export const dynamic = 'force-dynamic';

export default async function IaPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const companyId = await getSessionCompanyId();
  let companyName = 'Mi Negocio';

  if (companyId) {
    const comp = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    if (comp?.name) companyName = comp.name;
  }

  const metricsRes = await getTenantBusinessMetrics();
  const initialMetrics = metricsRes.success && metricsRes.metrics ? metricsRes.metrics : null;

  return (
    <div className="p-4 sm:p-6">
      <IaClient initialMetrics={initialMetrics} companyName={companyName} />
    </div>
  );
}

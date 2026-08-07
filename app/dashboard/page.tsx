import { getFilteredDashboardData } from '@/app/actions/dashboard-actions';
import { DashboardClient } from './dashboard-client';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';

export const revalidate = 0; // Evitar caché estático para mantener los datos siempre frescos

export default async function DashboardHomePage() {
  const session = await getAuthSession();
  if (!session?.user) redirect('/auth/login');

  const tenantId = await getSessionCompanyId() || -1;
  let allowedModules: any[] = [];

  if (session.user.role === 'SUPERADMIN') {
    allowedModules = await prisma.module.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
  } else if (session.user.role === 'ADMIN') {
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: tenantId },
      include: { module: true },
    });
    allowedModules = companyModules.map(cm => cm.module).filter(m => m.isActive);
  } else {
    const roleModules = await prisma.roleModule.findMany({
      where: { role: { name: session.user.role as any } },
      include: { module: true },
    });
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: tenantId },
      include: { module: true },
    });
    const companyModuleIds = new Set(companyModules.map(cm => cm.moduleId));
    allowedModules = roleModules.filter(rm => companyModuleIds.has(rm.moduleId)).map(rm => rm.module).filter(m => m.isActive);
  }

  const hasDashboardAccess = session.user.role === 'SUPERADMIN' || allowedModules.some(m => m.href === '/dashboard' || m.name.toLowerCase() === 'dashboard');
  
  if (!hasDashboardAccess) {
    if (allowedModules.length > 0) {
      redirect(allowedModules[0].href || '/dashboard/sales');
    } else {
      redirect('/auth/login');
    }
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { preferences: true }
  });
  const prefs = userRecord?.preferences as { tourCompleted?: boolean } | null;
  const tourCompleted = prefs?.tourCompleted === true;

  // Cargar datos iniciales del dashboard (Histórico completo)
  const initialRes = await getFilteredDashboardData({ preset: 'all' });
  const initialData = initialRes.success && initialRes.data ? initialRes.data : {
    productCount: 0,
    categoryCount: 0,
    supplierCount: 0,
    saleCount: 0,
    totalHistoricalSales: 0,
    profitMargin: 0,
    salesTrendData: [],
    topProducts: [],
    groupDistribution: [],
    recentSales: [],
    outOfStockProducts: [],
    lowStockProducts: [],
    filterInfo: { preset: 'all' }
  };

  return (
    <DashboardClient
      initialData={initialData}
      allowedModules={allowedModules}
      userId={session.user.id}
      tourCompleted={tourCompleted}
    />
  );
}

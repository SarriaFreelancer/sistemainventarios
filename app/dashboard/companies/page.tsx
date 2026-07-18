import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { CompaniesClient } from '@/components/company-dialogs';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Empresas · GNS SarriaTech',
  description: 'Gestiona las empresas y los usuarios asociados.',
};

export default async function CompaniesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  if (session.user.role !== 'SUPERADMIN') redirect('/dashboard');

  const companies = await prisma.company.findMany({
    include: { 
      _count: { select: { users: true } },
      modules: { select: { moduleId: true } },
      setting: { select: { nit: true } }
    },
    orderBy: { name: 'asc' },
  });

  const allModules = await prisma.module.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  const serializedCompanies = companies.map((company) => ({
    id: company.id,
    name: company.name,
    address: company.address,
    city: company.city,
    country: company.country,
    status: company.status,
    themeConfig: company.themeConfig ? JSON.parse(JSON.stringify(company.themeConfig)) : null,
    modules: company.modules.map((m) => m.moduleId),
    nit: company.setting?.nit ?? '',
    _count: { users: company._count.users },
  }));

  return (
    <div className="p-4 sm:p-6">
      <CompaniesClient companies={serializedCompanies} modules={allModules} />
    </div>
  );
}

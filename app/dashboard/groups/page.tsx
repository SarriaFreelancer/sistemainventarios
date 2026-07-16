import { prisma } from '@/lib/prisma';
import { getSessionCompanyId } from '@/lib/session';
import { GroupsClient } from '@/components/group-dialogs';

export const metadata = {
  title: 'Grupos · GNS',
  description: 'Clasifica los productos por grupos organizacionales.',
};

export default async function GroupsPage() {
  const companyId = await getSessionCompanyId();

  const groups = await prisma.productGroup.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  const serialized = groups.map(g => ({
    id: String(g.id),
    name: g.name,
    status: g.status,
    code: g.code ?? '',
    _count: { products: g._count.products },
  }));

  return (
    <div className="p-4 sm:p-6">
      <GroupsClient groups={serialized} />
    </div>
  );
}

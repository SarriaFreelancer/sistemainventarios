import { prisma } from '@/lib/prisma';
import { getSessionCompanyId } from '@/lib/session';
import { GroupsClient } from '@/components/group-dialogs';

export const metadata = {
  title: 'Grupos · Dulche Dorelle',
  description: 'Clasifica los productos por grupos organizacionales.',
};

export default async function GroupsPage() {
  const companyId = await getSessionCompanyId();

  const groups = await prisma.productGroup.findMany({
    ...(companyId ? { where: { companyId } } : {}),
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  const serialized = groups.map(g => ({
    id: g.id,
    name: g.name,
    status: g.status,
    _count: { products: g._count.products },
  }));

  return (
    <div className="p-4 sm:p-6">
      <GroupsClient groups={serialized} />
    </div>
  );
}



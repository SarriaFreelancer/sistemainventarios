import { prisma } from '@/lib/prisma';
import { CategoriesClient } from '@/components/category-dialogs';
import { getSessionCompanyId } from '@/lib/session';

export const metadata = {
  title: 'Categorías · GNS',
  description: 'Organiza los productos por categorías.',
};

export default async function CategoriesPage() {
  const companyId = await getSessionCompanyId();
  
  const [categories, groups] = await Promise.all([
    prisma.category.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
        productGroup: true,
      }
    }),
    prisma.productGroup.findMany({
      where: {
        status: 'ACTIVE',
        ...(companyId ? { companyId } : {}),
      },
      orderBy: { name: 'asc' }
    })
  ]);

  const serialized = categories.map(c => ({
    id: String(c.id),
    name: c.name,
    description: c.description,
    status: c.status,
    code: c.code ?? '',
    isPerishable: c.isPerishable,
    productGroupId: c.productGroupId,
    productGroupName: c.productGroup?.name ?? 'Sin Grupo',
    _count: { products: c._count.products },
  }));

  const serializedGroups = groups.map(g => ({
    id: String(g.id),
    name: g.name,
  }));

  return (
    <div className="p-4 sm:p-6">
      <CategoriesClient categories={serialized} groups={serializedGroups} />
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { CategoriesClient } from '@/components/category-dialogs';

export const metadata = {
  title: 'Categorías · Dulche Dorelle',
  description: 'Organiza los productos por categorías.',
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } }
  });

  const serialized = categories.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    status: c.status,
    _count: { products: c._count.products },
  }));

  return (
    <div className="p-4 sm:p-6">
      <CategoriesClient categories={serialized} />
    </div>
  );
}

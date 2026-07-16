import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { ProductsClient } from '@/components/products-client';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Productos · GNS',
  description: 'Gestiona el catálogo de productos del inventario.',
};

export default async function ProductsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const whereTenant = companyId ? { companyId } : {};

  const [products, categories, suppliers, groups] = await Promise.all([
    prisma.product.findMany({
      where: whereTenant,
      include: { category: true, supplier: true, productGroup: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: whereTenant,
      orderBy: { name: 'asc' }
    }),
    prisma.supplier.findMany({
      where: whereTenant,
      orderBy: { companyName: 'asc' }
    }),
    prisma.productGroup.findMany({
      where: whereTenant,
      orderBy: { name: 'asc' }
    }),
  ]);

  // Serialize safely (Decimal → number, IDs → string para encajar con el frontend)
  const serializedProducts = products.map((p) => ({
    id: String(p.id),
    code: p.code,
    name: p.name,
    categoryId: String(p.categoryId),
    supplierId: String(p.supplierId),
    quantityAvailable: p.quantityAvailable,
    unitCost: Number(p.unitCost),
    salePrice: Number(p.salePrice),
    soldQuantity: p.soldQuantity,
    status: p.status,
    productGroupId: p.productGroupId ? String(p.productGroupId) : null,
    category: p.category ? { id: String(p.category.id), name: p.category.name } : null,
    supplier: p.supplier ? { id: String(p.supplier.id), companyName: p.supplier.companyName } : null,
    productGroup: p.productGroup ? { id: String(p.productGroup.id), name: p.productGroup.name } : null,
  }));

  return (
    <div className="p-4 sm:p-6">
      <ProductsClient
        initialProducts={serializedProducts}
        categories={categories.map((c) => ({ id: String(c.id), name: c.name }))}
        suppliers={suppliers.map((s) => ({ id: String(s.id), companyName: s.companyName }))}
        groups={groups.map((g) => ({ id: String(g.id), name: g.name }))}
        userId={String(session.user.id)}
      />
    </div>
  );
}

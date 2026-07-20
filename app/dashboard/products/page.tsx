import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { ProductsClient } from '@/components/products-client';
import { redirect } from 'next/navigation';
import { getPlanLimits } from '@/lib/plans';

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

  const settings = companyId
    ? await prisma.companySetting.findUnique({ where: { companyId } })
    : await prisma.companySetting.findFirst();
  const allowNegativeStock = settings?.allowNegativeStock ?? false;

  let planLimits = { maxProducts: 999999, planName: 'Plan Premium' };
  let currentProductsCount = 0;

  if (companyId) {
    const activeCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { planId: true, maxUsers: true, maxProducts: true, _count: { select: { products: true } } }
    });
    
    if (activeCompany) {
      const limits = getPlanLimits(activeCompany.planId, { maxUsers: activeCompany.maxUsers, maxProducts: activeCompany.maxProducts });
      planLimits = { maxProducts: limits.maxProducts, planName: limits.name };
      currentProductsCount = activeCompany._count.products;
    }
  }

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
    type: p.type,
    productGroupId: p.productGroupId ? String(p.productGroupId) : null,
    category: p.category ? { id: String(p.category.id), name: p.category.name } : null,
    supplier: p.supplier ? { id: String(p.supplier.id), companyName: p.supplier.companyName } : null,
    productGroup: p.productGroup ? { id: String(p.productGroup.id), name: p.productGroup.name } : null,
  }));

  const serializedCategories = categories.map((c) => ({ id: String(c.id), name: c.name, productGroupId: c.productGroupId ? String(c.productGroupId) : undefined }));
  const serializedSuppliers = suppliers.map((s) => ({ id: String(s.id), companyName: s.companyName }));
  const serializedGroups = groups.map((g) => ({ id: String(g.id), name: g.name }));

  return (
    <div className="p-4 sm:p-6">
      <ProductsClient 
        initialProducts={serializedProducts} 
        categories={serializedCategories} 
        suppliers={serializedSuppliers} 
        groups={serializedGroups}
        userId={String(session.user.id)}
        allowNegativeStock={allowNegativeStock}
        maxProducts={planLimits.maxProducts}
        currentProducts={currentProductsCount}
        planName={planLimits.planName}
      />
    </div>
  );
}

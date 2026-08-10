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
  const registerInventoryCostAsExpense = settings?.registerInventoryCostAsExpense ?? false;
  const trackExpirationDates = settings?.trackExpirationDates ?? false;

  let planLimits = { maxProducts: 999999, planName: 'Plan Premium' };
  let currentProductsCount = 0;
  let allowExpirationTracking = true;

  if (companyId) {
    const activeCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { planId: true, maxUsers: true, maxProducts: true, _count: { select: { products: true } } }
    });
    
    if (activeCompany) {
      const limits = getPlanLimits(activeCompany.planId, { maxUsers: activeCompany.maxUsers, maxProducts: activeCompany.maxProducts });
      planLimits = { maxProducts: limits.maxProducts, planName: limits.name };
      currentProductsCount = activeCompany._count.products;
      allowExpirationTracking = limits.allowExpirationTracking;
    }
  }

  // If expiration tracking is enabled, fetch batches with products
  let productBatchesMap: Record<string, any[]> = {};
  if (trackExpirationDates && allowExpirationTracking) {
    const batches = await prisma.productBatch.findMany({
      where: { product: { companyId: companyId || undefined } },
      orderBy: { expirationDate: 'asc' },
    });
    for (const batch of batches) {
      const pid = String(batch.productId);
      if (!productBatchesMap[pid]) productBatchesMap[pid] = [];
      productBatchesMap[pid].push({
        id: batch.id,
        batchNumber: batch.batchNumber,
        expirationDate: batch.expirationDate.toISOString(),
        quantity: batch.quantity,
        status: batch.status,
        notes: batch.notes,
      });
    }
  }

  // Serialize safely
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
    batches: productBatchesMap[String(p.id)] || [],
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
        allowNegativeStock={allowNegativeStock}
        registerInventoryCostAsExpense={registerInventoryCostAsExpense}
        userId={session.user.id}
        role={session.user.role}
        planName={planLimits.planName}
        maxProducts={planLimits.maxProducts}
        currentProducts={currentProductsCount}
        trackExpirationDates={trackExpirationDates && allowExpirationTracking}
        expirationAlertDays={settings?.expirationAlertDays ?? 30}
      />
    </div>
  );
}

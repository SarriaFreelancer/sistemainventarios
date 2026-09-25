import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { SalesClient } from '@/components/sales-client';
import { redirect } from 'next/navigation';
import { getKits } from '@/app/actions/kit-actions';

export const metadata = {
  title: 'Ventas · GNS',
  description: 'Registra y gestiona las ventas del inventario.',
};

export default async function SalesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const whereTenant = companyId ? { companyId } : {};

  const [sales, products, customers, combosRes, settings, company] = await Promise.all([
    prisma.sale.findMany({
      where: whereTenant,
      include: {
        company: { select: { name: true } },
        user: { select: { name: true, image: true } },
        details: {
          include: {
            product: { select: { name: true, code: true } },
            combo: { select: { name: true, code: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.product.findMany({
      where: whereTenant,
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      where: whereTenant,
      orderBy: { name: 'asc' },
    }),
    getKits(),
    companyId
      ? prisma.companySetting.findUnique({ where: { companyId } })
      : prisma.companySetting.findFirst(),
    companyId
      ? prisma.company.findUnique({ where: { id: companyId } })
      : null,
  ]);

  // Serialize safely
  const serializedSales = sales.map((s) => ({
    id: String(s.id),
    saleNumber: s.saleNumber,
    client: s.client,
    customerId: s.customerId ? String(s.customerId) : null,
    discount: Number(s.discount),
    total: Number(s.total),
    paymentMethod: s.paymentMethod,
    status: s.status,
    remarks: s.remarks,
    voidedByUserId: s.voidedByUserId ? String(s.voidedByUserId) : null,
    voidedAt: s.voidedAt ? s.voidedAt.toISOString() : null,
    voidedReason: s.voidedReason,
    createdAt: s.createdAt.toISOString(),
    user: { name: s.user?.name ?? null, image: s.user?.image ?? null },
    company: s.company ? { name: s.company.name } : undefined,
    details: s.details.map(d => ({
      id: String(d.id),
      productId: d.productId ? String(d.productId) : null,
      comboId: d.comboId ? String(d.comboId) : null,
      comboName: d.comboName || d.combo?.name || null,
      isCombo: Boolean(d.isCombo),
      quantity: d.quantity,
      unitPrice: Number(d.unitPrice),
      subtotal: Number(d.subtotal),
      discount: Number(d.discount),
      total: Number(d.total),
      product: d.product ? { name: d.product.name, code: d.product.code } : null,
      combo: d.combo ? { name: d.combo.name, code: d.combo.code } : null,
    })),
  }));

  const serializedProducts = products.map((p) => ({
    id: String(p.id),
    code: p.code,
    name: p.name,
    salePrice: Number(p.salePrice),
    quantityAvailable: p.quantityAvailable,
  }));

  const serializedCustomers = customers.map((c) => ({
    id: String(c.id),
    name: c.name,
    code: c.code ?? '',
  }));

  const serializedCombos = (combosRes.success && combosRes.combos)
    ? combosRes.combos.filter((c: any) => c.isActive)
    : [];

  const defaultInvoiceConfig = settings?.invoiceConfig ? JSON.parse(JSON.stringify(settings.invoiceConfig)) : {};
  if (!defaultInvoiceConfig.companyName) defaultInvoiceConfig.companyName = company?.name || 'GNS SARRIA TECH';
  if (!defaultInvoiceConfig.nit) defaultInvoiceConfig.nit = settings?.nit || '';
  if (!defaultInvoiceConfig.phone) defaultInvoiceConfig.phone = settings?.phone || '';
  if (!defaultInvoiceConfig.address) defaultInvoiceConfig.address = company?.address || '';
  // Fallbacks para colores
  if (!defaultInvoiceConfig.primaryColor) defaultInvoiceConfig.primaryColor = '#b91c1c';
  if (!defaultInvoiceConfig.secondaryColor) defaultInvoiceConfig.secondaryColor = '#C5A059';

  return (
    <div className="p-4 sm:p-6">
      <SalesClient
        initialSales={serializedSales}
        products={serializedProducts}
        customers={serializedCustomers}
        combos={serializedCombos}
        userId={String(session.user.id)}
        invoiceConfig={defaultInvoiceConfig}
        allowNegativeStock={settings?.allowNegativeStock ?? false}
        enableCombos={settings?.enableCombos ?? false}
        allowSaleFromCommittedCombos={settings?.allowSaleFromCommittedCombos ?? false}
      />
    </div>
  );
}

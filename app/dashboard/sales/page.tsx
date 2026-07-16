import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { SalesClient } from '@/components/sales-client';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Ventas · GNS',
  description: 'Registra y gestiona las ventas del inventario.',
};

export default async function SalesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const whereTenant = companyId ? { companyId } : {};

  const [sales, products, customers] = await Promise.all([
    prisma.sale.findMany({
      where: whereTenant,
      include: {
        user: { select: { name: true } },
        details: {
          include: { product: { select: { name: true, code: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: whereTenant,
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      where: whereTenant,
      orderBy: { name: 'asc' },
    }),
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
    user: { name: s.user?.name ?? null },
    details: s.details.map(d => ({
      id: String(d.id),
      productId: String(d.productId),
      quantity: d.quantity,
      unitPrice: Number(d.unitPrice),
      subtotal: Number(d.subtotal),
      discount: Number(d.discount),
      total: Number(d.total),
      product: { name: d.product.name, code: d.product.code },
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

  return (
    <div className="p-4 sm:p-6">
      <SalesClient
        initialSales={serializedSales}
        products={serializedProducts}
        customers={serializedCustomers}
        userId={String(session.user.id)}
      />
    </div>
  );
}

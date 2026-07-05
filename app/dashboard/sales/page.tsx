import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { SalesClient } from '@/components/sales-client';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Ventas · Dulche Dorelle',
  description: 'Registra y gestiona las ventas del inventario.',
};

export default async function SalesPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const [sales, products] = await Promise.all([
    prisma.sale.findMany({
      include: {
        user: { select: { name: true } },
        details: {
          include: { product: { select: { name: true, code: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  // Serialize safely
  const serializedSales = sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    client: s.client,
    discount: Number(s.discount),
    total: Number(s.total),
    paymentMethod: s.paymentMethod,
    status: s.status,
    remarks: s.remarks,
    voidedByUserId: s.voidedByUserId,
    voidedAt: s.voidedAt ? s.voidedAt.toISOString() : null,
    voidedReason: s.voidedReason,
    createdAt: s.createdAt.toISOString(),
    user: { name: s.user?.name ?? null },
    details: s.details.map(d => ({
      id: d.id,
      productId: d.productId,
      quantity: d.quantity,
      unitPrice: Number(d.unitPrice),
      subtotal: Number(d.subtotal),
      discount: Number(d.discount),
      total: Number(d.total),
      product: { name: d.product.name, code: d.product.code },
    })),
  }));

  const serializedProducts = products.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    salePrice: Number(p.salePrice),
    quantityAvailable: p.quantityAvailable,
  }));

  return (
    <div className="p-4 sm:p-6">
      <SalesClient
        initialSales={serializedSales}
        products={serializedProducts}
        userId={session.user.id}
      />
    </div>
  );
}

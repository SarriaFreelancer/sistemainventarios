import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Compras · Dulche Dorelle',
  description: 'Gestión de órdenes de compra y proveedores.',
};

export default async function ComprasPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const [supplierCount, purchaseOrderCount, recentOrders] = await Promise.all([
    prisma.supplier.count(),
    prisma.purchaseOrder.count(),
    prisma.purchaseOrder.findMany({
      where: { status: 'SENT' },
      include: { supplier: true },
      orderBy: { expectedDelivery: 'asc' },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Proveedores</p>
          <p className="mt-4 text-4xl font-bold text-foreground">{supplierCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">Proveedores activos para tus compras.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Órdenes de compra</p>
          <p className="mt-4 text-4xl font-bold text-foreground">{purchaseOrderCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">Ordenes generadas para abastecer inventario.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recepción</p>
          <p className="mt-4 text-4xl font-bold text-foreground">{recentOrders.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Órdenes pendientes por recibir.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Órdenes pendientes</h1>
        <p className="mt-2 text-sm text-muted-foreground">Próximas entregas desde tus proveedores.</p>
        <div className="mt-6 grid gap-3">
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-border/70 bg-muted p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-foreground">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{order.status}</p>
                </div>
                <p className="text-sm text-muted-foreground">Proveedor: {order.supplier.companyName}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Entrega esperada: {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString('es-CO') : 'No definida'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay órdenes pendientes por el momento.</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Truck, Receipt, FileText, Settings, ShieldCheck, CreditCard, ArrowRight, PackagePlus, TrendingUp, TrendingDown } from 'lucide-react';
import { PurchaseCharts } from './components/PurchaseCharts';
import { 
  getSpendingKPIs, 
  getMonthlySpendings, 
  getTopSuppliers, 
  getPurchasesByCategory, 
  getTopProducts 
} from '@/app/actions/purchase-dashboard-actions';

export const metadata = {
  title: 'Módulo de Compras · GNS',
  description: 'Gestión integral del flujo de compras.',
};

export default async function ComprasPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  const [
    supplierCount, requisitionCount, requestCount, orderCount, receiptCount, invoiceCount, payablesCount,
    spendingKPIs, monthlySpendings, topSuppliers, purchasesByCategory, topProducts
  ] = await Promise.all([
    prisma.supplier.count({ where: companyFilter }),
    prisma.internalRequisition.count({ where: companyFilter }),
    prisma.purchaseRequest.count({ where: companyFilter }),
    prisma.purchaseOrder.count({ where: companyFilter }),
    prisma.purchaseReceipt.count({ where: companyFilter }),
    prisma.purchaseInvoice.count({ where: companyFilter }),
    prisma.accountsPayable.count({ where: companyFilter }),
    getSpendingKPIs(),
    getMonthlySpendings(),
    getTopSuppliers(),
    getPurchasesByCategory(),
    getTopProducts(),
  ]);

  const moduleCards = [
    {
      title: 'Requisiciones',
      description: 'Solicitudes internas de material (Fase 0).',
      icon: FileText,
      href: '/dashboard/compras/requisiciones',
      count: requisitionCount,
      color: 'bg-indigo-500/10 text-indigo-500',
    },
    {
      title: 'Solicitudes',
      description: 'Crear y aprobar solicitudes de compra.',
      icon: ShieldCheck,
      href: '/dashboard/compras/solicitudes',
      count: requestCount,
      color: 'bg-emerald-500/10 text-emerald-500',
    },
    {
      title: 'Órdenes de Compra',
      description: 'Gestionar órdenes enviadas a proveedores.',
      icon: Truck,
      href: '/dashboard/compras/ordenes',
      count: orderCount,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      title: 'Recepciones',
      description: 'Registrar entregas y actualizar el inventario.',
      icon: PackagePlus,
      href: '/dashboard/compras/recepciones',
      count: receiptCount,
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      title: 'Facturas',
      description: 'Registrar facturas de proveedores.',
      icon: FileText,
      href: '/dashboard/compras/facturas',
      count: invoiceCount,
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      title: 'Cuentas por Pagar',
      description: 'Gestionar pagos a proveedores.',
      icon: CreditCard,
      href: '/dashboard/compras/cuentas-por-pagar',
      count: payablesCount,
      color: 'bg-rose-500/10 text-rose-500',
    },
    {
      title: 'Configuración',
      description: 'Ajustar el flujo y niveles de aprobación.',
      icon: Settings,
      href: '/dashboard/compras/configuracion',
      count: null,
      color: 'bg-gray-500/10 text-gray-500',
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Compras</h1>
        <p className="mt-2 text-muted-foreground">
          Supervisa el abastecimiento, gestiona órdenes y actualiza tu inventario automáticamente.
        </p>
      </div>

      {/* Tarjetas KPI Financieras */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Gasto Mes Actual</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(spendingKPIs.currentSpend)}
            </h2>
            {spendingKPIs.variation !== 0 && (
              <span className={`inline-flex items-center text-sm font-medium ${spendingKPIs.variation > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {spendingKPIs.variation > 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                {spendingKPIs.variation > 0 ? '+' : ''}{spendingKPIs.variation}%
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">vs. mes anterior ({new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(spendingKPIs.prevSpend)})</p>
        </div>
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Órdenes Abiertas</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">{orderCount}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Esperando recepción de mercancía</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {moduleCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
              {card.count !== null && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {card.count} registros
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-4 transition-all group-hover:opacity-100 group-hover:translate-x-0">
              Ir al módulo <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Gráficas Avanzadas */}
      <PurchaseCharts 
        monthlySpendings={monthlySpendings}
        topSuppliers={topSuppliers}
        purchasesByCategory={purchasesByCategory}
        topProducts={topProducts}
      />
      
      {/* Resumen rápido de proveedores */}
      <div className="rounded-3xl border border-border/50 bg-muted/30 p-6 md:p-8 mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Proveedores Registrados</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tienes {supplierCount} proveedores activos listos para transaccionar.
            </p>
          </div>
          <Link
            href="/dashboard/suppliers"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver Proveedores
          </Link>
        </div>
      </div>
    </div>
  );
}

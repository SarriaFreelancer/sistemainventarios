import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isCreditModuleActive } from '@/lib/credit-auth';
import { getCreditDashboardStats, getCreditOperations } from '@/app/actions/credit-actions';
import { CarteraClient } from '@/components/cartera/cartera-client';
import { CreditCard, AlertCircle, Settings } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Cartera y Ventas a Crédito · GNS',
  description: 'Gestión de cuentas por cobrar, abonos, cuotas y entregas a crédito',
};

export default async function CarteraPage(props: {
  searchParams?: Promise<{ action?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialOpenCreate = searchParams?.action === 'new';

  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  if (!companyId) redirect('/dashboard');

  const isActive = await isCreditModuleActive(companyId);
  const isSuperAdmin = session.user.role === 'SUPERADMIN';

  // Si el módulo no está activo para la empresa y no es SUPERADMIN, mostrar pantalla informativa
  if (!isActive && !isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
          <CreditCard className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Módulo de Cartera y Ventas a Crédito Inactivo
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Este módulo opcional permite gestionar cuentas por cobrar, calendario de cuotas, abonos parciales, reservas de inventario y entregas bajo pago completo. Actualmente no está habilitado para su empresa.
          </p>
        </div>

        {session.user.role === 'ADMIN' ? (
          <div className="pt-4">
            <Link
              href="/dashboard/settings?tab=inventory"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
            >
              <Settings className="h-4 w-4" />
              Habilitar en Configuración
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Comuníquese con el administrador de su empresa para solicitar la activación de esta funcionalidad.
          </p>
        )}
      </div>
    );
  }

  // Cargar datos
  const [statsRes, operationsRes, customers, products, branches, companySetting] = await Promise.all([
    getCreditDashboardStats(),
    getCreditOperations({ page: 1, pageSize: 100 }),
    prisma.customer.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        documentType: true,
        documentNumber: true,
        phone: true,
        email: true,
        deliveryAddress: true,
        creditNotes: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.product.findMany({
      where: { companyId, status: 'AVAILABLE' },
      select: {
        id: true,
        code: true,
        name: true,
        salePrice: true,
        quantityAvailable: true,
        reservedQuantity: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.branch.findMany({
      where: { companyId, active: true },
      select: { id: true, name: true }
    }),
    prisma.companySetting.findUnique({
      where: { companyId },
      select: {
        creditDefaultDeliveryMode: true,
        creditEnableStockReservation: true,
        creditReservationDays: true
      }
    })
  ]);

  const stats = statsRes.success && statsRes.stats ? statsRes.stats : {
    totalPortfolio: 0,
    overduePortfolio: 0,
    overdueCount: 0,
    totalOperations: 0,
    activeCount: 0,
    paidPendingDelivery: 0,
    reservedOperations: 0,
    todayCollections: 0
  };

  const operations = operationsRes.success && operationsRes.items ? operationsRes.items : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            Cartera y Ventas a Crédito
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión integral de financiamiento comercial, cobro de cuotas y despacho de entregas.
          </p>
        </div>
      </div>

      <CarteraClient
        stats={stats}
        operations={operations}
        customers={customers}
        products={products}
        branches={branches}
        defaultDeliveryMode={companySetting?.creditDefaultDeliveryMode || 'IMMEDIATE'}
        enableStockReservation={companySetting?.creditEnableStockReservation ?? true}
        initialOpenCreate={initialOpenCreate}
      />
    </div>
  );
}

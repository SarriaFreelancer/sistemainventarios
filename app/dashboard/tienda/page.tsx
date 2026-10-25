import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isStoreModuleActive, generateStoreSlug } from '@/lib/store-auth';
import { getStoreAdminData, getStoreOrders } from '@/app/actions/store-actions';
import { StoreAdminClient } from '@/components/store/store-admin-client';
import { Store, Settings } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Tienda Virtual · GNS',
  description: 'Gestión de catálogo web, pedidos en línea y configuración de tienda virtual',
};

export default async function TiendaVirtualPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = await getSessionCompanyId();
  if (!companyId) redirect('/dashboard');

  const isActive = await isStoreModuleActive(companyId);
  const isSuperAdmin = session.user.role === 'SUPERADMIN';

  // Si el módulo no está activo para la empresa y no es SUPERADMIN, mostrar pantalla informativa
  if (!isActive && !isSuperAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shadow-sm">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Módulo de Tienda Virtual Inactivo
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Este módulo opcional permite a tu empresa publicar un catálogo digital de productos en internet, recibir pedidos en línea con carrito de compras y convertirlos en ventas directamente en GNS.
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

  // Asegurar que la tienda exista en la BD si el módulo está habilitado
  let store = await prisma.onlineStore.findUnique({
    where: { companyId },
    include: {
      domains: true,
    },
  });

  if (!store) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        address: true,
        city: true,
        setting: { select: { phone: true } },
      },
    });

    const slug = generateStoreSlug(companyId);
    store = await prisma.onlineStore.create({
      data: {
        companyId,
        slug,
        name: company?.name || 'Mi Tienda Virtual',
        phone: company?.setting?.phone || null,
        email: null,
        address: company?.address || null,
        city: company?.city || 'Cali',
        status: 'ACTIVE',
      },
      include: {
        domains: true,
      },
    });

    await prisma.companySetting.updateMany({
      where: { companyId },
      data: { enableOnlineStore: true },
    });
  }

  // Obtener métricas y pedidos
  const adminDataResult = await getStoreAdminData();
  const ordersResult = await getStoreOrders({ limit: 100 });

  // Obtener productos de la empresa
  const rawProducts = await prisma.product.findMany({
    where: { companyId },
    select: {
      id: true,
      code: true,
      name: true,
      salePrice: true,
      webPrice: true,
      quantityAvailable: true,
      reservedQuantity: true,
      isPublishedWeb: true,
      description: true,
      imageUrl: true,
      galleryImages: true,
      videoUrl: true,
      categoryId: true,
      productGroupId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      productGroup: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Obtener categorías activas de la empresa con conteo
  const categories = await prisma.category.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      code: true,
      productGroupId: true,
      productGroup: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: {
            where: { companyId },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Obtener grupos de productos activos
  const productGroups = await prisma.productGroup.findMany({
    where: { companyId, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      code: true,
      _count: {
        select: {
          products: {
            where: { companyId },
          },
          categories: {
            where: { companyId },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Convertir Decimal a number si aplica
  const products = rawProducts.map((p) => ({
    ...p,
    salePrice: Number(p.salePrice || 0),
    webPrice: p.webPrice !== null ? Number(p.webPrice) : null,
  }));

  const metrics = adminDataResult.success && adminDataResult.metrics ? adminDataResult.metrics : {
    totalOrders: 0,
    pendingReviewCount: 0,
    acceptedCount: 0,
    completedCount: 0,
    totalRevenue: 0,
    publishedCount: 0,
    totalProducts: products.length,
  };

  const orders = ordersResult.success && ordersResult.orders ? ordersResult.orders : [];

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const publicBaseUrl = `${protocol}://${host}`;

  return (
    <StoreAdminClient
      store={store}
      metrics={metrics}
      orders={orders}
      products={products}
      categories={categories}
      productGroups={productGroups}
      publicBaseUrl={publicBaseUrl}
    />
  );
}

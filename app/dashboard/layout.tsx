import { redirect } from 'next/navigation';
import { getAuthSession } from '../../auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { prisma } from '@/lib/prisma';
import { getSessionCompanyId } from '@/lib/session';

import { InactivityGuard } from '@/components/security/inactivity-guard';
import SessionMonitor from '@/components/security/session-monitor';
import { GlobalAnnouncer } from '@/components/global-announcer';
import { FloatingChat } from '@/components/chat/floating-chat';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let isModulesInitialized = false;

async function ensureModulesInitialized() {
  if (isModulesInitialized) return;
  try {
    const requiredModules = [
      { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', description: 'Panel de control principal y métricas clave' },
      { name: 'Productos', href: '/dashboard/products', icon: 'Boxes', description: 'Inventario, precios, stock y catálogo de artículos' },
      { name: 'Grupos', href: '/dashboard/groups', icon: 'Folder', description: 'Grupos y familias principales de productos' },
      { name: 'Categorías', href: '/dashboard/categories', icon: 'Tags', description: 'Categorización jerárquica de inventario' },
      { name: 'Bodegas', href: '/dashboard/warehouses', icon: 'Building2', description: 'Gestión WMS multibodega, ubicaciones y traslados' },
      { name: 'Proveedores', href: '/dashboard/suppliers', icon: 'Factory', description: 'Directorio de proveedores y compras' },
      { name: 'Compras', href: '/dashboard/compras', icon: 'Truck', description: 'Órdenes de compra, recepciones y cuentas por pagar' },
      { name: 'Ventas', href: '/dashboard/sales', icon: 'ShoppingCart', description: 'Punto de venta POS y facturación' },
      { name: 'CRM', href: '/dashboard/crm', icon: 'Users', description: 'Gestión comercial, leads, oportunidades y clientes' },
      { name: 'RRHH', href: '/dashboard/rrhh', icon: 'Users', description: 'Gestión de personal y nómina' },
      { name: 'Finanzas', href: '/dashboard/finanzas', icon: 'DollarSign', description: 'Ingresos, gastos y flujo de caja' },
      { name: 'Reportes', href: '/dashboard/reportes', icon: 'FileText', description: 'Informes avanzados exportables' },
      { name: 'Analíticas', href: '/dashboard/analytics', icon: 'BarChart3', description: 'Métricas SaaS, actividad de usuarios y módulos' },
      { name: 'Auditoría', href: '/dashboard/audit', icon: 'ShieldAlert', description: 'Trazabilidad y registro de actividad' },
      { name: 'Empresas', href: '/dashboard/companies', icon: 'Building2', description: 'Gestión de empresas y subcuentas' },
      { name: 'Documentación', href: '/dashboard/documentacion', icon: 'HelpCircle', description: 'Manual del sistema, guías paso a paso e IA' },
      { name: 'Configuración', href: '/dashboard/settings', icon: 'Settings', description: 'Ajustes generales, seguridad e integraciones' },
    ];

    const [superRole, adminRoleObj, userRoleObj] = await Promise.all([
      prisma.role.findUnique({ where: { name: 'SUPERADMIN' } }),
      prisma.role.findUnique({ where: { name: 'ADMIN' } }),
      prisma.role.findUnique({ where: { name: 'USER' } })
    ]);

    const companies = await prisma.company.findMany({ select: { id: true } });

    for (const reqMod of requiredModules) {
      const mod = await prisma.module.upsert({
        where: { name: reqMod.name },
        update: {
          href: reqMod.href,
          icon: reqMod.icon,
          description: reqMod.description,
          isActive: true
        },
        create: {
          name: reqMod.name,
          href: reqMod.href,
          icon: reqMod.icon,
          description: reqMod.description,
          isActive: true
        }
      });

      // Vincular a roles
      if (superRole) {
        await prisma.roleModule.upsert({
          where: { roleId_moduleId: { roleId: superRole.id, moduleId: mod.id } },
          update: {},
          create: { roleId: superRole.id, moduleId: mod.id }
        }).catch(() => {});
      }

      if (adminRoleObj && reqMod.name !== 'Empresas') {
        await prisma.roleModule.upsert({
          where: { roleId_moduleId: { roleId: adminRoleObj.id, moduleId: mod.id } },
          update: {},
          create: { roleId: adminRoleObj.id, moduleId: mod.id }
        }).catch(() => {});
      }

      const isUserAllowed = ['Dashboard', 'Productos', 'Grupos', 'Categorías', 'Bodegas', 'Proveedores', 'Compras', 'Ventas', 'CRM', 'RRHH', 'Finanzas', 'Reportes', 'Documentación'].includes(reqMod.name);
      if (userRoleObj && isUserAllowed) {
        await prisma.roleModule.upsert({
          where: { roleId_moduleId: { roleId: userRoleObj.id, moduleId: mod.id } },
          update: {},
          create: { roleId: userRoleObj.id, moduleId: mod.id }
        }).catch(() => {});
      }

      // Vincular a todas las empresas
      for (const comp of companies) {
        await prisma.companyModule.upsert({
          where: { companyId_moduleId: { companyId: comp.id, moduleId: mod.id } },
          update: {},
          create: { companyId: comp.id, moduleId: mod.id }
        }).catch(() => {});
      }
    }

    isModulesInitialized = true;
  } catch (err) {
    console.error('[MODULE_INIT_ERROR]', err);
  }
}

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAuthSession();
  if (!session?.user) redirect('/auth/login');

  if (session.user.role !== 'SUPERADMIN' && session.user.companyStatus !== 'ACTIVE') {
    redirect('/#planes');
  }

  // Ejecutar inicialización solo la primera vez en memoria
  await ensureModulesInitialized();

  let allowedModules: any[] = [];
  let companyTheme: any = null;

  let companyName = '';
  let companyLogo: string | null = null;
  let trialInfo: { isTrial: boolean; trialEndsAt: string | null; isExpired: boolean; daysLeft: number } | null = null;

  const tenantId = await getSessionCompanyId();
  let targetCompanyId = tenantId;
  if (!targetCompanyId) {
    const targetComp = await prisma.company.findFirst({ where: { status: 'ACTIVE' }, orderBy: { id: 'asc' } })
                    || await prisma.company.findFirst({ orderBy: { id: 'asc' } });
    targetCompanyId = targetComp?.id;
  }

  if (targetCompanyId) {
    const company = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: {
        name: true,
        themeConfig: true,
        setting: { select: { invoiceConfig: true } }
      }
    });
    companyTheme = company?.themeConfig;
    companyName = company?.name || '';
    companyLogo = (company?.setting?.invoiceConfig as any)?.logo || (company?.themeConfig as any)?.logo || null;

    let isTrial = false;
    let trialEndsAt: Date | null = null;
    try {
      const trialRows: any[] = await prisma.$queryRawUnsafe(
        'SELECT isTrial, trialEndsAt FROM `Company` WHERE id = ? LIMIT 1',
        targetCompanyId
      );
      if (trialRows && trialRows[0]) {
        isTrial = Boolean(trialRows[0].isTrial);
        trialEndsAt = trialRows[0].trialEndsAt ? new Date(trialRows[0].trialEndsAt) : null;
      }
    } catch {
      // Fallback si la tabla no tiene columnas de prueba
    }

    if (isTrial) {
      const now = new Date();
      const isExpired = trialEndsAt ? trialEndsAt.getTime() < now.getTime() : false;
      const diffMs = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0;
      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      trialInfo = {
        isTrial: true,
        trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
        isExpired,
        daysLeft
      };
    }
  }

  if (session.user.role === 'SUPERADMIN') {
    allowedModules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  } else if (session.user.role === 'ADMIN') {
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: Number(session.user.companyId) || -1 },
      include: { module: true },
    });
    allowedModules = companyModules
      .map(cm => cm.module)
      .filter(m => m.isActive && m.href !== '/dashboard/companies');
  } else {
    const roleModules = await prisma.roleModule.findMany({
      where: { role: { name: session.user.role as any } },
      include: { module: true },
    });

    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: Number(session.user.companyId) || -1 },
      include: { module: true },
    });

    const roleModuleIds = new Set(roleModules.map(rm => rm.moduleId));
    const companyModuleIds = new Set(companyModules.map(cm => cm.moduleId));

    allowedModules = roleModules
      .filter(rm => companyModuleIds.has(rm.moduleId))
      .map(rm => rm.module)
      .filter(m => m.isActive && m.href !== '/dashboard/companies');

    const userRecord = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { preferences: true }
    });
    const userPrefs = (userRecord?.preferences as any) || {};
    if (Array.isArray(userPrefs.allowedModuleIds)) {
      const allowedSet = new Set(userPrefs.allowedModuleIds.map((id: any) => Number(id)));
      allowedModules = allowedModules.filter(m => allowedSet.has(m.id));
    }
  }

  // Asegurar que Documentación siempre esté disponible para todos los usuarios
  const docModule = await prisma.module.findUnique({ where: { name: 'Documentación' } });
  if (docModule && !allowedModules.some(m => m.href === '/dashboard/documentacion')) {
    allowedModules.push(docModule);
  }

  // Ordenar módulos lógicamente: Documentación de penúltimo, Configuración de último
  const settingsModule = allowedModules.find(m => m.href === '/dashboard/settings');
  const documentationModule = allowedModules.find(m => m.href === '/dashboard/documentacion');
  const otherModules = allowedModules.filter(m => m.href !== '/dashboard/settings' && m.href !== '/dashboard/documentacion');

  allowedModules = [
    ...otherModules,
    ...(documentationModule ? [documentationModule] : []),
    ...(settingsModule ? [settingsModule] : [])
  ];

  return (
    <InactivityGuard>
      {(session.user as any).sessionToken && (
        <SessionMonitor sessionToken={(session.user as any).sessionToken} />
      )}
      <GlobalAnnouncer />
      <FloatingChat user={session.user} />
      <DashboardShell
        session={session}
        modules={allowedModules}
        themeConfig={companyTheme}
        companyName={companyName}
        companyLogo={companyLogo}
        trialInfo={trialInfo}
      >
        {children}
      </DashboardShell>
    </InactivityGuard>
  );
}

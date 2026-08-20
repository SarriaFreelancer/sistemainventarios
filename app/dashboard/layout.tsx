import { redirect } from 'next/navigation';
import { getAuthSession } from '../../auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { prisma } from '@/lib/prisma';
import { getSessionCompanyId } from '@/lib/session';

import { InactivityGuard } from '@/components/security/inactivity-guard';
import SessionMonitor from '@/components/security/session-monitor';
import { GlobalAnnouncer } from '@/components/global-announcer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let isModulesInitialized = false;

async function ensureModulesInitialized() {
  if (isModulesInitialized) return;
  try {
    const requiredModules = [
      { name: 'Auditoría', href: '/dashboard/audit', icon: 'ShieldAlert', description: 'Trazabilidad y registro de actividad' },
      { name: 'Bodegas', href: '/dashboard/warehouses', icon: 'Building2', description: 'Gestión WMS multibodega, ubicaciones y traslados' },
      { name: 'Configuración', href: '/dashboard/settings', icon: 'Settings', description: 'Ajustes generales, seguridad e integraciones' },
      { name: 'Analíticas', href: '/dashboard/analytics', icon: 'BarChart3', description: 'Métricas SaaS, actividad de usuarios y módulos' },
      { name: 'RRHH', href: '/dashboard/rrhh', icon: 'Users', description: 'Gestión de personal y nómina' }
    ];

    const existingModules = await prisma.module.findMany({
      where: { name: { in: requiredModules.map(m => m.name) } },
      select: { name: true }
    });
    const existingNames = new Set(existingModules.map(m => m.name));
    const missingModules = requiredModules.filter(m => !existingNames.has(m.name));

    for (const mod of missingModules) {
      const created = await prisma.module.create({
        data: {
          name: mod.name,
          href: mod.href,
          icon: mod.icon,
          description: mod.description,
          isActive: true
        }
      });
      
      const [superRole, adminRoleObj] = await Promise.all([
        prisma.role.findUnique({ where: { name: 'SUPERADMIN' } }),
        prisma.role.findUnique({ where: { name: 'ADMIN' } })
      ]);
      
      const rolePromises: Promise<any>[] = [];
      if (superRole) rolePromises.push(prisma.roleModule.create({ data: { roleId: superRole.id, moduleId: created.id } }).catch(() => {}));
      if (adminRoleObj) rolePromises.push(prisma.roleModule.create({ data: { roleId: adminRoleObj.id, moduleId: created.id } }).catch(() => {}));
      
      const companies = await prisma.company.findMany({ select: { id: true } });
      for (const comp of companies) {
        rolePromises.push(prisma.companyModule.create({ data: { companyId: comp.id, moduleId: created.id } }).catch(() => {}));
      }
      await Promise.all(rolePromises);
    }

    const userRoleObj = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (userRoleObj) {
      const assignedCount = await prisma.roleModule.count({ where: { roleId: userRoleObj.id } });
      if (assignedCount === 0) {
        const userModuleNames = ['Dashboard', 'Productos', 'Grupos', 'Categorías', 'Proveedores', 'Ventas', 'CRM', 'Compras', 'Finanzas', 'RRHH', 'Reportes'];
        const modulesToAssign = await prisma.module.findMany({
          where: { name: { in: userModuleNames } }
        });
        for (const mod of modulesToAssign) {
          await prisma.roleModule.create({
            data: { roleId: userRoleObj.id, moduleId: mod.id }
          }).catch(() => {});
        }
      }
    }

    isModulesInitialized = true;
  } catch (err) {
    console.error('[MODULE_INIT_ERROR]', err);
  }
}



import { FloatingChat } from '@/components/chat/floating-chat';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAuthSession();
  if (!session?.user) redirect('/auth/login');
  
  if (session.user.role !== 'SUPERADMIN' && session.user.companyStatus === 'SUSPENDED') {
    redirect('/#planes');
  }

  // Ejecutar inicialización solo la primera vez en memoria
  await ensureModulesInitialized();

  let allowedModules: any[] = [];
  let companyTheme: any = null;
  
  let companyName = '';
  let companyLogo: string | null = null;
  const tenantId = await getSessionCompanyId();
  if (tenantId) {
    const company = await prisma.company.findUnique({
      where: { id: tenantId },
      select: { 
        name: true, 
        themeConfig: true,
        setting: { select: { invoiceConfig: true } }
      }
    });
    companyTheme = company?.themeConfig;
    companyName = company?.name || '';
    companyLogo = (company?.setting?.invoiceConfig as any)?.logo || null;
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
  }

  // Garantizar que "Configuración" quede de último
  const settingsModule = allowedModules.find(m => m.href === '/dashboard/settings');
  const otherModules = allowedModules.filter(m => m.href !== '/dashboard/settings');
  allowedModules = settingsModule ? [...otherModules, settingsModule] : otherModules;

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
      >
        {children}
      </DashboardShell>
    </InactivityGuard>
  );
}

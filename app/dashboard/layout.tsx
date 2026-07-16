import { redirect } from 'next/navigation';
import { getAuthSession } from '../../auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getAuthSession();
  if (!session?.user) redirect('/auth/login');

  // Auto-inicialización no destructiva de nuevos módulos SaaS
  const requiredModules = [
    { name: 'Auditoría', href: '/dashboard/audit', icon: 'ShieldAlert', description: 'Trazabilidad y registro de actividad' },
    { name: 'Configuración', href: '/dashboard/settings', icon: 'Settings', description: 'Ajustes generales, seguridad e integraciones' },
    { name: 'Analíticas', href: '/dashboard/analytics', icon: 'BarChart3', description: 'Métricas SaaS, actividad de usuarios y módulos' }
  ];

  for (const mod of requiredModules) {
    const existing = await prisma.module.findUnique({ where: { name: mod.name } });
    if (!existing) {
      const created = await prisma.module.create({
        data: {
          name: mod.name,
          href: mod.href,
          icon: mod.icon,
          description: mod.description,
          isActive: true
        }
      });
      
      const superRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });
      if (superRole) {
        await prisma.roleModule.create({
          data: { roleId: superRole.id, moduleId: created.id }
        }).catch(() => {});
      }

      const adminRoleObj = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
      if (adminRoleObj) {
        await prisma.roleModule.create({
          data: { roleId: adminRoleObj.id, moduleId: created.id }
        }).catch(() => {});
      }

      const companies = await prisma.company.findMany({ select: { id: true } });
      for (const comp of companies) {
        await prisma.companyModule.create({
          data: { companyId: comp.id, moduleId: created.id }
        }).catch(() => {});
      }
    }
  }

  let allowedModules: any[] = [];
  let companyTheme: any = null;
  
  let companyName = '';
  if (session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: Number(session.user.companyId) },
      select: { name: true, themeConfig: true }
    });
    companyTheme = company?.themeConfig;
    companyName = company?.name || '';
  }
  
  if (session.user.role === 'SUPERADMIN') {
    allowedModules = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  } else if (session.user.role === 'ADMIN') {
    // ADMIN sees all modules assigned to their company
    const companyModules = await prisma.companyModule.findMany({
      where: { companyId: Number(session.user.companyId) || -1 },
      include: { module: true },
    });
    allowedModules = companyModules.map(cm => cm.module).filter(m => m.isActive);
  } else {
    // For regular users, find intersection of role modules AND company modules
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
      .filter(m => m.isActive);
  }

  return (
    <DashboardShell session={session} modules={allowedModules} themeConfig={companyTheme} companyName={companyName}>
      {children}
    </DashboardShell>
  );
}

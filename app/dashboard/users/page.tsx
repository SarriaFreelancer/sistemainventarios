import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { UsersClient } from '@/components/user-dialogs';
import { redirect } from 'next/navigation';
import { getPlanLimits } from '@/lib/plans';

export const metadata = {
  title: 'Usuarios · GNS',
  description: 'Administra los usuarios y roles del sistema.',
};

export default async function UsersPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const isAdmin = session.user.role === 'ADMIN';
  const companyId = await getSessionCompanyId();

  const [users, roles, companies] = await Promise.all([
    prisma.user.findMany({
      where: isAdmin && companyId ? { companyId } : {},
      include: { role: true, company: true },
      orderBy: { name: 'asc' },
    }),
    prisma.role.findMany({ 
      where: isAdmin ? { name: 'USER' } : {}, // Admin can only create USERs? Wait, they might create other admins. Let's say they can see all roles except SUPERADMIN.
      orderBy: { name: 'asc' } 
    }),
    prisma.company.findMany({ 
      where: isAdmin && companyId ? { id: companyId } : {},
      orderBy: { name: 'asc' } 
    }),
  ]);

  // Filter out SUPERADMIN role if the current user is not a SUPERADMIN
  const filteredRoles = isAdmin ? roles.filter(r => r.name !== 'SUPERADMIN') : roles;

  const serializedUsers = users.map((user) => {
    const prefs = (user.preferences as any) || {};
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      password: prefs.plainPassword ? String(prefs.plainPassword) : undefined,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      company: user.company ? { id: user.company.id, name: user.company.name } : null,
    };
  });

  const serializedRoles = filteredRoles.map((role) => ({ id: role.id, name: role.name }));
  const serializedCompanies = companies.map((company) => ({ id: company.id, name: company.name }));

  let planLimits = { maxUsers: 9999, planName: 'Plan Premium' };
  let currentUsersCount = 0;
  
  if (companyId) {
    const activeCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { planId: true, maxUsers: true, maxProducts: true, _count: { select: { users: true } } }
    });
    
    if (activeCompany) {
      const limits = getPlanLimits(activeCompany.planId, { maxUsers: activeCompany.maxUsers, maxProducts: activeCompany.maxProducts });
      planLimits = { maxUsers: limits.maxUsers, planName: limits.name };
      currentUsersCount = activeCompany._count.users;
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <UsersClient 
        users={serializedUsers} 
        roles={serializedRoles} 
        companies={serializedCompanies} 
        maxUsers={planLimits.maxUsers}
        currentUsers={currentUsersCount}
        planName={planLimits.planName}
      />
    </div>
  );
}

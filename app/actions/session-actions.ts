'use server';

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { 
  cleanupExpiredSessions, 
  createActiveSession, 
  checkSessionLimits, 
  removeSessionByToken, 
  removeSessionByIdInternal 
} from '@/lib/session-core';

export { cleanupExpiredSessions, createActiveSession, checkSessionLimits, removeSessionByToken };

export async function removeSessionById(sessionId: number) {
  const session = await getAuthSession();
  
  if (!session || !session.user) {
    return { success: false, error: 'Unauthorized' };
  }

  // handle different ways role might be shaped in session.user
  const role = (session.user as any).role?.name || (session.user as any).role || (session.user as any).roleName;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return { success: false, error: 'Forbidden' };
  }

  const targetSession = await prisma.userSession.findUnique({
    where: { id: sessionId }
  });

  if (!targetSession) {
    return { success: false, error: 'Session not found' };
  }

  if (role === 'ADMIN') {
    if (targetSession.companyId !== (session.user as any).companyId) {
      return { success: false, error: 'Forbidden' };
    }
  }

  try {
    return await removeSessionByIdInternal(sessionId);
  } catch (error) {
    return { success: false, error: 'Failed to delete session' };
  }
}

export async function removeAllCompanySessions(companyId: number, excludeToken?: string) {
  const session = await getAuthSession();
  
  if (!session || !session.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const role = (session.user as any).role?.name || (session.user as any).role || (session.user as any).roleName;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return { success: false, error: 'Forbidden' };
  }

  if (role === 'ADMIN') {
    if (companyId !== (session.user as any).companyId) {
      return { success: false, error: 'Forbidden' };
    }
  }

  try {
    const whereClause: any = { companyId };
    if (excludeToken) {
      whereClause.token = { not: excludeToken };
    }

    await prisma.userSession.deleteMany({
      where: whereClause
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete sessions' };
  }
}

export async function getActiveSessionsForAdmin() {
  const authSession = await getAuthSession();
  
  if (!authSession || !authSession.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const role = (authSession.user as any).role?.name || (authSession.user as any).role || (authSession.user as any).roleName;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return { success: false, error: 'Forbidden' };
  }

  if (role === 'SUPERADMIN') {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        planId: true,
        maxUsers: true,
        sessions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    const result = companies.map(c => ({
      id: c.id,
      name: c.name,
      planId: c.planId,
      maxUsers: c.maxUsers,
      sessions: c.sessions
    }));
    
    return { success: true, data: { companies: result } };
  }

  if (role === 'ADMIN') {
    const companyId = (authSession.user as any).companyId;
    if (!companyId) return { success: false, error: 'No company assigned' };

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        planId: true,
        maxUsers: true,
        sessions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!company) {
      return { success: false, error: 'Company not found' };
    }

    return { 
      success: true, 
      data: { 
        company: { id: company.id, name: company.name, planId: company.planId, maxUsers: company.maxUsers }, 
        sessions: company.sessions 
      } 
    };
  }
}

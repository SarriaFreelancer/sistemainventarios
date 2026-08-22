import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/plans';
import crypto from 'crypto';

export async function cleanupExpiredSessions(companyId?: number) {
  try {
    const whereClause = companyId ? { companyId, expiresAt: { lt: new Date() } } : { expiresAt: { lt: new Date() } };
    await prisma.userSession.deleteMany({
      where: whereClause
    });
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

export async function createActiveSession(userId: number, companyId: number, metadata: { ip?: string; browser?: string; os?: string }) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now

  await prisma.userSession.create({
    data: {
      userId,
      companyId,
      token,
      expiresAt,
      ip: metadata.ip,
      browser: metadata.browser,
      operatingSystem: metadata.os
    }
  });

  return token;
}

export async function checkSessionLimits(userId: number, companyId: number) {
  await cleanupExpiredSessions(companyId);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { maxUsers: true, planId: true }
  });

  if (!company) {
    return { allowed: false, activeCount: 0, maxUsers: 0 };
  }

  // Use the central getPlanLimits logic to resolve effective maxUsers
  const limits = getPlanLimits(company.planId, { maxUsers: company.maxUsers });
  const effectiveMaxUsers = limits.maxUsers;

  const activeCount = await prisma.userSession.count({
    where: { companyId }
  });

  if (effectiveMaxUsers === null || activeCount < effectiveMaxUsers) {
    return { allowed: true, activeCount, maxUsers: effectiveMaxUsers };
  }

  // Count >= maxUsers, check if this specific user already has a session to overwrite
  const userSessions = await prisma.userSession.findMany({
    where: { userId, companyId },
    orderBy: { createdAt: 'asc' }
  });

  if (userSessions.length > 0) {
    return {
      allowed: true,
      closeSessionId: userSessions[0].id,
      activeCount,
      maxUsers: effectiveMaxUsers
    };
  }

  return { allowed: false, activeCount, maxUsers: effectiveMaxUsers };
}

export async function removeSessionByToken(token: string) {
  try {
    await prisma.userSession.delete({
      where: { token }
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing session by token:', error);
    return { success: false, error: 'Failed to delete session' };
  }
}

export async function removeSessionByIdInternal(sessionId: number) {
  try {
    await prisma.userSession.delete({
      where: { id: sessionId }
    });
    return { success: true };
  } catch (error) {
    console.error('Error removing session by id:', error);
    return { success: false, error: 'Failed to delete session' };
  }
}

export async function isSessionTokenValid(token: string) {
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          company: true,
          role: true
        }
      }
    }
  });

  if (!session || !session.user) {
    return { valid: false, reason: 'USER_DELETED' };
  }

  const user = session.user;
  const isSuperAdmin = user.role?.name === 'SUPERADMIN';

  // Si tiene empresa pero la empresa fue eliminada de la base de datos
  if (session.companyId && !user.company && !isSuperAdmin) {
    return { valid: false, reason: 'COMPANY_DELETED' };
  }

  // Si la empresa existe pero está suspendida o inactiva (y no es SuperAdmin)
  if (user.company && user.company.status !== 'ACTIVE' && !isSuperAdmin) {
    return { valid: false, reason: 'COMPANY_SUSPENDED' };
  }

  if (session.expiresAt < new Date()) {
    await removeSessionByToken(token);
    return { valid: false, reason: 'EXPIRED' };
  }

  return { valid: true };
}

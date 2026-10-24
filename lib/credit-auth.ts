import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { resolveActionCompanyId, resolveActionUserId } from '@/lib/session';

/**
 * Verifica si el módulo opcional de Cartera y Crédito está activo para la empresa indicada.
 */
export async function isCreditModuleActive(companyId: number): Promise<boolean> {
  try {
    const setting = await prisma.companySetting.findUnique({
      where: { companyId },
      select: { enableCreditSales: true }
    });
    return Boolean(setting?.enableCreditSales);
  } catch {
    return false;
  }
}

/**
 * Valida de forma estricta en el servidor que la empresa tenga habilitado el módulo de crédito.
 * Si no está activo y el usuario no es SUPERADMIN, arroja un error controlado.
 */
export async function assertCreditModuleActive(companyId: number) {
  const setting = await prisma.companySetting.findUnique({
    where: { companyId }
  });

  if (!setting?.enableCreditSales) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'SUPERADMIN') {
      throw new Error('El módulo de Cartera y Ventas a Crédito no está habilitado para esta empresa.');
    }
  }

  return setting;
}

/**
 * Obtiene la sesión actual, la empresa y el usuario autorizado para operaciones de cartera.
 */
export async function getCreditAuthContext() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error('No autenticado.');
  }

  const companyId = await resolveActionCompanyId();
  if (!companyId) {
    throw new Error('No se pudo determinar la empresa del usuario.');
  }

  const userId = await resolveActionUserId(session.user.id);
  if (!userId) {
    throw new Error('Usuario inválido.');
  }

  await assertCreditModuleActive(companyId);

  const setting = await prisma.companySetting.findUnique({
    where: { companyId }
  });

  return {
    session,
    companyId,
    userId,
    userRole: session.user.role,
    setting
  };
}

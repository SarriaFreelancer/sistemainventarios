import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { resolveActionCompanyId, resolveActionUserId } from '@/lib/session';

/**
 * Verifica si el módulo de Tienda Virtual está activo para la empresa indicada.
 */
export async function isStoreModuleActive(companyId: number): Promise<boolean> {
  try {
    const setting = await prisma.companySetting.findUnique({
      where: { companyId },
      select: { enableOnlineStore: true },
    });
    return Boolean(setting?.enableOnlineStore);
  } catch {
    return false;
  }
}

/**
 * Valida de forma estricta en el servidor que la empresa tenga habilitada la Tienda Virtual.
 * Si no está activa y el usuario no es SUPERADMIN, arroja un error controlado.
 */
export async function assertStoreModuleActive(companyId: number) {
  const setting = await prisma.companySetting.findUnique({
    where: { companyId },
  });

  if (!setting?.enableOnlineStore) {
    const session = await getAuthSession();
    if (session?.user?.role !== 'SUPERADMIN') {
      throw new Error('El módulo de Tienda Virtual no está habilitado para esta empresa.');
    }
  }

  return setting;
}

/**
 * Obtiene el contexto de autenticación y empresa para administrar la tienda virtual.
 */
export async function getStoreAuthContext() {
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

  await assertStoreModuleActive(companyId);

  const setting = await prisma.companySetting.findUnique({
    where: { companyId },
  });

  return {
    session,
    companyId,
    userId,
    setting,
    isSuperAdmin: session.user.role === 'SUPERADMIN',
  };
}

/**
 * Genera un identificador único, inmutable y seguro para la tienda.
 * Ejemplo: store_a1b2c3d4
 */
export function generateStoreSlug(companyId: number): string {
  const randomHex = Math.random().toString(16).substring(2, 10);
  return `store_${companyId}_${randomHex}`;
}

/**
 * Resuelve una tienda pública por su slug o dominio personalizado.
 * Valida que la empresa esté activa y que la tienda no esté suspendida.
 */
export async function resolvePublicStore(slugOrDomain: string) {
  if (!slugOrDomain) return null;

  const normalized = slugOrDomain.trim().toLowerCase();

  // Buscar primero por slug o por dominio personalizado
  const store = await prisma.onlineStore.findFirst({
    where: {
      OR: [
        { slug: normalized },
        { customDomain: normalized },
      ],
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          status: true,
          setting: {
            select: {
              enableOnlineStore: true,
              phone: true,
              website: true,
              nit: true,
            },
          },
        },
      },
    },
  });

  if (!store) return null;

  // Validaciones de disponibilidad y licencia
  const isCompanyActive = store.company.status === 'ACTIVE';
  const isModuleEnabled = store.company.setting?.enableOnlineStore ?? false;

  return {
    store,
    isAvailable: isCompanyActive && isModuleEnabled && store.status === 'ACTIVE',
    isPaused: store.status === 'PAUSED',
    isSuspended: store.status === 'SUSPENDED' || !isCompanyActive || !isModuleEnabled,
  };
}

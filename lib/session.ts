"use server";

import { getAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns the current session's companyId.
 * If the user is SUPERADMIN (no companyId), returns undefined.
 * Returns null if not authenticated.
 */
export async function getSessionCompanyId(): Promise<number | undefined | null> {
  const session = await getAuthSession();
  if (!session?.user) return null;

  // El companyId fue validado al hacer login — confiar en el JWT evita
  // una query innecesaria a la BD en cada Server Action y API route.
  if (session.user.companyId) {
    return Number(session.user.companyId);
  }

  // SUPERADMIN no tiene companyId → sin filtro de tenant (undefined)
  return undefined;
}

/**
 * Retorna el companyId para mutaciones (Server Actions).
 * Garantiza 100% que la empresa exista en la base de datos para evitar errores de Foreign Key.
 */
export async function resolveActionCompanyId(): Promise<number> {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("No autenticado");

  if (session.user.companyId) {
    const candidateId = Number(session.user.companyId);
    const existingCompany = await prisma.company.findUnique({ where: { id: candidateId } });
    if (existingCompany) {
      return existingCompany.id;
    }
  }

  throw new Error("No tienes una empresa válida asociada a tu sesión. Por favor inicia sesión nuevamente o contacta al administrador.");
}

/**
 * Garantiza 100% que el userId exista en la base de datos para evitar errores de Foreign Key (e.g. tras re-sembrar la BD).
 */
export async function resolveActionUserId(inputUserId?: number | string): Promise<number> {
  const session = await getAuthSession();

  // 1. Probar con inputUserId si viene proporcionado
  if (inputUserId) {
    const candidateId = Number(inputUserId);
    if (!isNaN(candidateId) && candidateId > 0) {
      const user = await prisma.user.findUnique({ where: { id: candidateId } });
      if (user) return user.id;
    }
  }

  // 2. Probar con session.user.id
  if (session?.user?.id) {
    const candidateId = Number(session.user.id);
    if (!isNaN(candidateId) && candidateId > 0) {
      const user = await prisma.user.findUnique({ where: { id: candidateId } });
      if (user) return user.id;
    }
  }

  // 3. Probar por correo electrónico de la sesión
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) return user.id;
  }

  throw new Error("No se pudo resolver tu identidad de usuario. Por favor inicia sesión nuevamente.");
}

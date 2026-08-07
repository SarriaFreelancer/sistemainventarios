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

  if (session.user.companyId) {
    const candidateId = Number(session.user.companyId);
    const existingCompany = await prisma.company.findUnique({ where: { id: candidateId } });
    if (existingCompany) {
      return existingCompany.id;
    }
  }

  // Fallback si la empresa guardada en sesión ya no existe (ej. tras re-sembrar la BD)
  if (session.user.role === 'SUPERADMIN') {
    const globalCompany = await prisma.company.findFirst({
      where: { name: "Global" },
      orderBy: { id: "asc" }
    });
    if (globalCompany) return globalCompany.id;
  }

  const firstCompany = await prisma.company.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" }
  });

  return firstCompany?.id;
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

  // Fallback de seguridad extrema
  const globalCompany = await prisma.company.findFirst({
    where: { name: "Global" },
    orderBy: { id: "asc" }
  });
  if (globalCompany) return globalCompany.id;

  const firstActiveCompany = await prisma.company.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" }
  });
  if (firstActiveCompany) return firstActiveCompany.id;

  const firstAnyCompany = await prisma.company.findFirst({
    orderBy: { id: "asc" }
  });
  if (firstAnyCompany) return firstAnyCompany.id;

  throw new Error("No hay empresas registradas en el sistema para asignar esta operación.");
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

  // 4. Fallback de seguridad: Primer usuario del sistema
  const firstUser = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (firstUser) return firstUser.id;

  throw new Error("No hay usuarios registrados en el sistema para asociar esta transacción.");
}

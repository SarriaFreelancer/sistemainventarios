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
  return session.user.companyId ? Number(session.user.companyId) : undefined;
}

/**
 * Retorna el companyId para mutaciones (Server Actions).
 * Si el usuario es SUPERADMIN (sin empresa), toma la primera empresa del sistema.
 */
export async function resolveActionCompanyId(): Promise<number> {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("No autenticado");
  
  // Si el usuario ya tiene companyId (incluso el Global del SUPERADMIN), lo usamos.
  if (session.user.companyId) return Number(session.user.companyId);

  // Fallback de seguridad extrema (por si hay un SUPERADMIN viejo sin companyId en BD)
  const globalCompany = await prisma.company.findFirst({
    where: { name: "Global" },
    orderBy: { id: "asc" }
  });
  
  if (globalCompany) return globalCompany.id;

  const firstCompany = await prisma.company.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { id: "asc" }
  });
  
  if (!firstCompany) throw new Error("No hay empresas activas en el sistema para asignar esta operación.");
  return firstCompany.id;
}

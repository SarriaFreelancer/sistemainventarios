"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function getApiKeys() {
  const session = await getAuthSession();
  if (!session?.user) return { isSuperAdmin: false, keys: [], hasActiveIntegrations: false };

  const isSuperAdmin = session.user.role === "SUPERADMIN";

  try {
    if (isSuperAdmin) {
      const keys = await prisma.apiKey.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          company: { select: { id: true, name: true } }
        }
      });
      return { isSuperAdmin: true, keys, hasActiveIntegrations: keys.some(k => k.active) };
    } else {
      // Para empresas normales (ADMIN / USER): Devolver llaves de su empresa
      const companyId = Number(session.user.companyId);
      if (!companyId) return { isSuperAdmin: false, keys: [], hasActiveIntegrations: false };

      const keys = await prisma.apiKey.findMany({
        where: { companyId },
        include: {
          company: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" }
      });
      return {
        isSuperAdmin: false,
        keys,
        hasActiveIntegrations: keys.some(k => k.active)
      };
    }
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return { isSuperAdmin: false, keys: [], hasActiveIntegrations: false };
  }
}

export async function createApiKey(data: { name: string; targetCompanyId?: number; permissions?: any }) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    return { success: false, error: "No tienes permisos para crear Llaves API." };
  }

  const isSuperAdmin = session.user.role === "SUPERADMIN";
  const targetCompanyId = isSuperAdmin ? Number(data.targetCompanyId) : Number(session.user.companyId);

  if (!data.name?.trim()) {
    return { success: false, error: "El nombre identificador de la llave es obligatorio" };
  }

  if (!targetCompanyId) {
    return { success: false, error: "Debes especificar la empresa a la que pertenecerá esta Llave API" };
  }

  try {
    const generatedKey = `gns_live_${crypto.randomBytes(24).toString("hex")}`;

    const defaultPerms = {
      products: { read: true, create: true, update: true, delete: false },
      suppliers: { read: true, create: true, update: true, delete: false },
      categories: { read: true, create: true, update: true, delete: false },
      groups: { read: true, create: true, update: true, delete: false },
      purchases: { read: true, create: true, update: false, delete: false },
      sales: { read: true, create: true, update: false, delete: false },
      expenses: { read: true, create: true, update: false, delete: false },
      users: { read: false, create: false, update: false, delete: false },
    };

    const newKey = await prisma.apiKey.create({
      data: {
        name: data.name.trim(),
        key: generatedKey,
        companyId: targetCompanyId,
        permissions: data.permissions || defaultPerms,
        active: true
      },
      include: {
        company: { select: { id: true, name: true } }
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true, apiKey: newKey };
  } catch (error: any) {
    console.error("Error creating API Key:", error);
    return { success: false, error: error.message || "Error al crear la API Key" };
  }
}

export async function toggleApiKeyStatus(id: string, active: boolean) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    return { success: false, error: "No tienes permisos para gestionar el estado de las llaves API." };
  }

  try {
    const isSuperAdmin = session.user.role === "SUPERADMIN";
    const whereClause: any = { id };
    if (!isSuperAdmin) {
      whereClause.companyId = Number(session.user.companyId);
    }

    const updated = await prisma.apiKey.updateMany({
      where: whereClause,
      data: { active }
    });

    if (updated.count === 0) {
      return { success: false, error: "Llave API no encontrada o no pertenece a tu empresa" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar la API Key" };
  }
}

export async function updateApiKeyPermissions(id: string, permissions: any) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el SUPERADMIN puede modificar la matriz de permisos globales de API." };
  }

  try {
    await prisma.apiKey.update({
      where: { id },
      data: { permissions }
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar permisos" };
  }
}

export async function deleteApiKey(id: string) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN")) {
    return { success: false, error: "No tienes permisos para revocar Llaves API." };
  }

  try {
    const isSuperAdmin = session.user.role === "SUPERADMIN";
    const whereClause: any = { id };
    if (!isSuperAdmin) {
      whereClause.companyId = Number(session.user.companyId);
    }

    const deleted = await prisma.apiKey.deleteMany({
      where: whereClause
    });

    if (deleted.count === 0) {
      return { success: false, error: "Llave API no encontrada o no pertenece a tu empresa" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar la API Key" };
  }
}

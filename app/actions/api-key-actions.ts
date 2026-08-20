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
      // Para empresas normales (ADMIN / USER): Solo verificar si la empresa tiene llaves activas e identificadores simples
      const keys = await prisma.apiKey.findMany({
        where: { companyId: Number(session.user.companyId) },
        select: {
          id: true,
          name: true,
          active: true,
          lastUsedAt: true,
          createdAt: true
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

export async function createApiKey(data: { name: string; targetCompanyId: number; permissions: any }) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el SUPERADMIN tiene permisos para crear e integrar Llaves API." };
  }

  if (!data.name?.trim()) {
    return { success: false, error: "El nombre identificador de la llave es obligatorio" };
  }

  if (!data.targetCompanyId) {
    return { success: false, error: "Debes seleccionar la empresa a la que pertenecerá esta Llave API" };
  }

  try {
    const generatedKey = `gns_live_${crypto.randomBytes(24).toString("hex")}`;

    const newKey = await prisma.apiKey.create({
      data: {
        name: data.name.trim(),
        key: generatedKey,
        companyId: Number(data.targetCompanyId),
        permissions: data.permissions || {
          products: { read: true, create: false, update: false, delete: false },
          suppliers: { read: true, create: false, update: false, delete: false },
          categories: { read: true, create: false, update: false, delete: false },
          groups: { read: true, create: false, update: false, delete: false },
          users: { read: false, create: false, update: false, delete: false },
        },
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
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el SUPERADMIN puede gestionar el estado de las llaves API." };
  }

  try {
    await prisma.apiKey.update({
      where: { id },
      data: { active }
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar la API Key" };
  }
}

export async function updateApiKeyPermissions(id: string, permissions: any) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el SUPERADMIN puede modificar permisos de API." };
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
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el SUPERADMIN puede revocar Llaves API." };
  }

  try {
    await prisma.apiKey.delete({
      where: { id }
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar la API Key" };
  }
}

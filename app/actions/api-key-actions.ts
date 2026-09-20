"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function getApiKeys() {
  const session = await getAuthSession();
  if (!session?.user) {
    return {
      isSuperAdmin: false,
      isAdmin: false,
      isTrialLocked: true,
      canRequest: false,
      requestStatus: null,
      rejectionReason: null,
      pendingRequests: [],
      keys: [],
      hasActiveIntegrations: false
    };
  }

  const role = session.user.role;
  const isSuperAdmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";

  // Al desbloquearse el modulo de APIS debe ser para el ADMIN y SUPERADMIN nada más
  if (!isSuperAdmin && !isAdmin) {
    return {
      isSuperAdmin: false,
      isAdmin: false,
      isTrialLocked: true,
      canRequest: false,
      requestStatus: null,
      rejectionReason: null,
      pendingRequests: [],
      keys: [],
      hasActiveIntegrations: false
    };
  }

  try {
    if (isSuperAdmin) {
      const [keys, pendingRequests] = await Promise.all([
        prisma.apiKey.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            company: { select: { id: true, name: true, isTrial: true, apiAccessApproved: true } }
          }
        }),
        prisma.apiIntegrationRequest.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            company: { select: { id: true, name: true, isTrial: true } },
            requestedBy: { select: { id: true, name: true, email: true } },
            reviewedBy: { select: { id: true, name: true } }
          }
        })
      ]);

      return {
        isSuperAdmin: true,
        isAdmin: true,
        isTrialLocked: false,
        canRequest: false,
        requestStatus: null,
        rejectionReason: null,
        pendingRequests,
        keys,
        hasActiveIntegrations: keys.some(k => k.active)
      };
    } else {
      const companyId = Number(session.user.companyId);
      if (!companyId) {
        return {
          isSuperAdmin: false,
          isAdmin: true,
          isTrialLocked: true,
          canRequest: false,
          requestStatus: null,
          rejectionReason: null,
          pendingRequests: [],
          keys: [],
          hasActiveIntegrations: false
        };
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, isTrial: true, apiAccessApproved: true, name: true }
      });

      // El módulo se bloquea si la empresa está en prueba gratuita y no ha sido aprobada
      const isTrial = Boolean(company?.isTrial);
      const isApproved = Boolean(company?.apiAccessApproved);
      const isTrialLocked = isTrial && !isApproved;

      // Obtener la solicitud más reciente de esta empresa
      const latestRequest = await prisma.apiIntegrationRequest.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" }
      });

      let keys: any[] = [];
      if (!isTrialLocked) {
        keys = await prisma.apiKey.findMany({
          where: { companyId },
          include: {
            company: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" }
        });
      }

      return {
        isSuperAdmin: false,
        isAdmin: true,
        isTrialLocked,
        canRequest: isTrialLocked && latestRequest?.status !== "PENDING",
        requestStatus: latestRequest?.status || null,
        rejectionReason: latestRequest?.rejectionReason || null,
        pendingRequests: [],
        keys,
        hasActiveIntegrations: keys.some(k => k.active)
      };
    }
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return {
      isSuperAdmin: false,
      isAdmin: false,
      isTrialLocked: true,
      canRequest: false,
      requestStatus: null,
      rejectionReason: null,
      pendingRequests: [],
      keys: [],
      hasActiveIntegrations: false
    };
  }
}

export async function requestApiAccess(justification: string) {
  const session = await getAuthSession();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return { success: false, error: "Solo el Administrador de la empresa puede solicitar acceso a las APIs REST." };
  }

  const companyId = Number(session.user.companyId);
  const userId = Number(session.user.id);

  if (!companyId || !userId) {
    return { success: false, error: "No tienes una empresa vinculada a tu sesión." };
  }

  const cleanJustification = justification?.trim();
  if (!cleanJustification || cleanJustification.length < 15) {
    return { success: false, error: "Debes ingresar una justificación detallada de al menos 15 caracteres explicando el uso de la API (ej. Integración con Shopify, WooCommerce, ERP externo, etc.)." };
  }

  if (cleanJustification.length > 1000) {
    return { success: false, error: "La justificación no puede exceder los 1000 caracteres." };
  }

  try {
    const existingPending = await prisma.apiIntegrationRequest.findFirst({
      where: { companyId, status: "PENDING" }
    });

    if (existingPending) {
      return { success: false, error: "Ya tienes una solicitud de activación en revisión por el Administrador Global." };
    }

    await prisma.apiIntegrationRequest.create({
      data: {
        companyId,
        requestedById: userId,
        justification: cleanJustification,
        status: "PENDING"
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error submitting API request:", error);
    return { success: false, error: error.message || "Error al enviar la solicitud." };
  }
}

export async function reviewApiRequest(requestId: number, action: "APPROVE" | "REJECT", rejectionReason?: string) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return { success: false, error: "Solo el SUPERADMIN puede aprobar o rechazar solicitudes de API." };
  }

  const reviewedById = Number(session.user.id);

  try {
    const req = await prisma.apiIntegrationRequest.findUnique({
      where: { id: requestId }
    });

    if (!req) {
      return { success: false, error: "Solicitud no encontrada." };
    }

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.apiIntegrationRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedById,
            reviewedAt: new Date(),
            rejectionReason: null
          }
        }),
        prisma.company.update({
          where: { id: req.companyId },
          data: { apiAccessApproved: true }
        })
      ]);
    } else {
      await prisma.apiIntegrationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedById,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason?.trim() || "No cumple con las políticas de seguridad requeridas."
        }
      });
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error reviewing API request:", error);
    return { success: false, error: error.message || "Error al procesar la revisión." };
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

  // Comprobar que si la empresa está en prueba gratuita, tenga la aprobación
  if (!isSuperAdmin) {
    const company = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { isTrial: true, apiAccessApproved: true }
    });
    if (company?.isTrial && !company.apiAccessApproved) {
      return { success: false, error: "Tu empresa está en período de prueba y requiere la aprobación previa del Administrador Global para generar Llaves API." };
    }
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

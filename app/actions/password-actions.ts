"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId, resolveActionUserId } from "@/lib/session";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * Consulta el estado de contraseña del usuario actual.
 * Detecta:
 * 1. Si es ADMIN de Google y aún no tiene contraseña de admin definida (needsInitialPassword: true).
 * 2. Si tiene una clave temporal generada por el SuperAdmin que debe cambiarse (mustChangePassword: true).
 * 3. Si su contraseña de Admin tiene más de 6 meses (isExpired: true).
 * Nota: El SUPERADMIN y los usuarios USER NO están sujetos a la expiración de 6 meses.
 */
export async function checkAdminPasswordStatus() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, authenticated: false };
    }

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, company: true }
    });

    if (!user) {
      return { success: false, authenticated: false };
    }

    const roleName = user.role?.name || "USER";
    const isAdmin = roleName === "ADMIN";
    const isSuperAdmin = roleName === "SUPERADMIN";

    // 1. Verificar si no tiene contraseña definida (usuario de Google)
    const hasNoPassword = !user.password || user.password.trim() === "";

    // 2. Verificar si debe cambiar contraseña obligatoriamente (clave temporal)
    const mustChange = Boolean(user.mustChangePassword || user.isTemporaryPassword);

    // 3. Verificar expiración de 6 meses (SOLO para ADMIN de empresa)
    let isExpired = false;
    if (isAdmin && !hasNoPassword && !isSuperAdmin) {
      const lastUpdate = user.passwordUpdatedAt ? new Date(user.passwordUpdatedAt).getTime() : new Date(user.createdAt).getTime();
      const expiresAt = user.passwordExpiresAt ? new Date(user.passwordExpiresAt).getTime() : lastUpdate + SIX_MONTHS_MS;
      if (Date.now() > expiresAt) {
        isExpired = true;
      }
    }

    return {
      success: true,
      authenticated: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: roleName,
      isAdmin,
      isSuperAdmin,
      needsInitialPassword: isAdmin && hasNoPassword,
      mustChangePassword: mustChange,
      isExpired,
      hasPassword: !hasNoPassword
    };
  } catch (error: any) {
    console.error("[CHECK_ADMIN_PASSWORD_STATUS_ERROR]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Permite a un Administrador que ingresó por Google definir su contraseña de Administrador inicial.
 * Esta contraseña se usa para autorizaciones/eliminaciones y permite ingreso tradicional alternativo.
 */
export async function setInitialAdminPassword(data: {
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) throw new Error("Usuario no encontrado");

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: "La confirmación de la contraseña no coincide." };
    }

    if (!data.newPassword || data.newPassword.length < 6) {
      return { success: false, error: "La contraseña debe contener al menos 6 caracteres." };
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SIX_MONTHS_MS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordUpdatedAt: now,
        passwordExpiresAt: user.role?.name === "SUPERADMIN" ? null : expiresAt,
        mustChangePassword: false,
        isTemporaryPassword: false
      }
    });

    await logActivity({
      userId,
      module: "SECURITY",
      action: "SET_INITIAL_PASSWORD",
      entity: "User",
      entityId: userId,
      description: `El Administrador ${user.email} definió su contraseña de seguridad inicial.`
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Contraseña de Administrador configurada exitosamente. Ya puedes utilizarla para permisos, eliminaciones e inicio de sesión."
    };
  } catch (error: any) {
    console.error("[SET_INITIAL_ADMIN_PASSWORD_ERROR]", error);
    return { success: false, error: error.message || "Error al definir contraseña" };
  }
}

/**
 * Permite a un Admin solicitar al SuperAdmin el restablecimiento de su contraseña.
 */
export async function requestPasswordResetBySuperAdmin(data: {
  email: string;
  notes?: string;
}) {
  try {
    const email = data.email?.toLowerCase().trim();
    if (!email) throw new Error("El correo electrónico es obligatorio");

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true, role: true }
    });

    if (!user) {
      // Por seguridad no revelamos existencia, pero retornamos mensaje genérico
      return {
        success: true,
        message: "Si el correo corresponde a un Administrador registrado, la solicitud fue enviada al SuperAdmin."
      };
    }

    // Verificar si ya existe una solicitud pendiente
    const existingRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return {
        success: true,
        message: "Ya tienes una solicitud de restablecimiento pendiente de aprobación por el SuperAdmin."
      };
    }

    await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        status: "PENDING",
        notes: data.notes || "Solicitud de restablecimiento de contraseña de Administrador",
        requestedAt: new Date()
      }
    });

    await logActivity({
      userId: user.id,
      module: "SECURITY",
      action: "PASSWORD_RESET_REQUESTED",
      entity: "PasswordResetRequest",
      description: `El Administrador ${user.email} (${user.company?.name || 'Sin empresa'}) solicitó restablecimiento de contraseña al SuperAdmin.`
    });

    return {
      success: true,
      message: "Tu solicitud ha sido enviada al SuperAdmin. Una vez aprobada, recibirás tu nueva clave temporal para ingresar."
    };
  } catch (error: any) {
    console.error("[REQUEST_PASSWORD_RESET_ERROR]", error);
    return { success: false, error: error.message || "Error al enviar la solicitud" };
  }
}

/**
 * Consulta todas las solicitudes de restablecimiento pendientes (Solo SuperAdmin).
 */
export async function getPendingPasswordResetRequests() {
  try {
    const session = await getAuthSession();
    if (session?.user?.role !== "SUPERADMIN") {
      return { success: false, error: "Acceso no autorizado", requests: [] };
    }

    const requests = await prisma.passwordResetRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
        company: { select: { id: true, name: true } }
      },
      orderBy: { requestedAt: "desc" }
    });

    return { success: true, requests };
  } catch (error: any) {
    console.error("[GET_PENDING_PASSWORD_RESET_REQUESTS_ERROR]", error);
    return { success: false, error: error.message, requests: [] };
  }
}

/**
 * SuperAdmin aprueba la solicitud con 1 solo clic:
 * 1. Genera una contraseña temporal aleatoria (ej. GNS-839201).
 * 2. Asigna la contraseña hasheada al usuario con flag mustChangePassword = true.
 * 3. Marca la solicitud como APPROVED y guarda la clave temporal para enviarla/mostrarla.
 */
export async function approvePasswordResetRequest(requestId: number) {
  try {
    const session = await getAuthSession();
    if (session?.user?.role !== "SUPERADMIN") {
      throw new Error("Solo el SuperAdmin puede aprobar solicitudes de contraseña.");
    }

    const superAdminId = Number(session.user.id);
    const resetReq = await prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
      include: { user: true, company: true }
    });

    if (!resetReq || resetReq.status !== "PENDING") {
      throw new Error("Solicitud no encontrada o ya procesada.");
    }

    // Generar contraseña temporal segura
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const plainTempPassword = `GNS-${randomSuffix}`;
    const hashedTempPassword = await bcrypt.hash(plainTempPassword, 10);

    // Actualizar usuario
    await prisma.user.update({
      where: { id: resetReq.userId },
      data: {
        password: hashedTempPassword,
        isTemporaryPassword: true,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        isLocked: false
      }
    });

    // Actualizar solicitud
    await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        tempPassword: hashedTempPassword,
        plainTempPassword: plainTempPassword,
        reviewedAt: new Date(),
        reviewedBy: superAdminId
      }
    });

    await logActivity({
      userId: superAdminId,
      module: "SECURITY",
      action: "PASSWORD_RESET_APPROVED",
      entity: "PasswordResetRequest",
      entityId: requestId,
      description: `El SuperAdmin aprobó el restablecimiento de contraseña para el Admin ${resetReq.user.email} de la empresa ${resetReq.company?.name || ''}. Clave temporal generada.`
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      message: `Solicitud aprobada con éxito.`,
      tempPassword: plainTempPassword,
      userEmail: resetReq.user.email,
      companyName: resetReq.company?.name
    };
  } catch (error: any) {
    console.error("[APPROVE_PASSWORD_RESET_ERROR]", error);
    return { success: false, error: error.message || "Error al aprobar la solicitud" };
  }
}

/**
 * SuperAdmin rechaza una solicitud de restablecimiento.
 */
export async function rejectPasswordResetRequest(requestId: number, reason?: string) {
  try {
    const session = await getAuthSession();
    if (session?.user?.role !== "SUPERADMIN") {
      throw new Error("Solo el SuperAdmin puede rechazar solicitudes.");
    }

    const superAdminId = Number(session.user.id);
    await prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        notes: reason || "Rechazada por el SuperAdmin",
        reviewedAt: new Date(),
        reviewedBy: superAdminId
      }
    });

    return { success: true, message: "Solicitud rechazada." };
  } catch (error: any) {
    console.error("[REJECT_PASSWORD_RESET_ERROR]", error);
    return { success: false, error: error.message || "Error al rechazar" };
  }
}

/**
 * Permite al Admin completar el cambio definitivo de su contraseña (tras ingresar con clave temporal o por expiración de 6 meses).
 * Requiere dos inputs: nueva contraseña y confirmación.
 */
export async function completePasswordReset(data: {
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");

    const userId = Number(session.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) throw new Error("Usuario no encontrado");

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, error: "Las contraseñas no coinciden." };
    }

    if (!data.newPassword || data.newPassword.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." };
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SIX_MONTHS_MS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordUpdatedAt: now,
        passwordExpiresAt: user.role?.name === "SUPERADMIN" ? null : expiresAt,
        mustChangePassword: false,
        isTemporaryPassword: false,
        failedLoginAttempts: 0,
        isLocked: false
      }
    });

    // Marcar cualquier solicitud pendiente/aprobada como COMPLETED
    await prisma.passwordResetRequest.updateMany({
      where: {
        userId,
        status: { in: ["PENDING", "APPROVED"] }
      },
      data: { status: "COMPLETED" }
    });

    await logActivity({
      userId,
      module: "SECURITY",
      action: "PASSWORD_CHANGED_DEFINITIVE",
      entity: "User",
      entityId: userId,
      description: `El usuario ${user.email} definió su nueva contraseña definitiva. Vigencia renovada por 6 meses.`
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Contraseña actualizada exitosamente. Tu acceso y permisos han sido renovados."
    };
  } catch (error: any) {
    console.error("[COMPLETE_PASSWORD_RESET_ERROR]", error);
    return { success: false, error: error.message || "Error al actualizar contraseña" };
  }
}

/**
 * Valida la contraseña de Administrador para autorizaciones y eliminaciones.
 * Funciona tanto para admins que ingresaron con Google (y ya definieron su clave de admin)
 * como para administradores con inicio de sesión tradicional.
 */
export async function verifyAdminActionPassword(password: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { success: false, error: "No autenticado" };

    const userId = Number(session.user.id);
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!currentUser) return { success: false, error: "Usuario no encontrado" };

    const isAdmin = currentUser.role?.name === "ADMIN" || currentUser.role?.name === "SUPERADMIN";
    if (!isAdmin) {
      return { success: false, error: "Solo un Administrador o SuperAdmin puede autorizar esta acción." };
    }

    if (!currentUser.password || currentUser.password.trim() === "") {
      return {
        success: false,
        needsSetup: true,
        error: "Aún no has definido tu contraseña de Administrador. Debes configurarla primero para autorizar eliminaciones."
      };
    }

    if (!password || password.trim() === "") {
      return { success: false, error: "Debes ingresar tu contraseña de Administrador." };
    }

    const isValid = await bcrypt.compare(password, currentUser.password);
    if (!isValid) {
      return { success: false, error: "Contraseña de Administrador incorrecta." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[VERIFY_ADMIN_ACTION_PASSWORD_ERROR]", error);
    return { success: false, error: error.message || "Error al verificar contraseña" };
  }
}

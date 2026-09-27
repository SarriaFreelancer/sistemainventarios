"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import fs from "fs";
import path from "path";
import { validatePassword } from "@/lib/password";

export async function updateProfile(data: {
  name: string;
  position?: string;
  image?: string | null;
  preferences?: { theme?: "light" | "dark"; language?: string };
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return { success: false, error: "No autenticado" };

    const userId = Number(session.user.id);

    const userBefore = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userBefore) return { success: false, error: "Usuario no encontrado" };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        position: data.position || null,
        image: data.image ?? userBefore.image,
        preferences: data.preferences ? JSON.parse(JSON.stringify(data.preferences)) : userBefore.preferences
      }
    });

    await logActivity({
      module: "USERS",
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      description: `Actualizó su perfil personal (Nombre: ${updated.name}, Cargo: ${updated.position || 'Ninguno'})`,
      oldValues: userBefore,
      newValues: updated
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_PROFILE]", error);
    return { success: false, error: error.message || "Error al actualizar el perfil" };
  }
}

export async function updatePassword(data: {
  currentPass: string;
  newPass: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) return { success: false, error: "No autenticado" };

    const userId = Number(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) return { success: false, error: "Usuario no encontrado" };

    // Si el usuario ya tenía contraseña previa, validarla
    const hadPassword = user.password && user.password.trim() !== "";
    if (hadPassword) {
      const valid = await bcrypt.compare(data.currentPass, user.password);
      if (!valid) {
        return { success: false, error: "La contraseña actual es incorrecta" };
      }
    }

    if (user.companyId) {
      const settings = await prisma.companySetting.findUnique({ where: { companyId: user.companyId } });
      if (settings) {
        const pwdErrors = validatePassword(data.newPass, settings);
        if (pwdErrors.length > 0) {
          return { success: false, error: pwdErrors.join(" ") };
        }
      }
    } else if (data.newPass.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" };
    }

    const passwordHash = await bcrypt.hash(data.newPass, 10);
    const now = new Date();
    const isSuperAdmin = user.role?.name === "SUPERADMIN";
    const expiresAt = isSuperAdmin ? null : new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordUpdatedAt: now,
        passwordExpiresAt: expiresAt,
        mustChangePassword: false,
        isTemporaryPassword: false,
        failedLoginAttempts: 0,
        isLocked: false
      }
    });

    await logActivity({
      userId,
      module: "USERS",
      action: "UPDATE",
      entity: "User",
      entityId: userId,
      description: "Actualizó su contraseña personal de acceso"
    });

    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_PASSWORD]", error);
    return { success: false, error: error.message || "Error al cambiar la contraseña" };
  }
}

import { optimizeImage, saveLocalImageBackup } from "@/lib/image-optimizer";

export async function uploadProfileImage(base64Data: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { success: false, error: "No autenticado" };

    if (!base64Data || typeof base64Data !== 'string') {
      return { success: false, error: "Archivo de imagen inválido o vacío" };
    }

    // Optimizar imagen de perfil a WebP liviano y cuadrado (máx 256x256 píxeles)
    const optimized = await optimizeImage(base64Data, {
      maxWidth: 256,
      maxHeight: 256,
      quality: 80,
      format: 'webp',
      fit: 'cover',
    });

    const permanentUrl = optimized.dataUri;

    // Respaldo secundario en disco
    await saveLocalImageBackup(optimized.buffer, 'users', `user-${session.user.id}`);

    return { success: true, url: permanentUrl };
  } catch (error: any) {
    console.error("[UPLOAD_PROFILE_IMAGE]", error);
    return { success: false, error: error.message || "No se pudo optimizar ni subir la foto de perfil" };
  }
}

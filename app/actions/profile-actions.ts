"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";

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
      where: { id: userId }
    });
    
    if (!user) return { success: false, error: "Usuario no encontrado" };
    
    const valid = await bcrypt.compare(data.currentPass, user.password);
    if (!valid) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }
    
    if (data.newPass.length < 6) {
      return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" };
    }
    
    const passwordHash = await bcrypt.hash(data.newPass, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash
      }
    });
    
    await logActivity({
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

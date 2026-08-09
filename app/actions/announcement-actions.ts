"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";

export async function createAnnouncement(data: {
  title: string;
  message: string;
  type: string;
  expiresInHours: number;
  sendToBell: boolean;
}) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado" };
  }

  const userId = Number(session.user.id);
  const expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);

  try {
    const announcement = await prisma.systemAnnouncement.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        expiresAt,
        createdById: userId,
      },
    });

    if (data.sendToBell) {
      // Find all active users with a company
      const allUsers = await prisma.user.findMany({
        select: { id: true, companyId: true },
        where: { companyId: { not: null } }
      });
      
      if (allUsers.length > 0) {
        await prisma.notification.createMany({
          data: allUsers.map((u) => ({
            userId: u.id,
            companyId: u.companyId!,
            title: `Anuncio: ${data.title}`,
            message: data.message,
            type: data.type === "URGENT" ? "WARNING" : "INFO"
          })),
          skipDuplicates: true
        });
      }
    }

    return { success: true, data: announcement };
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Error al crear el anuncio" };
  }
}

export async function getActiveAnnouncements() {
  try {
    const active = await prisma.systemAnnouncement.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: active };
  } catch (error) {
    return { success: false, error: "Error al obtener anuncios" };
  }
}

export async function getAllAnnouncements() {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado" };
  }

  try {
    const announcements = await prisma.systemAnnouncement.findMany({
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: announcements };
  } catch (error) {
    return { success: false, error: "Error al obtener anuncios" };
  }
}

export async function deactivateAnnouncement(id: number) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado" };
  }

  try {
    await prisma.systemAnnouncement.update({
      where: { id },
      data: { isActive: false }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al desactivar el anuncio" };
  }
}

export async function deleteAnnouncement(id: number) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado" };
  }

  try {
    await prisma.systemAnnouncement.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar el anuncio" };
  }
}

export async function activateAnnouncement(id: number) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado" };
  }

  try {
    const ann = await prisma.systemAnnouncement.findUnique({ where: { id } });
    if (!ann) return { success: false, error: "Anuncio no encontrado" };

    // Extend expiration by 24 hours if it has already expired when turning back on
    let expiresAt = ann.expiresAt;
    if (new Date(ann.expiresAt) <= new Date()) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await prisma.systemAnnouncement.update({
      where: { id },
      data: { isActive: true, expiresAt }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al encender el anuncio" };
  }
}

export async function updateAnnouncement(id: number, data: {
  title: string;
  message: string;
  type: string;
  expiresInHours: number;
}) {
  const session = await getAuthSession();
  if (session?.user?.role !== "SUPERADMIN") {
    return { success: false, error: "No autorizado" };
  }

  const expiresAt = new Date(Date.now() + data.expiresInHours * 60 * 60 * 1000);

  try {
    await prisma.systemAnnouncement.update({
      where: { id },
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        expiresAt,
        isActive: true // Make sure it becomes active when updated
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar el anuncio" };
  }
}

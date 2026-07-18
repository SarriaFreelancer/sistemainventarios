"use server";

import { platformDb, encryptPassword } from "@/lib/db-manager";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";

export async function getServers() {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    throw new Error('No autorizado');
  }

  try {
    const servers = await platformDb.server.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { companies: true }
        }
      }
    });
    return servers;
  } catch (error: any) {
    console.error('Error fetching servers:', error);
    return [];
  }
}

export async function createServer(data: any) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const encryptedPassword = encryptPassword(data.password);
    
    await platformDb.server.create({
      data: {
        name: data.name,
        engine: data.engine,
        host: data.host,
        port: Number(data.port),
        username: data.username,
        password: encryptedPassword,
        ssl: Boolean(data.ssl),
        active: Boolean(data.active),
      }
    });

    revalidatePath('/dashboard/settings/servers');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating server:', error);
    return { success: false, error: 'Error al registrar servidor' };
  }
}

export async function updateServer(id: string, data: any) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const updateData: any = {
      name: data.name,
      engine: data.engine,
      host: data.host,
      port: Number(data.port),
      username: data.username,
      ssl: Boolean(data.ssl),
      active: Boolean(data.active),
    };

    if (data.password) {
      updateData.password = encryptPassword(data.password);
    }

    await platformDb.server.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/dashboard/settings/servers');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating server:', error);
    return { success: false, error: 'Error al actualizar servidor' };
  }
}

export async function deleteServer(id: string) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Verificar si hay empresas asociadas
    const count = await platformDb.company.count({ where: { serverId: id } });
    if (count > 0) {
      return { success: false, error: 'No se puede eliminar porque tiene empresas asociadas' };
    }

    await platformDb.server.delete({
      where: { id }
    });

    revalidatePath('/dashboard/settings/servers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting server:', error);
    return { success: false, error: 'Error al eliminar servidor' };
  }
}

"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { getPlanLimits } from '@/lib/plans';
import { validatePassword } from '@/lib/password';

const userCreateSchema = z.object({
  name: z.string().min(2, 'El nombre completo es obligatorio'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
  roleId: z.coerce.number().min(1, 'Selecciona un rol'),
  companyId: z.coerce.number().optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(2, 'El nombre completo es obligatorio'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().optional(),
  roleId: z.coerce.number().min(1, 'Selecciona un rol'),
  companyId: z.coerce.number().optional(),
});

export async function createUser(formData: FormData) {
  const parsed = userCreateSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    roleId: formData.get('roleId'),
    companyId: formData.get('companyId') || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, error: 'Ya existe un usuario con ese correo' };
  }

  // Verificar límite de usuarios del plan
  if (parsed.data.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: parsed.data.companyId },
      select: { planId: true, maxUsers: true, maxProducts: true, _count: { select: { users: true } } }
    });

    if (company) {
      const limits = getPlanLimits(company.planId, { maxUsers: company.maxUsers, maxProducts: company.maxProducts });
      if (company._count.users >= limits.maxUsers) {
        return {
          success: false,
          error: `Has alcanzado el límite de usuarios de tu plan (${limits.maxUsers}). Para crear más usuarios, actualiza tu plan.`
        };
      }
    }
  }

  if (parsed.data.companyId) {
    const settings = await prisma.companySetting.findUnique({ where: { companyId: parsed.data.companyId } });
    if (settings) {
      const pwdErrors = validatePassword(parsed.data.password, settings);
      if (pwdErrors.length > 0) {
        return { success: false, error: pwdErrors.join(" ") };
      }
    }
  }

  const allowedModuleIdsRaw = formData.get('allowedModuleIds');
  let allowedModuleIds: number[] | undefined = undefined;
  if (allowedModuleIdsRaw) {
    try {
      const parsedIds = JSON.parse(String(allowedModuleIdsRaw));
      if (Array.isArray(parsedIds)) {
        allowedModuleIds = parsedIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
      }
    } catch {
      // Fallback si no es JSON válido
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      roleId: parsed.data.roleId,
      companyId: parsed.data.companyId || undefined,
      preferences: {
        plainPassword: parsed.data.password,
        ...(allowedModuleIds !== undefined ? { allowedModuleIds } : {})
      },
    },
  });

  await logActivity({
    module: 'USERS',
    action: 'CREATE',
    entity: 'User',
    entityId: newUser.id,
    description: `Creó al usuario "${newUser.name}" (Email: ${newUser.email})`,
    newValues: newUser
  });

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function updateUser(formData: FormData) {
  const id = Number(formData.get('id'));
  const password = String(formData.get('password') ?? '');
  const parsed = userUpdateSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: password || undefined,
    roleId: formData.get('roleId'),
    companyId: formData.get('companyId') || undefined,
  });

  if (!parsed.success || !id || isNaN(id)) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  const currentPrefs = (existingUser?.preferences as any) || {};

  const allowedModuleIdsRaw = formData.get('allowedModuleIds');
  let newPreferences = { ...currentPrefs };
  if (allowedModuleIdsRaw !== null && allowedModuleIdsRaw !== undefined) {
    try {
      const parsedIds = JSON.parse(String(allowedModuleIdsRaw));
      if (Array.isArray(parsedIds)) {
        newPreferences.allowedModuleIds = parsedIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
      }
    } catch {
      // Fallback
    }
  }

  const data: any = {
    name: parsed.data.name,
    email: parsed.data.email,
    roleId: parsed.data.roleId,
    companyId: parsed.data.companyId || undefined,
    preferences: newPreferences,
  };

  if (password) {
    if (parsed.data.companyId) {
      const settings = await prisma.companySetting.findUnique({ where: { companyId: parsed.data.companyId } });
      if (settings) {
        const pwdErrors = validatePassword(password, settings);
        if (pwdErrors.length > 0) {
          return { success: false, error: pwdErrors.join(" ") };
        }
      }
    }
    data.password = await bcrypt.hash(password, 10);
    newPreferences.plainPassword = password;
    data.preferences = newPreferences;
  }

  try {
    const userBefore = await prisma.user.findUnique({ where: { id } });

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    await logActivity({
      module: 'USERS',
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      description: `Actualizó los datos del usuario "${updated.name}" (Email: ${updated.email})`,
      oldValues: userBefore,
      newValues: updated
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un usuario con ese correo' };
    }
    return { success: false, error: 'Error al actualizar el usuario' };
  }
}

export async function deleteUser(formData: FormData) {
  const id = Number(formData.get('id'));
  if (!id || isNaN(id)) return { success: false, error: 'ID inválida' };

  try {
    const userBefore = await prisma.user.findUnique({
      where: { id },
      include: { role: true }
    });
    if (!userBefore) return { success: false, error: 'Usuario no encontrado' };

    // Verificar si el usuario cuenta con transacciones u operaciones vinculadas en el sistema
    const [
      salesCount,
      purchaseRequestsCount,
      requisitionsCount,
      warehouseMovementsCount,
      warehouseTransfersCount
    ] = await Promise.all([
      prisma.sale.count({ where: { userId: id } }),
      prisma.purchaseRequest.count({ where: { userId: id } }),
      prisma.internalRequisition.count({ where: { userId: id } }),
      prisma.warehouseMovement.count({ where: { assignedUserId: id } }),
      prisma.warehouseTransfer.count({ where: { createdById: id } }),
    ]);

    const totalTransactions = salesCount + purchaseRequestsCount + requisitionsCount + warehouseMovementsCount + warehouseTransfersCount;

    if (totalTransactions > 0) {
      return {
        success: false,
        error: 'Este usuario no se puede eliminar porque cuenta con transacciones asociadas en el sistema. Puedes inhabilitarlo para restringir su acceso, o eliminar sus transacciones previamente.'
      };
    }

    // Si no tiene transacciones activas, procedemos a limpiar referencias no transaccionales y eliminarlo
    await prisma.$transaction(async (tx) => {
      // 1. Desvincular ficha de empleado
      await tx.employee.updateMany({
        where: { userId: id },
        data: { userId: null }
      });

      // 2. Desvincular ventas anuladas y líneas de tiempo
      await tx.sale.updateMany({
        where: { voidedByUserId: id },
        data: { voidedByUserId: null }
      });
      await tx.warehouseTimeline.updateMany({
        where: { userId: id },
        data: { userId: null }
      });

      // 3. Limpiar autorizaciones de compra, solicitudes de api, anuncios, actividades, chats, notificaciones y sesiones
      await tx.purchaseApproval.deleteMany({ where: { userId: id } });
      await tx.apiIntegrationRequest.deleteMany({ where: { requestedById: id } });
      await tx.apiIntegrationRequest.updateMany({
        where: { reviewedById: id },
        data: { reviewedById: null }
      });
      await tx.systemAnnouncement.deleteMany({ where: { createdById: id } });
      await tx.activity.deleteMany({ where: { userId: id } });
      await tx.reportPreset.deleteMany({ where: { userId: id } });
      await tx.chatMessage.deleteMany({ where: { senderId: id } });
      await tx.chatParticipant.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.userSession.deleteMany({ where: { userId: id } });
      await tx.auditLog.updateMany({
        where: { userId: id },
        data: { userId: null }
      });
      await tx.loginHistory.updateMany({
        where: { userId: id },
        data: { userId: null }
      });

      // 4. Finalmente eliminar el usuario
      await tx.user.delete({ where: { id } });
    });

    await logActivity({
      module: 'USERS',
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      description: `Eliminó al usuario "${userBefore.name}" (Email: ${userBefore.email})`,
      oldValues: userBefore
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'No fue posible eliminar el usuario: ' + (error.message || 'Error desconocido') };
  }
}

export async function unlockUser(id: number) {
  if (!id || isNaN(id)) return { success: false, error: 'ID inválida' };

  try {
    const userBefore = await prisma.user.findUnique({ where: { id } });
    if (!userBefore) return { success: false, error: 'Usuario no encontrado' };

    await prisma.user.update({
      where: { id },
      data: { isLocked: false, failedLoginAttempts: 0 }
    });

    await logActivity({
      module: 'USERS',
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      description: `Desbloqueó al usuario "${userBefore.name}" (Email: ${userBefore.email}) tras múltiples intentos fallidos`,
      oldValues: userBefore
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error unlocking user:', error);
    return { success: false, error: 'Ocurrió un error al desbloquear el usuario' };
  }
}

export async function markTourAsCompleted(userId: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const currentPreferences = user.preferences ? (user.preferences as any) : {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPreferences,
          tourCompleted: true
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking tour as completed:', error);
    return { success: false, error: 'Ocurrió un error al actualizar preferencias' };
  }
}

export async function markCookiesAsAccepted(userId: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const currentPreferences = user.preferences ? (user.preferences as any) : {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPreferences,
          cookieConsent: true
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking cookies as accepted:', error);
    return { success: false, error: 'Ocurrió un error al actualizar preferencias' };
  }
}

export async function resetTourCompleted(userId: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: 'Usuario no encontrado' };

    const currentPreferences = user.preferences ? (user.preferences as any) : {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPreferences,
          tourCompleted: false
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error resetting tour:', error);
    return { success: false, error: 'Ocurrió un error' };
  }
}

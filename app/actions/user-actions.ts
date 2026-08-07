"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { getPlanLimits } from '@/lib/plans';

const userCreateSchema = z.object({
  name: z.string().min(2, 'El nombre completo es obligatorio'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
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

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      roleId: parsed.data.roleId,
      companyId: parsed.data.companyId || undefined,
      preferences: { plainPassword: parsed.data.password },
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

  const data: any = {
    name: parsed.data.name,
    email: parsed.data.email,
    roleId: parsed.data.roleId,
    companyId: parsed.data.companyId || undefined,
  };

  if (password) {
    data.password = await bcrypt.hash(password, 10);
    const existingUser = await prisma.user.findUnique({ where: { id } });
    const currentPrefs = (existingUser?.preferences as any) || {};
    data.preferences = { ...currentPrefs, plainPassword: password };
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

  const userBefore = await prisma.user.findUnique({ where: { id } });
  if (!userBefore) return { success: false, error: 'Usuario no encontrado' };

  await prisma.user.delete({ where: { id } });

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

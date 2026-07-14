"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

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

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      roleId: parsed.data.roleId,
      companyId: parsed.data.companyId || undefined,
    },
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
  }

  try {
    await prisma.user.update({
      where: { id },
      data,
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

  await prisma.user.delete({ where: { id } });
  revalidatePath('/dashboard/users');
  return { success: true };
}

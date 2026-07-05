"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export async function createCategory(formData: FormData) {
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    status: formData.get('status') ?? 'ACTIVE',
  });

  if (!parsed.success) {
    return;
  }

  const existing = await prisma.category.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return;
  }

  await prisma.category.create({ data: { name: parsed.data.name, description: parsed.data.description ?? '', status: parsed.data.status } });
  revalidatePath('/dashboard/categories');
}

export async function updateCategory(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    status: formData.get('status') ?? 'ACTIVE',
  });

  if (!parsed.success || !id) {
    return;
  }

  await prisma.category.update({ where: { id }, data: { name: parsed.data.name, description: parsed.data.description ?? '', status: parsed.data.status } });
  revalidatePath('/dashboard/categories');
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await prisma.category.delete({ where: { id } });
  revalidatePath('/dashboard/categories');
}

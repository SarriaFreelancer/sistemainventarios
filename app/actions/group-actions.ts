"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const groupSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  status: z.string().default('ACTIVE'),
});

export async function createGroup(formData: FormData) {
  const parsed = groupSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status') || 'ACTIVE',
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await prisma.productGroup.create({
      data: {
        name: parsed.data.name,
        status: parsed.data.status,
      },
    });
    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un grupo con ese nombre' };
    }
    return { success: false, error: 'Error al crear el grupo' };
  }
}

export async function updateGroup(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const parsed = groupSchema.safeParse({
    name: formData.get('name'),
    status: formData.get('status'),
  });

  if (!parsed.success || !id) {
    return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await prisma.productGroup.update({
      where: { id },
      data: {
        name: parsed.data.name,
        status: parsed.data.status,
      },
    });
    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe un grupo con ese nombre' };
    }
    return { success: false, error: 'Error al actualizar el grupo' };
  }
}

export async function deleteGroup(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return { success: false, error: 'ID inválido' };

  try {
    // Check if any product is using this group
    const productsUsing = await prisma.product.count({
      where: { productGroupId: id }
    });

    if (productsUsing > 0) {
      return { success: false, error: 'No se puede eliminar el grupo porque tiene productos asignados' };
    }

    await prisma.productGroup.delete({ where: { id } });
    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar el grupo' };
  }
}

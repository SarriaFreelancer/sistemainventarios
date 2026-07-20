"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withTenantWhere, withTenantData } from '@/lib/tenant-db';
import { logActivity } from '@/lib/audit';

const groupSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  status: z.string().default('ACTIVE'),
  code: z.string().optional().nullable(),
});

export async function createGroup(formData: FormData) {
  try {
    const parsed = groupSchema.safeParse({
      name: formData.get('name'),
      status: formData.get('status') || 'ACTIVE',
      code: formData.get('code') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const whereName = await withTenantWhere({ name: parsed.data.name });
    const existingName = await prisma.productGroup.findFirst({ where: whereName });
    if (existingName) {
      return { success: false, error: 'Ya existe un grupo con ese nombre' };
    }

    if (parsed.data.code) {
      const whereCode = await withTenantWhere({ code: parsed.data.code });
      const existingCode = await prisma.productGroup.findFirst({ where: whereCode });
      if (existingCode) {
        return { success: false, error: 'Ya existe un grupo con ese código' };
      }
    }

    const data = await withTenantData({
      name: parsed.data.name,
      status: parsed.data.status,
      code: parsed.data.code,
    });

    const newGroup = await prisma.productGroup.create({ data });

    await logActivity({
      module: 'GROUPS',
      action: 'CREATE',
      entity: 'ProductGroup',
      entityId: newGroup.id,
      description: `Creó el grupo de productos "${newGroup.name}" (Código: ${newGroup.code})`,
      newValues: newGroup
    });

    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    console.error('[CREATE_GROUP]', error);
    return { success: false, error: error.message ?? 'Error al crear el grupo' };
  }
}

export async function updateGroup(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) {
      return { success: false, error: 'ID inválido' };
    }

    const parsed = groupSchema.safeParse({
      name: formData.get('name'),
      status: formData.get('status'),
      code: formData.get('code') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Aislamiento Tenant: Verificar que pertenezca a la empresa
    const whereCheck = await withTenantWhere({ id });
    const group = await prisma.productGroup.findFirst({ where: whereCheck });
    if (!group) {
      return { success: false, error: 'Grupo no encontrado o no autorizado' };
    }

    // Verificar duplicado en la misma empresa
    const whereExistingName = await withTenantWhere({
      name: parsed.data.name,
      id: { not: id }
    });
    const existingName = await prisma.productGroup.findFirst({ where: whereExistingName });
    if (existingName) {
      return { success: false, error: 'Ya existe otro grupo con ese nombre' };
    }

    // Verificar código duplicado
    if (parsed.data.code) {
      const whereExistingCode = await withTenantWhere({
        code: parsed.data.code,
        id: { not: id }
      });
      const existingCode = await prisma.productGroup.findFirst({ where: whereExistingCode });
      if (existingCode) {
        return { success: false, error: 'Ya existe otro grupo con ese código' };
      }
    }

    const updated = await prisma.productGroup.update({
      where: { id },
      data: {
        name: parsed.data.name,
        status: parsed.data.status,
        code: parsed.data.code,
      },
    });

    await logActivity({
      module: 'GROUPS',
      action: 'UPDATE',
      entity: 'ProductGroup',
      entityId: id,
      description: `Actualizó el grupo de productos "${updated.name}" (Código: ${updated.code})`,
      oldValues: group, // Obtenido en la línea 67
      newValues: updated
    });

    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    console.error('[UPDATE_GROUP]', error);
    return { success: false, error: error.message ?? 'Error al actualizar el grupo' };
  }
}

export async function deleteGroup(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) return { success: false, error: 'ID inválido' };

    // Aislamiento Tenant: Verificar que pertenezca a la empresa
    const whereCheck = await withTenantWhere({ id });
    const group = await prisma.productGroup.findFirst({ where: whereCheck });
    if (!group) {
      return { success: false, error: 'Grupo no encontrado o no autorizado' };
    }

    // Check if any category is using this group
    const categoriesUsing = await prisma.category.count({
      where: { productGroupId: id }
    });

    if (categoriesUsing > 0) {
      return { success: false, error: 'No se puede eliminar el grupo porque tiene categorías asignadas' };
    }

    // Check if any product is using this group
    const productsUsing = await prisma.product.count({
      where: { productGroupId: id }
    });

    if (productsUsing > 0) {
      return { success: false, error: 'No se puede eliminar el grupo porque tiene productos asignados' };
    }

    await prisma.productGroup.delete({ where: { id } });

    await logActivity({
      module: 'GROUPS',
      action: 'DELETE',
      entity: 'ProductGroup',
      entityId: id,
      description: `Eliminó el grupo de productos "${group.name}" (Código: ${group.code})`,
      oldValues: group
    });

    revalidatePath('/dashboard/groups');
    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE_GROUP]', error);
    return { success: false, error: 'Error al eliminar el grupo' };
  }
}

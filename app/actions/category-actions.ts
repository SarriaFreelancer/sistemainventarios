"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withTenantWhere, withTenantData } from '@/lib/tenant-db';
import { logActivity } from '@/lib/audit';

const categorySchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  isPerishable: z.boolean().default(false),
  productGroupId: z.coerce.number().min(1, 'El grupo es obligatorio'),
  code: z.string().optional().nullable(),
});

export async function createCategory(formData: FormData) {
  try {
    const parsed = categorySchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description') || '',
      status: formData.get('status') ?? 'ACTIVE',
      isPerishable: formData.get('isPerishable') === 'on' || formData.get('isPerishable') === 'true',
      productGroupId: formData.get('productGroupId'),
      code: formData.get('code') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const whereName = await withTenantWhere({ name: parsed.data.name });
    const existingName = await prisma.category.findFirst({ where: whereName });
    if (existingName) {
      return { success: false, error: 'Ya existe una categoría con ese nombre' };
    }

    if (parsed.data.code) {
      const whereCode = await withTenantWhere({ code: parsed.data.code });
      const existingCode = await prisma.category.findFirst({ where: whereCode });
      if (existingCode) {
        return { success: false, error: 'Ya existe una categoría con ese código' };
      }
    }

    const data = await withTenantData({
      name: parsed.data.name,
      description: parsed.data.description ?? '',
      status: parsed.data.status,
      isPerishable: parsed.data.isPerishable,
      productGroupId: parsed.data.productGroupId,
      code: parsed.data.code,
    });

    const newCategory = await prisma.category.create({ data });

    await logActivity({
      module: 'CATEGORIES',
      action: 'CREATE',
      entity: 'Category',
      entityId: newCategory.id,
      description: `Creó la categoría "${newCategory.name}" (Código: ${newCategory.code})`,
      newValues: newCategory
    });

    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: any) {
    console.error('[CREATE_CATEGORY]', error);
    return { success: false, error: error.message ?? 'Error al crear la categoría' };
  }
}

export async function updateCategory(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) {
      return { success: false, error: 'ID inválido' };
    }

    const parsed = categorySchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description') || '',
      status: formData.get('status') ?? 'ACTIVE',
      isPerishable: formData.get('isPerishable') === 'on' || formData.get('isPerishable') === 'true',
      productGroupId: formData.get('productGroupId'),
      code: formData.get('code') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Aislamiento Tenant: Verificar que pertenezca a la empresa
    const whereCheck = await withTenantWhere({ id });
    const cat = await prisma.category.findFirst({ where: whereCheck });
    if (!cat) {
      return { success: false, error: 'Categoría no encontrada o no autorizada' };
    }

    // Verificar nombre duplicado en la misma empresa
    const whereExistingName = await withTenantWhere({
      name: parsed.data.name,
      id: { not: id }
    });
    const existingName = await prisma.category.findFirst({ where: whereExistingName });
    if (existingName) {
      return { success: false, error: 'Ya existe otra categoría con ese nombre' };
    }

    // Verificar código duplicado
    if (parsed.data.code) {
      const whereExistingCode = await withTenantWhere({
        code: parsed.data.code,
        id: { not: id }
      });
      const existingCode = await prisma.category.findFirst({ where: whereExistingCode });
      if (existingCode) {
        return { success: false, error: 'Ya existe otra categoría con ese código' };
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? '',
        status: parsed.data.status,
        isPerishable: parsed.data.isPerishable,
        productGroupId: parsed.data.productGroupId,
        code: parsed.data.code,
      },
    });

    await logActivity({
      module: 'CATEGORIES',
      action: 'UPDATE',
      entity: 'Category',
      entityId: id,
      description: `Actualizó la categoría "${updated.name}" (Código: ${updated.code})`,
      oldValues: cat, // Obtenido en la línea 74
      newValues: updated
    });

    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: any) {
    console.error('[UPDATE_CATEGORY]', error);
    return { success: false, error: error.message ?? 'Error al actualizar la categoría' };
  }
}

export async function deleteCategory(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) return { success: false, error: 'ID inválido' };

    // Aislamiento Tenant: Verificar que pertenezca a la empresa
    const whereCheck = await withTenantWhere({ id });
    const cat = await prisma.category.findFirst({ where: whereCheck });
    if (!cat) {
      return { success: false, error: 'Categoría no encontrada o no autorizada' };
    }

    // Verificar si hay productos asignados
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productsCount > 0) {
      return { success: false, error: 'No se puede eliminar la categoría porque tiene productos asignados' };
    }

    await prisma.category.delete({ where: { id } });

    await logActivity({
      module: 'CATEGORIES',
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
      description: `Eliminó la categoría "${cat.name}" (Código: ${cat.code})`,
      oldValues: cat
    });

    revalidatePath('/dashboard/categories');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE_CATEGORY]', error);
    return { success: false, error: error.message ?? 'Error al eliminar la categoría' };
  }
}

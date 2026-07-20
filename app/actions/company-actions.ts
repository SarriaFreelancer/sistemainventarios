"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';

const companySchema = z.object({
  name: z.string().min(2, 'El nombre de la empresa es obligatorio'),
  address: z.string().min(3, 'La dirección es obligatoria').optional(),
  city: z.string().min(2, 'La ciudad es obligatoria').optional(),
  country: z.string().min(2, 'El país es obligatorio').default('Colombia'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  themeColor: z.string().optional(),
  themeMode: z.string().optional(),
  modules: z.array(z.number()).optional(),
  nit: z.string().optional(),
  planId: z.string().optional(),
});

export async function createCompany(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: "Solo el superadmin puede crear empresas directamente" };
  }

  const modulesIds = formData.getAll('modules').map(id => Number(id)).filter(id => !isNaN(id));
  const parsed = companySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    city: formData.get('city'),
    country: formData.get('country') ?? 'Colombia',
    status: formData.get('status') ?? 'ACTIVE',
    themeColor: formData.get('themeColor') || undefined,
    themeMode: formData.get('themeMode') || undefined,
    modules: modulesIds.length > 0 ? modulesIds : undefined,
    nit: formData.get('nit') || undefined,
    planId: formData.get('planId') || undefined,
  });

  if (!parsed.success) return { success: false, error: 'Datos inválidos' };

  if (parsed.data.nit) {
    const existingNit = await prisma.companySetting.findFirst({ where: { nit: parsed.data.nit } });
    if (existingNit) return { success: false, error: 'Ya existe una empresa con ese NIT/Código' };
  }

  try {
    await prisma.company.create({
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        status: parsed.data.status,
        themeConfig: (parsed.data.themeColor || parsed.data.themeMode) ? {
          primaryColor: parsed.data.themeColor,
          mode: parsed.data.themeMode
        } : undefined,
        modules: parsed.data.modules ? {
          create: parsed.data.modules.map(moduleId => ({
            module: { connect: { id: moduleId } }
          }))
        } : undefined,
        planId: parsed.data.planId,
        setting: {
          create: {
            nit: parsed.data.nit
          }
        }
      },
    });
    revalidatePath('/dashboard/companies');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe una empresa con ese nombre' };
    }
    return { success: false, error: 'Error al crear la empresa' };
  }
}

export async function updateCompany(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user) {
    return { success: false, error: "No autorizado" };
  }
  
  const id = Number(formData.get('id'));

  if (session.user.role === 'ADMIN') {
    // Si es ADMIN, solo puede actualizar SU propia empresa
    if (Number(session.user.companyId) !== id) {
      return { success: false, error: "No tienes permiso para actualizar esta empresa" };
    }
  } else if (session.user.role !== 'SUPERADMIN') {
    // Si no es ADMIN ni SUPERADMIN (ej. USER), no puede actualizar
    return { success: false, error: "Solo el administrador o superadmin pueden cambiar los datos de la empresa" };
  }

  const modulesIds = formData.getAll('modules').map(mid => Number(mid)).filter(mid => !isNaN(mid));
  const parsed = companySchema.safeParse({
    name: formData.get('name'),
    address: formData.get('address'),
    city: formData.get('city'),
    country: formData.get('country') ?? 'Colombia',
    status: formData.get('status') ?? 'ACTIVE',
    themeColor: formData.get('themeColor') || undefined,
    themeMode: formData.get('themeMode') || undefined,
    modules: modulesIds,
    nit: formData.get('nit') || undefined,
    planId: formData.get('planId') || undefined,
  });

  if (!parsed.success || !id || isNaN(id)) return { success: false, error: 'Datos inválidos' };

  if (parsed.data.nit) {
    const existingNit = await prisma.companySetting.findFirst({
      where: {
        nit: parsed.data.nit,
        companyId: { not: id }
      }
    });
    if (existingNit) return { success: false, error: 'Ya existe otra empresa con ese NIT/Código' };
  }

  try {
    await prisma.company.update({
      where: { id },
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        status: parsed.data.status,
        themeConfig: (parsed.data.themeColor || parsed.data.themeMode) ? {
          primaryColor: parsed.data.themeColor,
          mode: parsed.data.themeMode
        } : undefined,
        modules: {
          deleteMany: {},
          create: parsed.data.modules?.map((moduleId: number) => ({
             moduleId: moduleId 
          })) || []
        },
        planId: parsed.data.planId,
        setting: {
          upsert: {
            create: { nit: parsed.data.nit },
            update: { nit: parsed.data.nit }
          }
        }
      },
    });
    revalidatePath('/dashboard/companies');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'Ya existe una empresa con ese nombre' };
    }
    return { success: false, error: 'Error al actualizar la empresa' };
  }
}

export async function deleteCompany(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: "Solo el superadmin puede eliminar empresas" };
  }

  const id = Number(formData.get('id'));
  if (!id || isNaN(id)) return { success: false, error: 'ID inválida' };

  const usersCount = await prisma.user.count({ where: { companyId: id } });
  if (usersCount > 0) {
    return { success: false, error: 'No se puede eliminar la empresa porque tiene usuarios asignados' };
  }

  await prisma.company.delete({ where: { id } });
  revalidatePath('/dashboard/companies');
  return { success: true };
}

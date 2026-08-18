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
  darkBgColor: z.string().optional(),
  darkCardBg: z.string().optional(),
  darkSidebarBg: z.string().optional(),
  darkTextColor: z.string().optional(),
  modules: z.array(z.number()).optional(),
  nit: z.string().optional(),
  planId: z.string().optional(),
  maxUsers: z.coerce.number().optional().nullable(),
  maxProducts: z.coerce.number().optional().nullable(),
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
    darkBgColor: formData.get('darkBgColor') || undefined,
    darkCardBg: formData.get('darkCardBg') || undefined,
    darkSidebarBg: formData.get('darkSidebarBg') || undefined,
    darkTextColor: formData.get('darkTextColor') || undefined,
    modules: modulesIds.length > 0 ? modulesIds : undefined,
    nit: formData.get('nit') || undefined,
    planId: formData.get('planId') || undefined,
    maxUsers: formData.get('maxUsers') ? Number(formData.get('maxUsers')) : null,
    maxProducts: formData.get('maxProducts') ? Number(formData.get('maxProducts')) : null,
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
        planId: parsed.data.planId,
        maxUsers: parsed.data.maxUsers,
        maxProducts: parsed.data.maxProducts,
        themeConfig: {
          primaryColor: parsed.data.themeColor,
          mode: parsed.data.themeMode,
          darkBgColor: parsed.data.darkBgColor,
          darkCardBg: parsed.data.darkCardBg,
          darkSidebarBg: parsed.data.darkSidebarBg,
          darkTextColor: parsed.data.darkTextColor,
        },
        modules: parsed.data.modules ? {
          create: parsed.data.modules.map(moduleId => ({
            module: { connect: { id: moduleId } }
          }))
        } : undefined,
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
    darkBgColor: formData.get('darkBgColor') || undefined,
    darkCardBg: formData.get('darkCardBg') || undefined,
    darkSidebarBg: formData.get('darkSidebarBg') || undefined,
    darkTextColor: formData.get('darkTextColor') || undefined,
    modules: modulesIds.length > 0 ? modulesIds : undefined,
    nit: formData.get('nit') || undefined,
    planId: formData.get('planId') || undefined,
    maxUsers: formData.get('maxUsers') ? Number(formData.get('maxUsers')) : null,
    maxProducts: formData.get('maxProducts') ? Number(formData.get('maxProducts')) : null,
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
    // Leer el themeConfig actual para preservar bgImage y otros campos que no toca este formulario
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      select: { themeConfig: true }
    });
    const currentTheme = (existingCompany?.themeConfig as any) || {};

    await prisma.company.update({
      where: { id },
      data: {
        name: parsed.data.name,
        address: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        status: parsed.data.status,
        planId: parsed.data.planId,
        maxUsers: session.user.role === 'SUPERADMIN' ? parsed.data.maxUsers : undefined,
        maxProducts: session.user.role === 'SUPERADMIN' ? parsed.data.maxProducts : undefined,
        themeConfig: {
          ...currentTheme,
          ...(parsed.data.themeColor !== undefined ? { primaryColor: parsed.data.themeColor } : {}),
          ...(parsed.data.themeMode !== undefined ? { mode: parsed.data.themeMode } : {}),
          darkBgColor: parsed.data.darkBgColor || undefined,
          darkCardBg: parsed.data.darkCardBg || undefined,
          darkSidebarBg: parsed.data.darkSidebarBg || undefined,
          darkTextColor: parsed.data.darkTextColor || undefined,
        },
        modules: {
          deleteMany: {},
          create: parsed.data.modules?.map((moduleId: number) => ({
             moduleId: moduleId 
          })) || []
        },
        setting: {
          upsert: {
            create: { nit: parsed.data.nit },
            update: { nit: parsed.data.nit }
          }
        }
      },
    });
    revalidatePath('/dashboard/companies');
    revalidatePath('/', 'layout');
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

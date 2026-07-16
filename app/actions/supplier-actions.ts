"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withTenantWhere, withTenantData } from '@/lib/tenant-db';
import { logActivity } from '@/lib/audit';

const supplierSchema = z.object({
  companyName: z.string().min(2, 'El nombre es obligatorio'),
  contactName: z.string().min(2, 'El contacto es obligatorio'),
  phone: z.string().min(5, 'El teléfono es obligatorio'),
  email: z.string().email('Correo inválido'),
  address: z.string().min(3, 'La dirección es obligatoria'),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  country: z.string().min(2, 'El país es obligatorio').default('Colombia'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  code: z.string().optional().nullable(),
});

export async function createSupplier(formData: FormData) {
  try {
    const parsed = supplierSchema.safeParse({
      companyName: formData.get('companyName'),
      contactName: formData.get('contactName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      city: formData.get('city'),
      country: formData.get('country') || 'Colombia',
      status: formData.get('status') ?? 'ACTIVE',
      code: formData.get('code') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Aislamiento Tenant: verificar nombre único de proveedor en la empresa
    const whereName = await withTenantWhere({ companyName: parsed.data.companyName });
    const existingName = await prisma.supplier.findFirst({ where: whereName });
    if (existingName) {
      return { success: false, error: 'Ya existe un proveedor con este nombre en tu empresa' };
    }

    // Aislamiento Tenant: verificar email único de proveedor en la empresa
    const whereEmail = await withTenantWhere({ email: parsed.data.email });
    const existingEmail = await prisma.supplier.findFirst({ where: whereEmail });
    if (existingEmail) {
      return { success: false, error: 'Ya existe un proveedor con este correo electrónico en tu empresa' };
    }

    const data = await withTenantData({
      companyName: parsed.data.companyName,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      city: parsed.data.city,
      country: parsed.data.country,
      status: parsed.data.status,
      code: parsed.data.code,
    });

    const newSupplier = await prisma.supplier.create({ data });

    await logActivity({
      module: 'SUPPLIERS',
      action: 'CREATE',
      entity: 'Supplier',
      entityId: newSupplier.id,
      description: `Creó el proveedor "${newSupplier.companyName}" (NIT/Código: ${newSupplier.code})`,
      newValues: newSupplier
    });

    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error: any) {
    console.error('[CREATE_SUPPLIER]', error);
    return { success: false, error: error.message ?? 'Error al crear el proveedor' };
  }
}

export async function updateSupplier(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) return { success: false, error: 'ID inválido' };

    const parsed = supplierSchema.safeParse({
      companyName: formData.get('companyName'),
      contactName: formData.get('contactName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      address: formData.get('address'),
      city: formData.get('city'),
      country: formData.get('country') || 'Colombia',
      status: formData.get('status') ?? 'ACTIVE',
      code: formData.get('code') || null,
    });

    if (!parsed.success || !id) {
      return { success: false, error: parsed.error?.issues[0]?.message ?? 'Datos inválidos' };
    }

    // Aislamiento Tenant: verificar que pertenezca a la empresa
    const whereCheck = await withTenantWhere({ id });
    const sup = await prisma.supplier.findFirst({ where: whereCheck });
    if (!sup) {
      return { success: false, error: 'Proveedor no encontrado o no autorizado' };
    }

    // Verificar duplicado de nombre
    const whereExistingName = await withTenantWhere({
      companyName: parsed.data.companyName,
      id: { not: id }
    });
    const existingName = await prisma.supplier.findFirst({ where: whereExistingName });
    if (existingName) {
      return { success: false, error: 'Ya existe otro proveedor con este nombre en tu empresa' };
    }

    // Verificar duplicado de email
    const whereExistingEmail = await withTenantWhere({
      email: parsed.data.email,
      id: { not: id }
    });
    const existingEmail = await prisma.supplier.findFirst({ where: whereExistingEmail });
    if (existingEmail) {
      return { success: false, error: 'Ya existe otro proveedor con este correo electrónico' };
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        companyName: parsed.data.companyName,
        contactName: parsed.data.contactName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        address: parsed.data.address,
        city: parsed.data.city,
        country: parsed.data.country,
        status: parsed.data.status,
        code: parsed.data.code,
      },
    });

    await logActivity({
      module: 'SUPPLIERS',
      action: 'UPDATE',
      entity: 'Supplier',
      entityId: id,
      description: `Actualizó el proveedor "${updated.companyName}" (NIT/Código: ${updated.code})`,
      oldValues: sup, // Obtenido en la línea 96
      newValues: updated
    });

    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error: any) {
    console.error('[UPDATE_SUPPLIER]', error);
    return { success: false, error: error.message ?? 'Error al actualizar el proveedor' };
  }
}

export async function deleteSupplier(formData: FormData) {
  try {
    const id = Number(formData.get('id'));
    if (isNaN(id)) return { success: false, error: 'ID inválido' };

    // Aislamiento Tenant: verificar que pertenezca a la empresa
    const whereCheck = await withTenantWhere({ id });
    const sup = await prisma.supplier.findFirst({ where: whereCheck });
    if (!sup) {
      return { success: false, error: 'Proveedor no encontrado o no autorizado' };
    }

    // Verificar si hay productos asociados
    const productsCount = await prisma.product.count({
      where: { supplierId: id }
    });

    if (productsCount > 0) {
      return { success: false, error: 'No se puede eliminar el proveedor porque tiene productos asignados' };
    }

    await prisma.supplier.delete({ where: { id } });

    await logActivity({
      module: 'SUPPLIERS',
      action: 'DELETE',
      entity: 'Supplier',
      entityId: id,
      description: `Eliminó el proveedor "${sup.companyName}" (NIT/Código: ${sup.code})`,
      oldValues: sup
    });

    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error: any) {
    console.error('[DELETE_SUPPLIER]', error);
    return { success: false, error: 'Error al eliminar el proveedor' };
  }
}

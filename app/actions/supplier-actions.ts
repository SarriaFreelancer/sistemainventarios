"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const supplierSchema = z.object({
  companyName: z.string().min(2, 'El nombre es obligatorio'),
  contactName: z.string().min(2, 'El contacto es obligatorio'),
  phone: z.string().min(5, 'El teléfono es obligatorio'),
  email: z.string().email('Correo inválido'),
  address: z.string().min(3, 'La dirección es obligatoria'),
  city: z.string().min(2, 'La ciudad es obligatoria'),
  country: z.string().min(2, 'El país es obligatorio').default('Colombia'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export async function createSupplier(formData: FormData) {
  const parsed = supplierSchema.safeParse({
    companyName: formData.get('companyName'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    city: formData.get('city'),
    country: formData.get('country') || 'Colombia',
    status: formData.get('status') ?? 'ACTIVE',
  });

  if (!parsed.success) return;

  await prisma.supplier.create({ data: { ...parsed.data, status: parsed.data.status } });
  revalidatePath('/dashboard/suppliers');
}

export async function updateSupplier(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const parsed = supplierSchema.safeParse({
    companyName: formData.get('companyName'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    city: formData.get('city'),
    country: formData.get('country') || 'Colombia',
    status: formData.get('status') ?? 'ACTIVE',
  });

  if (!parsed.success || !id) return;

  await prisma.supplier.update({ where: { id }, data: { ...parsed.data, status: parsed.data.status } });
  revalidatePath('/dashboard/suppliers');
}

export async function deleteSupplier(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await prisma.supplier.delete({ where: { id } });
  revalidatePath('/dashboard/suppliers');
}

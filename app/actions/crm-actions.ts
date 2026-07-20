'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { CustomerStatus, OpportunityStage } from '@prisma/client';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.ACTIVE),
});

const opportunitySchema = z.object({
  title: z.string().min(2, 'El título es obligatorio'),
  customerId: z.coerce.number().min(1, 'El cliente es obligatorio'),
  stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.NEW),
  estimatedValue: z.coerce.number().min(0).default(0),
  probability: z.coerce.number().min(0).max(100).default(0),
});

// ─── Customer Actions ─────────────────────────────────────────────────────────

export async function createCustomer(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: 'No autenticado' };

  const companyId = await getSessionCompanyId();

  const raw = {
    name: formData.get('name'),
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    company: (formData.get('company') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    country: (formData.get('country') as string) || undefined,
    status: (formData.get('status') as CustomerStatus) || CustomerStatus.ACTIVE,
  };

  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await prisma.customer.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        company: parsed.data.company || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        country: parsed.data.country || 'Colombia',
        status: parsed.data.status,
        companyId: companyId ?? null,
      },
    });

    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { success: false, error: 'Ya existe un cliente con ese email.' };
    }
    console.error('[createCustomer]', err);
    return { success: false, error: 'Error al crear el cliente.' };
  }
}

export async function updateCustomer(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: 'No autenticado' };

  const companyId = await getSessionCompanyId();

  const id = Number(formData.get('id') ?? -1);
  if (!id || id === -1) return { success: false, error: 'ID inválido' };

  const raw = {
    name: formData.get('name'),
    email: (formData.get('email') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    company: (formData.get('company') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    city: (formData.get('city') as string) || undefined,
    status: (formData.get('status') as CustomerStatus) || CustomerStatus.ACTIVE,
  };

  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await prisma.customer.update({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      data: {
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        company: parsed.data.company || null,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        country: parsed.data.country || 'Colombia',
        status: parsed.data.status,
      },
    });

    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { success: false, error: 'Ya existe un cliente con ese email.' };
    }
    console.error('[updateCustomer]', err);
    return { success: false, error: 'Error al actualizar el cliente.' };
  }
}

export async function deleteCustomer(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: 'No autenticado' };
  if (!id) return { success: false, error: 'ID inválido' };

  const companyId = await getSessionCompanyId();

  try {
    await prisma.customer.delete({
      where: {
        id: Number(id),
        ...(companyId ? { companyId } : {}),
      },
    });
    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (err) {
    console.error('[deleteCustomer]', err);
    return { success: false, error: 'Error al eliminar el cliente.' };
  }
}

// ─── Opportunity Actions ──────────────────────────────────────────────────────

export async function createOpportunity(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: 'No autenticado' };

  const companyId = await getSessionCompanyId();

  const raw = {
    title: formData.get('title'),
    customerId: formData.get('customerId'),
    stage: (formData.get('stage') as OpportunityStage) || OpportunityStage.NEW,
    estimatedValue: formData.get('estimatedValue'),
    probability: formData.get('probability'),
  };

  const parsed = opportunitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    await prisma.opportunity.create({
      data: {
        title: parsed.data.title,
        customerId: parsed.data.customerId,
        stage: parsed.data.stage,
        estimatedValue: parsed.data.estimatedValue,
        probability: parsed.data.probability,
        companyId: companyId ?? null,
      },
    });

    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (err) {
    console.error('[createOpportunity]', err);
    return { success: false, error: 'Error al crear la oportunidad.' };
  }
}

export async function updateOpportunityStage(id: string, stage: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: 'No autenticado' };
  if (!id) return { success: false, error: 'ID inválido' };

  const companyId = await getSessionCompanyId();

  const validStages = Object.values(OpportunityStage);
  if (!validStages.includes(stage as OpportunityStage)) {
    return { success: false, error: 'Etapa inválida' };
  }

  try {
    await prisma.opportunity.update({
      where: {
        id: Number(id),
        ...(companyId ? { companyId } : {}),
      },
      data: { stage: stage as OpportunityStage },
    });
    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (err) {
    console.error('[updateOpportunityStage]', err);
    return { success: false, error: 'Error al actualizar la etapa.' };
  }
}

export async function deleteOpportunity(id: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false, error: 'No autenticado' };
  if (!id) return { success: false, error: 'ID inválido' };

  const companyId = await getSessionCompanyId();

  try {
    await prisma.opportunity.delete({
      where: {
        id: Number(id),
        ...(companyId ? { companyId } : {}),
      },
    });
    revalidatePath('/dashboard/crm');
    return { success: true };
  } catch (err) {
    console.error('[deleteOpportunity]', err);
    return { success: false, error: 'Error al eliminar la oportunidad.' };
  }
}

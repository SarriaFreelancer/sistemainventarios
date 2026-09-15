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
  isTrial: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  trialDays: z.coerce.number().optional().nullable(),
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
    isTrial: formData.get('isTrial') === 'true' || formData.get('isTrial') === 'on',
    trialDays: formData.get('trialDays') ? Number(formData.get('trialDays')) : null,
  });

  if (!parsed.success) return { success: false, error: 'Datos inválidos' };

  if (parsed.data.nit) {
    const existingNit = await prisma.companySetting.findFirst({ where: { nit: parsed.data.nit } });
    if (existingNit) return { success: false, error: 'Ya existe una empresa con ese NIT/Código' };
  }

  const isTrial = parsed.data.isTrial ?? false;
  let trialStartedAt: Date | null = null;
  let trialEndsAt: Date | null = null;

  if (isTrial) {
    const days = parsed.data.trialDays && parsed.data.trialDays > 0 ? parsed.data.trialDays : 15;
    trialStartedAt = new Date();
    trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  try {
    const newCompany = await prisma.company.create({
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

    if (isTrial) {
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE `Company` SET `isTrial` = 1, `trialStartedAt` = ?, `trialEndsAt` = ? WHERE `id` = ?',
          trialStartedAt,
          trialEndsAt,
          newCompany.id
        );
      } catch (err) {
        console.error('Error updating trial info in createCompany:', err);
      }
    }

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
    isTrial: formData.get('isTrial') === 'true' || formData.get('isTrial') === 'on',
    trialDays: formData.get('trialDays') ? Number(formData.get('trialDays')) : null,
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
    // Leer el themeConfig actual y estado de prueba
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      select: { themeConfig: true }
    });
    const currentTheme = (existingCompany?.themeConfig as any) || {};

    let existingTrial: any = {};
    try {
      const trialRows: any[] = await prisma.$queryRawUnsafe(
        'SELECT isTrial, trialEndsAt, trialStartedAt FROM `Company` WHERE id = ? LIMIT 1',
        id
      );
      if (trialRows && trialRows[0]) {
        existingTrial = trialRows[0];
      }
    } catch {}

    if (session.user.role === 'SUPERADMIN') {
      const isTrial = parsed.data.isTrial ?? false;
      let trialStartedAt = existingTrial?.trialStartedAt ? new Date(existingTrial.trialStartedAt) : new Date();
      let trialEndsAt: Date | null = null;
      if (isTrial) {
        const days = parsed.data.trialDays && parsed.data.trialDays > 0 ? parsed.data.trialDays : 15;
        if (formData.has('trialDays') && parsed.data.trialDays) {
          trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        } else if (existingTrial?.trialEndsAt) {
          trialEndsAt = new Date(existingTrial.trialEndsAt);
        } else {
          trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }
      }
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE `Company` SET `isTrial` = ?, `trialStartedAt` = ?, `trialEndsAt` = ? WHERE `id` = ?',
          isTrial ? 1 : 0,
          isTrial ? trialStartedAt : null,
          isTrial ? trialEndsAt : null,
          id
        );
      } catch (err) {
        console.error('Error updating trial info in updateCompany:', err);
      }
    }

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

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Sesiones y pagos de suscripción
      await tx.userSession.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.subscriptionPayment.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 2. Módulos y configuraciones
      await tx.companyModule.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.companySetting.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.apiKey.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.notification.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.auditLog.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.loginHistory.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.reportPreset.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 3. Chat
      await tx.chatMessage.deleteMany({ where: { conversation: { companyId: id } } }).catch(() => {});
      await tx.chatParticipant.deleteMany({ where: { conversation: { companyId: id } } }).catch(() => {});
      await tx.chatConversation.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 4. Ventas
      await tx.saleDetail.deleteMany({ where: { sale: { companyId: id } } }).catch(() => {});
      await tx.sale.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 5. Compras
      await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrder: { companyId: id } } }).catch(() => {});
      await tx.purchaseOrder.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchaseReceiptItem.deleteMany({ where: { purchaseReceipt: { companyId: id } } }).catch(() => {});
      await tx.purchaseReceipt.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchaseInvoice.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchasePayment.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.accountsPayable.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchaseQuotationItem.deleteMany({ where: { purchaseQuotation: { companyId: id } } }).catch(() => {});
      await tx.purchaseQuotation.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchaseRequestItem.deleteMany({ where: { purchaseRequest: { companyId: id } } }).catch(() => {});
      await tx.purchaseRequest.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchaseApproval.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.purchaseApprovalConfig.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.internalRequisitionItem.deleteMany({ where: { internalRequisition: { companyId: id } } }).catch(() => {});
      await tx.internalRequisition.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 6. RRHH
      await tx.employeeNovelty.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.payrollDetail.deleteMany({ where: { payroll: { companyId: id } } }).catch(() => {});
      await tx.payroll.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.employee.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.position.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 7. Finanzas
      await tx.expense.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.income.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.invoiceCounter.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.discount.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 8. CRM
      await tx.activity.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.quote.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.opportunity.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.contact.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.lead.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.customer.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 9. Bodegas e inventario
      await (tx as any).warehouseTransferItem?.deleteMany({ where: { transfer: { companyId: id } } }).catch(() => {});
      await (tx as any).warehouseTransfer?.deleteMany({ where: { companyId: id } }).catch(() => {});
      await (tx as any).warehouseTimeline?.deleteMany({ where: { transfer: { companyId: id } } }).catch(() => {});
      await (tx as any).warehouseStock?.deleteMany({ where: { warehouse: { companyId: id } } }).catch(() => {});
      await (tx as any).warehouseLocation?.deleteMany({ where: { warehouse: { companyId: id } } }).catch(() => {});
      await (tx as any).warehouseMovement?.deleteMany({ where: { companyId: id } }).catch(() => {});
      await (tx as any).inventoryEntryItem?.deleteMany({ where: { inventoryEntry: { companyId: id } } }).catch(() => {});
      await (tx as any).inventoryEntry?.deleteMany({ where: { companyId: id } }).catch(() => {});
      await (tx as any).warehouse?.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 10. Productos y Proveedores
      await tx.productBatch.deleteMany({ where: { product: { companyId: id } } }).catch(() => {});
      await tx.product.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.category.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.productGroup.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.supplier.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 11. Usuarios pertenecientes a la empresa
      await tx.user.deleteMany({ where: { companyId: id } }).catch(() => {});

      // 12. Finalmente la Empresa
      await tx.company.delete({ where: { id } });
    });

    revalidatePath('/dashboard/companies');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando empresa:', error);
    return { success: false, error: 'Ocurrió un error al eliminar la empresa: ' + (error.message || '') };
  }
}

export async function setCompanyTrialAction(companyId: number, days: number, isTrial: boolean, expireNow: boolean = false) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: "Solo el superadmin puede modificar el período de prueba" };
  }

  if (!companyId || isNaN(companyId)) {
    return { success: false, error: "ID de empresa no válido" };
  }

  try {
    let trialStartedAt: Date | null = new Date();
    let trialEndsAt: Date | null = null;

    if (expireNow) {
      // Forzar vencimiento inmediato para probar el bloqueo del sistema
      isTrial = true;
      trialStartedAt = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000); // 16 días atrás
      trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Venció ayer
    } else if (isTrial) {
      const validDays = days && days > 0 ? days : 15;
      trialStartedAt = new Date();
      trialEndsAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
    } else {
      isTrial = false;
      trialStartedAt = null;
      trialEndsAt = null;
    }

    await prisma.$executeRawUnsafe(
      'UPDATE `Company` SET `isTrial` = ?, `trialStartedAt` = ?, `trialEndsAt` = ?, `status` = CASE WHEN ? = 1 THEN "ACTIVE" ELSE `status` END WHERE `id` = ?',
      isTrial ? 1 : 0,
      trialStartedAt,
      trialEndsAt,
      isTrial ? 1 : 0,
      companyId
    );

    revalidatePath('/dashboard/companies');
    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Error asignando período de prueba:', error);
    return { success: false, error: error.message || 'Error al actualizar el período de prueba' };
  }
}

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
      await tx.warehouseTransferItem.deleteMany({ where: { warehouseTransfer: { companyId: id } } }).catch(() => {});
      await tx.warehouseTransfer.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.warehouseTimeline.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.warehouseStock.deleteMany({ where: { warehouse: { companyId: id } } }).catch(() => {});
      await tx.warehouseLocation.deleteMany({ where: { warehouse: { companyId: id } } }).catch(() => {});
      await tx.warehouseMovement.deleteMany({ where: { warehouse: { companyId: id } } }).catch(() => {});
      await tx.inventoryEntryItem.deleteMany({ where: { inventoryEntry: { companyId: id } } }).catch(() => {});
      await tx.inventoryEntry.deleteMany({ where: { companyId: id } }).catch(() => {});
      await tx.warehouse.deleteMany({ where: { companyId: id } }).catch(() => {});

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

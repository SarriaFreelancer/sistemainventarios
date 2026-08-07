"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import fs from "fs";
import path from "path";

export async function uploadCompanyLogo(base64Data: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: "Formato de imagen inválido" };
    }

    const extRaw = matches[1].toLowerCase();
    const extension = extRaw === 'jpeg' ? 'jpg' : extRaw;
    const imageBuffer = Buffer.from(matches[2], 'base64');

    const fileName = `logo-${session.user.companyId || 'company'}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, imageBuffer);

    const publicUrl = `/uploads/logos/${fileName}`;
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("[UPLOAD_COMPANY_LOGO]", error);
    return { success: false, error: "Error al guardar el logo de la empresa" };
  }
}

export async function uploadCompanyBackgroundImage(base64Data: string) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: "Formato de imagen inválido" };
    }

    const extRaw = matches[1].toLowerCase();
    const extension = extRaw === 'jpeg' ? 'jpg' : extRaw;
    const imageBuffer = Buffer.from(matches[2], 'base64');

    const fileName = `bg-${session.user.companyId || 'company'}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'backgrounds');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await fs.promises.writeFile(filePath, imageBuffer);

    const publicUrl = `/uploads/backgrounds/${fileName}`;
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("[UPLOAD_COMPANY_BG]", error);
    return { success: false, error: "Error al guardar la imagen de fondo" };
  }
}

export async function getCompanySettings() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return { success: false, error: "No autorizado o sin empresa vinculada" };
    }
    
    let companyId: number | null = session.user.companyId ? Number(session.user.companyId) : null;
    let targetCompany = companyId
      ? await prisma.company.findUnique({ where: { id: companyId } })
      : null;

    // Si la empresa de la sesión no existe en la BD (ej. tras re-sembrar datos), usar la primera empresa activa
    if (!targetCompany) {
      targetCompany = await prisma.company.findFirst({ where: { status: 'ACTIVE' }, orderBy: { id: 'asc' } })
                   || await prisma.company.findFirst({ orderBy: { id: 'asc' } });
    }

    if (!targetCompany) {
      return { success: false, error: "No se encontró ninguna empresa activa en el sistema" };
    }

    companyId = targetCompany.id;
    
    // Intentar obtener la configuración. Si no existe, la creamos (Upsert de seguridad)
    let settings = await prisma.companySetting.findUnique({
      where: { companyId }
    });
    
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: { companyId }
      });
    }
    
    const themeConfig = (targetCompany.themeConfig as any) || {};
    const fullSettings = {
      ...settings,
      bgImage: themeConfig.bgImage || "",
      themeColor: themeConfig.primaryColor || ""
    };

    return { success: true, settings: JSON.parse(JSON.stringify(fullSettings)) };
  } catch (error: any) {
    console.error("[GET_SETTINGS]", error);
    return { success: false, error: error.message || "Error al obtener la configuración" };
  }
}

export async function updateCompanySettings(data: any) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return { success: false, error: "Permisos insuficientes. Solo los administradores pueden cambiar estos ajustes." };
    }
    
    let companyId: number | null = session.user.companyId ? Number(session.user.companyId) : null;
    let targetCompany = companyId
      ? await prisma.company.findUnique({ where: { id: companyId } })
      : null;

    if (!targetCompany) {
      targetCompany = await prisma.company.findFirst({ where: { status: 'ACTIVE' }, orderBy: { id: 'asc' } })
                   || await prisma.company.findFirst({ orderBy: { id: 'asc' } });
    }

    if (!targetCompany) {
      return { success: false, error: "No se encontró ninguna empresa activa en el sistema" };
    }

    companyId = targetCompany.id;
    
    const settingsBefore = await prisma.companySetting.findUnique({
      where: { companyId }
    });
    
    const updated = await prisma.companySetting.update({
      where: { companyId },
      data: {
        nit: data.nit,
        phone: data.phone,
        website: data.website,
        socialMedia: data.socialMedia ? JSON.parse(JSON.stringify(data.socialMedia)) : undefined,
        invoiceConfig: data.invoiceConfig ? JSON.parse(JSON.stringify(data.invoiceConfig)) : undefined,
        currency: data.currency,
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        currencyFormat: data.currencyFormat,
        allowNegativeStock: data.allowNegativeStock,
        automaticCode: data.automaticCode,
        decimals: Number(data.decimals ?? 0),
        defaultIva: Number(data.defaultIva ?? 19),
        invoicePrefix: data.invoicePrefix,
        invoiceConsecutive: Number(data.invoiceConsecutive ?? 1),
        purchasePrefix: data.purchasePrefix,
        purchaseConsecutive: Number(data.purchaseConsecutive ?? 1),
        passwordMinLength: Number(data.passwordMinLength ?? 6),
        maxLoginAttempts: Number(data.maxLoginAttempts ?? 5),
        sessionTimeoutMinutes: Number(data.sessionTimeoutMinutes ?? 60),
        enable2FA: data.enable2FA,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort ? Number(data.smtpPort) : null,
        smtpUser: data.smtpUser,
        smtpPass: data.smtpPass,
        backupFrequency: data.backupFrequency,
        backupTime: data.backupTime,
        backupDay: data.backupDay ? Number(data.backupDay) : 1,
        backupPath: data.backupPath,
        enableNotifications: data.enableNotifications
      }
    });
    
    if (data.themeColor !== undefined || data.bgImage !== undefined) {
      const existingCompany = await prisma.company.findUnique({ where: { id: companyId } });
      const currentTheme = (existingCompany?.themeConfig as any) || {};
      await prisma.company.update({
        where: { id: companyId },
        data: {
          themeConfig: {
            ...currentTheme,
            ...(data.themeColor !== undefined ? { primaryColor: data.themeColor } : {}),
            ...(data.bgImage !== undefined ? { bgImage: data.bgImage } : {})
          }
        }
      });
    }

    await logActivity({
      module: "COMPANY",
      action: "UPDATE",
      entity: "CompanySetting",
      entityId: updated.id,
      description: "Actualizó los parámetros globales de configuración de la empresa",
      oldValues: settingsBefore,
      newValues: updated
    });
    
    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_SETTINGS]", error);
    return { success: false, error: error.message || "Error al actualizar la configuración" };
  }
}

/**
 * Limpia los datos transaccionales (ventas, productos, clientes, categorías, proveedores)
 * de la empresa del usuario actual (o de una empresa específica si es SUPERADMIN).
 * CONSERVA INTACTOS los usuarios, la empresa y sus licencias para mantener el inicio de sesión.
 */
export async function resetCompanyData(targetCompanyId?: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    const isAdmin = session.user.role === 'ADMIN';

    if (!isAdmin && !isSuperAdmin) {
      return { success: false, error: "Solo los administradores pueden realizar esta acción." };
    }

    const companyId = (isSuperAdmin && targetCompanyId)
      ? Number(targetCompanyId)
      : (session.user.companyId ? Number(session.user.companyId) : null);

    if (!companyId) {
      return { success: false, error: "Empresa no válida o no especificada." };
    }

    // Verificar que la empresa exista
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return { success: false, error: "Empresa no encontrada." };
    }

    // Ejecutar borrado transaccional seguro conservando usuarios y licencias
    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { companyId } });
      await tx.auditLog.deleteMany({ where: { companyId } });
      await tx.saleDetail.deleteMany({ where: { companyId } });
      await tx.sale.deleteMany({ where: { companyId } });
      await tx.opportunity.deleteMany({ where: { companyId } });
      await tx.customer.deleteMany({ where: { companyId } });
      await tx.product.deleteMany({ where: { companyId } });
      await tx.category.deleteMany({ where: { companyId } });
      await tx.productGroup.deleteMany({ where: { companyId } });
      await tx.supplier.deleteMany({ where: { companyId } });
      await tx.invoiceCounter.deleteMany({ where: { companyId } });
    });

    await logActivity({
      module: "COMPANY",
      action: "DELETE",
      entity: "CompanyData",
      entityId: companyId,
      description: `Limpió todos los datos transaccionales de la empresa "${company.name}" (Usuarios y accesos conservados).`
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/suppliers");
    return { success: true, message: `Los datos de "${company.name}" fueron limpiados correctamente. Las cuentas de usuario conservan su acceso.` };
  } catch (error: any) {
    console.error("[RESET_COMPANY_DATA_ERROR]", error);
    return { success: false, error: error.message || "Error al limpiar los datos de la empresa." };
  }
}

/**
 * Exclusivo para SUPERADMIN: Limpia los datos transaccionales de TODAS las empresas del sistema.
 * CONSERVA INTACTOS todos los usuarios, cuentas, licencias y empresas registradas.
 */
export async function resetGlobalSystemData() {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return { success: false, error: "Acceso denegado. Solo el SUPERADMIN puede realizar una limpieza global." };
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.saleDetail.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.productGroup.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.invoiceCounter.deleteMany();

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    await logActivity({
      module: "SYSTEM",
      action: "DELETE",
      entity: "GlobalData",
      entityId: 0,
      description: "Realizó una limpieza global de datos transaccionales en todas las empresas (Usuarios y licencias conservados)."
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/suppliers");
    return { success: true, message: "Se han limpiado todos los datos transaccionales de la plataforma. Las empresas y los usuarios mantienen su acceso intacto." };
  } catch (error: any) {
    console.error("[RESET_GLOBAL_SYSTEM_DATA_ERROR]", error);
    return { success: false, error: error.message || "Error al realizar la limpieza global." };
  }
}

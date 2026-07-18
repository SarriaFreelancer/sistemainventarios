"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";

export async function getCompanySettings() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.companyId) {
      return { success: false, error: "No autorizado o sin empresa vinculada" };
    }
    
    const companyId = Number(session.user.companyId);
    
    // Intentar obtener la configuración. Si no existe, la creamos (Upsert de seguridad)
    let settings = await prisma.companySetting.findUnique({
      where: { companyId }
    });
    
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: { companyId }
      });
    }
    
    return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
  } catch (error: any) {
    console.error("[GET_SETTINGS]", error);
    return { success: false, error: error.message || "Error al obtener la configuración" };
  }
}

export async function updateCompanySettings(data: any) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.companyId) {
      return { success: false, error: "No autorizado" };
    }
    
    const companyId = Number(session.user.companyId);
    
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
        backupFrequency: data.backupFrequency
      }
    });
    
    await logActivity({
      module: "COMPANY",
      action: "UPDATE",
      entity: "CompanySetting",
      entityId: updated.id,
      description: "Actualizó los parámetros globales de configuración de la empresa",
      oldValues: settingsBefore,
      newValues: updated
    });
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_SETTINGS]", error);
    return { success: false, error: error.message || "Error al actualizar la configuración" };
  }
}

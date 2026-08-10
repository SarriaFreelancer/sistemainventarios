"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/actions/notification-actions";
import { BatchStatus } from "@prisma/client";

// ─── Get batches for a product ───
export async function getProductBatches(productId: number) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  try {
    const batches = await prisma.productBatch.findMany({
      where: { productId },
      orderBy: { expirationDate: "asc" },
    });
    return { success: true, data: batches };
  } catch (error: any) {
    console.error("[GET_PRODUCT_BATCHES]", error);
    return { success: false, error: "Error al obtener lotes" };
  }
}

// ─── Create a new batch ───
export async function createProductBatch(
  productId: number,
  data: { batchNumber: string; expirationDate: string; quantity: number; notes?: string }
) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  try {
    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, error: "Producto no encontrado" };

    const batch = await prisma.productBatch.create({
      data: {
        productId,
        batchNumber: data.batchNumber.trim(),
        expirationDate: new Date(data.expirationDate),
        quantity: data.quantity,
        notes: data.notes?.trim() || null,
        status: new Date(data.expirationDate) < new Date() ? BatchStatus.EXPIRED : BatchStatus.ACTIVE,
      },
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: batch };
  } catch (error: any) {
    console.error("[CREATE_PRODUCT_BATCH]", error);
    if (error.code === "P2002") {
      return { success: false, error: "Ya existe un lote con ese número para este producto" };
    }
    return { success: false, error: "Error al crear el lote" };
  }
}

// ─── Update a batch ───
export async function updateProductBatch(
  batchId: number,
  data: { batchNumber?: string; expirationDate?: string; quantity?: number; notes?: string; status?: BatchStatus }
) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  try {
    const updateData: any = {};
    if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber.trim();
    if (data.expirationDate !== undefined) updateData.expirationDate = new Date(data.expirationDate);
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.status !== undefined) updateData.status = data.status;

    // Auto-set DEPLETED if quantity is 0
    if (data.quantity === 0 && !data.status) {
      updateData.status = BatchStatus.DEPLETED;
    }

    const batch = await prisma.productBatch.update({
      where: { id: batchId },
      data: updateData,
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: batch };
  } catch (error: any) {
    console.error("[UPDATE_PRODUCT_BATCH]", error);
    return { success: false, error: "Error al actualizar el lote" };
  }
}

// ─── Delete a batch ───
export async function deleteProductBatch(batchId: number) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  try {
    await prisma.productBatch.delete({ where: { id: batchId } });
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_PRODUCT_BATCH]", error);
    return { success: false, error: "Error al eliminar el lote" };
  }
}

// ─── Get products with expiring batches (for dashboard widget) ───
export async function getExpiringProducts(daysAhead?: number) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const companyId = await getSessionCompanyId();
  if (!companyId) return { success: false, error: "Sin empresa" };

  try {
    const settings = await prisma.companySetting.findUnique({ where: { companyId } });
    if (!settings?.trackExpirationDates) return { success: true, data: [] };

    const alertDays = daysAhead ?? settings.expirationAlertDays;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + alertDays);

    const batches = await prisma.productBatch.findMany({
      where: {
        product: { companyId },
        status: BatchStatus.ACTIVE,
        expirationDate: { lte: futureDate },
      },
      include: {
        product: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expirationDate: "asc" },
    });

    return { success: true, data: batches };
  } catch (error: any) {
    console.error("[GET_EXPIRING_PRODUCTS]", error);
    return { success: false, error: "Error al obtener productos próximos a vencer" };
  }
}

// ─── Get already expired products ───
export async function getExpiredProducts() {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const companyId = await getSessionCompanyId();
  if (!companyId) return { success: false, error: "Sin empresa" };

  try {
    const settings = await prisma.companySetting.findUnique({ where: { companyId } });
    if (!settings?.trackExpirationDates) return { success: true, data: [] };

    const batches = await prisma.productBatch.findMany({
      where: {
        product: { companyId },
        status: BatchStatus.EXPIRED,
      },
      include: {
        product: { select: { id: true, code: true, name: true } },
      },
      orderBy: { expirationDate: "asc" },
    });

    return { success: true, data: batches };
  } catch (error: any) {
    console.error("[GET_EXPIRED_PRODUCTS]", error);
    return { success: false, error: "Error al obtener productos vencidos" };
  }
}

// ─── Check and notify expirations (called by cron) ───
export async function checkAndNotifyExpirations() {
  try {
    // Get all companies with expiration tracking enabled
    const companiesWithTracking = await prisma.companySetting.findMany({
      where: { trackExpirationDates: true },
      include: { company: { select: { id: true, name: true } } },
    });

    let totalNotified = 0;
    let totalExpired = 0;

    for (const setting of companiesWithTracking) {
      const companyId = setting.companyId;
      const alertDays = setting.expirationAlertDays;
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + alertDays);

      // 1. Mark expired batches
      const expiredResult = await prisma.productBatch.updateMany({
        where: {
          product: { companyId },
          status: BatchStatus.ACTIVE,
          expirationDate: { lt: now },
        },
        data: { status: BatchStatus.EXPIRED },
      });
      totalExpired += expiredResult.count;

      // 2. Find batches expiring soon
      const expiringBatches = await prisma.productBatch.findMany({
        where: {
          product: { companyId },
          status: BatchStatus.ACTIVE,
          expirationDate: { gte: now, lte: futureDate },
        },
        include: {
          product: { select: { name: true, code: true } },
        },
      });

      if (expiringBatches.length === 0 && expiredResult.count === 0) continue;

      // 3. Find admin users of this company
      const admins = await prisma.user.findMany({
        where: {
          companyId,
          role: { name: { in: ["ADMIN", "SUPERADMIN"] } },
        },
        select: { id: true },
      });

      // 4. Create notifications
      for (const admin of admins) {
        if (expiringBatches.length > 0) {
          const productNames = expiringBatches
            .slice(0, 5)
            .map((b) => `${b.product.name} (Lote: ${b.batchNumber})`)
            .join(", ");
          const extra = expiringBatches.length > 5 ? ` y ${expiringBatches.length - 5} más` : "";

          await createNotification(
            admin.id,
            companyId,
            "⚠️ Productos próximos a vencer",
            `${expiringBatches.length} lote(s) vencen en los próximos ${alertDays} días: ${productNames}${extra}`,
            "WARNING"
          );
          totalNotified++;
        }

        if (expiredResult.count > 0) {
          await createNotification(
            admin.id,
            companyId,
            "🔴 Productos vencidos detectados",
            `${expiredResult.count} lote(s) han sido marcados como vencidos automáticamente.`,
            "ERROR"
          );
          totalNotified++;
        }
      }
    }

    return {
      success: true,
      companiesChecked: companiesWithTracking.length,
      notificationsSent: totalNotified,
      batchesExpired: totalExpired,
    };
  } catch (error: any) {
    console.error("[CHECK_EXPIRATIONS]", error);
    return { success: false, error: error.message };
  }
}

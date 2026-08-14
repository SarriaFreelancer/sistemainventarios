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

// ─── Write-off a batch (Baja por Vencimiento / Merma) ───
export async function writeOffProductBatch(
  batchId: number,
  quantityToWriteOff: number,
  reason: string = "Baja por Vencimiento"
) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const companyId = await getSessionCompanyId();
  if (!companyId) return { success: false, error: "Sin empresa autorizada" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener la configuración de la empresa
      const settings = await tx.companySetting.findUnique({ where: { companyId } });
      if (settings && (settings as any).enableBatchWriteOff === false) {
        throw new Error("La función de baja de lotes por vencimiento está deshabilitada en la configuración de la empresa.");
      }

      // 2. Obtener el lote con el producto y categoría
      const batch = await tx.productBatch.findUnique({
        where: { id: batchId },
        include: {
          product: {
            include: { category: true }
          }
        }
      });

      if (!batch) throw new Error("Lote no encontrado");
      if (batch.product.companyId !== companyId) throw new Error("Acceso denegado a este lote");
      if (quantityToWriteOff <= 0 || quantityToWriteOff > batch.quantity) {
        throw new Error(`La cantidad a dar de baja debe ser entre 1 y ${batch.quantity} u.`);
      }

      const newBatchQty = batch.quantity - quantityToWriteOff;
      const isTotalWriteOff = newBatchQty === 0;

      // 3. Actualizar el lote
      await tx.productBatch.update({
        where: { id: batchId },
        data: {
          quantity: newBatchQty,
          status: isTotalWriteOff ? BatchStatus.DEPLETED : batch.status,
        }
      });

      // 4. Descontar del inventario disponible global del producto
      const currentProduct = batch.product;
      const newProductQty = Math.max(0, currentProduct.quantityAvailable - quantityToWriteOff);
      await tx.product.update({
        where: { id: currentProduct.id },
        data: {
          quantityAvailable: newProductQty,
          status: newProductQty <= 0 ? 'OUT_OF_STOCK' : currentProduct.status,
        }
      });

      // 5. Generar gasto contable si autoExpenseOnWriteOff está activo
      let createdExpense = null;
      const autoExpense = (settings as any)?.autoExpenseOnWriteOff ?? true;
      if (autoExpense) {
        const totalLossAmount = quantityToWriteOff * currentProduct.unitCost;
        if (totalLossAmount > 0) {
          createdExpense = await tx.expense.create({
            data: {
              companyId,
              amount: totalLossAmount,
              category: 'OTHER',
              description: `Baja por Vencimiento (${reason}): ${quantityToWriteOff} u. del Lote ${batch.batchNumber} - Producto: ${currentProduct.name}`,
              date: new Date(),
            }
          });
        }
      }

      return {
        batchNumber: batch.batchNumber,
        productName: currentProduct.name,
        quantityWrittenOff: quantityToWriteOff,
        isTotalWriteOff,
        expenseId: createdExpense?.id ?? null,
      };
    });

    // 6. Notificar a los administradores
    const admins = await prisma.user.findMany({
      where: { companyId, role: { name: 'ADMIN' } }
    });

    for (const admin of admins) {
      await createNotification(
        admin.id,
        companyId,
        '⚠️ Baja de Lote Registrada',
        `Se dieron de baja ${result.quantityWrittenOff} u. del lote ${result.batchNumber} (${result.productName}). Razón: ${reason}.`,
        'WARNING'
      );
    }

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/finanzas");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[WRITE_OFF_PRODUCT_BATCH]", error);
    return { success: false, error: error.message ?? "Error al dar de baja el lote" };
  }
}

// ─── Delete a batch permanently ───
export async function deleteProductBatch(batchId: number) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const companyId = await getSessionCompanyId();
  if (!companyId) return { success: false, error: "Sin empresa autorizada" };

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar configuración de la empresa
      const settings = await tx.companySetting.findUnique({ where: { companyId } });
      if (settings && (settings as any).enableBatchDelete === false) {
        throw new Error("La eliminación directa de lotes está deshabilitada en la configuración de la empresa.");
      }

      // 2. Obtener el lote con el producto
      const batch = await tx.productBatch.findUnique({
        where: { id: batchId },
        include: { product: true }
      });

      if (!batch) throw new Error("Lote no encontrado");
      if (batch.product.companyId !== companyId) throw new Error("Acceso denegado a este lote");

      // 3. Eliminar el lote
      await tx.productBatch.delete({ where: { id: batchId } });

      // 4. Actualizar el stock disponible global del producto
      const currentProduct = batch.product;
      const newProductQty = Math.max(0, currentProduct.quantityAvailable - batch.quantity);
      await tx.product.update({
        where: { id: currentProduct.id },
        data: {
          quantityAvailable: newProductQty,
          status: newProductQty <= 0 ? 'OUT_OF_STOCK' : currentProduct.status,
        }
      });

      return {
        batchNumber: batch.batchNumber,
        productName: currentProduct.name,
        quantityDeleted: batch.quantity,
      };
    });

    revalidatePath("/dashboard/products");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("[DELETE_PRODUCT_BATCH]", error);
    return { success: false, error: error.message ?? "Error al eliminar el lote" };
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

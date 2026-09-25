"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { withTenantWhere, withTenantData } from "@/lib/tenant-db";
import { getSessionCompanyId, resolveActionCompanyId } from "@/lib/session";
import { logActivity } from "@/lib/audit";
import { createNotification } from "@/app/actions/notification-actions";
import {
  calculateComboFinancials,
  calculateComboStockAvailability,
  type ComboFinancials,
  type ComboAvailability,
} from "@/lib/combo-utils";

const comboItemSchema = z.object({
  productId: z.coerce.number().min(1, "Producto inválido"),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
});

const comboSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(2, "El nombre del combo es obligatorio"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  pricingType: z.enum(["DISCOUNT_PERCENT", "CUSTOM_PRICE"]).default("DISCOUNT_PERCENT"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  customPrice: z.coerce.number().min(0).optional().nullable(),
  targetQuantity: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(comboItemSchema).min(1, "Debes agregar al menos un producto al combo"),
});

export type ComboFormData = z.infer<typeof comboSchema>;

/**
 * Obtener todos los combos de la empresa actual con cálculo dinámico de existencias y rentabilidad
 */
export async function getCombos() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { companyId } : {};

    const combos = await prisma.combo.findMany({
      where: whereTenant,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                quantityAvailable: true,
                unitCost: true,
                salePrice: true,
                status: true,
                productGroup: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const enrichedCombos = combos.map((c) => {
      const financials = calculateComboFinancials(
        c.items.map(it => ({
          quantity: it.quantity,
          unitCost: Number(it.product.unitCost || 0),
          salePrice: Number(it.product.salePrice || 0),
        })),
        c.pricingType as any,
        Number(c.discountPercent || 0),
        c.customPrice !== null ? Number(c.customPrice) : null
      );

      const availability = calculateComboStockAvailability({
        targetQuantity: c.targetQuantity,
        items: c.items.map(it => ({
          quantity: it.quantity,
          product: {
            id: it.product.id,
            name: it.product.name,
            code: it.product.code,
            quantityAvailable: it.product.quantityAvailable,
            status: it.product.status,
            unitCost: Number(it.product.unitCost || 0),
            salePrice: Number(it.product.salePrice || 0),
          }
        }))
      });

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        image: c.image,
        pricingType: c.pricingType,
        discountPercent: Number(c.discountPercent),
        customPrice: c.customPrice ? Number(c.customPrice) : null,
        targetQuantity: c.targetQuantity,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        ...financials,
        ...availability,
        items: c.items.map(it => ({
          id: it.id,
          productId: it.productId,
          quantity: it.quantity,
          product: {
            id: it.product.id,
            name: it.product.name,
            code: it.product.code,
            quantityAvailable: it.product.quantityAvailable,
            unitCost: Number(it.product.unitCost || 0),
            salePrice: Number(it.product.salePrice || 0),
            groupName: it.product.productGroup?.name || null,
            categoryName: it.product.category?.name || null,
          }
        }))
      };
    });

    return { success: true, combos: enrichedCombos };
  } catch (error: any) {
    console.error("[GET_COMBOS]", error);
    return { success: false, error: error.message || "Error al obtener combos" };
  }
}

/**
 * Obtener un combo específico por ID
 */
export async function getComboById(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (!id || isNaN(id)) return { success: false, error: "ID de combo inválido" };

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { id, companyId } : { id };

    const combo = await prisma.combo.findFirst({
      where: whereTenant,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                quantityAvailable: true,
                unitCost: true,
                salePrice: true,
                status: true,
                productGroup: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
              }
            }
          }
        }
      }
    });

    if (!combo) return { success: false, error: "Combo no encontrado" };

    const financials = calculateComboFinancials(
      combo.items.map(it => ({
        quantity: it.quantity,
        unitCost: Number(it.product.unitCost || 0),
        salePrice: Number(it.product.salePrice || 0),
      })),
      combo.pricingType as any,
      Number(combo.discountPercent || 0),
      combo.customPrice !== null ? Number(combo.customPrice) : null
    );

    const availability = calculateComboStockAvailability({
      targetQuantity: combo.targetQuantity,
      items: combo.items.map(it => ({
        quantity: it.quantity,
        product: {
          id: it.product.id,
          name: it.product.name,
          code: it.product.code,
          quantityAvailable: it.product.quantityAvailable,
          status: it.product.status,
          unitCost: Number(it.product.unitCost || 0),
          salePrice: Number(it.product.salePrice || 0),
        }
      }))
    });

    return {
      success: true,
      combo: {
        id: combo.id,
        code: combo.code,
        name: combo.name,
        description: combo.description,
        image: combo.image,
        pricingType: combo.pricingType,
        discountPercent: Number(combo.discountPercent),
        customPrice: combo.customPrice ? Number(combo.customPrice) : null,
        targetQuantity: combo.targetQuantity,
        isActive: combo.isActive,
        createdAt: combo.createdAt.toISOString(),
        updatedAt: combo.updatedAt.toISOString(),
        ...financials,
        ...availability,
        items: combo.items.map(it => ({
          id: it.id,
          productId: it.productId,
          quantity: it.quantity,
          product: {
            id: it.product.id,
            name: it.product.name,
            code: it.product.code,
            quantityAvailable: it.product.quantityAvailable,
            unitCost: Number(it.product.unitCost || 0),
            salePrice: Number(it.product.salePrice || 0),
            groupName: it.product.productGroup?.name || null,
            categoryName: it.product.category?.name || null,
          }
        }))
      }
    };
  } catch (error: any) {
    console.error("[GET_COMBO_BY_ID]", error);
    return { success: false, error: error.message || "Error al obtener combo" };
  }
}

/**
 * Crear un nuevo combo
 */
export async function createCombo(data: ComboFormData) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const parsed = comboSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos de combo inválidos" };
    }

    const companyId = (await getSessionCompanyId()) ?? (await resolveActionCompanyId());
    if (!companyId) return { success: false, error: "No autorizado o sin empresa vinculada" };

    // Validar nombre único por empresa
    const existingName = await prisma.combo.findFirst({
      where: { name: parsed.data.name.trim(), companyId }
    });
    if (existingName) {
      return { success: false, error: `Ya existe un combo con el nombre "${parsed.data.name}"` };
    }

    // Validar productos duplicados en el mismo combo
    const productIds = parsed.data.items.map(it => it.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return { success: false, error: "No puedes incluir el mismo producto varias veces en un combo" };
    }

    // Validar que todos los productos existan y pertenezcan a la empresa
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        companyId
      },
      select: { id: true, name: true, unitCost: true, salePrice: true, quantityAvailable: true, status: true }
    });

    if (products.length !== productIds.length) {
      return { success: false, error: "Uno o más productos seleccionados no existen o no pertenecen a tu empresa" };
    }

    const prodMap = new Map(products.map(p => [p.id, p]));

    // Calcular costos y precios iniciales
    const itemsWithPricing = parsed.data.items.map(it => {
      const prod = prodMap.get(it.productId)!;
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitCost: Number(prod.unitCost || 0),
        salePrice: Number(prod.salePrice || 0),
      };
    });

    const financials = calculateComboFinancials(
      itemsWithPricing,
      parsed.data.pricingType,
      parsed.data.discountPercent,
      parsed.data.customPrice
    );

    // Consecutivo o código de combo si no se especifica
    let comboCode = parsed.data.code?.trim() || null;
    if (!comboCode) {
      const count = await prisma.combo.count({ where: { companyId } });
      comboCode = `CMB-${String(count + 1).padStart(4, "0")}`;
    }

    const newCombo = await prisma.combo.create({
      data: {
        code: comboCode,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        image: parsed.data.image || null,
        pricingType: parsed.data.pricingType,
        discountPercent: parsed.data.discountPercent,
        customPrice: parsed.data.customPrice !== undefined ? parsed.data.customPrice : null,
        calculatedCost: financials.calculatedCost,
        commercialPrice: financials.commercialPrice,
        finalPrice: financials.finalPrice,
        targetQuantity: parsed.data.targetQuantity !== undefined && parsed.data.targetQuantity !== null ? Number(parsed.data.targetQuantity) : null,
        isActive: parsed.data.isActive,
        companyId,
        items: {
          create: parsed.data.items.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            companyId,
          }))
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    await logActivity({
      module: "COMBOS",
      action: "CREATE",
      entity: "Combo",
      entityId: newCombo.id,
      description: `Creó el combo "${newCombo.name}" con ${newCombo.items.length} productos (Precio: $${financials.finalPrice.toLocaleString("es-CO")})`,
      newValues: newCombo,
    });

    if (session.user.id) {
      await createNotification(
        Number(session.user.id),
        companyId,
        "✨ Nuevo Combo Comercial Creado",
        `Se creó el combo "${newCombo.name}" con precio final de $${financials.finalPrice.toLocaleString("es-CO")}.`,
        "SUCCESS"
      );
    }

    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");

    return { success: true, combo: newCombo };
  } catch (error: any) {
    console.error("[CREATE_COMBO]", error);
    return { success: false, error: error.message || "Error al crear el combo" };
  }
}

/**
 * Actualizar un combo existente
 */
export async function updateCombo(idInput: number | string, data: ComboFormData) {
  try {
    const id = Number(idInput);
    if (!id || isNaN(id)) return { success: false, error: "ID de combo inválido" };

    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const parsed = comboSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    const companyId = (await getSessionCompanyId()) ?? (await resolveActionCompanyId());
    if (!companyId) return { success: false, error: "No autorizado" };

    const existingCombo = await prisma.combo.findFirst({
      where: { id, companyId },
      include: { items: true }
    });
    if (!existingCombo) return { success: false, error: "Combo no encontrado o no autorizado" };

    // Validar nombre único si cambió
    if (parsed.data.name.trim() !== existingCombo.name) {
      const duplicateName = await prisma.combo.findFirst({
        where: { name: parsed.data.name.trim(), companyId, id: { not: id } }
      });
      if (duplicateName) {
        return { success: false, error: `Ya existe otro combo con el nombre "${parsed.data.name}"` };
      }
    }

    // Validar productos duplicados
    const productIds = parsed.data.items.map(it => it.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return { success: false, error: "No puedes incluir el mismo producto varias veces en un combo" };
    }

    // Validar pertenencia de productos al tenant
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        companyId
      },
      select: { id: true, name: true, unitCost: true, salePrice: true, quantityAvailable: true, status: true }
    });

    if (products.length !== productIds.length) {
      return { success: false, error: "Uno o más productos no existen o no pertenecen a tu empresa" };
    }

    const prodMap = new Map(products.map(p => [p.id, p]));

    const itemsWithPricing = parsed.data.items.map(it => {
      const prod = prodMap.get(it.productId)!;
      return {
        productId: it.productId,
        quantity: it.quantity,
        unitCost: Number(prod.unitCost || 0),
        salePrice: Number(prod.salePrice || 0),
      };
    });

    const financials = calculateComboFinancials(
      itemsWithPricing,
      parsed.data.pricingType,
      parsed.data.discountPercent,
      parsed.data.customPrice
    );

    // Actualización transaccional: actualizar combo y sincronizar comboItems
    const updatedCombo = await prisma.$transaction(async (tx) => {
      // 1. Eliminar items anteriores
      await tx.comboItem.deleteMany({ where: { comboId: id } });

      // 2. Crear nuevos items y actualizar combo
      return await tx.combo.update({
        where: { id },
        data: {
          code: parsed.data.code?.trim() || existingCombo.code,
          name: parsed.data.name.trim(),
          description: parsed.data.description?.trim() || null,
          image: parsed.data.image || null,
          pricingType: parsed.data.pricingType,
          discountPercent: parsed.data.discountPercent,
          customPrice: parsed.data.customPrice !== undefined ? parsed.data.customPrice : null,
          calculatedCost: financials.calculatedCost,
          commercialPrice: financials.commercialPrice,
          finalPrice: financials.finalPrice,
          targetQuantity: parsed.data.targetQuantity !== undefined && parsed.data.targetQuantity !== null ? Number(parsed.data.targetQuantity) : null,
          isActive: parsed.data.isActive,
          items: {
            create: parsed.data.items.map(it => ({
              productId: it.productId,
              quantity: it.quantity,
              companyId,
            }))
          }
        },
        include: {
          items: { include: { product: true } }
        }
      });
    });

    await logActivity({
      module: "COMBOS",
      action: "UPDATE",
      entity: "Combo",
      entityId: id,
      description: `Actualizó el combo "${updatedCombo.name}" (Precio: $${financials.finalPrice.toLocaleString("es-CO")})`,
      oldValues: existingCombo,
      newValues: updatedCombo,
    });

    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");

    return { success: true, combo: updatedCombo };
  } catch (error: any) {
    console.error("[UPDATE_COMBO]", error);
    return { success: false, error: error.message || "Error al actualizar combo" };
  }
}

/**
 * Eliminar un combo
 */
export async function deleteCombo(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (!id || isNaN(id)) return { success: false, error: "ID inválido" };

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { id, companyId } : { id };

    const combo = await prisma.combo.findFirst({
      where: whereTenant,
      include: {
        _count: { select: { saleDetails: true } }
      }
    });
    if (!combo) return { success: false, error: "Combo no encontrado o no autorizado" };

    if (combo._count.saleDetails > 0) {
      return {
        success: false,
        error: `No puedes eliminar este combo porque ya tiene ${combo._count.saleDetails} venta(s) registrada(s). Puedes desactivarlo en su lugar.`
      };
    }

    await prisma.combo.delete({ where: { id } });

    await logActivity({
      module: "COMBOS",
      action: "DELETE",
      entity: "Combo",
      entityId: id,
      description: `Eliminó el combo "${combo.name}"`,
      oldValues: combo,
    });

    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/sales");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_COMBO]", error);
    return { success: false, error: error.message || "Error al eliminar combo" };
  }
}

/**
 * Alternar estado Activo / Inactivo de un combo
 */
export async function toggleComboStatus(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (!id || isNaN(id)) return { success: false, error: "ID inválido" };

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { id, companyId } : { id };

    const combo = await prisma.combo.findFirst({ where: whereTenant });
    if (!combo) return { success: false, error: "Combo no encontrado" };

    const newStatus = !combo.isActive;
    const updated = await prisma.combo.update({
      where: { id },
      data: { isActive: newStatus }
    });

    await logActivity({
      module: "COMBOS",
      action: "UPDATE",
      entity: "Combo",
      entityId: id,
      description: `${newStatus ? "Activó" : "Desactivó"} el combo "${combo.name}"`,
      oldValues: { isActive: combo.isActive },
      newValues: { isActive: newStatus }
    });

    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/sales");
    return { success: true, isActive: newStatus };
  } catch (error: any) {
    console.error("[TOGGLE_COMBO_STATUS]", error);
    return { success: false, error: error.message || "Error al cambiar estado del combo" };
  }
}

/**
 * Duplicar un combo existente
 */
export async function duplicateCombo(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (!id || isNaN(id)) return { success: false, error: "ID inválido" };

    const companyId = (await getSessionCompanyId()) ?? (await resolveActionCompanyId());
    if (!companyId) return { success: false, error: "No autorizado" };

    const original = await prisma.combo.findFirst({
      where: { id, companyId },
      include: { items: true }
    });
    if (!original) return { success: false, error: "Combo original no encontrado" };

    // Generar un nombre único para la copia
    let newName = `${original.name} (Copia)`;
    let counter = 2;
    while (await prisma.combo.findFirst({ where: { name: newName, companyId } })) {
      newName = `${original.name} (Copia ${counter})`;
      counter++;
    }

    const count = await prisma.combo.count({ where: { companyId } });
    const newCode = `CMB-${String(count + 1).padStart(4, "0")}`;

    const duplicated = await prisma.combo.create({
      data: {
        code: newCode,
        name: newName,
        description: original.description,
        image: original.image,
        pricingType: original.pricingType,
        discountPercent: original.discountPercent,
        customPrice: original.customPrice,
        calculatedCost: original.calculatedCost,
        commercialPrice: original.commercialPrice,
        finalPrice: original.finalPrice,
        targetQuantity: original.targetQuantity,
        isActive: true,
        companyId,
        items: {
          create: original.items.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            companyId,
          }))
        }
      },
      include: { items: { include: { product: true } } }
    });

    await logActivity({
      module: "COMBOS",
      action: "CREATE",
      entity: "Combo",
      entityId: duplicated.id,
      description: `Duplicó el combo "${original.name}" como "${duplicated.name}"`,
      newValues: duplicated
    });

    revalidatePath("/dashboard/combos");
    return { success: true, combo: duplicated };
  } catch (error: any) {
    console.error("[DUPLICATE_COMBO]", error);
    return { success: false, error: error.message || "Error al duplicar combo" };
  }
}

/**
 * Obtiene el inventario comprometido en combos para todos los productos de la empresa
 */
export async function getProductsCommittedStockMap() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado", map: {} };

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { companyId, isActive: true } : { isActive: true };

    const activeCombos = await prisma.combo.findMany({
      where: whereTenant,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                quantityAvailable: true,
                status: true,
                unitCost: true,
                salePrice: true,
                code: true
              }
            }
          }
        }
      }
    });

    // productMap: productId -> { committedInCombos, completeCombosBreakdown: [] }
    const stockMap: Record<number, {
      committedInCombos: number;
      combosInvolved: { comboId: number; comboName: string; requiredQty: number; completeCombos: number }[];
    }> = {};

    for (const combo of activeCombos) {
      const avail = calculateComboStockAvailability({
        targetQuantity: combo.targetQuantity,
        items: combo.items.map(it => ({
          quantity: it.quantity,
          product: it.product
        }))
      });

      // La cantidad comprometida se calcula con los combos completos disponibles
      const comboQtyCommitted = avail.completeCombos;

      for (const item of combo.items) {
        const pId = item.productId;
        if (!stockMap[pId]) {
          stockMap[pId] = { committedInCombos: 0, combosInvolved: [] };
        }

        const committedForThisCombo = comboQtyCommitted * item.quantity;
        stockMap[pId].committedInCombos += committedForThisCombo;
        stockMap[pId].combosInvolved.push({
          comboId: combo.id,
          comboName: combo.name,
          requiredQty: item.quantity,
          completeCombos: avail.completeCombos,
        });
      }
    }

    return { success: true, map: stockMap };
  } catch (error: any) {
    console.error("[GET_COMMITTED_STOCK_MAP]", error);
    return { success: false, error: error.message || "Error al calcular inventario comprometido", map: {} };
  }
}

/**
 * Evalúa si una venta individual de un producto romperá combos completos y calcula
 * cuántos combos deben descompletarse automáticamente para liberar la cantidad faltante.
 */
export async function checkProductSaleImpactOnCombos(productIdInput: number | string, requestedQty: number) {
  try {
    const productId = Number(productIdInput);
    if (!productId || isNaN(productId)) return { success: false, error: "Producto inválido" };

    const companyId = await getSessionCompanyId();
    if (!companyId) return { success: false, error: "No autorizado" };

    const settings = await prisma.companySetting.findUnique({ where: { companyId } });
    if (!settings?.enableCombos) {
      // El módulo de combos no está activo para la empresa -> sin restricciones de combo
      return {
        success: true,
        hasImpact: false,
        allowSaleFromCommitted: true,
        combosImpacted: [],
        combosToUncomplete: 0,
        uncommittedAvailable: Infinity,
      };
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId }
    });
    if (!product) return { success: false, error: "Producto no encontrado" };

    // Buscar combos activos donde este producto participe
    const activeCombos = await prisma.combo.findMany({
      where: { companyId, isActive: true, items: { some: { productId } } },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                quantityAvailable: true,
                status: true,
                unitCost: true,
                salePrice: true,
              }
            }
          }
        }
      }
    });

    if (activeCombos.length === 0) {
      return {
        success: true,
        hasImpact: false,
        allowSaleFromCommitted: settings.allowSaleFromCommittedCombos,
        combosImpacted: [],
        combosToUncomplete: 0,
        uncommittedAvailable: product.quantityAvailable,
      };
    }

    // Calcular cuántos combos completos existen y cuánto stock de este producto está comprometido
    let totalCommitted = 0;
    const combosBreakdown: {
      comboId: number;
      comboName: string;
      completeCombos: number;
      requiredPerCombo: number;
      combosToBreak: number;
    }[] = [];

    for (const combo of activeCombos) {
      const item = combo.items.find(it => it.productId === productId)!;
      const avail = calculateComboStockAvailability({
        targetQuantity: combo.targetQuantity,
        items: combo.items.map(it => ({
          quantity: it.quantity,
          product: it.product
        }))
      });

      const complete = avail.completeCombos;
      const committed = complete * item.quantity;
      totalCommitted += committed;

      combosBreakdown.push({
        comboId: combo.id,
        comboName: combo.name,
        completeCombos: complete,
        requiredPerCombo: item.quantity,
        combosToBreak: 0,
      });
    }

    const uncommittedAvailable = Math.max(0, product.quantityAvailable - totalCommitted);

    // Si la cantidad solicitada supera el disponible NO comprometido
    if (requestedQty > uncommittedAvailable) {
      const unitsNeededFromCommitted = requestedQty - uncommittedAvailable;

      let remainingUnitsToFree = unitsNeededFromCommitted;
      let totalCombosToBreak = 0;

      for (const cb of combosBreakdown) {
        if (remainingUnitsToFree <= 0) break;
        if (cb.completeCombos > 0) {
          const neededCombos = Math.ceil(remainingUnitsToFree / cb.requiredPerCombo);
          const breakCount = Math.min(cb.completeCombos, neededCombos);
          cb.combosToBreak = breakCount;
          totalCombosToBreak += breakCount;
          remainingUnitsToFree -= breakCount * cb.requiredPerCombo;
        }
      }

      return {
        success: true,
        hasImpact: true,
        allowSaleFromCommitted: settings.allowSaleFromCommittedCombos,
        physicalStock: product.quantityAvailable,
        committedStock: totalCommitted,
        uncommittedAvailable,
        requestedQty,
        unitsNeededFromCommitted,
        combosToUncomplete: totalCombosToBreak,
        combosImpacted: combosBreakdown.filter(c => c.combosToBreak > 0),
      };
    }

    return {
      success: true,
      hasImpact: false,
      allowSaleFromCommitted: settings.allowSaleFromCommittedCombos,
      physicalStock: product.quantityAvailable,
      committedStock: totalCommitted,
      uncommittedAvailable,
      requestedQty,
      combosToUncomplete: 0,
      combosImpacted: [],
    };
  } catch (error: any) {
    console.error("[CHECK_SALE_IMPACT]", error);
    return { success: false, error: error.message || "Error al evaluar impacto en combos" };
  }
}

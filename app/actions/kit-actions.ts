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
  calculateKitFinancials,
  calculateKitStockAvailability,
  type KitFinancials,
  type KitAvailability,
} from "@/lib/kit-utils";

const kitItemSchema = z.object({
  productId: z.coerce.number().min(1, "Producto inválido"),
  quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
});

const kitSchema = z.object({
  code: z.string().optional().nullable(),
  name: z.string().min(2, "El nombre del kit es obligatorio"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  pricingType: z.enum(["DISCOUNT_PERCENT", "CUSTOM_PRICE"]).default("DISCOUNT_PERCENT"),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  customPrice: z.coerce.number().min(0).optional().nullable(),
  targetQuantity: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(kitItemSchema).min(1, "Debes agregar al menos un producto al kit"),
});

export type KitFormData = z.infer<typeof kitSchema>;
export type ComboFormData = KitFormData;

/**
 * Obtener todos los kits de la empresa actual con cálculo dinámico de existencias y rentabilidad
 */
export async function getKits() {
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

    // Enriquecer cada kit con cálculos dinámicos en tiempo real
    const enrichedCombos = combos.map((combo) => {
      const itemsForFinancials = combo.items.map((it) => ({
        quantity: it.quantity,
        unitCost: Number(it.product.unitCost || 0),
        salePrice: Number(it.product.salePrice || 0),
      }));

      const financials = calculateKitFinancials(
        itemsForFinancials,
        combo.pricingType as "DISCOUNT_PERCENT" | "CUSTOM_PRICE",
        combo.discountPercent,
        combo.customPrice
      );

      const itemsForAvailability = combo.items.map((it) => ({
        quantity: it.quantity,
        product: it.product,
      }));

      const availability = calculateKitStockAvailability({
        targetQuantity: combo.targetQuantity,
        items: itemsForAvailability,
      });

      return {
        ...combo,
        ...financials,
        ...availability,
        itemsCount: combo.items.length,
        items: combo.items.map((it) => ({
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
            groupName: it.product.productGroup?.name ?? null,
            categoryName: it.product.category?.name ?? null,
          }
        })),
        createdAt: combo.createdAt.toISOString(),
        updatedAt: combo.updatedAt.toISOString(),
      };
    });

    return { success: true, combos: enrichedCombos, kits: enrichedCombos };
  } catch (error: any) {
    console.error("Error al obtener kits:", error);
    return { success: false, error: error.message || "Error al obtener kits" };
  }
}

export const getCombos = getKits;

/**
 * Obtener un kit específico por ID
 */
export async function getKitById(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (isNaN(id)) return { success: false, error: "ID de kit inválido" };

    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { id, companyId } : { id };

    const combo = await prisma.combo.findFirst({
      where: whereTenant,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                productGroup: true,
              }
            }
          }
        }
      }
    });

    if (!combo) return { success: false, error: "Kit no encontrado o no autorizado" };

    const itemsForFinancials = combo.items.map((it) => ({
      quantity: it.quantity,
      unitCost: Number(it.product.unitCost || 0),
      salePrice: Number(it.product.salePrice || 0),
    }));

    const financials = calculateKitFinancials(
      itemsForFinancials,
      combo.pricingType as "DISCOUNT_PERCENT" | "CUSTOM_PRICE",
      combo.discountPercent,
      combo.customPrice
    );

    const itemsForAvailability = combo.items.map((it) => ({
      quantity: it.quantity,
      product: it.product,
    }));

    const availability = calculateKitStockAvailability({
      targetQuantity: combo.targetQuantity,
      items: itemsForAvailability,
    });

    const enrichedCombo = {
      ...combo,
      ...financials,
      ...availability,
      itemsCount: combo.items.length,
      items: combo.items.map((it) => ({
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
          groupName: it.product.productGroup?.name ?? null,
          categoryName: it.product.category?.name ?? null,
        }
      })),
      createdAt: combo.createdAt.toISOString(),
      updatedAt: combo.updatedAt.toISOString(),
    };

    return { success: true, combo: enrichedCombo, kit: enrichedCombo };
  } catch (error: any) {
    console.error("Error al obtener kit:", error);
    return { success: false, error: error.message || "Error al obtener kit" };
  }
}

export const getComboById = getKitById;

/**
 * Crear un nuevo kit comercial
 */
export async function createKit(data: KitFormData) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const parsed = kitSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Datos inválidos" };
    }

    const { code, name, description, image, pricingType, discountPercent, customPrice, targetQuantity, isActive, items } = parsed.data;

    // Verificar que los productos existan y pertenezcan a la empresa
    const companyId = await getSessionCompanyId();
    const productIds = items.map(i => i.productId);

    // Validar productos duplicados en el kit
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return { success: false, error: "No puedes agregar el mismo producto más de una vez en un kit. Ajusta la cantidad." };
    }

    const whereProducts = companyId ? { id: { in: productIds }, companyId } : { id: { in: productIds } };
    const existingProducts = await prisma.product.findMany({
      where: whereProducts,
      select: { id: true, name: true, code: true, quantityAvailable: true, unitCost: true, salePrice: true }
    });

    if (existingProducts.length !== productIds.length) {
      return { success: false, error: "Uno o más productos seleccionados no existen o no pertenecen a tu empresa" };
    }

    // Código autogenerado si no se proporcionó
    let finalCode = code?.trim() || null;
    if (!finalCode) {
      const count = await prisma.combo.count({ where: companyId ? { companyId } : {} });
      finalCode = `KIT-${String(count + 1).padStart(4, '0')}`;
    }

    // Verificar código único por empresa
    if (finalCode) {
      const duplicateCode = await prisma.combo.findFirst({
        where: companyId ? { code: finalCode, companyId } : { code: finalCode }
      });
      if (duplicateCode) {
        return { success: false, error: `Ya existe un kit con el código "${finalCode}"` };
      }
    }

    const resolvedCompanyId = companyId || await resolveActionCompanyId();

    const created = await prisma.combo.create({
      data: {
        code: finalCode,
        name: name.trim(),
        description: description?.trim() || null,
        image: image || null,
        pricingType,
        discountPercent,
        customPrice: pricingType === "CUSTOM_PRICE" ? customPrice : null,
        targetQuantity: targetQuantity || null,
        isActive,
        companyId: resolvedCompanyId,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    await logActivity({
      module: "INVENTORY",
      action: "CREATE",
      entity: "Kit",
      entityId: created.id,
      description: `Creó el kit comercial "${created.name}" con ${items.length} componentes`,
      newValues: created
    });

    revalidatePath("/dashboard/kits");
    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/sales");

    return { success: true, combo: created, kit: created };
  } catch (error: any) {
    console.error("Error al crear kit:", error);
    return { success: false, error: error.message || "Error al crear kit" };
  }
}

export const createCombo = createKit;

/**
 * Actualizar un kit existente
 */
export async function updateKit(idInput: number | string, data: KitFormData) {
  try {
    const id = Number(idInput);
    if (isNaN(id)) return { success: false, error: "ID inválido" };

    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const parsed = kitSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Datos inválidos" };
    }

    const { code, name, description, image, pricingType, discountPercent, customPrice, targetQuantity, isActive, items } = parsed.data;

    const companyId = await getSessionCompanyId();
    const existingCombo = await prisma.combo.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { items: true }
    });

    if (!existingCombo) {
      return { success: false, error: "Kit no encontrado o no autorizado" };
    }

    const productIds = items.map(i => i.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return { success: false, error: "No puedes agregar el mismo producto más de una vez en un kit." };
    }

    const whereProducts = companyId ? { id: { in: productIds }, companyId } : { id: { in: productIds } };
    const existingProducts = await prisma.product.findMany({
      where: whereProducts,
      select: { id: true }
    });

    if (existingProducts.length !== productIds.length) {
      return { success: false, error: "Uno o más productos no existen o no pertenecen a tu empresa" };
    }

    let finalCode = code?.trim() || null;
    if (finalCode) {
      const duplicateCode = await prisma.combo.findFirst({
        where: companyId
          ? { code: finalCode, companyId, id: { not: id } }
          : { code: finalCode, id: { not: id } }
      });
      if (duplicateCode) {
        return { success: false, error: `Ya existe otro kit con el código "${finalCode}"` };
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Eliminar items antiguos
      await tx.comboItem.deleteMany({
        where: { comboId: id }
      });

      // Actualizar cabecera y crear nuevos items
      return await tx.combo.update({
        where: { id },
        data: {
          code: finalCode,
          name: name.trim(),
          description: description?.trim() || null,
          image: image || null,
          pricingType,
          discountPercent,
          customPrice: pricingType === "CUSTOM_PRICE" ? customPrice : null,
          targetQuantity: targetQuantity || null,
          isActive,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
    });

    await logActivity({
      module: "INVENTORY",
      action: "UPDATE",
      entity: "Kit",
      entityId: id,
      description: `Actualizó el kit comercial "${updated.name}"`,
      oldValues: existingCombo,
      newValues: updated
    });

    revalidatePath("/dashboard/kits");
    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/sales");

    return { success: true, combo: updated, kit: updated };
  } catch (error: any) {
    console.error("Error al actualizar kit:", error);
    return { success: false, error: error.message || "Error al actualizar kit" };
  }
}

export const updateCombo = updateKit;

/**
 * Eliminar un kit comercial
 */
export async function deleteKit(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (isNaN(id)) return { success: false, error: "ID inválido" };

    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const companyId = await getSessionCompanyId();
    const existingCombo = await prisma.combo.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { saleDetails: true }
    });

    if (!existingCombo) {
      return { success: false, error: "Kit no encontrado o no autorizado" };
    }

    // Si tiene ventas asociadas, se desactiva en vez de borrado duro para mantener consistencia contable
    if (existingCombo.saleDetails && existingCombo.saleDetails.length > 0) {
      await prisma.combo.update({
        where: { id },
        data: { isActive: false }
      });

      await logActivity({
        module: "INVENTORY",
        action: "DEACTIVATE",
        entity: "Kit",
        entityId: id,
        description: `Desactivó el kit "${existingCombo.name}" (posee ventas históricas asociadas)`
      });

      revalidatePath("/dashboard/kits");
      revalidatePath("/dashboard/combos");
      return { success: true, message: "El kit tiene ventas asociadas. Ha sido desactivado para mantener el historial contable." };
    }

    await prisma.combo.delete({
      where: { id }
    });

    await logActivity({
      module: "INVENTORY",
      action: "DELETE",
      entity: "Kit",
      entityId: id,
      description: `Eliminó el kit comercial "${existingCombo.name}"`
    });

    revalidatePath("/dashboard/kits");
    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/sales");

    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar kit:", error);
    return { success: false, error: error.message || "Error al eliminar kit" };
  }
}

export const deleteCombo = deleteKit;

/**
 * Cambiar estado activo / inactivo de un kit
 */
export async function toggleKitStatus(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (isNaN(id)) return { success: false, error: "ID inválido" };

    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const companyId = await getSessionCompanyId();
    const existingCombo = await prisma.combo.findFirst({
      where: companyId ? { id, companyId } : { id }
    });

    if (!existingCombo) return { success: false, error: "Kit no encontrado" };

    const updated = await prisma.combo.update({
      where: { id },
      data: { isActive: !existingCombo.isActive }
    });

    await logActivity({
      module: "INVENTORY",
      action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
      entity: "Kit",
      entityId: id,
      description: `Cambió el estado del kit "${updated.name}" a ${updated.isActive ? 'ACTIVO' : 'INACTIVO'}`
    });

    revalidatePath("/dashboard/kits");
    revalidatePath("/dashboard/combos");
    revalidatePath("/dashboard/sales");

    return { success: true, isActive: updated.isActive };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al cambiar estado" };
  }
}

export const toggleComboStatus = toggleKitStatus;

/**
 * Duplicar un kit
 */
export async function duplicateKit(idInput: number | string) {
  try {
    const id = Number(idInput);
    if (isNaN(id)) return { success: false, error: "ID inválido" };

    const session = await getAuthSession();
    if (!session?.user) return { success: false, error: "No autenticado" };

    const companyId = await getSessionCompanyId();
    const original = await prisma.combo.findFirst({
      where: companyId ? { id, companyId } : { id },
      include: { items: true }
    });

    if (!original) return { success: false, error: "Kit original no encontrado" };

    const count = await prisma.combo.count({ where: companyId ? { companyId } : {} });
    const newCode = `KIT-${String(count + 1).padStart(4, '0')}`;
    const newName = `${original.name} (Copia)`;

    const resolvedCompanyId = companyId || await resolveActionCompanyId();

    const duplicated = await prisma.combo.create({
      data: {
        code: newCode,
        name: newName,
        description: original.description,
        image: original.image,
        pricingType: original.pricingType,
        discountPercent: original.discountPercent,
        customPrice: original.customPrice,
        targetQuantity: original.targetQuantity,
        isActive: false, // Inactivo por defecto para revisión
        companyId: resolvedCompanyId,
        items: {
          create: original.items.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
          }))
        }
      }
    });

    await logActivity({
      module: "INVENTORY",
      action: "DUPLICATE",
      entity: "Kit",
      entityId: duplicated.id,
      description: `Duplicó el kit "${original.name}" creando "${duplicated.name}"`
    });

    revalidatePath("/dashboard/kits");
    revalidatePath("/dashboard/combos");

    return { success: true, combo: duplicated, kit: duplicated };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al duplicar kit" };
  }
}

export const duplicateCombo = duplicateKit;

/**
 * Obtener un mapa de productos y su stock comprometido en kits completos armables
 */
export async function getProductsCommittedStockMap() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return {};

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
                code: true,
                quantityAvailable: true,
                unitCost: true,
                salePrice: true,
                status: true,
              }
            }
          }
        }
      }
    });

    const committedMap: Record<number, {
      committedInCombos: number;
      combosDetails: { comboId: number; comboName: string; completeCombos: number; requiredPerCombo: number; committedStock: number }[];
    }> = {};

    for (const combo of activeCombos) {
      const avail = calculateKitStockAvailability({
        targetQuantity: combo.targetQuantity,
        items: combo.items.map(it => ({
          quantity: it.quantity,
          product: it.product
        }))
      });

      const complete = avail.completeCombos;
      if (complete > 0) {
        for (const item of combo.items) {
          const committedForThisCombo = complete * item.quantity;
          if (!committedMap[item.productId]) {
            committedMap[item.productId] = {
              committedInCombos: 0,
              combosDetails: []
            };
          }

          committedMap[item.productId].committedInCombos += committedForThisCombo;
          committedMap[item.productId].combosDetails.push({
            comboId: combo.id,
            comboName: combo.name,
            completeCombos: complete,
            requiredPerCombo: item.quantity,
            committedStock: committedForThisCombo,
          });
        }
      }
    }

    return committedMap;
  } catch (error) {
    console.error("Error al calcular stock comprometido en kits:", error);
    return {};
  }
}

/**
 * Validar impacto de venta individual sobre kits armables
 */
export async function checkProductSaleImpactOnKits(productId: number, quantityToSell: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return { hasImpact: false };

    const companyId = await getSessionCompanyId();
    const settings = await prisma.companySetting.findFirst({
      where: companyId ? { companyId } : {}
    });

    if (!settings?.enableCombos) {
      return { hasImpact: false };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, code: true, quantityAvailable: true }
    });

    if (!product) return { hasImpact: false };

    const activeCombos = await prisma.combo.findMany({
      where: companyId ? { companyId, isActive: true, items: { some: { productId } } } : { isActive: true, items: { some: { productId } } },
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
              }
            }
          }
        }
      }
    });

    if (activeCombos.length === 0) {
      return {
        hasImpact: false,
        allowSaleFromCommitted: settings.allowSaleFromCommittedCombos,
        combosImpacted: [],
        combosToUncomplete: 0,
        uncommittedAvailable: product.quantityAvailable,
      };
    }

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
      const avail = calculateKitStockAvailability({
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

    const freeStock = Math.max(0, product.quantityAvailable - totalCommitted);
    const touchesCommitted = quantityToSell > freeStock;

    if (!touchesCommitted) {
      return {
        hasImpact: false,
        allowSaleFromCommitted: settings.allowSaleFromCommittedCombos,
        combosImpacted: [],
        combosToUncomplete: 0,
        uncommittedAvailable: freeStock,
      };
    }

    const excessToTake = quantityToSell - freeStock;
    let unitsLeftToTake = excessToTake;
    let totalCombosBroken = 0;

    const impactedCombos = combosBreakdown.map(c => {
      if (unitsLeftToTake <= 0) return c;
      const combosBroken = Math.min(c.completeCombos, Math.ceil(unitsLeftToTake / c.requiredPerCombo));
      unitsLeftToTake = Math.max(0, unitsLeftToTake - (combosBroken * c.requiredPerCombo));
      totalCombosBroken += combosBroken;
      return {
        ...c,
        combosToBreak: combosBroken,
      };
    }).filter(c => c.combosToBreak > 0);

    return {
      hasImpact: true,
      allowSaleFromCommitted: settings.allowSaleFromCommittedCombos,
      productName: product.name,
      quantityToSell,
      freeStock,
      totalCommitted,
      combosToUncomplete: totalCombosBroken,
      combosImpacted: impactedCombos,
    };
  } catch (error) {
    console.error("Error al verificar impacto en kits:", error);
    return { hasImpact: false };
  }
}

export const checkProductSaleImpactOnCombos = checkProductSaleImpactOnKits;

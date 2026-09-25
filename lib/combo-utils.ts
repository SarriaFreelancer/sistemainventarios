/**
 * Utilidades puras de cálculo de rentabilidad y stock dinámico para el módulo de Combos
 */

export interface ComboFinancials {
  calculatedCost: number;
  commercialPrice: number;
  finalPrice: number;
  profit: number;
  marginPercent: number;
  effectiveDiscount: number;
}

export interface LimitingProduct {
  id: number;
  name: string;
  code: string;
  quantityAvailable: number;
  requiredPerCombo: number;
  possibleCombos: number;
}

export interface ComponentStatus {
  productId: number;
  name: string;
  code: string;
  quantityAvailable: number;
  requiredPerCombo: number;
  possibleCombos: number;
  unitCost: number;
  salePrice: number;
}

export interface ComboAvailability {
  completeCombos: number;
  incompleteCombos: number;
  limitingProduct: LimitingProduct | null;
  componentStatus: ComponentStatus[];
  hasInactiveProducts: boolean;
  statusAvailability: 'COMPLETE' | 'INCOMPLETE' | 'OUT_OF_STOCK';
}

/**
 * Calcula dinámicamente el costo, precio comercial, precio final, utilidad y margen de un combo
 */
export function calculateComboFinancials(
  items: { quantity: number; unitCost: number; salePrice: number }[],
  pricingType: "DISCOUNT_PERCENT" | "CUSTOM_PRICE",
  discountPercent: number = 0,
  customPrice?: number | null
): ComboFinancials {
  const calculatedCost = items.reduce((sum, it) => sum + (Number(it.unitCost || 0) * it.quantity), 0);
  const commercialPrice = items.reduce((sum, it) => sum + (Number(it.salePrice || 0) * it.quantity), 0);

  let finalPrice = commercialPrice;
  if (pricingType === "DISCOUNT_PERCENT") {
    const discVal = (commercialPrice * Math.max(0, Math.min(100, discountPercent))) / 100;
    finalPrice = Math.max(0, commercialPrice - discVal);
  } else if (pricingType === "CUSTOM_PRICE" && customPrice !== undefined && customPrice !== null) {
    finalPrice = Math.max(0, Number(customPrice));
  }

  const profit = finalPrice - calculatedCost;
  const marginPercent = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
  const effectiveDiscount = commercialPrice > 0 ? Math.max(0, ((commercialPrice - finalPrice) / commercialPrice) * 100) : 0;

  return {
    calculatedCost,
    commercialPrice,
    finalPrice,
    profit,
    marginPercent,
    effectiveDiscount,
  };
}

/**
 * Calcula la disponibilidad de un combo:
 * - Combos completos (limitados por el componente con menor ratio stock/cant_requerida)
 * - Combos incompletos
 * - Producto(s) limitante(s)
 * - Componentes
 */
export function calculateComboStockAvailability(combo: {
  targetQuantity?: number | null;
  items: {
    quantity: number;
    product: {
      id: number;
      name: string;
      code: string;
      quantityAvailable: number;
      status?: string;
      unitCost?: number;
      salePrice?: number;
    };
  }[];
}): ComboAvailability {
  if (!combo.items || combo.items.length === 0) {
    return {
      completeCombos: 0,
      incompleteCombos: 0,
      limitingProduct: null,
      componentStatus: [],
      hasInactiveProducts: false,
      statusAvailability: 'OUT_OF_STOCK',
    };
  }

  let minCombos = Infinity;
  let maxPotentialCombos = 0;
  let limitingProduct: LimitingProduct | null = null;
  let hasInactiveProducts = false;

  const componentStatus: ComponentStatus[] = combo.items.map((item) => {
    const prod = item.product;
    if (prod.status === "OUT_OF_STOCK" && prod.quantityAvailable <= 0) {
      // Indicador de agotado
    }
    const possibleCombos = item.quantity > 0 ? Math.floor(Math.max(0, prod.quantityAvailable) / item.quantity) : 0;

    if (possibleCombos < minCombos) {
      minCombos = possibleCombos;
      limitingProduct = {
        id: prod.id,
        name: prod.name,
        code: prod.code,
        quantityAvailable: prod.quantityAvailable,
        requiredPerCombo: item.quantity,
        possibleCombos,
      };
    }

    if (possibleCombos > maxPotentialCombos) {
      maxPotentialCombos = possibleCombos;
    }

    return {
      productId: prod.id,
      name: prod.name,
      code: prod.code,
      quantityAvailable: prod.quantityAvailable,
      requiredPerCombo: item.quantity,
      possibleCombos,
      unitCost: Number(prod.unitCost || 0),
      salePrice: Number(prod.salePrice || 0),
    };
  });

  const completeCombos = minCombos === Infinity ? 0 : minCombos;

  let incompleteCombos = 0;
  if (combo.targetQuantity !== null && combo.targetQuantity !== undefined && combo.targetQuantity > 0) {
    incompleteCombos = Math.max(0, combo.targetQuantity - completeCombos);
  } else {
    incompleteCombos = Math.max(0, maxPotentialCombos - completeCombos);
  }

  let statusAvailability: 'COMPLETE' | 'INCOMPLETE' | 'OUT_OF_STOCK' = 'COMPLETE';
  if (completeCombos === 0) {
    statusAvailability = 'OUT_OF_STOCK';
  } else if (combo.targetQuantity && completeCombos < combo.targetQuantity) {
    statusAvailability = 'INCOMPLETE';
  }

  return {
    completeCombos,
    incompleteCombos,
    limitingProduct,
    componentStatus,
    hasInactiveProducts,
    statusAvailability,
  };
}

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Layers,
  Plus,
  Trash2,
  Search,
  DollarSign,
  TrendingUp,
  Percent,
  Check,
  AlertTriangle,
  Package,
  Boxes,
  Sparkles,
  Info,
  X,
} from "lucide-react";
import { createKit, updateKit, KitFormData } from "@/app/actions/kit-actions";
import { calculateKitFinancials } from "@/lib/kit-utils";
import { successAlert, errorAlert } from "@/lib/sweetalert";

interface ProductOption {
  id: number;
  code: string;
  name: string;
  quantityAvailable: number;
  unitCost: number;
  salePrice: number;
  status: string;
  categoryName?: string | null;
  groupName?: string | null;
}

interface KitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  kitToEdit?: any | null;
  availableProducts: ProductOption[];
}

export function KitFormModal({
  open,
  onClose,
  onSuccess,
  kitToEdit,
  availableProducts,
}: KitFormModalProps) {
  const isEditing = !!kitToEdit;

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState<"DISCOUNT_PERCENT" | "CUSTOM_PRICE">("DISCOUNT_PERCENT");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [targetQuantity, setTargetQuantity] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  // Selected items: { productId, quantity, product }
  const [items, setItems] = useState<
    { productId: number; quantity: number; product: ProductOption }[]
  >([]);

  // Product search in modal
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or initialize form
  useEffect(() => {
    if (open) {
      if (kitToEdit) {
        setCode(kitToEdit.code || "");
        setName(kitToEdit.name || "");
        setDescription(kitToEdit.description || "");
        setPricingType(kitToEdit.pricingType || "DISCOUNT_PERCENT");
        setDiscountPercent(kitToEdit.discountPercent || 0);
        setCustomPrice(kitToEdit.customPrice ? String(kitToEdit.customPrice) : "");
        setTargetQuantity(kitToEdit.targetQuantity ? String(kitToEdit.targetQuantity) : "");
        setIsActive(kitToEdit.isActive !== undefined ? kitToEdit.isActive : true);

        // Populate items
        const populatedItems = (kitToEdit.items || []).map((it: any) => {
          const foundProd = availableProducts.find((p) => p.id === it.productId) || {
            id: it.productId,
            name: it.product?.name || "Producto",
            code: it.product?.code || "—",
            quantityAvailable: it.product?.quantityAvailable ?? 0,
            unitCost: Number(it.product?.unitCost || 0),
            salePrice: Number(it.product?.salePrice || 0),
            status: "AVAILABLE",
          };
          return {
            productId: it.productId,
            quantity: it.quantity || 1,
            product: foundProd,
          };
        });
        setItems(populatedItems);
      } else {
        // Reset to default
        setCode("");
        setName("");
        setDescription("");
        setPricingType("DISCOUNT_PERCENT");
        setDiscountPercent(0);
        setCustomPrice("");
        setTargetQuantity("");
        setIsActive(true);
        setItems([]);
      }
      setProductSearch("");
      setSelectedCategoryFilter("ALL");
    }
  }, [open, kitToEdit, availableProducts]);

  // Handle adding product to kit
  const handleAddProduct = (prod: ProductOption) => {
    if (items.some((i) => i.productId === prod.id)) {
      // Incrementar cantidad si ya existe
      setItems((prev) =>
        prev.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          quantity: 1,
          product: prod,
        },
      ]);
    }
  };

  const handleUpdateItemQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const handleRemoveItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Filtered available products for search dropdown
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return availableProducts.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const matchesCat =
        selectedCategoryFilter === "ALL" ||
        p.categoryName === selectedCategoryFilter ||
        p.groupName === selectedCategoryFilter;
      return matchesQuery && matchesCat;
    }).slice(0, 10);
  }, [availableProducts, productSearch, selectedCategoryFilter]);

  // Categories list for filtering
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    availableProducts.forEach((p) => {
      if (p.categoryName) cats.add(p.categoryName);
      if (p.groupName) cats.add(p.groupName);
    });
    return Array.from(cats);
  }, [availableProducts]);

  // Financial calculations
  const financials = useMemo(() => {
    const itemsForCalc = items.map((i) => ({
      quantity: i.quantity,
      unitCost: i.product.unitCost,
      salePrice: i.product.salePrice,
    }));
    return calculateKitFinancials(
      itemsForCalc,
      pricingType,
      discountPercent,
      customPrice ? parseFloat(customPrice) : null
    );
  }, [items, pricingType, discountPercent, customPrice]);

  // Stock availability estimation
  const stockEstimation = useMemo<{ completeKits: number; limitingProduct: ProductOption | null }>(() => {
    if (items.length === 0) return { completeKits: 0, limitingProduct: null };
    let minKits = Infinity;
    let limiting: ProductOption | null = null;

    items.forEach((item) => {
      const possible = item.quantity > 0 ? Math.floor(item.product.quantityAvailable / item.quantity) : 0;
      if (possible < minKits) {
        minKits = possible;
        limiting = item.product;
      }
    });

    return {
      completeKits: minKits === Infinity ? 0 : minKits,
      limitingProduct: limiting,
    };
  }, [items]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      errorAlert("Campo Obligatorio", "Por favor ingresa un nombre para el kit.");
      return;
    }

    if (items.length === 0) {
      errorAlert("Componentes requeridos", "Debes agregar al menos un producto componente al kit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: KitFormData = {
        code: code.trim() || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        pricingType,
        discountPercent: Number(discountPercent) || 0,
        customPrice: pricingType === "CUSTOM_PRICE" && customPrice ? parseFloat(customPrice) : undefined,
        targetQuantity: targetQuantity ? parseInt(targetQuantity) : undefined,
        isActive,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const result = isEditing
        ? await updateKit(kitToEdit.id, payload)
        : await createKit(payload);

      if (result.success) {
        await successAlert(
          isEditing ? "¡Kit Actualizado!" : "¡Kit Creado!",
          isEditing
            ? `El kit "${name}" ha sido actualizado correctamente.`
            : `El kit "${name}" ha sido registrado con éxito.`
        );
        onSuccess();
        onClose();
      } else {
        errorAlert("Error al procesar", result.error || "Ocurrió un error inesperado");
      }
    } catch (err: any) {
      errorAlert("Error inesperado", err.message || "No se pudo guardar el kit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border border-border bg-card shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {isEditing ? "Editar Kit de Productos" : "Nuevo Kit de Productos"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Inventario → Kits: Crea paquetes comerciales con stock dinámico derivado
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Fila 1: Datos Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-foreground">Nombre del Kit *</Label>
              <Input
                placeholder="Ej. Kit Rutina Skincare Glow, Kit Maquillaje Pro..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Código / SKU (Opcional)</Label>
              <Input
                placeholder="Ej. KIT-0001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-10 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Descripción Comercial</Label>
            <Textarea
              placeholder="Describe lo que incluye este kit o sugerencias de venta..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-xl resize-none text-xs"
            />
          </div>

          {/* Fila 2: Componentes del Kit (Selección Interactiva) */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Componentes del Kit ({items.length})
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Los productos se descuentan individualmente al vender el kit
              </span>
            </div>

            {/* Buscador de productos para añadir */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre o código para añadir..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-xl bg-card"
                  />
                </div>
                {categoryOptions.length > 0 && (
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="h-9 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none"
                  >
                    <option value="ALL">Todas las Categorías</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lista desplegable de resultados rápidos */}
              {productSearch.trim().length > 0 && (
                <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-card divide-y divide-border">
                  {filteredProducts.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No se encontraron productos coincidentes.
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isAlreadyIn = items.some((i) => i.productId === p.id);
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 hover:bg-muted/50 transition cursor-pointer"
                          onClick={() => handleAddProduct(p)}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className="font-mono">{p.code}</span>
                              <span>•</span>
                              <span>
                                Stock:{" "}
                                <strong className={p.quantityAvailable > 0 ? "text-emerald-500" : "text-red-500"}>
                                  {p.quantityAvailable} uds
                                </strong>
                              </span>
                              <span>•</span>
                              <span>
                                Precio:{" "}
                                {p.salePrice.toLocaleString("es-CO", {
                                  style: "currency",
                                  currency: "COP",
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={isAlreadyIn ? "secondary" : "default"}
                            className="h-7 text-xs rounded-lg px-2.5 gap-1 shrink-0"
                          >
                            {isAlreadyIn ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {isAlreadyIn ? "Añadido (+1)" : "Añadir"}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Tabla de componentes seleccionados */}
            {items.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-2xl bg-muted/10 space-y-2">
                <Package className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-xs font-medium text-muted-foreground">
                  Aún no has agregado componentes a este kit.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  Usa el buscador superior para seleccionar los productos que conforman este kit comercial.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden bg-card divide-y divide-border">
                <div className="grid grid-cols-[1fr_8rem_6rem_6rem_2.5rem] gap-2 p-2.5 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div>Producto Componente</div>
                  <div className="text-center">Cant. Requerida</div>
                  <div className="text-right">Costo Total</div>
                  <div className="text-right">Precio Reg.</div>
                  <div></div>
                </div>

                {items.map((item) => {
                  const itemCostTotal = item.product.unitCost * item.quantity;
                  const itemSaleTotal = item.product.salePrice * item.quantity;
                  const possibleKitsFromThis = Math.floor(item.product.quantityAvailable / item.quantity);

                  return (
                    <div
                      key={item.productId}
                      className="grid grid-cols-[1fr_8rem_6rem_6rem_2.5rem] gap-2 p-2.5 items-center hover:bg-muted/20 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span className="font-mono">{item.product.code}</span>
                          <span>•</span>
                          <span>Stock: {item.product.quantityAvailable} uds</span>
                          <span>•</span>
                          <span className={possibleKitsFromThis <= 0 ? "text-red-500 font-bold" : "text-muted-foreground"}>
                            (Alcanza para {possibleKitsFromThis} kits)
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(item.productId, item.quantity - 1)}
                          className="h-6 w-6 rounded-md border border-border bg-muted/50 text-foreground font-bold flex items-center justify-center hover:bg-primary hover:text-white transition"
                        >
                          -
                        </button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemQuantity(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="h-7 w-12 text-center text-xs font-bold rounded-md px-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(item.productId, item.quantity + 1)}
                          className="h-6 w-6 rounded-md border border-border bg-muted/50 text-foreground font-bold flex items-center justify-center hover:bg-primary hover:text-white transition"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right text-xs font-medium text-muted-foreground">
                        {itemCostTotal.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </div>

                      <div className="text-right text-xs font-semibold text-foreground">
                        {itemSaleTotal.toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition"
                          title="Quitar producto del kit"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fila 3: Estrategia de Precios y Rentabilidad */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Estrategia de Precio y Rentabilidad
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tipo de fijación de precio */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Modalidad de Precio</Label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-card border border-border rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPricingType("DISCOUNT_PERCENT")}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      pricingType === "DISCOUNT_PERCENT"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    % Descuento
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType("CUSTOM_PRICE")}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      pricingType === "CUSTOM_PRICE"
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Precio Fijo
                  </button>
                </div>
              </div>

              {/* Parámetro según tipo */}
              {pricingType === "DISCOUNT_PERCENT" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Descuento al Kit (%)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                      className="h-10 rounded-xl pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Precio Final del Kit (COP)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="h-10 rounded-xl pr-8"
                    />
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Meta de kits armables (opcional) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Meta de Kits Armables (Opcional)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Ej. 10 para alertar si baja"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Panel de Resumen Financiero en Vivo */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 border-t border-border/60">
              <div className="p-2.5 rounded-xl bg-card border border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Suma Costos</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">
                  {financials.calculatedCost.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Precio Regular</p>
                <p className="text-xs sm:text-sm font-bold text-foreground line-through opacity-70">
                  {financials.commercialPrice.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-[10px] uppercase font-bold text-primary">Precio Kit</p>
                <p className="text-xs sm:text-sm font-extrabold text-primary">
                  {financials.finalPrice.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Utilidad / Margen</p>
                <p className={`text-xs sm:text-sm font-bold ${financials.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {financials.profit.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                    maximumFractionDigits: 0,
                  })}{" "}
                  <span className="text-[10px]">({financials.marginPercent.toFixed(1)}%)</span>
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Kits Disponibles</p>
                <p className="text-xs sm:text-sm font-extrabold text-foreground">
                  {stockEstimation.completeKits}{" "}
                  <span className="text-[10px] font-normal text-muted-foreground">armables hoy</span>
                </p>
              </div>
            </div>

            {stockEstimation.limitingProduct && stockEstimation.completeKits === 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  El producto limitante es <strong>{stockEstimation.limitingProduct.name}</strong> (Stock actual:{" "}
                  {stockEstimation.limitingProduct.quantityAvailable} uds).
                </span>
              </div>
            )}
          </div>

          {/* Estado activo */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border">
            <div>
              <p className="text-xs font-bold text-foreground">Kit Activo en Sistema</p>
              <p className="text-[11px] text-muted-foreground">
                Si está desactivado, no aparecerá disponible para venta en el POS
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl px-5 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-xl px-6 text-xs font-bold gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>Guardando...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isEditing ? "Guardar Cambios" : "Crear Kit"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { createCombo, updateCombo, ComboFormData } from "@/app/actions/combo-actions";
import { calculateComboFinancials } from "@/lib/combo-utils";
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

interface ComboFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comboToEdit?: any | null;
  products: ProductOption[];
  categories: { id: number; name: string }[];
  groups: { id: number; name: string }[];
  onSuccess?: () => void;
}

export function ComboFormModal({
  open,
  onOpenChange,
  comboToEdit,
  products,
  categories,
  groups,
  onSuccess,
}: ComboFormModalProps) {
  const isEditing = !!comboToEdit;

  // Estados del Formulario
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [targetQuantity, setTargetQuantity] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);

  // Modalidad de Precio
  const [pricingType, setPricingType] = useState<"DISCOUNT_PERCENT" | "CUSTOM_PRICE">("DISCOUNT_PERCENT");
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<number | "">("");

  // Items seleccionados: productId -> { product, quantity }
  const [selectedItems, setSelectedItems] = useState<
    { productId: number; product: ProductOption; quantity: number }[]
  >([]);

  // Filtros del buscador de productos
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (comboToEdit && open) {
      setName(comboToEdit.name || "");
      setCode(comboToEdit.code || "");
      setDescription(comboToEdit.description || "");
      setImage(comboToEdit.image || "");
      setTargetQuantity(comboToEdit.targetQuantity ?? "");
      setIsActive(comboToEdit.isActive ?? true);
      setPricingType(comboToEdit.pricingType || "DISCOUNT_PERCENT");
      setDiscountPercent(Number(comboToEdit.discountPercent || 0));
      setCustomPrice(comboToEdit.customPrice !== null ? Number(comboToEdit.customPrice) : "");

      if (Array.isArray(comboToEdit.items)) {
        const mapped = comboToEdit.items.map((it: any) => {
          const matchedProd = products.find((p) => p.id === it.productId) || {
            id: it.productId,
            name: it.product?.name || "Producto",
            code: it.product?.code || "",
            quantityAvailable: it.product?.quantityAvailable ?? 0,
            unitCost: Number(it.product?.unitCost || 0),
            salePrice: Number(it.product?.salePrice || 0),
            status: it.product?.status || "AVAILABLE",
            categoryName: it.product?.categoryName,
            groupName: it.product?.groupName,
          };
          return {
            productId: it.productId,
            product: matchedProd,
            quantity: it.quantity,
          };
        });
        setSelectedItems(mapped);
      }
    } else if (open) {
      // Reset form para nuevo combo
      setName("");
      setCode("");
      setDescription("");
      setImage("");
      setTargetQuantity("");
      setIsActive(true);
      setPricingType("DISCOUNT_PERCENT");
      setDiscountPercent(10);
      setCustomPrice("");
      setSelectedItems([]);
      setSearchQuery("");
      setFilterCategory("ALL");
      setFilterGroup("ALL");
    }
  }, [comboToEdit, open, products]);

  // Filtrado de productos disponibles para agregar
  const availableProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const selectedIds = new Set(selectedItems.map((i) => i.productId));

    return products.filter((p) => {
      // No mostrar los ya agregados
      if (selectedIds.has(p.id)) return false;

      // Filtro de texto por nombre o SKU
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);

      // Filtro por categoría
      const matchesCategory =
        filterCategory === "ALL" || p.categoryName === filterCategory;

      // Filtro por grupo
      const matchesGroup = filterGroup === "ALL" || p.groupName === filterGroup;

      return matchesQuery && matchesCategory && matchesGroup;
    });
  }, [products, selectedItems, searchQuery, filterCategory, filterGroup]);

  // Cálculos financieros en vivo
  const financials = useMemo(() => {
    const itemsPricing = selectedItems.map((item) => ({
      quantity: item.quantity,
      unitCost: item.product.unitCost,
      salePrice: item.product.salePrice,
    }));

    return calculateComboFinancials(
      itemsPricing,
      pricingType,
      discountPercent || 0,
      customPrice !== "" ? Number(customPrice) : null
    );
  }, [selectedItems, pricingType, discountPercent, customPrice]);

  // Cálculo de disponibilidad estimada con stock actual
  const stockAvailability = useMemo(() => {
    if (selectedItems.length === 0) {
      return { completeCombos: 0, limitingProduct: null };
    }

    let minCombos = Infinity;
    let limitingProduct: any = null;

    for (const item of selectedItems) {
      const possible =
        item.quantity > 0
          ? Math.floor(Math.max(0, item.product.quantityAvailable) / item.quantity)
          : 0;

      if (possible < minCombos) {
        minCombos = possible;
        limitingProduct = {
          name: item.product.name,
          stock: item.product.quantityAvailable,
          required: item.quantity,
          possibleCombos: possible,
        };
      }
    }

    return {
      completeCombos: minCombos === Infinity ? 0 : minCombos,
      limitingProduct,
    };
  }, [selectedItems]);

  const handleAddProduct = (prod: ProductOption) => {
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        product: prod,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty < 1) return;
    setSelectedItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      errorAlert("Campo obligatorio", "Debes ingresar un nombre para el combo.");
      return;
    }

    if (selectedItems.length === 0) {
      errorAlert("Productos requeridos", "Debes agregar al menos un producto al combo.");
      return;
    }

    const payload: ComboFormData = {
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      image: image.trim() || undefined,
      pricingType,
      discountPercent: Number(discountPercent) || 0,
      customPrice: customPrice !== "" ? Number(customPrice) : null,
      targetQuantity: targetQuantity !== "" ? Number(targetQuantity) : null,
      isActive,
      items: selectedItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };

    setIsSubmitting(true);

    try {
      let res;
      if (isEditing) {
        res = await updateCombo(comboToEdit.id, payload);
      } else {
        res = await createCombo(payload);
      }

      if (res.success) {
        await successAlert(
          isEditing ? "Combo actualizado" : "Combo creado",
          `El combo "${name}" ha sido guardado exitosamente.`
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        errorAlert("Error", res.error || "No se pudo guardar el combo.");
      }
    } catch (err: any) {
      errorAlert("Error inesperado", err.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-border p-5 sm:p-7 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-black text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers size={22} />
            </div>
            <span>{isEditing ? "Editar Combo Comercial" : "Crear Nuevo Combo"}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Agrupa varios productos en un kit promocional. El inventario se mantendrá en los productos individuales.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* 1. Datos Básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nombre del Combo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Kit Maquillaje Glow, Combo Empresarial"
                className="bg-muted/40 border-border rounded-xl h-10 text-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Código / SKU (Opcional)
              </Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej. CMB-001 (Automático si se deja vacío)"
                className="bg-muted/40 border-border rounded-xl h-10 text-sm font-mono"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Descripción Comercial
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla qué incluye este combo o sus beneficios para el cliente..."
                className="bg-muted/40 border-border rounded-xl text-xs resize-none h-16"
              />
            </div>
          </div>

          {/* 2. Selector de Productos Componentes */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Package size={15} className="text-primary" />
                  Productos Incluidos en el Combo ({selectedItems.length})
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Selecciona productos de cualquier grupo o categoría y define cuántas unidades requiere cada combo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Estado:</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isActive ? "● Activo" : "○ Inactivo"}
                </button>
              </div>
            </div>

            {/* Buscador y Filtros de Productos */}
            <div className="p-3.5 bg-muted/20 border border-border/80 rounded-2xl space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6 relative">
                  <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto por nombre o SKU..."
                    className="pl-9 bg-card border-border rounded-xl text-xs h-9"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none h-9"
                  >
                    <option value="ALL">Todas las Categorías</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none h-9"
                  >
                    <option value="ALL">Todos los Grupos</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista Desplegable de Resultados para Agregar */}
              {searchQuery.trim() !== "" && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-1.5 space-y-1 shadow-inner">
                  {availableProducts.length === 0 ? (
                    <p className="text-center py-3 text-xs text-muted-foreground">
                      No se encontraron productos disponibles con ese criterio.
                    </p>
                  ) : (
                    availableProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-xs transition border border-transparent hover:border-border"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-bold text-foreground truncate">{prod.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            SKU: {prod.code} | Stock Físico:{" "}
                            <span className={prod.quantityAvailable > 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-bold text-red-500"}>
                              {prod.quantityAvailable} u.
                            </span>{" "}
                            | Precio: ${prod.salePrice.toLocaleString("es-CO")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAddProduct(prod)}
                          className="h-7 px-2.5 text-[11px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                        >
                          <Plus size={13} className="mr-1" /> Agregar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tabla de Productos Seleccionados */}
            {selectedItems.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-2xl text-center space-y-2 bg-muted/5">
                <Boxes className="mx-auto text-muted-foreground/50" size={32} />
                <p className="text-xs font-bold text-muted-foreground">
                  Aún no has agregado productos a este combo.
                </p>
                <p className="text-[11px] text-muted-foreground/70">
                  Usa el buscador superior para seleccionar los artículos componentes.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                    <tr>
                      <th className="p-2.5 pl-3.5">Producto</th>
                      <th className="p-2.5 text-center">Stock Actual</th>
                      <th className="p-2.5 text-center w-28">Cant. Requerida</th>
                      <th className="p-2.5 text-right">Costo Unit.</th>
                      <th className="p-2.5 text-right">Precio Unit.</th>
                      <th className="p-2.5 text-right font-black text-foreground">Precio Agrupado</th>
                      <th className="p-2.5 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selectedItems.map((item) => {
                      const rowCost = item.quantity * item.product.unitCost;
                      const rowPrice = item.quantity * item.product.salePrice;
                      const isLow = item.product.quantityAvailable < item.quantity;

                      return (
                        <tr key={item.productId} className="hover:bg-muted/10 transition">
                          <td className="p-2.5 pl-3.5">
                            <p className="font-bold text-foreground">{item.product.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              SKU: {item.product.code}
                              {item.product.groupName && ` • ${item.product.groupName}`}
                            </p>
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isLow
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {item.product.quantityAvailable} u.
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                                className="w-6 h-6 rounded-md bg-muted hover:bg-muted-foreground/20 font-black flex items-center justify-center text-xs"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                                }
                                className="w-12 text-center bg-card border border-border rounded-md py-0.5 text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                                className="w-6 h-6 rounded-md bg-muted hover:bg-muted-foreground/20 font-black flex items-center justify-center text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            ${item.product.unitCost.toLocaleString("es-CO")}
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            ${item.product.salePrice.toLocaleString("es-CO")}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-foreground">
                            ${rowPrice.toLocaleString("es-CO")}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.productId)}
                              className="p-1 rounded-md text-red-500 hover:bg-red-500/10 transition"
                              title="Quitar producto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 3. Configuración de Precio & Modalidades */}
          <div className="space-y-3 border-t border-border/60 pt-5">
            <Label className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <DollarSign size={15} className="text-primary" />
              Modalidad de Fijación de Precio
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Opción A: Descuento Porcentual */}
              <div
                onClick={() => setPricingType("DISCOUNT_PERCENT")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  pricingType === "DISCOUNT_PERCENT"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:bg-muted/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Percent size={14} />
                    </div>
                    <span className="text-xs font-extrabold text-foreground">
                      Modalidad A: Descuento Porcentual
                    </span>
                  </div>
                  {pricingType === "DISCOUNT_PERCENT" && <Check size={14} className="text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Aplica un % de descuento sobre la suma de los precios de venta individuales.
                </p>

                {pricingType === "DISCOUNT_PERCENT" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-[11px] font-bold text-muted-foreground">Descuento:</Label>
                    <div className="relative w-24">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                        className="bg-card border-border rounded-xl h-8 text-xs font-bold pr-6"
                      />
                      <span className="absolute right-2 top-2 text-xs font-bold text-muted-foreground">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Opción B: Precio Personalizado */}
              <div
                onClick={() => setPricingType("CUSTOM_PRICE")}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  pricingType === "CUSTOM_PRICE"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:bg-muted/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <DollarSign size={14} />
                    </div>
                    <span className="text-xs font-extrabold text-foreground">
                      Modalidad B: Precio Personalizado
                    </span>
                  </div>
                  {pricingType === "CUSTOM_PRICE" && <Check size={14} className="text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Fija directamente el valor final del combo (puede ser mayor o menor al agrupado).
                </p>

                {pricingType === "CUSTOM_PRICE" && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-[11px] font-bold text-muted-foreground">Precio Final:</Label>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="0"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        placeholder="Ej. 89900"
                        className="pl-6 bg-card border-border rounded-xl h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Tarjeta Resumen Financiero & Disponibilidad */}
          {selectedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-5">
              {/* Métricas Financieras */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border space-y-2.5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-primary" />
                  Resumen Económico del Combo
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold block">Costo Total:</span>
                    <span className="font-bold text-foreground font-mono">
                      ${financials.calculatedCost.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold block">Valor Comercial:</span>
                    <span className="font-bold text-foreground font-mono">
                      ${financials.commercialPrice.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold block">Precio Final Combo:</span>
                    <span className="text-sm font-black text-primary font-mono">
                      ${financials.finalPrice.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold block">Utilidad Estimada:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ${financials.profit.toLocaleString("es-CO")} ({financials.marginPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Disponibilidad Inicial Estimada */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border space-y-2.5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Boxes size={13} className="text-primary" />
                  Disponibilidad de Inventario Actual
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {stockAvailability.completeCombos}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">combos completos posibles</span>
                </div>

                {stockAvailability.limitingProduct && (
                  <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/50">
                    <span className="font-bold text-foreground">Componente limitante:</span>{" "}
                    {stockAvailability.limitingProduct.name} (Stock: {stockAvailability.limitingProduct.stock} u. / Requiere: {stockAvailability.limitingProduct.required} u.)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 text-xs font-bold border-border"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="rounded-xl px-5 text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
            >
              {isSubmitting ? "Guardando..." : isEditing ? "Actualizar Combo" : "Guardar Combo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Search,
  Filter,
  Package,
  Boxes,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Info,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KitFormModal } from "./components/kit-form-modal";
import { KitDetailModal } from "./components/kit-detail-modal";
import {
  deleteKit,
  toggleKitStatus,
  duplicateKit,
} from "@/app/actions/kit-actions";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";

interface ProductItem {
  id: string;
  code: string;
  name: string;
  unitCost: number;
  salePrice: number;
  quantityAvailable: number;
  status: string;
  categoryId?: string | null;
  productGroupId?: string | null;
  category?: { id: string; name: string } | null;
  productGroup?: { id: string; name: string } | null;
}

interface KitsClientProps {
  initialCombos: any[];
  products: ProductItem[];
  categories: { id: string; name: string }[];
  groups: { id: string; name: string }[];
  isCombosEnabled: boolean;
  role: string;
}

export function KitsClient({
  initialCombos,
  products,
  categories,
  groups,
  isCombosEnabled,
  role,
}: KitsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "AVAILABLE" | "INCOMPLETE" | "OUT_OF_STOCK" | "INACTIVE"
  >("ALL");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [kitToEdit, setKitToEdit] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedKitForDetail, setSelectedKitForDetail] = useState<any | null>(null);

  // Formatted products for selector
  const productOptions = useMemo(() => {
    return products.map((p) => ({
      id: Number(p.id),
      code: p.code,
      name: p.name,
      quantityAvailable: p.quantityAvailable,
      unitCost: p.unitCost,
      salePrice: p.salePrice,
      status: p.status,
      categoryName: p.category?.name || null,
      groupName: p.productGroup?.name || null,
    }));
  }, [products]);

  // Filtered kits
  const filteredKits = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return initialCombos.filter((c) => {
      // Search text
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "INACTIVE") {
        matchesStatus = !c.isActive;
      } else if (statusFilter === "AVAILABLE") {
        matchesStatus = c.isActive && c.completeCombos > 0;
      } else if (statusFilter === "INCOMPLETE") {
        matchesStatus = c.isActive && c.statusAvailability === "INCOMPLETE";
      } else if (statusFilter === "OUT_OF_STOCK") {
        matchesStatus = c.isActive && c.completeCombos === 0;
      }

      return matchesSearch && matchesStatus;
    });
  }, [initialCombos, searchTerm, statusFilter]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalKits = initialCombos.length;
    const activeKits = initialCombos.filter((c) => c.isActive).length;
    const totalArmableKits = initialCombos
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + (c.completeCombos || 0), 0);
    const potentialValue = initialCombos
      .filter((c) => c.isActive)
      .reduce((sum, c) => sum + (c.completeCombos || 0) * (c.finalPrice || 0), 0);

    return { totalKits, activeKits, totalArmableKits, potentialValue };
  }, [initialCombos]);

  // Handlers
  const handleOpenCreateModal = () => {
    setKitToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (kit: any) => {
    setKitToEdit(kit);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (kit: any) => {
    setSelectedKitForDetail(kit);
    setIsDetailModalOpen(true);
  };

  const handleToggleStatus = async (kit: any) => {
    const res = await toggleKitStatus(kit.id);
    if (res.success) {
      router.refresh();
    } else {
      errorAlert("Error", res.error || "No se pudo cambiar el estado del kit.");
    }
  };

  const handleDuplicate = async (kit: any) => {
    const confirmed = await confirmAction(
      "¿Duplicar Kit?",
      `Se creará una copia idéntica del kit "${kit.name}".`,
      "Sí, duplicar",
      "Cancelar"
    );
    if (confirmed) {
      const res = await duplicateKit(kit.id);
      if (res.success) {
        await successAlert("Kit duplicado", `Se creó la copia "${res.combo?.name || kit.name}".`);
        router.refresh();
      } else {
        errorAlert("Error", res.error || "No se pudo duplicar el kit.");
      }
    }
  };

  const handleDelete = async (kit: any) => {
    const confirmed = await confirmAction(
      "¿Eliminar Kit?",
      `¿Estás seguro de eliminar el kit "${kit.name}"? Los productos individuales no serán afectados.`,
      "Sí, eliminar",
      "Cancelar"
    );
    if (confirmed) {
      const res = await deleteKit(kit.id);
      if (res.success) {
        await successAlert("Operación Exitosa", res.message || "Kit eliminado correctamente.");
        router.refresh();
      } else {
        errorAlert("Error", res.error || "No se pudo eliminar el kit.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de módulo deshabilitado en ajustes si aplica */}
      {!isCombosEnabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>El módulo de Kits está inactivo globalmente:</strong> Puedes crear y gestionar kits, pero no
              serán visibles para venta en el POS hasta que lo actives en <em>Ajustes → Kits</em>.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/dashboard/settings")}
            className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-lg shrink-0"
          >
            Ir a Ajustes
          </Button>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              Inventario → Kits
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5 mt-1">
            <Layers className="h-7 w-7 text-primary" />
            Kits de Inventario
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Crea paquetes comerciales y promociones armadas sin duplicar existencias físicas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenCreateModal}
            className="h-11 px-5 rounded-2xl font-bold text-xs gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Nuevo Kit
          </Button>
        </div>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Kits</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-foreground">{kpis.totalKits}</p>
            <span className="text-xs text-muted-foreground">registrados</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kits Activos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-emerald-500">{kpis.activeKits}</p>
            <span className="text-xs text-muted-foreground">habilitados</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kits Armables Hoy</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-primary">{kpis.totalArmableKits}</p>
            <span className="text-xs text-muted-foreground">con stock actual</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border/60 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Valorización Potencial</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-black text-foreground">
              {kpis.potentialValue.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl bg-card border border-border/60">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl bg-muted/20 border-border/60"
          />
        </div>

        {/* Botones de filtro rápido de estado */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: "ALL", label: "Todos" },
            { id: "AVAILABLE", label: "Armables" },
            { id: "INCOMPLETE", label: "Incompletos" },
            { id: "OUT_OF_STOCK", label: "Sin Stock" },
            { id: "INACTIVE", label: "Inactivos" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === f.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Kits */}
      {filteredKits.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl bg-card/50 space-y-3">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-bold text-foreground">No se encontraron kits</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm || statusFilter !== "ALL"
              ? "Prueba cambiando los filtros de búsqueda."
              : "Comienza a crear kits de productos para aumentar tu ticket promedio de venta."}
          </p>
          {!searchTerm && statusFilter === "ALL" && (
            <Button
              onClick={handleOpenCreateModal}
              className="h-9 text-xs rounded-xl font-bold mt-2"
            >
              Crear Primer Kit
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredKits.map((kit) => {
            const hasStock = kit.completeCombos > 0;
            const isInactive = !kit.isActive;

            return (
              <div
                key={kit.id}
                className={`p-5 rounded-3xl border bg-card shadow-sm transition-all duration-300 flex flex-col justify-between hover:shadow-md ${
                  isInactive
                    ? "opacity-60 border-border/40"
                    : hasStock
                    ? "border-border/80 hover:border-primary/40"
                    : "border-amber-500/30 hover:border-amber-500/50"
                }`}
              >
                <div>
                  {/* Encabezado de la tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                          {kit.code || "SIN SKU"}
                        </span>
                        {!kit.isActive && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground mt-1.5 truncate" title={kit.name}>
                        {kit.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border flex items-center gap-1 shrink-0 ${
                        hasStock
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {hasStock ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {kit.completeCombos} armables
                    </span>
                  </div>

                  {kit.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                      {kit.description}
                    </p>
                  )}

                  {/* Lista comprimida de componentes */}
                  <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                      <span>Componentes ({kit.items?.length || 0})</span>
                      <span>En Inventario</span>
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {kit.items?.map((it: any) => {
                        const stockAvailable = it.product?.quantityAvailable ?? 0;
                        const isEnough = stockAvailable >= (it.quantity || 1);

                        return (
                          <div
                            key={it.id || it.productId}
                            className="flex items-center justify-between text-xs text-foreground/80 py-0.5"
                          >
                            <span className="truncate pr-2 text-[11px]">
                              {it.quantity}x {it.product?.name || "Producto"}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold shrink-0 ${
                                isEnough ? "text-muted-foreground" : "text-red-500 font-bold"
                              }`}
                            >
                              {stockAvailable} uds
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Aviso de producto limitante si falta stock */}
                  {kit.limitingProduct && kit.completeCombos === 0 && (
                    <div className="mt-3 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        Agotado por: <strong>{kit.limitingProduct.name}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Precios y Botonera */}
                <div className="mt-5 pt-3 border-t border-border/60">
                  <div className="flex items-end justify-between">
                    <div>
                      {kit.effectiveDiscount > 0 && (
                        <p className="text-[10px] text-muted-foreground line-through">
                          {Number(kit.commercialPrice || 0).toLocaleString("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      )}
                      <p className="text-lg font-black text-primary">
                        {Number(kit.finalPrice || 0).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Margen</p>
                      <p className={`text-xs font-bold ${kit.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {kit.marginPercent?.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(kit)}
                      className={`text-xs p-1.5 rounded-lg border flex items-center gap-1 font-semibold transition ${
                        kit.isActive
                          ? "text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20"
                          : "text-muted-foreground hover:bg-muted border-border"
                      }`}
                      title={kit.isActive ? "Desactivar Kit" : "Activar Kit"}
                    >
                      {kit.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      <span className="text-[10px]">{kit.isActive ? "Activo" : "Inactivo"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {kit.isActive && hasStock && (
                        <Link
                          href="/dashboard/sales"
                          className="h-8 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-purple-600/20 transition active:scale-95"
                          title="Vender este kit en el POS"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Vender</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenDetailModal(kit)}
                        className="h-8 w-8 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center transition"
                        title="Ver detalle del kit"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(kit)}
                        className="h-8 w-8 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center transition"
                        title="Duplicar kit"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(kit)}
                        className="h-8 w-8 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center transition"
                        title="Editar kit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(kit)}
                        className="h-8 w-8 rounded-xl border border-border bg-muted/40 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 flex items-center justify-center transition"
                        title="Eliminar kit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {isFormModalOpen && (
        <KitFormModal
          open={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => router.refresh()}
          kitToEdit={kitToEdit}
          availableProducts={productOptions}
        />
      )}

      {isDetailModalOpen && (
        <KitDetailModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          kit={selectedKitForDetail}
          onEdit={handleOpenEditModal}
          onDuplicate={handleDuplicate}
        />
      )}
    </div>
  );
}

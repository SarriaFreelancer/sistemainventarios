"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Boxes,
  DollarSign,
  Eye,
  Edit2,
  Copy,
  Trash2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
  PackageX,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComboFormModal } from "./components/combo-form-modal";
import { ComboDetailModal } from "./components/combo-detail-modal";
import { toggleComboStatus, duplicateCombo, deleteCombo } from "@/app/actions/combo-actions";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

interface CombosClientProps {
  initialCombos: any[];
  products: any[];
  categories: any[];
  groups: any[];
  isCombosEnabled: boolean;
  role?: string;
}

export function CombosClient({
  initialCombos,
  products,
  categories,
  groups,
  isCombosEnabled,
  role,
}: CombosClientProps) {
  const router = useRouter();
  const [combos, setCombos] = useState<any[]>(initialCombos);
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<"ALL" | "COMPLETE" | "INCOMPLETE" | "OUT_OF_STOCK">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [comboToEdit, setComboToEdit] = useState<any | null>(null);
  const [comboToView, setComboToView] = useState<any | null>(null);

  // Sincronizar estado si cambian las props
  React.useEffect(() => {
    setCombos(initialCombos);
  }, [initialCombos]);

  // Filtrado de la tabla
  const filteredCombos = useMemo(() => {
    const q = search.toLowerCase().trim();

    return combos.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && c.isActive) ||
        (filterStatus === "INACTIVE" && !c.isActive);

      let matchesAvail = true;
      if (filterAvailability === "COMPLETE") {
        matchesAvail = c.completeCombos > 0;
      } else if (filterAvailability === "INCOMPLETE") {
        matchesAvail = c.incompleteCombos > 0;
      } else if (filterAvailability === "OUT_OF_STOCK") {
        matchesAvail = c.completeCombos === 0;
      }

      return matchesQuery && matchesStatus && matchesAvail;
    });
  }, [combos, search, filterStatus, filterAvailability]);

  // KPIs superiores
  const stats = useMemo(() => {
    const totalCombos = combos.length;
    const activeCombos = combos.filter((c) => c.isActive).length;
    const totalCompletos = combos.reduce((sum, c) => sum + (c.isActive ? c.completeCombos : 0), 0);
    const totalIncompletos = combos.reduce((sum, c) => sum + (c.isActive ? c.incompleteCombos : 0), 0);
    const totalCommercialVal = combos.reduce(
      (sum, c) => sum + (c.isActive ? Number(c.finalPrice || 0) * c.completeCombos : 0),
      0
    );

    return {
      totalCombos,
      activeCombos,
      totalCompletos,
      totalIncompletos,
      totalCommercialVal,
    };
  }, [combos]);

  // Acciones
  const handleOpenCreate = () => {
    setComboToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (combo: any) => {
    setComboToEdit(combo);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (combo: any) => {
    setComboToView(combo);
    setDetailModalOpen(true);
  };

  const handleToggleStatus = async (combo: any) => {
    const res = await toggleComboStatus(combo.id);
    if (res.success) {
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, isActive: res.isActive } : c))
      );
      router.refresh();
    } else {
      errorAlert("Error", res.error || "No se pudo cambiar el estado.");
    }
  };

  const handleDuplicate = async (combo: any) => {
    const confirmed = await confirmAction(
      "¿Duplicar Combo?",
      `Se creará una copia idéntica del combo "${combo.name}".`,
      "Sí, duplicar",
      "Cancelar"
    );
    if (confirmed) {
      const res = await duplicateCombo(combo.id);
      if (res.success) {
        await successAlert("Combo duplicado", `Se creó la copia "${res.combo?.name || combo.name}".`);
        router.refresh();
      } else {
        errorAlert("Error", res.error || "No se pudo duplicar el combo.");
      }
    }
  };

  const handleDelete = async (combo: any) => {
    const confirmed = await confirmAction(
      "¿Eliminar Combo?",
      `¿Estás seguro de eliminar el combo "${combo.name}"? Los productos individuales no serán afectados.`,
      "Sí, eliminar",
      "Cancelar"
    );
    if (confirmed) {
      const res = await deleteCombo(combo.id);
      if (res.success) {
        setCombos((prev) => prev.filter((c) => c.id !== combo.id));
        await successAlert("Combo eliminado", "El combo fue eliminado exitosamente.");
        router.refresh();
      } else {
        errorAlert("Error", res.error || "No se pudo eliminar el combo.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Módulo de Combos & Kits Comerciales
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crea paquetes promocionales combinando productos existentes. El stock real se descuenta automáticamente de cada artículo.
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-2xl px-5 py-2.5 text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shrink-0 flex items-center gap-2"
        >
          <Plus size={16} />
          + Nuevo Combo
        </Button>
      </div>

      {/* 2. Tarjetas de Métricas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Combos */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total de Combos
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5 font-mono">
              {stats.totalCombos}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              {stats.activeCombos} activos en catálogo
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Layers size={22} />
          </div>
        </div>

        {/* Card 2: Combos Completos Listos */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Combos Completos Listos
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
              {stats.totalCompletos}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              Listos para venta inmediata
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <PackageCheck size={22} />
          </div>
        </div>

        {/* Card 3: Combos Incompletos */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Combos Incompletos
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
              {stats.totalIncompletos}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              Requieren reabastecimiento
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <PackageX size={22} />
          </div>
        </div>

        {/* Card 4: Valor Comercial Potencial */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Valor en Combos Listos
            </p>
            <p className="text-2xl font-black text-foreground mt-0.5 font-mono">
              ${stats.totalCommercialVal.toLocaleString("es-CO")}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
              Potencial de venta disponible
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="p-3.5 bg-card border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU o descripción..."
            className="pl-9 bg-muted/40 border-border rounded-xl text-xs h-9 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={filterAvailability}
            onChange={(e) => setFilterAvailability(e.target.value as any)}
            className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none h-9 shrink-0"
          >
            <option value="ALL">Toda Disponibilidad</option>
            <option value="COMPLETE">🟢 Completos (Listos)</option>
            <option value="INCOMPLETE">🟡 Incompletos</option>
            <option value="OUT_OF_STOCK">🔴 Agotados (0 completos)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none h-9 shrink-0"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>

      {/* 4. Tabla Principal de Combos */}
      {filteredCombos.length === 0 ? (
        <div className="p-12 border border-dashed border-border rounded-3xl text-center space-y-3 bg-card">
          <Layers className="mx-auto text-muted-foreground/40" size={40} />
          <p className="text-sm font-bold text-foreground">No se encontraron combos registrados</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {search || filterAvailability !== "ALL" || filterStatus !== "ALL"
              ? "Prueba cambiando los filtros de búsqueda para ver más resultados."
              : "Comienza creando tu primer combo comercial para agrupar productos y ofrecer promociones."}
          </p>
          <Button
            onClick={handleOpenCreate}
            className="mt-2 rounded-xl text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus size={14} className="mr-1.5" /> Crear Combo Ahora
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-3.5 pl-5">Combo / Kit</th>
                  <th className="p-3.5 text-right font-black text-foreground">Precio Venta</th>
                  <th className="p-3.5 text-right font-bold">Costo Inversión</th>
                  <th className="p-3.5 text-right font-bold">Utilidad / Margen</th>
                  <th className="p-3.5 text-center font-bold">Disponibilidad Actual</th>
                  <th className="p-3.5 text-center font-bold">Estado</th>
                  <th className="p-3.5 text-center pr-5">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCombos.map((combo) => {
                  const isAvailable = combo.completeCombos > 0;

                  return (
                    <tr key={combo.id} className="hover:bg-muted/10 transition">
                      {/* 1. Datos del Combo */}
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black text-xs">
                            <Layers size={18} />
                          </div>
                          <div>
                            <p className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                              {combo.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              SKU: <span className="font-bold">{combo.code || "N/A"}</span> •{" "}
                              {combo.items?.length || 0} producto(s) incluidos
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Precio Final de Venta */}
                      <td className="p-3.5 text-right">
                        <span className="font-mono text-sm font-black text-primary">
                          ${Number(combo.finalPrice).toLocaleString("es-CO")}
                        </span>
                        {combo.commercialPrice > combo.finalPrice && (
                          <p className="text-[10px] text-muted-foreground line-through font-mono">
                            ${Number(combo.commercialPrice).toLocaleString("es-CO")}
                          </p>
                        )}
                      </td>

                      {/* 3. Costo Total Sumado */}
                      <td className="p-3.5 text-right font-mono font-medium text-muted-foreground">
                        ${Number(combo.calculatedCost).toLocaleString("es-CO")}
                      </td>

                      {/* 4. Utilidad y Margen */}
                      <td className="p-3.5 text-right">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                          ${Number(combo.profit).toLocaleString("es-CO")}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {Number(combo.marginPercent).toFixed(1)}% margen
                        </span>
                      </td>

                      {/* 5. Disponibilidad Dinámica (Completos / Incompletos) */}
                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                                isAvailable
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-500 border border-red-500/20"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {combo.completeCombos} completos
                            </span>

                            {combo.incompleteCombos > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                🟡 {combo.incompleteCombos}
                              </span>
                            )}
                          </div>

                          {combo.limitingProduct && isAvailable && (
                            <span className="text-[9.5px] text-muted-foreground truncate max-w-[140px]" title={`Limitado por: ${combo.limitingProduct.name}`}>
                              Limitante: {combo.limitingProduct.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Estado */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(combo)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black transition ${
                            combo.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                          }`}
                          title="Clic para cambiar estado"
                        >
                          {combo.isActive ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      {/* 7. Acciones */}
                      <td className="p-3.5 pr-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(combo)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Ver desglose detallado"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(combo)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Editar combo"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(combo)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                            title="Duplicar combo"
                          >
                            <Copy size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(combo)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                            title="Eliminar combo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      <ComboFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        comboToEdit={comboToEdit}
        products={products}
        categories={categories}
        groups={groups}
        onSuccess={() => router.refresh()}
      />

      {/* Modal Desglose / Detalle */}
      <ComboDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        combo={comboToView}
        onEdit={(c) => {
          setDetailModalOpen(false);
          handleOpenEdit(c);
        }}
      />
    </div>
  );
}

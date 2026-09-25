"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Layers,
  DollarSign,
  TrendingUp,
  Boxes,
  Percent,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  Tag,
  ShieldCheck,
} from "lucide-react";

interface ComboDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo: any | null;
  onEdit?: (combo: any) => void;
}

export function ComboDetailModal({
  open,
  onOpenChange,
  combo,
  onEdit,
}: ComboDetailModalProps) {
  if (!combo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-6 sm:p-7 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Layers size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground">
                  {combo.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Código: <span className="font-bold text-foreground">{combo.code || "N/A"}</span> • Creado el{" "}
                  {new Date(combo.createdAt).toLocaleDateString("es-CO")}
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                combo.isActive
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {combo.isActive ? "● Activo" : "○ Inactivo"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Descripción si existe */}
          {combo.description && (
            <div className="bg-muted/20 border border-border/60 p-3.5 rounded-2xl">
              <p className="text-xs text-muted-foreground leading-relaxed">{combo.description}</p>
            </div>
          )}

          {/* Tarjetas de Disponibilidad & Rentabilidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Disponibilidad de Inventario */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Boxes size={14} className="text-primary" />
                Disponibilidad Comercial
              </p>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black">
                  <CheckCircle2 size={14} />
                  <span>{combo.completeCombos} Completos</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black">
                  <AlertCircle size={14} />
                  <span>{combo.incompleteCombos} Incompletos</span>
                </div>
              </div>

              {combo.limitingProduct && (
                <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/40">
                  <span className="font-bold text-foreground">Componente Limitante:</span>{" "}
                  {combo.limitingProduct.name} ({combo.limitingProduct.quantityAvailable} u. disponibles / requiere{" "}
                  {combo.limitingProduct.requiredPerCombo} u.)
                </p>
              )}
            </div>

            {/* 2. Resumen Económico */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={14} className="text-primary" />
                Rentabilidad y Precios
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Precio Comercial:</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    ${Number(combo.commercialPrice).toLocaleString("es-CO")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Precio del Combo:</span>
                  <span className="font-mono text-base font-black text-primary">
                    ${Number(combo.finalPrice).toLocaleString("es-CO")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Costo de Inversión:</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    ${Number(combo.calculatedCost).toLocaleString("es-CO")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Utilidad / Margen:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    ${Number(combo.profit).toLocaleString("es-CO")} ({Number(combo.marginPercent).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Productos Componentes */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Package size={14} className="text-primary" />
              Desglose de Productos Componentes ({combo.items?.length || 0})
            </h4>

            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="p-2.5 pl-3.5">Producto</th>
                    <th className="p-2.5 text-center">Cant. Requerida</th>
                    <th className="p-2.5 text-center">Stock Físico</th>
                    <th className="p-2.5 text-center">Combos Posibles</th>
                    <th className="p-2.5 text-right">Costo Unit.</th>
                    <th className="p-2.5 text-right font-bold text-foreground">Precio Unit.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {combo.items?.map((item: any) => {
                    const prod = item.product;
                    const possible = item.quantity > 0 ? Math.floor(Math.max(0, prod.quantityAvailable) / item.quantity) : 0;
                    const isLimit = combo.limitingProduct?.id === prod.id;

                    return (
                      <tr key={item.id || item.productId} className={`hover:bg-muted/10 transition ${isLimit ? "bg-amber-500/5" : ""}`}>
                        <td className="p-2.5 pl-3.5">
                          <p className="font-bold text-foreground">{prod.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            SKU: {prod.code}
                            {prod.groupName && ` • ${prod.groupName}`}
                            {prod.categoryName && ` • ${prod.categoryName}`}
                          </p>
                        </td>
                        <td className="p-2.5 text-center font-bold text-foreground font-mono">
                          {item.quantity} u.
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            prod.quantityAvailable < item.quantity
                              ? "bg-red-500/10 text-red-500"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {prod.quantityAvailable} u.
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            isLimit
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-black"
                              : "text-muted-foreground"
                          }`}>
                            {possible} combos {isLimit && "⚠️ Limitante"}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-muted-foreground">
                          ${Number(prod.unitCost).toLocaleString("es-CO")}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-foreground">
                          ${Number(prod.salePrice).toLocaleString("es-CO")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie del Modal */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 text-xs font-bold border-border"
            >
              Cerrar
            </Button>

            {onEdit && (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(combo);
                }}
                className="rounded-xl px-5 text-xs font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              >
                Editar Combo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

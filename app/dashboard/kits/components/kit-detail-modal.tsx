"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Boxes,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Calendar,
  Tag,
  Edit,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface KitDetailModalProps {
  open: boolean;
  onClose: () => void;
  kit: any | null;
  onEdit?: (kit: any) => void;
  onDuplicate?: (kit: any) => void;
}

export function KitDetailModal({
  open,
  onClose,
  kit,
  onEdit,
  onDuplicate,
}: KitDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"COMPONENTS" | "FINANCIALS">("COMPONENTS");

  if (!kit) return null;

  const isComplete = kit.completeCombos > 0;
  const statusColor =
    kit.statusAvailability === "COMPLETE"
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      : kit.statusAvailability === "INCOMPLETE"
      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
      : "text-red-500 bg-red-500/10 border-red-500/20";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border border-border bg-card shadow-2xl">
        {/* Cabecera */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-black text-foreground">
                    {kit.name}
                  </DialogTitle>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border">
                    {kit.code || "SIN CÓDIGO"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inventario → Kits: Paquete comercial compuesto por {kit.items?.length || 0} productos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusColor}`}
              >
                {kit.statusAvailability === "COMPLETE" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : kit.statusAvailability === "INCOMPLETE" ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {kit.completeCombos} Kits Armables
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Descripción si existe */}
          {kit.description && (
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border text-xs text-muted-foreground">
              {kit.description}
            </div>
          )}

          {/* Tarjetas resumen superior */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Precio de Venta
              </p>
              <p className="text-base sm:text-lg font-black text-primary">
                {Number(kit.finalPrice || 0).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                })}
              </p>
              {kit.effectiveDiscount > 0 && (
                <span className="inline-block text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  -{kit.effectiveDiscount.toFixed(1)}% vs regular
                </span>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Costo Total
              </p>
              <p className="text-base sm:text-lg font-black text-foreground">
                {Number(kit.calculatedCost || 0).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-[10px] text-muted-foreground">Suma componentes</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Margen Estimado
              </p>
              <p className={`text-base sm:text-lg font-black ${kit.profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {Number(kit.profit || 0).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {kit.marginPercent?.toFixed(1) || "0.0"}% de rentabilidad
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Disponibilidad
              </p>
              <p className="text-base sm:text-lg font-black text-foreground">
                {kit.completeCombos}{" "}
                <span className="text-xs font-normal text-muted-foreground">completos</span>
              </p>
              {kit.targetQuantity && (
                <p className="text-[10px] text-muted-foreground">Meta: {kit.targetQuantity} kits</p>
              )}
            </div>
          </div>

          {/* Navegación por pestañas */}
          <div className="flex border-b border-border gap-2">
            <button
              onClick={() => setActiveTab("COMPONENTS")}
              className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 px-2 ${
                activeTab === "COMPONENTS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Boxes className="h-4 w-4" />
              Productos Componentes ({kit.items?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("FINANCIALS")}
              className={`pb-2.5 text-xs font-bold transition border-b-2 flex items-center gap-1.5 px-2 ${
                activeTab === "FINANCIALS"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Desglose Financiero
            </button>
          </div>

          {/* Contenido Pestaña 1: Componentes */}
          {activeTab === "COMPONENTS" && (
            <div className="space-y-4">
              <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
                <div className="grid grid-cols-[1fr_5rem_6rem_6rem] gap-2 p-3 bg-muted/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div>Producto</div>
                  <div className="text-center">Por Kit</div>
                  <div className="text-right">Stock Actual</div>
                  <div className="text-right">Kits Posibles</div>
                </div>

                {kit.items?.map((item: any) => {
                  const prod = item.product || {};
                  const currentStock = prod.quantityAvailable ?? 0;
                  const reqQty = item.quantity || 1;
                  const possible = Math.floor(currentStock / reqQty);
                  const isBottleneck = possible === kit.completeCombos;

                  return (
                    <div
                      key={item.id || item.productId}
                      className={`grid grid-cols-[1fr_5rem_6rem_6rem] gap-2 p-3 items-center hover:bg-muted/20 transition ${
                        isBottleneck && kit.completeCombos === 0 ? "bg-red-500/5" : ""
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-foreground truncate">{prod.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="font-mono">{prod.code}</span>
                          {prod.categoryName && <span>• {prod.categoryName}</span>}
                          {isBottleneck && (
                            <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded text-[9px]">
                              Cuello de botella
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-center font-bold text-xs text-foreground">
                        {reqQty} ud{reqQty > 1 ? "s" : ""}
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold ${
                            currentStock >= reqQty ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {currentStock} uds
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-black ${
                            possible > 0 ? "text-foreground" : "text-red-500"
                          }`}
                        >
                          {possible} kits
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {kit.limitingProduct && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Producto Limitante: </span>
                    <span>
                      La cantidad máxima de este kit está restringida por{" "}
                      <strong>{kit.limitingProduct.name}</strong> ({kit.limitingProduct.quantityAvailable} uds
                      disponibles en inventario).
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido Pestaña 2: Financiero */}
          {activeTab === "FINANCIALS" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Desglose de Costos y Precios Individuales
                </h4>
                <div className="divide-y divide-border/60 text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Suma de costos unitarios:</span>
                    <span className="font-semibold text-foreground">
                      {Number(kit.calculatedCost || 0).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Suma de precios regulares individuales:</span>
                    <span className="font-semibold text-foreground">
                      {Number(kit.commercialPrice || 0).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Estrategia aplicada:</span>
                    <span className="font-bold text-foreground">
                      {kit.pricingType === "DISCOUNT_PERCENT"
                        ? `${kit.discountPercent}% de Descuento Especial`
                        : "Precio Fijo Promocional"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 bg-primary/5 px-2 rounded-lg">
                    <span className="font-bold text-primary">Precio Final del Kit:</span>
                    <span className="font-black text-primary text-sm">
                      {Number(kit.finalPrice || 0).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pie de acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-[11px] text-muted-foreground">
              ID Kit: <span className="font-mono">{kit.id}</span>
            </div>

            <div className="flex items-center gap-2">
              {onDuplicate && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onDuplicate(kit);
                  }}
                  className="h-9 rounded-xl text-xs gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicar Kit
                </Button>
              )}
              {onEdit && (
                <Button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(kit);
                  }}
                  className="h-9 rounded-xl text-xs font-bold gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar Kit
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

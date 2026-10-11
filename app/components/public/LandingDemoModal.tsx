"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Play,
  ShoppingCart,
  Building2,
  PackageSearch,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  TrendingUp,
  Cpu,
  Layers
} from "lucide-react";

interface LandingDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LandingDemoModal({ isOpen, onClose }: LandingDemoModalProps) {
  const [activeTab, setActiveTab] = useState<"pos" | "sedes" | "wms" | "ia">("pos");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Play size={20} className="fill-current ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Demo Interactivo de GNS
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Conoce las capacidades de la plataforma antes de registrarte
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-4 sm:px-6 pt-4 border-b border-slate-100 dark:border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
          {[
            { id: "pos", label: "Caja POS & DIAN", icon: ShoppingCart },
            { id: "sedes", label: "Control Multi-Sedes", icon: Building2 },
            { id: "wms", label: "WMS & Inventarios", icon: PackageSearch },
            { id: "ia", label: "Analítica & IA Groq", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "pos" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Módulo Punto de Venta (POS)</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck size={14} /> Facturación DIAN Conectada
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Taladro Percutor 1/2&quot; Inalámbrico</div>
                        <div className="text-[10px] text-slate-400">SKU: IND-9042 • 1 Und</div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white">$345.000 COP</span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Juego de Brocas Acero Rápido (13 Pzas)</div>
                        <div className="text-[10px] text-slate-400">SKU: ACC-1022 • 2 Und</div>
                      </div>
                      <span className="font-black text-slate-900 dark:text-white">$78.000 COP</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-500 block">Total con IVA:</span>
                      <span className="text-lg font-black text-blue-600 dark:text-blue-400">$423.000 COP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black">
                        Documento POS / Electrónica
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
                      <FileText size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">Ventas Ultrarrápidas</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Soporte de lectores de código de barras, atajos de teclado, múltiples medios de pago (efectivo, PSE, datáfono) e impresión térmica directa.
                    </p>
                  </div>
                  <ul className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1.5 mt-4">
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> CUFE y QR DIAN automático
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Cierre y arqueo de caja ciego
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sedes" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Red de Sedes Activas</span>
                    <span className="text-xs font-bold text-blue-600">Enterprise Multi-Sedes</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Sede Principal - Cali (Centro)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-black">Activa</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Stock: 4.820 Und • Ventas hoy: $6.450.000</div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Principal</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Sucursal Norte - Chipichape</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-black">Líder</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Stock: 2.150 Und • Ventas hoy: $8.920.000</div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Sucursal #2</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Sucursal Bogotá - Chapinero</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-black">Activa</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Stock: 3.400 Und • Ventas hoy: $5.120.000</div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">Sucursal #3</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
                      <Layers size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">Interconexión Total</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      El Super Administrador y administradores autorizados pueden alternar entre sedes con un solo clic o ver el dashboard consolidado en tiempo real.
                    </p>
                  </div>
                  <ul className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1.5 mt-4">
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Traslados de stock entre sedes
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Reportes comparativos de ventas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wms" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Control de Almacén & Kardex</span>
                    <span className="text-xs font-bold text-emerald-600">Costeo Promedio Automático</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">Entrada de Mercancía #OC-842</span>
                        <span className="text-emerald-600 font-black">+250 Unidades</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Proveedor: Ferretería Mayorista SAS</span>
                        <span>Costo Unit: $42.500 COP</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">Traslado a Sucursal Norte #TR-104</span>
                        <span className="text-blue-600 font-black">-50 Unidades</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Estado: Despachado y Confirmado</span>
                        <span>Bodega Central</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
                      <PackageSearch size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">Cero Descuadres</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Auditoría paso a paso de cada movimiento. Control de lotes, fechas de vencimiento y cálculo de rentabilidad real por producto.
                    </p>
                  </div>
                  <ul className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1.5 mt-4">
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Kardex en tiempo real
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Importación masiva desde Excel
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ia" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Asistente de Negocio IA (Groq)</span>
                    <span className="text-xs font-bold text-purple-600 flex items-center gap-1">
                      <Cpu size={14} /> Modelo Llama 3 70B
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">Pregunta:</span>
                      <span>&quot;¿Cuáles productos tienen riesgo de agotarse antes del fin de semana?&quot;</span>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900 text-purple-950 dark:text-purple-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                        <Sparkles size={14} /> Recomendación Inteligente de GNS:
                      </div>
                      <p className="m-0 leading-relaxed text-[11px]">
                        Detecté que la <strong>Pintura Esmalte Blanco 1 Gal</strong> tiene solo 8 unidades en stock y tu promedio de venta en sábados es de 14 unidades. Te sugiero generar una orden de compra hoy al proveedor Distribuciones Nacionales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
                      <TrendingUp size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2">Decisiones con Datos</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      El asistente analiza automáticamente tus ventas y comportamiento de inventario para evitar quiebres de stock y dinero estancado.
                    </p>
                  </div>
                  <ul className="text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1.5 mt-4">
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Respuestas en menos de 1 segundo
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} /> Proyecciones de compra sugerida
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <span>30 días de prueba sin ingresar tarjeta de crédito.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cerrar
            </button>
            <Link
              href="/auth/register"
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
            >
              <span>Comenzar Prueba Gratis</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

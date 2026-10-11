"use client";

import React, { useState } from "react";
import {
  Wrench,
  Boxes,
  Shirt,
  Store,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Barcode,
  Layers,
  FileCheck2,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

interface Industry {
  id: string;
  name: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  features: { label: string; detail: string }[];
  tag: string;
}

const industries: Industry[] = [
  {
    id: "hardware",
    name: "Ferreterías & Repuestos",
    icon: Wrench,
    title: "Control milimétrico para miles de referencias y códigos",
    subtitle: "Evita desabastecimientos y agiliza la atención en mostrador",
    description:
      "Gestiona catálogos extensos con múltiples marcas, medidas, conversiones de unidades y códigos equivalentes sin equivocaciones.",
    benefits: [
      "Búsqueda instantánea por código de barras, SKU o referencia original",
      "Control de stock mínimo con alertas automáticas antes de agotar existencia",
      "Listas de precios diferenciales para instaladores, maestros y público general",
      "Facturación electrónica POS en segundos sin filas en mostrador",
    ],
    features: [
      { label: "Manejo de Unidades", detail: "Metros, Kilos, Cajas, Paquetes y Unidades" },
      { label: "Margen de Ganancia", detail: "Cálculo en vivo sobre costo promedio ponderado" },
      { label: "Auditoría de Caja", detail: "Control de arqueo por turnos y cajeros" },
    ],
    tag: "Alta Rotación",
  },
  {
    id: "wholesale",
    name: "Mayoristas & Distribuidoras",
    icon: Boxes,
    title: "Potencia multi-sede y traslados de mercancía en tiempo real",
    subtitle: "Conecta bodegas centrales, almacenes y puntos de despacho",
    description:
      "Diseñado para empresas con varias bodegas y sucursales. Conoce en qué sede está cada producto y aprueba traslados con trazabilidad total.",
    benefits: [
      "Visibilidad consolidada de inventario en todas las sedes desde un solo panel",
      "Traslados entre sedes con control de despacho, recepción y firmas",
      "Precios especiales por volumen, cliente mayorista o crédito comercial",
      "Control estricto de cuentas por cobrar y límites de crédito por cliente",
    ],
    features: [
      { label: "Red Multi-Sede", detail: "Cambio de sede sin cerrar sesión ni perder tiempo" },
      { label: "Kardex Automatizado", detail: "Historial completo de entradas, salidas y ajustes" },
      { label: "Reportes Consolidados", detail: "Rentabilidad por sede, producto y vendedor" },
    ],
    tag: "Enterprise Multi-Sedes",
  },
  {
    id: "fashion",
    name: "Moda & Calzado (Retail)",
    icon: Shirt,
    title: "Matrices completas de variantes: tallas, colores y colecciones",
    subtitle: "Organización visual de prendas y temporadas comerciales",
    description:
      "Deja atrás el caos de las variantes. Crea un producto matriz y genera automáticamente combinaciones de tallas y colores con código propio.",
    benefits: [
      "Gestión de matriz de variantes (S, M, L, XL / Azul, Negro, Blanco)",
      "Impresión de etiquetas con código de barras y precio para prendas",
      "Venta ágil en mostrador con escáner e integración de datáfonos",
      "Reporte de productos más vendidos para no quedar desabastecido en temporadas",
    ],
    features: [
      { label: "Variantes Rápidas", detail: "Hasta decenas de combinaciones por referencia" },
      { label: "Comisiones de Venta", detail: "Seguimiento exacto de ventas por asesor comercial" },
      { label: "Historial de Clientes", detail: "Registro de compras y fidelización de compradores" },
    ],
    tag: "Comercio Minorista",
  },
  {
    id: "market",
    name: "Minimarkets & Droguerías",
    icon: Store,
    title: "Lotes, fechas de vencimiento y alta velocidad en el cobro",
    subtitle: "Protege tu mercancía perecedera y maximiza la rotación",
    description:
      "Evita pérdidas por vencimiento de productos. Controla lotes, registra fechas límite y cobra a la máxima velocidad en tu punto de venta.",
    benefits: [
      "Alertas tempranas de productos próximos a vencer para liquidación o devolución",
      "Lectura ultra-rápida de códigos de barra para ventas fluidas en caja",
      "Soporte de balanzas digitales y venta de productos pesados o a granel",
      "Manejo de caja chica, gastos diarios y arqueos ciegos para evitar fugas",
    ],
    features: [
      { label: "Gestión de Lotes", detail: "Trazabilidad desde la compra al proveedor" },
      { label: "Control Anti-Mermas", detail: "Registro clasificado de pérdidas y averías" },
      { label: "Cierres Diarios", detail: "Resumen de ventas por medios de pago con 1 clic" },
    ],
    tag: "Perecederos & Farmacia",
  },
  {
    id: "services",
    name: "Servicios & Talleres",
    icon: Briefcase,
    title: "Facturación electrónica de servicios y órdenes de trabajo",
    subtitle: "Cobra profesionalmente y controla tus cuentas por cobrar",
    description:
      "Ideal para consultorías, talleres técnicos y negocios de servicios. Emite facturas electrónicas avaladas por la DIAN y haz seguimiento a cobros.",
    benefits: [
      "Emisión de facturas electrónicas de servicios con envío automático por correo",
      "Órdenes de servicio y cotizaciones que se convierten a factura con un clic",
      "Control de pagos a crédito, abonos parciales y recordatorios de vencimiento",
      "Reportes contables listos para tu contador en formato Excel",
    ],
    features: [
      { label: "Validación DIAN", detail: "XML firmado, CUFE y representación gráfica en PDF" },
      { label: "Cotizaciones Pro", detail: "Diseño elegante con el logotipo de tu empresa" },
      { label: "Cuentas por Cobrar", detail: "Semáforo de cartera vencida y por vencer" },
    ],
    tag: "Facturación DIAN",
  },
];

export default function LandingIndustries() {
  const [activeId, setActiveId] = useState<string>("hardware");

  const current = industries.find((i) => i.id === activeId) || industries[0];
  const CurrentIcon = current.icon;

  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50/70 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
            <Sparkles size={14} />
            Adaptado a la Realidad de tu Sector
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Diseñado para resolver los retos de tu industria
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Ya sea que vendas tornillos, prendas de vestir o distribuyas a nivel nacional, GNS se configura según las necesidades operativas de tu modelo de negocio.
          </p>
        </div>

        {/* Industry Nav Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-8 sm:mb-12 no-scrollbar">
          {industries.map((ind) => {
            const Icon = ind.icon;
            const isActive = ind.id === activeId;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => setActiveId(ind.id)}
                className={`px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all duration-200 shrink-0 border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon size={16} className={isActive ? "text-white" : "text-blue-600 dark:text-blue-400"} />
                <span>{ind.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Industry Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-xl relative overflow-hidden transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            {/* Left Column: Description & Benefits */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
                  {current.tag}
                </span>
                <span className="text-xs text-slate-400 font-bold">• Sector Especializado</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  {current.title}
                </h3>
                <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
                  {current.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {current.description}
                </p>
              </div>

              {/* Bullet Points */}
              <div className="space-y-3 pt-2">
                {current.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={13} strokeWidth={3} />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Link */}
              <div className="pt-2">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-blue-600/20 active:scale-95"
                >
                  <span>Probar GNS para {current.name}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right Column: Key Feature Highlights Visual Cards */}
            <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <CurrentIcon size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white block">
                      {current.name}
                    </span>
                    <span className="text-[10px] text-slate-400">Funcionalidades Clave</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  Listo para usar
                </span>
              </div>

              <div className="space-y-3">
                {current.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1"
                  >
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>{feat.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-3.5 leading-relaxed">
                      {feat.detail}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Certificado DIAN Colombia</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-black">
                  <FileCheck2 size={13} /> 100% Compatible
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

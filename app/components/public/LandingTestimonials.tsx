"use client";

import React from "react";
import { Star, Quote, TrendingUp, Building2, CheckCircle2 } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  city: string;
  metric: string;
  metricLabel: string;
  quote: string;
  initials: string;
  avatarBg: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Carlos Mendoza",
    role: "Gerente General",
    company: "Distribuidora & Ferretería del Valle",
    city: "Cali, Colombia",
    metric: "-42%",
    metricLabel: "menos descuadres en inventario",
    quote:
      "Teníamos pérdidas constantes y descuadres entre la bodega principal y los dos puntos de venta. Con GNS sincronizamos el stock en tiempo real y ahora sabemos exactamente qué tenemos y qué debemos pedir.",
    initials: "CM",
    avatarBg: "bg-blue-600",
  },
  {
    name: "Diana Marcela Ospina",
    role: "Directora de Operaciones",
    company: "Boutique & Moda Urbana",
    city: "Medellín, Colombia",
    metric: "2 Horas",
    metricLabel: "ahorradas cada día en cuadres",
    quote:
      "El manejo de tallas y colores antes era una pesadilla en Excel. El POS de GNS es rapidísimo, emite las facturas electrónicas de la DIAN al instante y los cierres de caja son exactos sin un solo centavo de diferencia.",
    initials: "DO",
    avatarBg: "bg-indigo-600",
  },
  {
    name: "Andrés Felipe Ruiz",
    role: "Propietario y Fundador",
    company: "Cadena Minimarkets La Catorce",
    city: "Bogotá, Colombia",
    metric: "+35%",
    metricLabel: "aumento en velocidad de cobro",
    quote:
      "Manejamos 4 sedes con el plan Enterprise. Poder ver el consolidado total de ventas desde mi celular mientras estoy fuera de la ciudad me da total tranquilidad. El soporte técnico siempre responde de inmediato.",
    initials: "AR",
    avatarBg: "bg-emerald-600",
  },
];

export default function LandingTestimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
            <div className="flex text-amber-500 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span>Valoración 4.9 / 5.0 por más de 500 comercios</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Empresas reales con resultados comprobados
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Descubre cómo dueños de negocios y gerentes en Colombia transformaron el control y la rentabilidad de sus empresas con GNS.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group"
            >
              <div className="space-y-4">
                {/* Metric Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                      {t.metric}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 leading-tight block max-w-[110px]">
                      {t.metricLabel}
                    </span>
                  </div>
                  <Quote size={28} className="text-slate-300 dark:text-slate-700 group-hover:text-blue-500/40 transition-colors" />
                </div>

                {/* Star rating */}
                <div className="flex text-amber-400 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  &quot;{t.quote}&quot;
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl ${t.avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md`}
                >
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-tight mt-0.5">
                    {t.role} • {t.company}
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-tight mt-0.5">
                    📍 {t.city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Bar */}
        <div className="mt-12 p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 text-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>99.9% Uptime en la Nube</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Facturación DIAN Avalada</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Soporte Técnico en Español 24/7</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span>Copias de Seguridad Diarias Automáticas</span>
          </div>
        </div>
      </div>
    </section>
  );
}

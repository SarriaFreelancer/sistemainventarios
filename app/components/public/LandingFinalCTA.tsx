"use client";

import React from "react";
import Link from "next/link";
import { Rocket, ShieldCheck, ArrowRight, MessageSquare, CheckCircle2 } from "lucide-react";

export default function LandingFinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-900 text-white relative overflow-hidden border-t border-slate-800">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
          <ShieldCheck size={14} className="text-blue-400" />
          Pruébalo Gratis Durante 30 Días
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
          Empieza a tomar el control total de tu empresa hoy mismo
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Únete a más de 500 comercios, distribuidoras y cadenas que ya automatizaron su inventario, facturan con la DIAN y maximizan sus ganancias con GNS.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 no-underline"
          >
            <Rocket size={20} />
            <span>Crear Cuenta Gratis (Sin Tarjeta)</span>
            <ArrowRight size={18} />
          </Link>

          <a
            href="https://wa.me/573001234567?text=Hola,%20quisiera%20asesoría%20para%20implementar%20GNS%20en%20mi%20empresa"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all no-underline"
          >
            <MessageSquare size={18} className="text-emerald-400" />
            <span>Asesoría Personalizada</span>
          </a>
        </div>

        {/* Trust Points */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Sin datos bancarios requeridos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Listo en menos de 5 minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Cancelas en cualquier momento</span>
          </div>
        </div>
      </div>
    </section>
  );
}

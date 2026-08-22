"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, RefreshCcw, SearchX } from "lucide-react";
import gnsLogo from "@/public/gns-logo.png";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#070b14] p-4 sm:p-6 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">

      {/* Contenedor Principal */}
      <div className="w-full max-w-lg bg-white dark:bg-[#0b1329] rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-slate-800/80 text-center space-y-7 relative overflow-hidden">

        {/* Efectos de luz de fondo */}
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-indigo-500/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Logo GNS SarriaTech */}
        <div className="flex items-center justify-center gap-3 relative z-10">
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-blue-500 bg-black flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Image
              src={gnsLogo}
              alt="GNS SarriaTech Logo"
              className="h-full w-full object-cover rounded-full aspect-square"
              priority
            />
          </div>
          <div className="text-left">
            <span className="text-base font-black tracking-wider uppercase text-slate-900 dark:text-white block leading-none">
              GNS <span className="text-blue-500">SARRIATECH</span>
            </span>
            <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mt-0.5 block">
              Gestión de Negocios
            </span>
          </div>
        </div>

        {/* Ilustración 404 */}
        <div className="relative z-10 py-2">
          <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-3 shadow-inner">
            <SearchX className="w-10 h-10" />
          </div>
          <h1 className="text-7xl font-black text-slate-900 dark:text-white tracking-tight">
            4<span className="text-blue-500">0</span>4
          </h1>
        </div>

        {/* Texto Explicativo */}
        <div className="space-y-2 relative z-10">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Página o Recurso No Encontrado
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            La dirección a la que intentas acceder no existe, ha sido movida o la ruta ingresada no está disponible en este momento.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center relative z-10 pt-2">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 h-11 px-5 text-xs font-extrabold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver Atrás
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 h-11 px-5 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </Link>
        </div>

      </div>
    </main>
  );
}

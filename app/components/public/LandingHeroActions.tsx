"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Rocket, Play } from "lucide-react";
import LandingDemoModal from "./LandingDemoModal";

interface LandingHeroActionsProps {
  sessionUser?: any;
}

export default function LandingHeroActions({ sessionUser }: LandingHeroActionsProps) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <div className="animate-fade-in-3 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mt-4 sm:mt-2 w-full sm:w-auto">
        {sessionUser ? (
          <Link
            href={sessionUser.companyStatus === "SUSPENDED" ? "/#planes" : "/dashboard"}
            className="w-full sm:w-auto no-underline"
          >
            <button className="btn-red w-full sm:w-auto justify-center px-5 py-3.5 sm:px-7 sm:py-3.5 text-[14px] sm:text-[15px]">
              <Rocket size={18} className="shrink-0" />
              <span>{sessionUser.companyStatus === "SUSPENDED" ? "Completar Pago" : "Ir al Dashboard"}</span>
            </button>
          </Link>
        ) : (
          <Link href="/auth/register" className="w-full sm:w-auto no-underline">
            <button className="btn-red w-full sm:w-auto justify-center px-5 py-3 sm:px-7 sm:py-3.5 text-[14px] sm:text-[15px]">
              <Rocket size={18} className="shrink-0" />
              <div className="text-left">
                <div className="leading-none font-bold">Comenzar Ahora</div>
                <div className="text-[10px] sm:text-[11px] font-medium opacity-80 mt-1">Prueba 30 días gratis</div>
              </div>
            </button>
          </Link>
        )}

        {/* Botón Ver Demo interactivo */}
        <button
          type="button"
          onClick={() => setIsDemoOpen(true)}
          className="w-full sm:w-auto justify-center px-5 py-3 sm:px-6 sm:py-2.5 text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
            <Play size={14} className="fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400 ml-0.5" />
          </div>
          <div className="text-left">
            <div className="leading-none">Ver Demo en Vivo</div>
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
              Explorar módulos sin registro
            </div>
          </div>
        </button>
      </div>

      {/* Modal de Demo Interactivo */}
      <LandingDemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}

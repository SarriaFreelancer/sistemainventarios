"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, RefreshCcw } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full space-y-6">
        
        {/* Icon & Error Code */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
          <h1 className="text-9xl font-black text-primary relative z-10 drop-shadow-sm">
            404
          </h1>
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Página no encontrada
          </h2>
          <p className="text-sm text-muted-foreground">
            Parece que te has perdido. La página o recurso que estás intentando buscar no existe o ha sido movido.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors"
          >
            <ArrowLeft size={16} />
            Volver Atrás
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
          >
            <RefreshCcw size={16} />
            Reintentar
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl shadow-md transition-all active:scale-95"
          >
            <Home size={16} />
            Ir al Inicio
          </Link>
        </div>
        
      </div>
    </div>
  );
}

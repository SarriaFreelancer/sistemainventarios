"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configuración de tiempos de inactividad:
// 25 minutos sin actividad -> Abre el modal de advertencia con un conteo regresivo de 5 minutos (300 segundos).
// Si llega a 30 minutos (0 segundos de conteo), se cierra la sesión automáticamente.
const INACTIVITY_WARNING_MS = 25 * 60 * 1000; // 25 minutos
const TOTAL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

export function InactivityGuard({ children }: { children: React.ReactNode }) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300); // 5 minutos (300 s)
  const lastActivityRef = useRef<number>(Date.now());
  const warningOpenRef = useRef<boolean>(false);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    warningOpenRef.current = false;
    window.location.href = "/auth/login?reason=inactivity";
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (warningOpenRef.current) {
      setShowWarning(false);
      warningOpenRef.current = false;
    }
  }, []);

  // Registrar listeners de actividad del usuario (movimiento del mouse, teclas, clics, scroll)
  useEffect(() => {
    const handleUserActivity = () => {
      // Solo reiniciar si el modal de advertencia NO está abierto
      if (!warningOpenRef.current) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, []);

  // Intervalo de comprobación continua cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const inactiveMs = now - lastActivityRef.current;

      if (inactiveMs >= TOTAL_TIMEOUT_MS) {
        // Excedió 30 minutos -> Cerrar sesión de inmediato
        handleLogout();
      } else if (inactiveMs >= INACTIVITY_WARNING_MS) {
        // Excedió 25 minutos -> Mostrar advertencia con conteo regresivo
        if (!warningOpenRef.current) {
          setShowWarning(true);
          warningOpenRef.current = true;
        }
        const remainingMs = TOTAL_TIMEOUT_MS - inactiveMs;
        const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
        setRemainingSeconds(secondsLeft);
        
        if (secondsLeft <= 0) {
          handleLogout();
        }
      } else {
        if (warningOpenRef.current) {
          setShowWarning(false);
          warningOpenRef.current = false;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [handleLogout]);

  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <>
      {children}

      {/* Modal de Advertencia por Inactividad */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[32px] border border-border/80 bg-card p-7 shadow-2xl shadow-primary/20 space-y-6 text-center">
            
            <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center ring-4 ring-orange-500/20 animate-bounce">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                ¿Sigues ahí? Sesión Inactiva
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">
                Has estado inactivo durante un tiempo. Por motivos de seguridad, tu sesión se cerrará automáticamente en:
              </p>
            </div>

            {/* Contador Regresivo */}
            <div className="py-3 px-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 inline-block">
              <span className="text-3xl font-black font-mono text-orange-600 dark:text-orange-400 tracking-wider">
                {formatTime(remainingSeconds)}
              </span>
              <p className="text-[10px] uppercase font-bold text-orange-600/80 dark:text-orange-400/80 mt-0.5">
                minutos restantes
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                onClick={resetTimer}
                className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Continuar Sesión
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                className="h-12 rounded-xl border-border text-foreground font-semibold text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

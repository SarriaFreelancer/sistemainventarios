"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ClientSecurityShield() {
  useEffect(() => {
    // 1. Deshabilitar Clic Derecho (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Seguridad activa: El menú contextual está deshabilitado por protección de código.", {
        duration: 3000,
        id: "security-context-menu"
      });
    };

    // 2. Deshabilitar atajos de teclado de inspección de código fuente y consola
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // F12 (DevTools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked("F12 (Herramientas de desarrollo)");
        return false;
      }

      // Ctrl + Shift + I / Cmd + Option + I (Inspect)
      if (ctrlOrCmd && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked("Inspección de elementos");
        return false;
      }

      // Ctrl + Shift + J / Cmd + Option + J (Console)
      if (ctrlOrCmd && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked("Consola de desarrollo");
        return false;
      }

      // Ctrl + Shift + C / Cmd + Option + C (Element selector)
      if (ctrlOrCmd && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked("Selector de código");
        return false;
      }

      // Ctrl + U / Cmd + Option + U (Ver Código Fuente Original)
      if (ctrlOrCmd && (e.key === "U" || e.key === "u" || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
        notifyBlocked("Ver Código Fuente");
        return false;
      }

      // Ctrl + S / Cmd + S (Guardar página completa)
      if (ctrlOrCmd && (e.key === "S" || e.key === "s" || e.keyCode === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const notifyBlocked = (feature: string) => {
      toast.error(`Acceso restringido: No está permitido abrir ${feature} en GNS Gestión.`, {
        duration: 4000,
        id: `security-blocked-${feature}`
      });
    };

    // 3. Sanitizar/Deshabilitar logs en la consola del navegador en producción
    if (process.env.NODE_ENV === "production") {
      const dummyFunc = () => {};
      console.log = dummyFunc;
      console.info = dummyFunc;
      console.warn = dummyFunc;
      console.debug = dummyFunc;
      console.dir = dummyFunc;
    }

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}

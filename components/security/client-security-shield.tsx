"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ClientSecurityShield() {
  const [devModeEnabled, setDevModeEnabled] = useState(false);

  useEffect(() => {
    // 0. Detectar entorno local o modo desarrollador en localStorage
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local"));

    const storedDevMode =
      typeof window !== "undefined" &&
      localStorage.getItem("gns_dev_mode") === "true";

    const isDev = isLocalhost || storedDevMode || process.env.NODE_ENV === "development";
    setDevModeEnabled(isDev);

    // Atajo secreto para desarrolladores y administradores: Ctrl + Shift + D (o Cmd + Shift + D en Mac)
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlOrCmd && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        const current = localStorage.getItem("gns_dev_mode") === "true";
        const next = !current;
        localStorage.setItem("gns_dev_mode", next ? "true" : "false");
        setDevModeEnabled(next || isLocalhost);

        if (next) {
          toast.success("🛠️ Modo Desarrollador Activado: Consola, F12 y Clic Derecho desbloqueados.", {
            duration: 4000,
            id: "dev-mode-toggle"
          });
        } else {
          toast.info("🛡️ Modo Seguridad Activado: Protección de código fuente restablecida.", {
            duration: 4000,
            id: "dev-mode-toggle"
          });
        }
        return false;
      }
    };

    // 1. Manejo de Clic Derecho (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      // Si está en localhost o modo dev activo, permitir el clic derecho
      const activeDev =
        isLocalhost ||
        process.env.NODE_ENV === "development" ||
        localStorage.getItem("gns_dev_mode") === "true";

      if (activeDev) {
        return true;
      }

      e.preventDefault();
      toast.warning("Seguridad activa: Menú contextual deshabilitado. (Pulsa Ctrl+Shift+D si eres desarrollador/admin)", {
        duration: 3500,
        id: "security-context-menu"
      });
      return false;
    };

    // 2. Manejo de atajos de teclado de inspección de código y consola
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeDev =
        isLocalhost ||
        process.env.NODE_ENV === "development" ||
        localStorage.getItem("gns_dev_mode") === "true";

      if (activeDev) {
        return true;
      }

      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
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

      // Ctrl + U / Cmd + Option + U (Ver Código Fuente)
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
      toast.error(`Acceso restringido: No está permitido abrir ${feature} en GNS. Para depuración pulsa Ctrl+Shift+D.`, {
        duration: 4000,
        id: `security-blocked-${feature}`
      });
    };

    // Registrar escuchadores
    window.addEventListener("keydown", handleGlobalShortcuts);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}

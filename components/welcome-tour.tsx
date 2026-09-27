"use client";

import { useEffect, useRef } from "react";
import { startDashboardTour } from "@/lib/tour";
import { markTourAsCompleted } from "@/app/actions/user-actions";

/**
 * Detecta si hay alguna alerta emergente (SweetAlert2, diálogos modales o anuncios)
 * actualmente visible o activa en pantalla para evitar que el tour la cubra.
 */
function isAnyAlertOrModalActive(): boolean {
  if (typeof document === "undefined") return false;

  // 1. SweetAlert2 abierto
  const swalContainer = document.querySelector(".swal2-container");
  if (
    swalContainer &&
    !swalContainer.classList.contains("swal2-hidden") &&
    swalContainer.clientHeight > 0
  ) {
    return true;
  }
  if (document.body.classList.contains("swal2-shown")) {
    return true;
  }

  // 2. Modales Radix / Diálogos abiertos
  const activeDialogs = document.querySelectorAll(
    '[role="dialog"][data-state="open"], [data-slot="dialog-content"][data-state="open"], .fixed.inset-0.z-50'
  );
  if (activeDialogs.length > 0) {
    return true;
  }

  return false;
}

export function WelcomeTour({ modules, userId }: { modules?: string[]; userId: string }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const tourKey = `gns_sarriatech_tour_completed_${userId}`;
    if (localStorage.getItem(tourKey)) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let calmTicks = 0; // Conteo de revisiones consecutivas sin alertas

    // Polling cada 400ms para esperar que desaparezcan todas las alertas de bienvenida/anuncios
    pollInterval = setInterval(() => {
      // Si el tour ya fue completado o cancelado en otra pestaña/botón, detenemos
      if (localStorage.getItem(tourKey)) {
        if (pollInterval) clearInterval(pollInterval);
        return;
      }

      if (isAnyAlertOrModalActive()) {
        calmTicks = 0; // Se resetea el contador mientras haya una alerta en pantalla
        return;
      }

      calmTicks++;

      // Cuando pasen al menos 3 revisiones (aprox. 1.2 segundos continuos sin ninguna alerta)
      if (calmTicks >= 3) {
        if (pollInterval) clearInterval(pollInterval);
        initialized.current = true;

        startDashboardTour(modules, userId, () => {
          markTourAsCompleted(Number(userId)).catch(console.error);
        });
      }
    }, 400);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      initialized.current = false;
    };
  }, [modules, userId]);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { startDashboardTour } from "@/lib/tour";

export function WelcomeTour({ modules, userId }: { modules?: string[], userId: string }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const tourKey = `gns_sarriatech_tour_completed_${userId}`;
    if (localStorage.getItem(tourKey)) return;

    initialized.current = true;

    // Pequeño delay para asegurar que el DOM haya cargado completamente
    const timeout = setTimeout(() => {
      startDashboardTour(modules, userId);
    }, 1500);

    return () => {
      clearTimeout(timeout);
      initialized.current = false;
    };
  }, []);

  return null;
}

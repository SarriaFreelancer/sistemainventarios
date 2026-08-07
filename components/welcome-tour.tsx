"use client";

import { useEffect, useRef } from "react";
import { startDashboardTour } from "@/lib/tour";
import { markTourAsCompleted } from "@/app/actions/user-actions";

export function WelcomeTour({ modules, userId }: { modules?: string[], userId: string }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    const tourKey = `gns_sarriatech_tour_completed_${userId}`;
    if (localStorage.getItem(tourKey)) return;

    initialized.current = true;

    // Pequeño delay para asegurar que el DOM haya cargado completamente
    const timeout = setTimeout(() => {
      startDashboardTour(modules, userId, () => {
        markTourAsCompleted(Number(userId)).catch(console.error);
      });
    }, 1500);

    return () => {
      clearTimeout(timeout);
      initialized.current = false;
    };
  }, []);

  return null;
}

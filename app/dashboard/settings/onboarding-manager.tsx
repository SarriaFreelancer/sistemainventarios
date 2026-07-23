"use client";

import React, { useState } from "react";
import { Sparkles, Trash2, Loader2, ArrowRight } from "lucide-react";
import { successAlert, errorAlert } from "@/lib/sweetalert";
import Swal from "sweetalert2";
import { generateDemoData, clearDemoData } from "@/app/actions/demo-actions";
import { useRouter } from "next/navigation";
import { startDashboardTour } from "@/lib/tour";

export function OnboardingManager({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const handleRestartTour = async () => {
    localStorage.removeItem(`gns_sarriatech_tour_completed_${userId}`);
    router.push("/dashboard");
  };

  const handleGenerate = async () => {
    const confirm = await Swal.fire({
      title: '¿Generar datos de prueba?',
      text: "Se inyectarán categorías, productos, ventas y empleados falsos con el prefijo [DEMO].",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, generar'
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      const res = await generateDemoData();
      setLoading(false);
      
      if (res.success) {
        successAlert("Datos generados", "Explora el dashboard para ver los nuevos datos.");
        router.refresh();
      } else {
        errorAlert("Error", res.error || "Ocurrió un error");
      }
    }
  };

  const handleClean = async () => {
    const confirm = await Swal.fire({
      title: '¿Limpiar datos de prueba?',
      text: "Se eliminarán permanentemente todos los registros que comiencen con [DEMO]. Tus datos reales estarán a salvo.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, limpiar'
    });

    if (confirm.isConfirmed) {
      setCleaning(true);
      const res = await clearDemoData();
      setCleaning(false);
      
      if (res.success) {
        successAlert("Limpieza exitosa", "Los datos de prueba han sido eliminados.");
        router.refresh();
      } else {
        errorAlert("Error", res.error || "Ocurrió un error");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 p-3 rounded-xl">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">Datos de Prueba y Bienvenida</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Si tu sistema está vacío, puedes generar datos ficticios para visualizar el funcionamiento de los reportes, 
              ventas y recursos humanos. Todos los datos tendrán el prefijo <b>[DEMO]</b>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || cleaning}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Generar Datos [DEMO]
              </button>

              <button
                type="button"
                onClick={handleClean}
                disabled={loading || cleaning}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 font-semibold rounded-xl text-sm hover:bg-destructive/20 transition disabled:opacity-50"
              >
                {cleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Limpiar Datos [DEMO]
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-2xl border border-border p-6 bg-card">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
          <ArrowRight size={18} className="text-primary" />
          Tour Guiado
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Si deseas volver a ver el tutorial interactivo del sistema para repasar las opciones principales, presiona el siguiente botón.
        </p>
        <button
          type="button"
          onClick={handleRestartTour}
          className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition"
        >
          Relanzar Tutorial
        </button>
      </div>
    </div>
  );
}

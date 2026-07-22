"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, X } from "lucide-react";
import { generatePayroll } from "@/app/actions/hr-actions";

export function GeneratePayrollModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!periodStart || !periodEnd) {
      alert("Por favor selecciona las fechas del período.");
      setLoading(false);
      return;
    }

    const result = await generatePayroll(new Date(periodStart), new Date(periodEnd));

    if (result.success) {
      setIsOpen(false);
      router.refresh(); // Refresh the list
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 gap-2"
      >
        <Calculator className="h-4 w-4" />
        Generar Nómina
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-background rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 flex items-center justify-between border-b border-border p-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Generar Nómina</h2>
                <p className="text-sm text-muted-foreground">Calcula los pagos para todos los empleados activos.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Inicio del Período</label>
                    <input 
                      type="date" 
                      required
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Fin del Período</label>
                    <input 
                      type="date" 
                      required
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Nota:</strong> Al generar la nómina, el sistema tomará a todos los empleados en estado <span className="text-emerald-500 font-medium">ACTIVO</span> y calculará automáticamente sus salarios base, deducciones (ej. 8% EPS/Pensión) y neto a pagar proporcional.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-border gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-8 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 gap-2"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 gap-2"
                  >
                    {loading ? (
                      <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    ) : (
                      <Calculator className="h-4 w-4" />
                    )}
                    Calcular Nómina
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

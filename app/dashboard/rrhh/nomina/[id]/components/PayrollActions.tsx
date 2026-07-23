"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, DollarSign } from "lucide-react";
import { processPayroll, payPayroll, deletePayroll } from "@/app/actions/hr-actions";
import { confirmAction, errorAlert, successAlert } from "@/lib/sweetalert";

export function PayrollActions({ payrollId, status }: { payrollId: number, status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    const confirmed = await confirmAction(
      "¿Aprobar Nómina?", 
      "¿Estás seguro de aprobar esta nómina? No podrás revertirlo."
    );
    if (!confirmed) return;

    setLoading(true);
    const result = await processPayroll(payrollId);
    if (!result.success) {
      errorAlert("Error al aprobar", result.error);
    } else {
      successAlert("Nómina aprobada", "La nómina ha sido aprobada exitosamente.");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const confirmed = await confirmAction(
      "¿Eliminar Borrador?", 
      "¿Estás seguro de eliminar este borrador de nómina? Las novedades de único uso volverán a estar pendientes.",
      "Sí, eliminar",
      "Cancelar"
    );
    if (!confirmed) return;

    setLoading(true);
    const result = await deletePayroll(payrollId);
    if (!result.success) {
      errorAlert("Error al eliminar", result.error);
      setLoading(false);
    } else {
      successAlert("Borrador eliminado", "La nómina ha sido eliminada.");
      router.push("/dashboard/rrhh/nomina");
    }
  };

  const handlePay = async () => {
    const confirmed = await confirmAction(
      "¿Registrar Pago?", 
      "¿Confirmas que el pago ha sido realizado a los empleados?"
    );
    if (!confirmed) return;

    setLoading(true);
    const result = await payPayroll(payrollId);
    if (!result.success) {
      errorAlert("Error al pagar", result.error);
    } else {
      successAlert("Pago registrado", "Se ha registrado el pago de la nómina.");
    }
    setLoading(false);
  };

  if (status === "DRAFT") {
    return (
      <div className="flex gap-2">
        <button 
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-500/20 disabled:opacity-50"
        >
          Eliminar Borrador
        </button>
        
        <button 
          onClick={handleApprove}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Aprobar Nómina
        </button>
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <button 
        onClick={handlePay}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 gap-2"
      >
        <DollarSign className="h-4 w-4" />
        Registrar Pago
      </button>
    );
  }

  return null;
}

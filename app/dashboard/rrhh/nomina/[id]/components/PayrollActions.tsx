"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, DollarSign } from "lucide-react";
import { processPayroll, payPayroll } from "@/app/actions/hr-actions";

export function PayrollActions({ payrollId, status }: { payrollId: number, status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm("¿Estás seguro de aprobar esta nómina? No podrás revertirlo.")) return;
    setLoading(true);
    const result = await processPayroll(payrollId);
    if (!result.success) alert("Error: " + result.error);
    setLoading(false);
  };

  const handlePay = async () => {
    if (!confirm("¿Confirmas que el pago ha sido realizado a los empleados?")) return;
    setLoading(true);
    const result = await payPayroll(payrollId);
    if (!result.success) alert("Error: " + result.error);
    setLoading(false);
  };

  if (status === "DRAFT") {
    return (
      <button 
        onClick={handleApprove}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        Aprobar Nómina
      </button>
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

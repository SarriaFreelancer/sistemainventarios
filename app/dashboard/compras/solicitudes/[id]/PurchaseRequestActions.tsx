"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { updatePurchaseRequestStatus } from "@/app/actions/purchase-request-actions";
import { confirmAction } from "@/lib/sweetalert";

interface PurchaseRequestActionsProps {
  requestId: number;
  status: string;
}

export function PurchaseRequestActions({ requestId, status }: PurchaseRequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: "APPROVED" | "REJECTED") => {
    const actionName = newStatus === "APPROVED" ? "aprobar" : "rechazar";
    const confirmed = await confirmAction(
      `¿${actionName.charAt(0).toUpperCase() + actionName.slice(1)} solicitud?`,
      `¿Estás seguro de ${actionName} esta solicitud de compra?`,
      "Sí, confirmar",
      "Cancelar"
    );

    if (!confirmed) return;

    setLoading(true);
    const result = await updatePurchaseRequestStatus(requestId, newStatus);
    
    if (result.success) {
      router.refresh();
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  if (status !== 'PENDING_APPROVAL' && status !== 'DRAFT') {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No hay acciones disponibles para el estado actual.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button 
        onClick={() => handleStatusChange("APPROVED")}
        disabled={loading}
        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50 gap-2"
      >
        <CheckCircle className="h-4 w-4" />
        Aprobar
      </button>
      <button 
        onClick={() => handleStatusChange("REJECTED")}
        disabled={loading}
        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-rose-600/10 px-4 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-600/20 disabled:opacity-50 gap-2"
      >
        <XCircle className="h-4 w-4" />
        Rechazar
      </button>
    </div>
  );
}

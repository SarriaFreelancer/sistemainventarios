"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, XCircle } from "lucide-react";
import { updatePurchaseOrderStatus } from "@/app/actions/purchase-actions";
import { confirmAction } from "@/lib/sweetalert";

interface PurchaseOrderActionsProps {
  orderId: number;
  status: string;
}

export function PurchaseOrderActions({ orderId, status }: PurchaseOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: "SENT" | "CANCELLED") => {
    const actionName = newStatus === "SENT" ? "enviar" : "cancelar";
    const confirmed = await confirmAction(
      `¿${actionName.charAt(0).toUpperCase() + actionName.slice(1)} orden?`,
      `¿Estás seguro de ${actionName} esta orden de compra?`,
      "Sí, confirmar",
      "No, volver"
    );

    if (!confirmed) return;

    setLoading(true);
    const result = await updatePurchaseOrderStatus(orderId, newStatus);
    
    if (result.success) {
      router.refresh();
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  if (status !== 'DRAFT') {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No hay acciones disponibles para el estado actual.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button 
        onClick={() => handleStatusChange("SENT")}
        disabled={loading}
        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50 gap-2"
      >
        <Send className="h-4 w-4" />
        Enviar al Proveedor
      </button>
      <button 
        onClick={() => handleStatusChange("CANCELLED")}
        disabled={loading}
        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-rose-600/10 px-4 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-600/20 disabled:opacity-50 gap-2"
      >
        <XCircle className="h-4 w-4" />
        Cancelar Orden
      </button>
    </div>
  );
}

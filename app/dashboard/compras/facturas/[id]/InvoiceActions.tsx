"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { updatePurchaseInvoiceStatus } from "@/app/actions/purchase-actions";
import { confirmAction } from "@/lib/sweetalert";

interface InvoiceActionsProps {
  invoiceId: number;
  status: string;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: "CANCELLED") => {
    const actionName = "anular";
    const confirmed = await confirmAction(
      `¿Anular factura?`,
      `¿Estás seguro de anular esta factura?`,
      "Sí, confirmar",
      "No, volver"
    );

    if (!confirmed) return;

    setLoading(true);
    const result = await updatePurchaseInvoiceStatus(invoiceId, newStatus);
    
    if (result.success) {
      router.refresh();
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  if (status !== 'PENDING' && status !== 'PARTIAL') {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No hay acciones disponibles para el estado actual.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button 
        onClick={() => handleStatusChange("CANCELLED")}
        disabled={loading}
        className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-rose-600/10 px-4 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-600/20 disabled:opacity-50 gap-2"
      >
        <XCircle className="h-4 w-4" />
        Anular Factura
      </button>
    </div>
  );
}

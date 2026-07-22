"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle } from "lucide-react";
import { createPurchasePayment } from "@/app/actions/purchase-finance-actions";

export function PurchasePaymentModal({ 
  payable, 
  onClose 
}: { 
  payable: any; 
  onClose: () => void 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const balance = payable.amount - payable.paidAmount;
  const [amount, setAmount] = useState(balance.toString());
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER");
  const [reference, setReference] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    
    if (Number(amount) > balance) {
      alert("El abono no puede superar el saldo pendiente.");
      return;
    }

    setLoading(true);

    try {
      const res = await createPurchasePayment(payable.id, Number(amount), paymentMethod, reference);
      
      if (!res.success) {
        alert("Error: " + res.error);
        setLoading(false);
        return;
      }

      router.refresh();
      onClose();
    } catch (error: any) {
      alert("Error inesperado: " + error.message);
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-bold text-foreground">Abonar a Cuenta</h2>
        <p className="text-sm text-muted-foreground mt-1">Factura: {payable.purchaseInvoice.invoiceNumber}</p>

        <div className="mt-4 p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Facturado:</span>
            <span className="font-medium text-foreground">{formatCurrency(payable.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Pagado:</span>
            <span className="font-medium text-foreground">{formatCurrency(payable.paidAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-foreground font-semibold">Saldo Pendiente:</span>
            <span className="font-bold text-rose-500">{formatCurrency(balance)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Monto a Pagar *</label>
            <input 
              type="number" 
              required
              min="1"
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Método de Pago</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="TRANSFER">Transferencia Bancaria</option>
              <option value="CASH">Efectivo</option>
              <option value="CREDIT_CARD">Tarjeta de Crédito</option>
              <option value="CHECK">Cheque</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Referencia (Opcional)</label>
            <input 
              type="text" 
              placeholder="N° Comprobante, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 gap-2"
            >
              {loading ? "Procesando..." : "Confirmar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

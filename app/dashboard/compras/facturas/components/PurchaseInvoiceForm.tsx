"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { createPurchaseInvoice } from "@/app/actions/purchase-finance-actions";

interface PurchaseInvoiceFormProps {
  suppliers: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PurchaseInvoiceForm({ suppliers, onSuccess, onCancel }: PurchaseInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !invoiceNumber || !totalAmount) return;
    
    setLoading(true);

    try {
      await createPurchaseInvoice({
        invoiceNumber,
        supplierId: Number(supplierId),
        totalAmount: Number(totalAmount),
        dueDate: dueDate ? dueDate : undefined,
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      alert("Error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6 max-w-2xl">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Proveedor emisor *</label>
            <select 
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Número de Factura *</label>
            <input 
              type="text" 
              required
              placeholder="Ej. FE-10029"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Total Facturado (con impuestos) *</label>
            <input 
              type="number" 
              required
              min="0"
              placeholder="Ej. 1500000"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Fecha de Vencimiento (Opcional)</label>
            <input 
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 gap-4 border-t border-border mt-4">
          <button
            type="button"
            onClick={onCancel}
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
              <Save className="h-4 w-4" />
            )}
            Registrar Factura
          </button>
        </div>
      </div>
    </form>
  );
}

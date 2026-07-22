"use client";

import { useState } from "react";
import { ChevronRight, DollarSign, Wallet } from "lucide-react";
import { PurchasePaymentModal } from "./PurchasePaymentModal";

export function AccountsPayableClient({ payables }: { payables: any[] }) {
  const [selectedPayable, setSelectedPayable] = useState<any | null>(null);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'PARTIAL': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING': return 'Pendiente';
      case 'PARTIAL': return 'Pago Parcial';
      case 'PAID': return 'Pagado';
      default: return status;
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <>
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        {payables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hay cuentas por pagar</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Las facturas de compras generarán cuentas por cobrar automáticamente aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Factura</th>
                  <th className="px-6 py-4 font-medium">Proveedor</th>
                  <th className="px-6 py-4 font-medium">Vencimiento</th>
                  <th className="px-6 py-4 font-medium">Total Adeudado</th>
                  <th className="px-6 py-4 font-medium">Saldo Restante</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payables.map((ap) => {
                  const balance = ap.amount - ap.paidAmount;
                  return (
                    <tr key={ap.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {ap.purchaseInvoice?.invoiceNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {ap.purchaseInvoice?.supplier?.companyName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {ap.dueDate ? new Date(ap.dueDate).toLocaleDateString('es-CO') : 'Sin fecha'}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(ap.amount)}
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-500">
                        {formatCurrency(balance)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(ap.status)}`}>
                          {getStatusLabel(ap.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {ap.status !== 'PAID' ? (
                          <button 
                            onClick={() => setSelectedPayable(ap)}
                            className="inline-flex h-8 px-3 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium"
                          >
                            Pagar
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Cerrada</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayable && (
        <PurchasePaymentModal 
          payable={selectedPayable} 
          onClose={() => setSelectedPayable(null)} 
        />
      )}
    </>
  );
}

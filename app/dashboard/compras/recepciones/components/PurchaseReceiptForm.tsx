"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle } from "lucide-react";
import { createPurchaseReceipt } from "@/app/actions/purchase-actions";

export function PurchaseReceiptForm({ pendingOrders }: { pendingOrders: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">("");
  const [receivedItems, setReceivedItems] = useState<any[]>([]);

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(Number(orderId));
    const order = pendingOrders.find(o => o.id === Number(orderId));
    if (order) {
      // Poblar el array con las líneas de la orden
      setReceivedItems(order.lines.map((line: any) => ({
        lineId: line.id,
        productId: line.productId, // puede ser null si es servicio
        description: line.description,
        requestedQuantity: line.quantity,
        alreadyReceived: line.receivedQuantity || 0,
        // Por defecto, sugerir recibir lo que falta
        quantityToReceive: line.quantity - (line.receivedQuantity || 0),
        itemType: line.itemType
      })));
    } else {
      setReceivedItems([]);
    }
  };

  const handleQuantityChange = (lineId: number, value: string) => {
    setReceivedItems(prev => prev.map(item => 
      item.lineId === lineId ? { ...item, quantityToReceive: Number(value) } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    
    setLoading(true);

    // Filtrar solo los ítems donde se está recibiendo algo y son productos que impactan inventario
    // Opcional: Permitir recibir servicios si se requiere tracking
    const itemsToProcess = receivedItems
      .filter(i => i.quantityToReceive > 0 && i.productId !== null)
      .map(i => ({
        lineId: i.lineId,
        productId: i.productId,
        quantity: i.quantityToReceive
      }));

    if (itemsToProcess.length === 0) {
      alert("No hay ítems válidos para recibir (revisa que las cantidades sean mayores a 0 y estén asociadas a productos físicos).");
      setLoading(false);
      return;
    }

    try {
      await createPurchaseReceipt(Number(selectedOrderId), itemsToProcess);
      router.push("/dashboard/compras/recepciones");
    } catch (error: any) {
      alert("Error: " + error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="max-w-xl space-y-2">
          <label className="text-sm font-medium text-foreground">Orden de Compra a Recibir *</label>
          <select 
            required
            value={selectedOrderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">-- Selecciona una Orden Enviada --</option>
            {pendingOrders.map(order => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - {order.supplier.companyName} (Total: ${order.total})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedOrderId !== "" && receivedItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Ítems de la Orden</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Descripción</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 text-right font-medium">Pedido</th>
                    <th className="px-4 py-3 text-right font-medium">Recibido (Previo)</th>
                    <th className="px-4 py-3 text-right font-medium">A Recibir Ahora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {receivedItems.map((item) => (
                    <tr key={item.lineId}>
                      <td className="p-3 font-medium">{item.description}</td>
                      <td className="p-3 text-muted-foreground">{item.itemType}</td>
                      <td className="p-3 text-right">{item.requestedQuantity}</td>
                      <td className="p-3 text-right">{item.alreadyReceived}</td>
                      <td className="p-2 text-right">
                        {item.productId ? (
                          <input 
                            type="number" 
                            min="0"
                            max={item.requestedQuantity - item.alreadyReceived}
                            value={item.quantityToReceive}
                            onChange={(e) => handleQuantityChange(item.lineId, e.target.value)}
                            className="w-24 ml-auto rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none text-right"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A (No físico)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 gap-4">
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
              Confirmar Recepción e Ingresar a Inventario
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

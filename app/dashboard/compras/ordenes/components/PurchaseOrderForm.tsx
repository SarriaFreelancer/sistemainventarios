"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft, Calculator } from "lucide-react";
import { createPurchaseOrder } from "@/app/actions/purchase-actions";
import Link from "next/link";

interface Supplier {
  id: number;
  companyName: string;
}

export function PurchaseOrderForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<string>("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 19, itemType: "PRODUCTO_VENTA" }
  ]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, taxRate: 19, itemType: "PRODUCTO_VENTA" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    items.forEach(i => {
      const lineTotal = Number(i.quantity) * Number(i.unitPrice);
      subtotal += lineTotal;
      tax += lineTotal * (Number(i.taxRate) / 100);
    });
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert("Selecciona un proveedor");
      return;
    }
    
    setLoading(true);

    const result = await createPurchaseOrder({
      supplierId: Number(supplierId),
      expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      lines: items.map(i => ({
        description: i.description,
        itemType: i.itemType as any,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxRate: Number(i.taxRate),
      }))
    });

    if (result && result.id) {
      router.push("/dashboard/compras/ordenes");
    } else {
      alert("Error al crear orden");
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Proveedor *</label>
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
            <label className="text-sm font-medium text-foreground">Fecha Esperada de Entrega</label>
            <input 
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Detalle de Orden</h2>
          <button 
            type="button" 
            onClick={addItem}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-secondary px-4 text-xs font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Línea
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium w-36">Tipo</th>
                  <th className="px-4 py-3 font-medium w-24">Cant.</th>
                  <th className="px-4 py-3 font-medium w-32">Precio Unit.</th>
                  <th className="px-4 py-3 font-medium w-24">% IVA</th>
                  <th className="px-4 py-3 text-right font-medium w-32">Subtotal</th>
                  <th className="px-4 py-3 text-right font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => {
                  const lineTotal = Number(item.quantity) * Number(item.unitPrice);
                  return (
                    <tr key={index}>
                      <td className="p-2">
                        <input 
                          type="text" 
                          required
                          value={item.description}
                          onChange={(e) => handleChange(index, 'description', e.target.value)}
                          placeholder="Nombre del recurso..."
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <select 
                          value={item.itemType}
                          onChange={(e) => handleChange(index, 'itemType', e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="MATERIA_PRIMA">Materia Prima</option>
                          <option value="PRODUCTO_VENTA">Producto Venta</option>
                          <option value="SERVICIO">Servicio</option>
                          <option value="ACTIVO_FIJO">Activo Fijo</option>
                          <option value="INSUMO">Insumo</option>
                          <option value="PAPELERIA">Papelería</option>
                          <option value="GASTO_ADMINISTRATIVO">Gasto Adm.</option>
                          <option value="OTROS">Otros</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          required
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleChange(index, 'unitPrice', e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={item.taxRate}
                          onChange={(e) => handleChange(index, 'taxRate', e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="p-2 text-right">
                        <button 
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="bg-muted/20 p-4 border-t border-border flex flex-col items-end gap-1 text-sm">
            <div className="flex w-64 justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex w-64 justify-between text-muted-foreground">
              <span>Impuestos (IVA):</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex w-64 justify-between font-bold text-base text-foreground mt-2 pt-2 border-t border-border">
              <span>Total Orden:</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border gap-4">
        <Link
          href="/dashboard/compras/ordenes"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Cancelar
        </Link>
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
          Emitir Orden
        </button>
      </div>
    </form>
  );
}

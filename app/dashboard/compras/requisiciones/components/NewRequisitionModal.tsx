"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, X } from "lucide-react";
import { createInternalRequisition } from "@/app/actions/purchase-requisition-actions";

export function NewRequisitionModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: 1, unit: "UN", itemType: "PRODUCTO_VENTA", notes: "" }
  ]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit: "UN", itemType: "PRODUCTO_VENTA", notes: "" }]);
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

  const handleOpen = () => {
    setPriority("MEDIUM");
    setNotes("");
    setItems([{ description: "", quantity: 1, unit: "UN", itemType: "PRODUCTO_VENTA", notes: "" }]);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createInternalRequisition({
      priority,
      notes,
      items: items.map(i => ({
        ...i,
        quantity: Number(i.quantity),
        itemType: i.itemType as any
      }))
    });

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 gap-2"
      >
        <Plus className="h-4 w-4" />
        Nueva Requisición
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
          <div className="bg-background rounded-3xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="sticky top-0 bg-background/95 backdrop-blur z-10 flex items-center justify-between border-b border-border p-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Nueva Requisición Interna</h2>
                <p className="text-sm text-muted-foreground">Solicita recursos y compártelos para su aprobación.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Prioridad</label>
                      <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="LOW">Baja</option>
                        <option value="MEDIUM">Media</option>
                        <option value="HIGH">Alta</option>
                        <option value="URGENT">Urgente</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Observaciones Generales</label>
                      <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej. Material necesario para la campaña de marketing del mes..."
                        className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">Ítems Solicitados</h2>
                    <button 
                      type="button" 
                      onClick={addItem}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-secondary px-4 text-xs font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Ítem
                    </button>
                  </div>

                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Descripción</th>
                            <th className="px-4 py-3 font-medium w-32">Tipo</th>
                            <th className="px-4 py-3 font-medium w-24">Cantidad</th>
                            <th className="px-4 py-3 font-medium w-24">Unidad</th>
                            <th className="px-4 py-3 font-medium">Notas</th>
                            <th className="px-4 py-3 text-right font-medium w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {items.map((item, index) => (
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
                                  type="text" 
                                  value={item.unit}
                                  onChange={(e) => handleChange(index, 'unit', e.target.value)}
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="text" 
                                  value={item.notes}
                                  onChange={(e) => handleChange(index, 'notes', e.target.value)}
                                  placeholder="Opcional..."
                                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                />
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
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
                    Generar Requisición
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

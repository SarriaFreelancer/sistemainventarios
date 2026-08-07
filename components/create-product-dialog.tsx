"use client";

import { useState, useTransition, useCallback } from "react";
import { createProduct } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { successAlert, errorAlert } from "@/lib/sweetalert";

interface Category { id: string; name: string; productGroupId?: string; }
interface Supplier { id: string; companyName: string; }
interface ProductGroup { id: string; name: string; }

interface CreateProductDialogProps {
  categories: Category[];
  suppliers: Supplier[];
  groups: ProductGroup[];
  disabled?: boolean;
  limitMessage?: string;
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 disabled:opacity-50";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

export function CreateProductDialog({ categories, suppliers, groups, disabled = false, limitMessage = '' }: CreateProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [productType, setProductType] = useState('SALE');
  const [selectedGroup, setSelectedGroup] = useState('');

  const filteredCategories = selectedGroup
    ? categories.filter(c => c.productGroupId === selectedGroup)
    : categories;

  const handleAction = useCallback(async (formData: FormData) => {
    startTransition(async () => {
      const result = await createProduct(formData);
      if (result?.success) {
        successAlert('Producto Registrado', 'El producto fue agregado al catálogo exitosamente.');
        setOpen(false);
      } else {
        errorAlert('Error al Registrar', result?.error ?? 'No fue posible guardar el producto.');
      }
    });
  }, []);

  return (
    <>
      <Button
        onClick={() => {
          if (disabled) {
            errorAlert('Límite alcanzado', limitMessage);
            return;
          }
          setOpen(true);
        }}
        className={`flex items-center gap-2 px-5 h-11 rounded-2xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus className="h-4 w-4" />
        Nuevo Producto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-primary to-[#C5A059] rounded-full" />
              Registrar Producto
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleAction(new FormData(e.currentTarget)); }} className="space-y-5 mt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-type" className={labelCls}>Tipo de Producto</Label>
                <select id="new-type" name="type" className={selectCls} value={productType} onChange={(e) => setProductType(e.target.value)}>
                  <option value="SALE">Producto para venta</option>
                  <option value="RAW_MATERIAL">Materia prima</option>
                  <option value="FINISHED_GOOD">Producto terminado</option>
                  <option value="SUPPLY">Insumo</option>
                  <option value="SERVICE">Servicio</option>
                  <option value="FIXED_ASSET">Activo fijo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-code" className={labelCls}>Código</Label>
                <Input id="new-code" name="code" placeholder="Ej. LIP-001" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-name" className={labelCls}>Nombre</Label>
                <Input id="new-name" name="name" placeholder="Nombre del producto" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-group" className={labelCls}>Grupo de Producto</Label>
                <select id="new-group" name="productGroupId" className={selectCls} value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                  <option value="">Seleccione un grupo...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-categoryId" className={labelCls}>Categoría</Label>
                <select id="new-categoryId" name="categoryId" className={selectCls}>
                  <option value="">Seleccione una categoría...</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-supplierId" className={labelCls}>Proveedor</Label>
                <select id="new-supplierId" name="supplierId" className={selectCls}>
                  <option value="">Seleccione proveedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-qty" className={labelCls}>Cantidad Disponible</Label>
                <Input id="new-qty" name="quantityAvailable" type="number" min="0" defaultValue="0" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-cost" className={labelCls}>Costo Unitario (COP)</Label>
                <Input id="new-cost" name="unitCost" type="number" min="0" step="100" defaultValue="0" className={inputCls} />
              </div>
              
              {['SALE', 'FINISHED_GOOD', 'SERVICE'].includes(productType) ? (
                <div className="space-y-1.5">
                  <Label htmlFor="new-price" className={labelCls}>Precio de Venta (COP)</Label>
                  <Input id="new-price" name="salePrice" type="number" min="0" step="100" defaultValue="0" className={inputCls} required />
                </div>
              ) : (
                <div className="space-y-1.5 flex items-end pb-0.5">
                  <div className="bg-muted/30 border border-border rounded-xl p-2.5 text-xs text-muted-foreground">
                    Uso interno (sin precio de venta).
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

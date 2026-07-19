"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { updateProduct } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { successAlert, errorAlert } from "@/lib/sweetalert";

interface Category { id: string; name: string; }
interface Supplier { id: string; companyName: string; }
interface ProductGroup { id: string; name: string; }
interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  supplierId: string;
  quantityAvailable: number;
  unitCost: number;
  salePrice: number;
  productGroupId?: string | null;
  type?: string;
}

interface EditProductDialogProps {
  product: Product;
  categories: Category[];
  suppliers: Supplier[];
  groups: ProductGroup[];
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 disabled:opacity-50";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

export function EditProductDialog({ product, categories, suppliers, groups }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [productType, setProductType] = useState(product.type || 'SALE');

  useEffect(() => {
    if (open) {
      setProductType(product.type || 'SALE');
    }
  }, [open, product.type]);

  const handleAction = useCallback(async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProduct(formData);
      if (result?.success) {
        successAlert('Producto Actualizado', 'Los cambios se guardaron correctamente.');
        setOpen(false);
      } else {
        errorAlert('Error al Actualizar', result?.error ?? 'No fue posible actualizar el producto.');
      }
    });
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-primary to-[#C5A059] rounded-full" />
              Editar Producto
            </DialogTitle>
          </DialogHeader>

          <form action={handleAction} className="space-y-5 mt-2">
            <input type="hidden" name="id" value={product.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`edit-type-${product.id}`} className={labelCls}>Tipo de Producto</Label>
                <select id={`edit-type-${product.id}`} name="type" className={selectCls} value={productType} onChange={(e) => setProductType(e.target.value)}>
                  <option value="SALE">Producto para venta</option>
                  <option value="RAW_MATERIAL">Materia prima</option>
                  <option value="FINISHED_GOOD">Producto terminado</option>
                  <option value="SUPPLY">Insumo</option>
                  <option value="SERVICE">Servicio</option>
                  <option value="FIXED_ASSET">Activo fijo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-code-${product.id}`} className={labelCls}>Código</Label>
                <Input id={`edit-code-${product.id}`} name="code" defaultValue={product.code} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-name-${product.id}`} className={labelCls}>Nombre</Label>
                <Input id={`edit-name-${product.id}`} name="name" defaultValue={product.name} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-cat-${product.id}`} className={labelCls}>Categoría</Label>
                <select id={`edit-cat-${product.id}`} name="categoryId" defaultValue={product.categoryId} className={selectCls}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-${product.id}`} className={labelCls}>Proveedor</Label>
                <select id={`edit-sup-${product.id}`} name="supplierId" defaultValue={product.supplierId} className={selectCls}>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`edit-group-${product.id}`} className={labelCls}>Grupo de Producto (Opcional)</Label>
                <select id={`edit-group-${product.id}`} name="productGroupId" defaultValue={product.productGroupId ?? ''} className={selectCls}>
                  <option value="">Ninguno</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-qty-${product.id}`} className={labelCls}>Cantidad Disponible</Label>
                <Input id={`edit-qty-${product.id}`} name="quantityAvailable" type="number" min="0" defaultValue={product.quantityAvailable} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-cost-${product.id}`} className={labelCls}>Costo Unitario (COP)</Label>
                <Input id={`edit-cost-${product.id}`} name="unitCost" type="number" min="0" step="100" defaultValue={product.unitCost} className={inputCls} />
              </div>
              
              {['SALE', 'FINISHED_GOOD', 'SERVICE'].includes(productType) ? (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`edit-price-${product.id}`} className={labelCls}>Precio de Venta (COP)</Label>
                  <Input id={`edit-price-${product.id}`} name="salePrice" type="number" min="0" step="100" defaultValue={product.salePrice} className={inputCls} required />
                </div>
              ) : (
                <div className="space-y-1.5 sm:col-span-2 pt-2">
                  <div className="bg-muted/30 border border-border rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                    Este tipo de producto es de uso interno y no requiere un precio de venta para el público.
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
                {isPending ? 'Guardando...' : 'Actualizar Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

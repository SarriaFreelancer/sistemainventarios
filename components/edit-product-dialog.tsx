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

interface Category { id: string; name: string; productGroupId?: string; }
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
  registerInventoryCostAsExpense?: boolean;
  trackExpirationDates?: boolean;
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300 disabled:opacity-50";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

export function EditProductDialog({ product, categories, suppliers, groups, registerInventoryCostAsExpense = false, trackExpirationDates = false }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [productType, setProductType] = useState(product.type || 'SALE');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const getInitialGroup = useCallback(() => {
    if (product.productGroupId) return String(product.productGroupId);
    const cat = categories.find(c => String(c.id) === String(product.categoryId));
    return cat?.productGroupId ? String(cat.productGroupId) : '';
  }, [product, categories]);

  useEffect(() => {
    if (open) {
      setProductType(product.type || 'SALE');
      const grp = getInitialGroup();
      setSelectedGroup(grp);
      setSelectedCategory(product.categoryId ? String(product.categoryId) : '');
    }
  }, [open, product, categories, getInitialGroup]);

  const filteredCategories = selectedGroup
    ? categories.filter(c => String(c.productGroupId) === String(selectedGroup))
    : categories;

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
    if (groupId) {
      const isCatInGroup = categories.some(c => String(c.id) === String(selectedCategory) && String(c.productGroupId) === String(groupId));
      if (!isCatInGroup) {
        setSelectedCategory('');
      }
    }
  };

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
        aria-label="Editar producto"
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
                <Label htmlFor={`edit-group-${product.id}`} className={labelCls}>Grupo de Producto</Label>
                <select id={`edit-group-${product.id}`} name="productGroupId" value={selectedGroup} onChange={(e) => handleGroupChange(e.target.value)} className={selectCls}>
                  <option value="">Seleccione un grupo...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-cat-${product.id}`} className={labelCls}>Categoría</Label>
                <select id={`edit-cat-${product.id}`} name="categoryId" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectCls}>
                  <option value="">Seleccione una categoría...</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-${product.id}`} className={labelCls}>Proveedor</Label>
                <select id={`edit-sup-${product.id}`} name="supplierId" defaultValue={product.supplierId} className={selectCls}>
                  <option value="">Seleccione proveedor...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
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

              {trackExpirationDates && (
                <>
                  <div className="space-y-1.5 flex items-end pb-0.5 sm:col-span-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-600/90 w-full">
                      <strong className="block text-amber-600">Añadir existencias a un nuevo lote</strong>
                      Si vas a aumentar la cantidad, puedes ingresar el lote y fecha de vencimiento de las nuevas unidades.
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`edit-batch-${product.id}`} className={labelCls}>Lote (Nuevas uds)</Label>
                    <Input id={`edit-batch-${product.id}`} name="batchNumber" placeholder="Ej. LOTE-001" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`edit-exp-${product.id}`} className={labelCls}>Vencimiento (Nuevas uds)</Label>
                    <Input id={`edit-exp-${product.id}`} name="expirationDate" type="date" className={inputCls} />
                  </div>
                </>
              )}
              
              {['SALE', 'FINISHED_GOOD', 'SERVICE'].includes(productType) ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`edit-price-${product.id}`} className={labelCls}>Precio de Venta (COP)</Label>
                  <Input id={`edit-price-${product.id}`} name="salePrice" type="number" min="0" step="100" defaultValue={product.salePrice} className={inputCls} required />
                </div>
              ) : (
                <div className="space-y-1.5 flex items-end pb-0.5">
                  <div className="bg-muted/30 border border-border rounded-xl p-2.5 text-xs text-muted-foreground">
                    Uso interno (sin precio de venta).
                  </div>
                </div>
              )}
              
              {registerInventoryCostAsExpense && (
                <div className="sm:col-span-2 flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-foreground">Registrar como gasto</p>
                    <p className="text-xs text-muted-foreground">Registra automáticamente la <b>diferencia</b> de costo por cantidad añadida como un gasto, si incrementas existencias.</p>
                  </div>
                  <input
                    type="checkbox"
                    name="registerAsExpense"
                    className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
                  />
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

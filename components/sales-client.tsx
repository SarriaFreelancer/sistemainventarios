"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSale, voidSale, completePendingSale } from "@/app/actions/sales-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingBag, Plus, Trash2, Search, FileDown,
  TrendingUp, DollarSign, Receipt, Calendar, X, Package, Check, Download, AlertTriangle
} from "lucide-react";
import { confirmAction, successAlert, errorAlert, brandAlert } from "@/lib/sweetalert";
import * as XLSX from "xlsx";
import { generateInvoiceMedia } from "@/lib/invoice-generator";

type ProductGroup = 'MAQUILLAJE' | 'ACCESORIOS' | 'SKINCARE' | 'CAPILAR' | 'CORPORAL' | 'PERFUMERIA' | 'OTROS';

interface Product {
  id: string;
  code: string;
  name: string;
  salePrice: number;
  quantityAvailable: number;
}

interface SaleDetail {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
  product: { name: string; code: string };
}

interface Sale {
  id: string;
  saleNumber: string;
  client: string | null;
  customerId: string | null;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  remarks: string | null;
  voidedByUserId: string | null;
  voidedAt: string | null;
  voidedReason: string | null;
  createdAt: string;
  user: { name: string | null };
  details: SaleDetail[];
}

interface CartItem {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  maxQty: number;
  discount: number; // Row-level discount
}

const PAYMENT_METHODS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO'];

const inputCls = "bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-10 rounded-xl w-full text-sm px-3 transition-all duration-200";
const selectCls = "flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

function NewSaleDialog({ products, customers, userId, onSuccess }: { products: Product[]; customers: { id: string; name: string; code: string }[]; userId: string; onSuccess?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [client, setClient] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<'PENDING' | 'COMPLETED'>('COMPLETED');
  const [productSearch, setProductSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    if (!q) return [];
    return products.filter(p =>
      (status === 'PENDING' || p.quantityAvailable > 0) &&
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [products, productSearch, status]);

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal - discount - cart.reduce((s, i) => s + i.discount, 0));

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.maxQty && status === 'COMPLETED') return prev;
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        productId: product.id,
        code: product.code,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        maxQty: product.quantityAvailable,
        discount: 0,
      }];
    });
    setProductSearch('');
  };

  const updateQty = (productId: string, qty: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId === productId) {
        const targetQty = status === 'COMPLETED' ? Math.min(Math.max(1, qty), i.maxQty) : Math.max(1, qty);
        return { ...i, quantity: targetQty };
      }
      return i;
    }));
  };

  const updateItemDiscount = (productId: string, desc: number) => {
    setCart(prev => prev.map(i =>
      i.productId === productId ? { ...i, discount: Math.max(0, desc) } : i
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const resetForm = () => {
    setCart([]);
    setClient('');
    setCustomerId('');
    setDiscount(0);
    setPaymentMethod('EFECTIVO');
    setRemarks('');
    setProductSearch('');
    setStatus('COMPLETED');
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      errorAlert('Carrito Vacío', 'Agrega al menos un producto a la venta.');
      return;
    }

    const fmtVal = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    const { isConfirmed } = await brandAlert.fire({
      title: 'Confirmar Venta',
      html: `
        <div class="text-left space-y-4 font-sans text-sm">
          <div class="border-b border-border/60 pb-2.5 text-xs space-y-1">
            <p class="text-muted-foreground">Cliente: <strong class="text-foreground">${client || 'Consumidor Final'}</strong></p>
            <p class="text-muted-foreground">Pago: <strong class="text-foreground">${paymentMethod}</strong></p>
            <p class="text-muted-foreground">Estado: <strong class="text-primary">${status === 'PENDING' ? 'Pendiente (Reserva)' : 'Completada'}</strong></p>
          </div>
          <div class="max-h-[180px] overflow-y-auto pr-1 space-y-2">
            ${cart.map(i => `
              <div class="flex justify-between items-start text-xs border-b border-border/40 pb-2 last:border-b-0">
                <div>
                  <p class="font-medium text-foreground">${i.name}</p>
                  <p class="text-[10px] text-muted-foreground">${i.quantity} u. x ${fmtVal(i.unitPrice)}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-foreground">${fmtVal(i.quantity * i.unitPrice)}</p>
                  ${i.discount > 0 ? `<p class="text-[10px] font-semibold text-red-500">Desc: -${fmtVal(i.discount)}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1.5 text-xs">
            <div class="flex justify-between text-muted-foreground">
              <span>Subtotal Productos</span>
              <span>${fmtVal(subtotal)}</span>
            </div>
            ${(discount > 0 || cart.reduce((sum, i) => sum + i.discount, 0) > 0) ? `
              <div class="flex justify-between text-red-500 font-medium">
                <span>Descuentos Totales</span>
                <span>-${fmtVal(discount + cart.reduce((sum, i) => sum + i.discount, 0))}</span>
              </div>
            ` : ''}
            <div class="flex justify-between font-bold text-sm text-primary pt-1.5 border-t border-primary/25">
              <span>Total Facturado</span>
              <span>${fmtVal(total)}</span>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Registro',
      cancelButtonText: 'Revisar',
      customClass: {
        popup: 'rounded-3xl border border-border bg-card text-foreground font-sans shadow-2xl p-6 w-[480px]',
        confirmButton: 'bg-gradient-to-r from-[#B18ACF] to-[#8B5CF6] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:opacity-95 transition mr-2',
        cancelButton: 'bg-secondary/10 hover:bg-secondary/20 border border-border text-foreground rounded-xl px-6 py-3 font-semibold text-sm transition ml-2',
      },
      buttonsStyling: false,
    });

    if (!isConfirmed) return;

    startTransition(async () => {
      const result = await createSale({
        userId,
        client: client || undefined,
        customerId: customerId ? Number(customerId) : undefined,
        discount,
        paymentMethod,
        remarks: remarks || undefined,
        status,
        items: cart.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount
        })),
      });

      if (result.success) {
        resetForm();
        setOpen(false);
        await successAlert(
          '¡Venta Registrada!',
          `Venta ${result.saleNumber} por ${result.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`
        );
        window.location.reload();
        onSuccess?.();
      } else {
        errorAlert('Error al Registrar', (result as any).error ?? 'No fue posible guardar la venta.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => { resetForm(); setOpen(true); }} className="flex items-center gap-2 px-5 h-11 rounded-2xl">
        <Plus className="h-4 w-4" />
        Nueva Venta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[98vw] max-w-7xl rounded-[32px] border-border/60 bg-card p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
          <DialogHeader className="pb-4 border-b border-border/40 shrink-0">
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              <span className="w-2 h-7 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Registrar Nueva Venta
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Busca productos, ajusta cantidades y descuentos, luego confirma la venta.</p>
          </DialogHeader>

          {/* Form Content Area: Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-5 overflow-hidden flex-1 min-h-0">
            {/* Left Area (Product Search and Cart) */}
            <div className="lg:col-span-3 flex flex-col overflow-hidden h-full space-y-4">
              {/* Product Search */}
              <div className="space-y-1.5 relative">
                <Label className={labelCls}>Buscar y Agregar Productos</Label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Escribe código o nombre del producto..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                {productSearch && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl mt-1 overflow-hidden">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-colors border-b border-border/40 last:border-b-0 text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary whitespace-nowrap">{p.code}</span>
                          <span className="text-sm text-foreground font-medium">{p.name}</span>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold text-primary">
                            {p.salePrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Stock: {p.quantityAvailable}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {productSearch && filteredProducts.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl mt-1 px-4 py-3">
                    <p className="text-sm text-muted-foreground">No se encontraron productos con ese criterio.</p>
                  </div>
                )}
              </div>

              {/* Cart Header */}
              {cart.length > 0 && (
                <div className="grid grid-cols-[1.5rem_1fr_6rem_5rem_5rem_1.5rem] gap-x-2 px-2 shrink-0">
                  <span />
                  <span className={labelCls}>Producto</span>
                  <span className={`${labelCls} text-center`}>Cantidad</span>
                  <span className={`${labelCls} text-center`}>Descuento</span>
                  <span className={`${labelCls} text-right`}>Subtotal</span>
                  <span />
                </div>
              )}

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto border border-border/60 rounded-2xl p-3 bg-muted/5 min-h-[200px] max-h-[320px]">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground/50 py-12">
                    <ShoppingBag className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">El carrito está vacío</p>
                    <p className="text-xs mt-1 opacity-70">Busca un producto arriba para agregarlo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.productId} className="grid grid-cols-[1.5rem_1fr_6rem_5rem_5rem_1.5rem] gap-x-2 items-center p-2.5 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.productId)}
                          onChange={e => {
                            if (e.target.checked) setSelectedItems(prev => [...prev, item.productId]);
                            else setSelectedItems(prev => prev.filter(id => id !== item.productId));
                          }}
                          className="h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {item.unitPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })} c/u
                          </p>
                        </div>
                        {/* Qty controls */}
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, item.quantity - 1)}
                            className="h-6 w-6 rounded-md border border-border bg-card flex items-center justify-center text-foreground font-bold text-xs hover:bg-primary/10 transition-colors"
                          >−</button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                            className="w-9 h-6 text-center rounded-md border border-border bg-card text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => updateQty(item.productId, item.quantity + 1)}
                            className="h-6 w-6 rounded-md border border-border bg-card flex items-center justify-center text-foreground font-bold text-xs hover:bg-primary/10 transition-colors"
                          >+</button>
                        </div>
                        {/* Discount */}
                        <input
                          type="number"
                          placeholder="0"
                          value={item.discount || ''}
                          onChange={e => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                          className="h-7 w-full text-center rounded-md border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                        />
                        {/* Row total */}
                        <p className="text-xs font-extrabold text-primary text-right whitespace-nowrap">
                          {((item.quantity * item.unitPrice) - item.discount).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="h-6 w-6 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Area (Form Controls and Totals) */}
            <div className="lg:col-span-2 flex flex-col justify-between h-full space-y-4 overflow-y-auto pr-1">
              <div className="space-y-3">
                {/* Fila 1: CRM + Nombre cliente */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Asociar Cliente CRM (Opcional)</Label>
                    <select
                      value={customerId}
                      onChange={e => {
                        const val = e.target.value;
                        setCustomerId(val);
                        if (val) {
                          const cust = customers.find(c => c.id === val);
                          if (cust) setClient(cust.name);
                        }
                      }}
                      className={selectCls}
                    >
                      <option value="">-- Cliente Rápido / Consumidor Final --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.code ? `[${c.code}] ` : ''}{c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>Cliente (Nombre / Venta Rápida)</Label>
                    <Input
                      placeholder="Nombre del cliente..."
                      value={client}
                      onChange={e => setClient(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Fila 2: Estado + Método de Pago en dos columnas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Estado de Venta</Label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className={selectCls}
                    >
                      <option value="COMPLETED">Completada</option>
                      <option value="PENDING">Pendiente</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>Método de Pago</Label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={selectCls}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                {/* Fila 3: Descuento + Observaciones en dos columnas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Descuento Global ($)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discount || ''}
                      onChange={e => setDiscount(Number(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>Observaciones</Label>
                    <Input
                      placeholder="Notas internas..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Tip: select items to apply discount */}
                {cart.length > 0 && (
                  <p className="text-[11px] text-muted-foreground bg-muted/30 border border-border/40 rounded-xl px-3 py-2">
                    💡 Selecciona ítems del carrito con el checkbox para aplicar descuentos por selección.
                  </p>
                )}
              </div>

              {/* Summary panel & submit */}
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium">{subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                  </div>
                  {(discount > 0 || cart.reduce((s, i) => s + i.discount, 0) > 0) && (
                    <div className="flex justify-between text-red-500 font-semibold">
                      <span>Descuentos aplicados</span>
                      <span>−{(discount + cart.reduce((s, i) => s + i.discount, 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  <div className="border-t border-primary/20 pt-2 flex justify-between font-bold">
                    <span className="text-base">Total</span>
                    <span className="text-primary text-xl font-black">
                      {total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDiscountModalOpen(true)}
                  disabled={selectedItems.length === 0}
                  className="w-full h-10 rounded-xl text-sm"
                >
                  Aplicar Descuento a Selección ({selectedItems.length})
                </Button>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11 rounded-xl">
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending || cart.length === 0}
                    className="flex-1 h-11 rounded-xl font-bold"
                  >
                    {isPending ? 'Guardando...' : '✓ Crear Venta'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-border/60 bg-card p-6 shadow-2xl">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-lg font-extrabold text-foreground">
              Aplicar Descuento a Selección
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as any)}
                className={selectCls}
              >
                <option value="percentage">Porcentaje</option>
                <option value="fixed">Fijo</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                placeholder="0"
                value={discountValue}
                onChange={e => setDiscountValue(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDiscountModalOpen(false)} className="h-9 px-4">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  selectedItems.forEach(id => {
                    const item = cart.find(i => i.productId === id);
                    if (item) {
                      const base = item.unitPrice * item.quantity;
                      const newDiscount = discountType === 'percentage' ? (base * discountValue) / 100 : discountValue;
                      updateItemDiscount(id, Math.max(0, newDiscount));
                    }
                  });
                  setDiscountModalOpen(false);
                }}
                className="h-9 px-4"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CompleteSaleDialog({ sale, customers, userId, onSuccess }: {
  sale: Sale;
  customers: { id: string; name: string; code: string }[];
  userId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState(sale.client ?? '');
  const [customerId, setCustomerId] = useState(sale.customerId ? String(sale.customerId) : '');
  const [discount, setDiscount] = useState(sale.discount ?? 0);
  const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod ?? 'EFECTIVO');
  const [remarks, setRemarks] = useState(sale.remarks ?? '');
  const [isPending, startTransition] = useTransition();

  const subtotal = sale.details.reduce((s, d) => s + d.subtotal, 0);
  const total = Math.max(0, subtotal - discount - sale.details.reduce((s, d) => s + d.discount, 0));

  const handleCompletarAction = async () => {
    startTransition(async () => {
      const result = await completePendingSale(sale.id, {
        paymentMethod,
        client: client || null,
        customerId: customerId ? Number(customerId) : null,
        remarks: remarks || null,
        discount: discount,
      });

      if (result.success) {
        setOpen(false);
        await successAlert('Venta Completada', 'La venta fue completada y se descontó el stock.');
        window.location.reload();
        onSuccess?.();
      } else {
        errorAlert('Error al Completar', (result as any).error ?? 'No fue posible completar la venta.');
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
        title="Completar Venta"
      >
        <Check className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[98vw] max-w-7xl rounded-[32px] border-border/60 bg-card p-6 md:p-10 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
          <DialogHeader className="pb-4 border-b border-border/40 shrink-0">
            <DialogTitle className="text-2xl font-extrabold text-foreground flex items-center gap-3">
              <span className="w-2 h-7 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Completar Venta Pendiente ({sale.saleNumber})
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Elige el método de pago y confirma los datos del cliente para finalizar la transacción.</p>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-5 overflow-hidden flex-1 min-h-0">
            {/* Detalle de Productos (Col span 3) */}
            <div className="lg:col-span-3 flex flex-col overflow-hidden h-full space-y-4">
              <Label className={labelCls}>Productos en esta Venta</Label>
              
              <div className="grid grid-cols-[1fr_6rem_5rem_5rem] gap-x-2 px-2 shrink-0">
                <span className={labelCls}>Producto</span>
                <span className={`${labelCls} text-center`}>Cantidad</span>
                <span className={`${labelCls} text-center`}>Precio Unitario</span>
                <span className={`${labelCls} text-right`}>Subtotal</span>
              </div>

              <div className="flex-1 overflow-y-auto border border-border/60 rounded-2xl p-3 bg-muted/5 min-h-[200px] max-h-[320px]">
                <div className="space-y-2">
                  {sale.details.map(item => (
                    <div key={item.id} className="grid grid-cols-[1fr_6rem_5rem_5rem] gap-x-2 items-center p-2.5 rounded-xl bg-card border border-border/40">
                      <div>
                        <p className="text-xs font-semibold text-foreground truncate">{item.product.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.product.code}</p>
                      </div>
                      <p className="text-xs font-bold text-foreground text-center">{item.quantity} u.</p>
                      <p className="text-xs text-muted-foreground text-center">
                        {item.unitPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs font-extrabold text-primary text-right whitespace-nowrap">
                        {item.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ajustes de Pago y Cliente (Col span 2) */}
            <div className="lg:col-span-2 flex flex-col justify-between h-full space-y-4 overflow-y-auto pr-1">
              <div className="space-y-3">
                {/* Fila 1: CRM + Nombre cliente */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Asociar Cliente CRM (Opcional)</Label>
                  <select
                    value={customerId}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomerId(val);
                      if (val) {
                        const cust = customers.find(c => c.id === val);
                        if (cust) setClient(cust.name);
                      }
                    }}
                    className={selectCls}
                  >
                    <option value="">-- Cliente Rápido / Consumidor Final --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code ? `[${c.code}] ` : ''}{c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className={labelCls}>Cliente (Nombre / Venta Rápida)</Label>
                  <Input
                    placeholder="Nombre del cliente..."
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Fila 2: Método de Pago + Descuento en dos columnas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={labelCls}>Método de Pago</Label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={selectCls}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelCls}>Descuento Global ($)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discount || ''}
                      onChange={e => setDiscount(Number(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                  <Label className={labelCls}>Observaciones</Label>
                  <Input
                    placeholder="Notas internas..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Resumen Final y Botones */}
              <div className="space-y-3 pt-2">
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium">{subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                  </div>
                  {(discount > 0 || sale.details.reduce((s, d) => s + d.discount, 0) > 0) && (
                    <div className="flex justify-between text-red-500 font-semibold">
                      <span>Descuentos aplicados</span>
                      <span>−{(discount + sale.details.reduce((s, d) => s + d.discount, 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  <div className="border-t border-primary/20 pt-2 flex justify-between font-bold">
                    <span className="text-base">Total</span>
                    <span className="text-primary text-xl font-black">
                      {total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11 rounded-xl">
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCompletarAction}
                    disabled={isPending}
                    className="flex-1 h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isPending ? 'Guardando...' : '✓ Completar Venta'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SaleDetailDialog({ sale }: { sale: Sale }) {
  const [open, setOpen] = useState(false);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const fmt = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-primary hover:underline font-semibold"
      >
        Ver detalles
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[32px] border-border/60 bg-card p-6 shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">Detalles de Venta #{sale.saleNumber}</DialogTitle>
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold text-sm">
              Total: {fmt(sale.total)}
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Fecha / Hora</p>
                <p className="font-semibold text-foreground">{fmtDate(sale.createdAt)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Cliente</p>
                <p className="font-semibold text-foreground">{sale.client ?? 'Consumidor Final'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Vendedor</p>
                <p className="font-semibold text-foreground">{sale.user.name || 'Sistema'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Pago</p>
                <p className="font-semibold text-foreground">{sale.paymentMethod}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/5">
              {sale.details.map(d => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2.5 border-b border-border/40 last:border-b-0 text-xs">
                  <div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary mr-1.5">{d.product.code}</span>
                    <span className="font-medium text-foreground">{d.product.name}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {d.quantity} u. × {fmt(d.unitPrice)}
                      {d.discount > 0 && <span className="text-red-500 font-semibold ml-1.5">Desc: -{fmt(d.discount)}</span>}
                    </p>
                  </div>
                  <span className="font-bold text-foreground shrink-0">{fmt(d.total)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Productos</span>
                <span className="font-semibold text-foreground">{fmt(sale.details.reduce((s, d) => s + d.subtotal, 0))}</span>
              </div>
              {sale.details.reduce((s, d) => s + d.discount, 0) > 0 && (
                <div className="space-y-1">
                  {sale.details.reduce((s, d) => s + d.discount, 0) - sale.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Descuentos por Producto</span>
                      <span>-{fmt(sale.details.reduce((s, d) => s + d.discount, 0) - sale.discount)}</span>
                    </div>
                  )}
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Descuento Global</span>
                      <span>-{fmt(sale.discount)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t border-primary/20 pt-1.5 flex justify-between font-bold text-sm">
                <span>Total Facturado</span>
                <span className="text-primary text-base font-black">{fmt(sale.total)}</span>
              </div>
            </div>

            {sale.status === 'VOIDED' && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-1 text-xs">
                <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Datos de Anulación
                </p>
                <p className="text-muted-foreground">Motivo: <span className="text-foreground font-medium">"{sale.voidedReason}"</span></p>
                {sale.voidedAt && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Por usuario en fecha: {new Date(sale.voidedAt).toLocaleString('es-CO')}
                  </p>
                )}
              </div>
            )}

            {sale.remarks && (
              <p className="text-[11px] text-muted-foreground italic">Nota: "{sale.remarks}"</p>
            )}

            {/* Downloader buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button size="sm" variant="outline" className="text-[10px] h-9 gap-1" onClick={() => generateInvoiceMedia(sale, 'png')}>
                <Download className="h-3.5 w-3.5" /> PNG
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-9 gap-1" onClick={() => generateInvoiceMedia(sale, 'jpeg')}>
                <Download className="h-3.5 w-3.5" /> JPG
              </Button>
              <Button size="sm" className="text-[10px] h-9 gap-1" onClick={() => generateInvoiceMedia(sale, 'pdf')}>
                <Download className="h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function exportSalesToExcel(sales: Sale[]) {
  const rows = sales.flatMap(s =>
    s.details.map(d => ({
      'N° Venta': s.saleNumber,
      'Fecha': new Date(s.createdAt).toLocaleDateString('es-CO'),
      'Hora': new Date(s.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      'Cliente': s.client ?? 'Consumidor final',
      'Vendedor': s.user?.name ?? '—',
      'Producto': d.product.name,
      'Código': d.product.code,
      'Cantidad': d.quantity,
      'Precio Unitario': d.unitPrice,
      'Subtotal Renglón': d.subtotal,
      'Descuento Renglón': d.discount,
      'Total Renglón': d.total,
      'Total Factura': s.total,
      'Método Pago': s.paymentMethod,
      'Estado': s.status,
    }))
  );

  const ws = XLSX.utils.json_to_sheet(rows);

  // Freeze the first row
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }];

  // Auto-fit column widths
  const maxW = (colIdx: number) => {
    let max = 10;
    rows.forEach(r => {
      const val = Object.values(r)[colIdx];
      if (val != null) {
        const len = String(val).length;
        if (len > max) max = len;
      }
    });
    return max + 3;
  };

  ws['!cols'] = Object.keys(rows[0] || {}).map((_, idx) => ({ wch: maxW(idx) }));

  // Autofilter
  ws['!autofilter'] = { ref: `A1:${String.fromCharCode(65 + Object.keys(rows[0] || {}).length - 1)}${rows.length + 1}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

  const fileName = `dulche_dorelle_ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);

  brandAlert.fire({
    title: 'Exportación exitosa',
    text: `Archivo guardado como ${fileName}`,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  });
}

export function SalesClient({
  initialSales,
  products,
  customers,
  userId,
}: {
  initialSales: Sale[];
  products: Product[];
  customers: { id: string; name: string; code: string }[];
  userId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [isPending, startTransition] = useTransition();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterPayment]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialSales.filter(s =>
      (!q || s.saleNumber.toLowerCase().includes(q) || (s.client ?? '').toLowerCase().includes(q)) &&
      (!filterStatus || s.status === filterStatus) &&
      (!filterPayment || s.paymentMethod === filterPayment)
    );
  }, [initialSales, search, filterStatus, filterPayment]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const totalSales = filtered.reduce((s, v) => v.status === 'COMPLETED' ? s + v.total : s, 0);
  const totalQuantity = filtered.length;

  const handleAnular = async (sale: Sale) => {
    if (sale.status === 'VOIDED') return;

    const { value: reason, isConfirmed } = await brandAlert.fire({
      title: 'Anular Venta',
      text: `Por favor, ingresa el motivo para anular la venta ${sale.saleNumber}:`,
      input: 'text',
      inputPlaceholder: 'Ej. Error en cobro / Devolución de producto',
      showCancelButton: true,
      confirmButtonText: 'Confirmar Anulación',
      cancelButtonText: 'Cancelar',
      inputValidator: (val) => {
        if (!val) return 'Debes ingresar un motivo.';
        return null;
      }
    });

    if (!isConfirmed || !reason) return;

    startTransition(async () => {
      const result = await voidSale({
        saleId: sale.id,
        voidedByUserId: userId,
        reason,
      });

      if (result.success) {
        await successAlert('Venta Anulada', `La venta ${sale.saleNumber} fue anulada y se devolvió el stock.`);
        window.location.reload();
      } else {
        errorAlert('Error', (result as any).error ?? 'No se pudo anular la venta.');
      }
    });
  };



  const fmt = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' });
  const selectFilterCls = "h-10 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-[32px] bg-card border border-border shadow-md shadow-violet-500/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#B18ACF] to-[#8B5CF6] rounded-2xl text-white shadow-lg shadow-violet-500/25">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Ventas</h1>
            <p className="text-sm text-muted-foreground">Registra y monitorea todas las ventas de tu negocio.</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportSalesToExcel(filtered)}
            disabled={filtered.length === 0}
            className="h-11 gap-2 px-5 rounded-2xl"
          >
            <FileDown className="h-4 w-4" />
            Exportar Excel
          </Button>
          <NewSaleDialog products={products} customers={customers} userId={userId} />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registros', value: String(totalQuantity), sub: 'transacciones', icon: Receipt },
          { label: 'Ingresos Netos', value: fmt(totalSales), sub: 'Ventas Completadas', icon: DollarSign },
          { label: 'Ventas Pendientes', value: String(filtered.filter(s => s.status === 'PENDING').length), sub: 'reservas de stock', icon: Calendar },
          { label: 'Hoy', value: String(filtered.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length), sub: 'ventas hoy', icon: TrendingUp },
        ].map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="p-5 rounded-[24px] bg-card border border-border shadow-sm flex flex-col gap-3 hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-black leading-tight text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Buscar por N° venta o cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-border/80 bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectFilterCls}>
              <option value="">Todos los estados</option>
              <option value="COMPLETED">Completada</option>
              <option value="PENDING">Pendiente</option>
              <option value="VOIDED">Anulada</option>
            </select>
            <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} className={selectFilterCls}>
              <option value="">Todos los pagos</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-foreground font-semibold">No hay ventas registradas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/60">
                  {['N° Venta', 'Fecha', 'Cliente', 'Productos', 'Pago', 'Total', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className="group hover:bg-primary/5 transition-colors duration-200">
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/10">
                        {sale.saleNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-foreground font-medium">{fmtDate(sale.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-foreground">{sale.client ?? 'Consumidor final'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">{sale.details.length} prod.</span>
                      <br />
                      <SaleDetailDialog sale={sale} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-secondary/20 text-foreground">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-extrabold text-primary">{fmt(sale.total)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        sale.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : sale.status === 'VOIDED'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {sale.status === 'PENDING' && (
                          <CompleteSaleDialog sale={sale} customers={customers} userId={userId} />
                        )}
                        {sale.status !== 'VOIDED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => handleAnular(sale)}
                            className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-lg"
                            title="Anular venta"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No hay ventas.</div>
          ) : (
            paginatedSales.map((sale) => (
              <div key={sale.id} className="p-5 space-y-3 hover:bg-primary/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/10">
                      {sale.saleNumber}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{fmtDate(sale.createdAt)}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{sale.client ?? 'Consumidor final'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">{fmt(sale.total)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      sale.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        : sale.status === 'VOIDED'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <SaleDetailDialog sale={sale} />
                  <div className="flex gap-1.5">
                    {sale.status === 'PENDING' && (
                      <CompleteSaleDialog sale={sale} customers={customers} userId={userId} />
                    )}
                    {sale.status !== 'VOIDED' && (
                      <Button variant="ghost" size="icon" onClick={() => handleAnular(sale)} className="h-8 w-8 text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/5 shrink-0">
            <p className="text-xs text-muted-foreground font-medium">
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} registros
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={currentPage === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs p-0 font-bold ${currentPage === p ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

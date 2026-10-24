'use client';

import React, { useState, useTransition } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  UserPlus
} from 'lucide-react';
import { createCreditOperation } from '@/app/actions/credit-actions';
import { createCustomer } from '@/app/actions/crm-actions';
import { successAlert, errorAlert } from '@/lib/sweetalert';
import { useRouter } from 'next/navigation';

interface CustomerOption {
  id: number;
  name: string;
  documentType?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  deliveryAddress?: string | null;
  creditNotes?: string | null;
}

interface ProductOption {
  id: number;
  code: string;
  name: string;
  salePrice: number;
  quantityAvailable: number;
  reservedQuantity: number;
}

interface CreateCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerOption[];
  products: ProductOption[];
  branches?: { id: number; name: string }[];
  defaultDeliveryMode?: string;
  enableStockReservation?: boolean;
}

export function CreateCreditModal({
  isOpen,
  onClose,
  customers,
  products,
  branches = [],
  defaultDeliveryMode = 'IMMEDIATE',
  enableStockReservation = true
}: CreateCreditModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados de Operación
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>('');
  const [deliveryMode, setDeliveryMode] = useState<'IMMEDIATE' | 'UPON_PAYMENT'>(
    defaultDeliveryMode === 'UPON_PAYMENT' ? 'UPON_PAYMENT' : 'IMMEDIATE'
  );
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Items
  const [items, setItems] = useState<
    {
      productId: number;
      name: string;
      code: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      availableStock: number;
      reservedStock: number;
    }[]
  >([]);

  // Búsqueda de Productos
  const [productSearch, setProductSearch] = useState('');

  // Cuotas y Pagos
  const [downPayment, setDownPayment] = useState<number>(0);
  const [downPaymentMethod, setDownPaymentMethod] = useState('EFECTIVO');
  const [downPaymentReference, setDownPaymentReference] = useState('');
  const [numInstallments, setNumInstallments] = useState<number>(1);
  const [installments, setInstallments] = useState<
    { installmentNumber: number; amount: number; dueDate: string; notes?: string }[]
  >([]);

  // Sub-modal rápido de creación de Cliente
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustDocType, setNewCustDocType] = useState('CC');
  const [newCustDocNumber, setNewCustDocNumber] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAltPhone, setNewCustAltPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustDeliveryAddress, setNewCustDeliveryAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('Bogotá');
  const [newCustNeighborhood, setNewCustNeighborhood] = useState('');
  const [newCustContactMethod, setNewCustContactMethod] = useState('WHATSAPP');
  const [newCustCreditNotes, setNewCustCreditNotes] = useState('');

  if (!isOpen) return null;

  // Cálculos en tiempo real
  const subtotalBeforeDiscounts = items.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );
  const totalDiscounts = items.reduce((sum, i) => sum + i.discount, 0);
  const totalAmount = Math.max(0, subtotalBeforeDiscounts - totalDiscounts);
  const balanceToFinance = Math.max(0, totalAmount - downPayment);

  // Agregar producto a la lista
  const handleAddProduct = (prod: ProductOption) => {
    const existing = items.find((i) => i.productId === prod.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          name: prod.name,
          code: prod.code,
          quantity: 1,
          unitPrice: prod.salePrice,
          discount: 0,
          availableStock: prod.quantityAvailable,
          reservedStock: prod.reservedQuantity
        }
      ]);
    }
  };

  const handleRemoveItem = (productId: number) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const handleUpdateItem = (
    productId: number,
    field: 'quantity' | 'unitPrice' | 'discount',
    val: number
  ) => {
    setItems(
      items.map((i) => (i.productId === productId ? { ...i, [field]: val } : i))
    );
  };

  // Generador inteligente de cuotas automáticas
  const handleGenerateInstallments = (count: number) => {
    setNumInstallments(count);
    if (balanceToFinance <= 0 || count <= 0) {
      setInstallments([]);
      return;
    }

    const baseAmount = Math.floor(balanceToFinance / count);
    const remainder = balanceToFinance - baseAmount * count;

    const generated = [];
    const today = new Date();

    for (let i = 1; i <= count; i++) {
      const nextDue = new Date(today);
      nextDue.setDate(nextDue.getDate() + i * 30); // Cuotas mensuales por defecto
      const dateString = nextDue.toISOString().split('T')[0];

      generated.push({
        installmentNumber: i,
        amount: i === count ? baseAmount + remainder : baseAmount,
        dueDate: dateString,
        notes: `Cuota ${i} de ${count}`
      });
    }

    setInstallments(generated);
    if (generated.length > 0) {
      setDueDate(generated[generated.length - 1].dueDate);
    }
  };

  // Crear cliente rápido si no existe
  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) {
      errorAlert('Nombre requerido', 'Ingresa el nombre del cliente');
      return;
    }

    const formData = new FormData();
    formData.set('name', newCustName.trim());
    formData.set('documentType', newCustDocType);
    formData.set('documentNumber', newCustDocNumber.trim());
    formData.set('phone', newCustPhone.trim());
    formData.set('altPhone', newCustAltPhone.trim());
    formData.set('email', newCustEmail.trim());
    formData.set('address', newCustAddress.trim());
    formData.set('deliveryAddress', newCustDeliveryAddress.trim() || newCustAddress.trim());
    formData.set('city', newCustCity.trim());
    formData.set('neighborhood', newCustNeighborhood.trim());
    formData.set('preferredContactMethod', newCustContactMethod);
    formData.set('creditNotes', newCustCreditNotes.trim());

    startTransition(async () => {
      const res = await createCustomer(formData);
      if (res.success && (res as any).customer) {
        successAlert('Cliente Registrado', 'Cliente agregado exitosamente.');
        setCustomerId((res as any).customer.id);
        setShowQuickCustomer(false);
      } else {
        errorAlert('Error', res.error || 'No se pudo crear el cliente');
      }
    });
  };

  // Guardar Operación a Crédito
  const handleSubmitOperation = () => {
    if (!customerId) {
      errorAlert('Cliente requerido', 'Selecciona o registra un cliente');
      return;
    }
    if (items.length === 0) {
      errorAlert('Productos requeridos', 'Agrega al menos un producto a la lista');
      return;
    }

    startTransition(async () => {
      const payload = {
        customerId: Number(customerId),
        branchId: branchId ? Number(branchId) : null,
        deliveryMode,
        downPayment: Number(downPayment || 0),
        downPaymentMethod,
        downPaymentReference,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount || 0)
        })),
        installments: installments.map((inst) => ({
          installmentNumber: inst.installmentNumber,
          amount: Number(inst.amount),
          dueDate: inst.dueDate,
          notes: inst.notes || null
        })),
        dueDate: dueDate || null,
        notes: notes || null
      };

      const res = await createCreditOperation(payload);
      if (res.success) {
        successAlert(
          'Crédito Registrado',
          `Operación ${(res.data as any).code} creada exitosamente.`
        );
        onClose();
        router.refresh();
      } else {
        errorAlert('Error al registrar crédito', res.error || 'Ocurrió un error inesperado');
      }
    });
  };

  const selectedCustomer = customers.find((c) => c.id === Number(customerId));

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Nueva Operación a Crédito / Venta a Plazos
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure las condiciones de venta, entrega física y calendario de pagos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* SECCIÓN 1: CLIENTE Y SEDE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-muted/20 border border-border">
            <div className="sm:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(true)}
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" /> + Nuevo Cliente
                </button>
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona un cliente del CRM...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.documentNumber ? `(${c.documentType || 'CC'}: ${c.documentNumber})` : ''} - {c.phone || 'Sin tel'}
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="mt-2 text-xs text-muted-foreground bg-card p-2.5 rounded-xl border border-border/80 flex flex-wrap gap-x-4 gap-y-1">
                  <span><strong>Tel:</strong> {selectedCustomer.phone || 'No registrado'}</span>
                  <span><strong>Email:</strong> {selectedCustomer.email || 'No registrado'}</span>
                  <span><strong>Entrega:</strong> {selectedCustomer.deliveryAddress || 'Misma dirección'}</span>
                </div>
              )}
            </div>

            {/* Sede / Sucursal */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Sede / Sucursal
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-primary"
              >
                <option value="">Sede Principal / Por Defecto</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECCIÓN 2: MODALIDAD DE ENTREGA */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Modalidad de Entrega de la Mercancía *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setDeliveryMode('IMMEDIATE')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  deliveryMode === 'IMMEDIATE'
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${deliveryMode === 'IMMEDIATE' ? 'text-primary' : 'text-muted-foreground'}`} />
                    Modalidad A: Entrega Inmediata a Crédito
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Salida Inmediata
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  El cliente recibe la mercancía hoy. El inventario se descuenta del almacén al confirmar y se genera la cuenta por cobrar.
                </p>
              </div>

              <div
                onClick={() => setDeliveryMode('UPON_PAYMENT')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  deliveryMode === 'UPON_PAYMENT'
                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${deliveryMode === 'UPON_PAYMENT' ? 'text-primary' : 'text-muted-foreground'}`} />
                    Modalidad B: Entrega después del Pago Completo
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {enableStockReservation ? 'Con Reserva' : 'Bajo Pedido'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  El pedido queda reservado sin salida física. Los abonos se registran y la entrega solo se habilita al cancelar el total pactado.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: SELECCIÓN DE PRODUCTOS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="h-4 w-4 text-primary" /> Productos o Artículos a Financiar *
              </label>
              {/* Buscador de artículos */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar producto por código o nombre..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Selector rápido si hay texto en búsqueda */}
            {productSearch.trim().length > 0 && (
              <div className="border border-border rounded-2xl bg-card max-h-40 overflow-y-auto p-2 space-y-1 shadow-lg">
                {filteredProducts.slice(0, 6).map((p) => {
                  const freeStock = p.quantityAvailable - p.reservedQuantity;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleAddProduct(p);
                        setProductSearch('');
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 cursor-pointer text-xs"
                    >
                      <div>
                        <span className="font-bold text-foreground">{p.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-[11px]">({p.code})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">
                          ${p.salePrice.toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            freeStock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          Stock: {p.quantityAvailable} u. {enableStockReservation ? `(${freeStock} libres)` : ''}
                        </span>
                        <button
                          type="button"
                          className="h-7 px-2.5 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tabla de items agregados */}
            {items.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground">
                No has agregado productos a esta operación. Utiliza el buscador para añadir artículos.
              </div>
            ) : (
              <div className="border border-border rounded-2xl overflow-hidden bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Artículo</th>
                      <th className="py-2.5 px-3 w-24">Cantidad</th>
                      <th className="py-2.5 px-3 w-32">Precio Unit.</th>
                      <th className="py-2.5 px-3 w-28">Descuento</th>
                      <th className="py-2.5 px-3 w-32 text-right">Total</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it) => (
                      <tr key={it.productId} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-foreground">{it.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{it.code}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) =>
                              handleUpdateItem(it.productId, 'quantity', Math.max(1, Number(e.target.value)))
                            }
                            className="w-full h-8 rounded-lg border border-border bg-background px-2 font-bold text-center"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            value={it.unitPrice}
                            onChange={(e) =>
                              handleUpdateItem(it.productId, 'unitPrice', Math.max(0, Number(e.target.value)))
                            }
                            className="w-full h-8 rounded-lg border border-border bg-background px-2 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            value={it.discount}
                            onChange={(e) =>
                              handleUpdateItem(it.productId, 'discount', Math.max(0, Number(e.target.value)))
                            }
                            className="w-full h-8 rounded-lg border border-border bg-background px-2 font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground font-mono">
                          ${(it.quantity * it.unitPrice - it.discount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.productId)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border font-bold">
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-right text-muted-foreground">
                        TOTAL DE LA OPERACIÓN:
                      </td>
                      <td className="py-3 px-3 text-right text-base text-primary font-mono font-extrabold">
                        ${totalAmount.toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* SECCIÓN 4: CONDICIONES FINANCIERAS Y CUOTAS */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" /> Plan de Pagos, Anticipo y Cuotas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Anticipo inicial */}
              <div className="p-3 bg-card border border-border rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Anticipo o Cuota Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={0}
                    max={totalAmount}
                    value={downPayment}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(totalAmount, Number(e.target.value)));
                      setDownPayment(val);
                    }}
                    className="w-full h-9 pl-7 pr-3 rounded-lg border border-border bg-background text-sm font-bold font-mono text-foreground"
                  />
                </div>
                {downPayment > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <select
                      value={downPaymentMethod}
                      onChange={(e) => setDownPaymentMethod(e.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-[11px]"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                      <option value="NEQUI">Nequi</option>
                      <option value="DAVIPLATA">Daviplata</option>
                      <option value="TARJETA">Tarjeta</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Comprobante..."
                      value={downPaymentReference}
                      onChange={(e) => setDownPaymentReference(e.target.value)}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-[11px]"
                    />
                  </div>
                )}
              </div>

              {/* Saldo a financiar */}
              <div className="p-3 bg-card border border-border rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Saldo Pendiente de Cartera</label>
                <div className="h-9 flex items-center px-3 rounded-lg bg-muted/40 font-mono font-extrabold text-base text-amber-500">
                  ${balanceToFinance.toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Monto restante que el cliente se compromete a pagar en cuotas.
                </p>
              </div>

              {/* Generador de cuotas */}
              <div className="p-3 bg-card border border-border rounded-xl space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Número de Cuotas</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleGenerateInstallments(num)}
                      className={`flex-1 h-9 rounded-lg font-bold text-xs border transition-colors ${
                        numInstallments === num && installments.length > 0
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {num} {num === 1 ? 'pago' : 'cuotas'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Divide el saldo en cuotas mensuales equidistantes.
                </p>
              </div>
            </div>

            {/* Detalle editable de Cuotas */}
            {installments.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Calendario de Vencimientos Pactado
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {installments.map((inst, idx) => (
                    <div
                      key={inst.installmentNumber}
                      className="p-3 bg-card border border-border rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-primary">Cuota #{inst.installmentNumber}</span>
                        <input
                          type="number"
                          value={inst.amount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setInstallments(
                              installments.map((x, i) => (i === idx ? { ...x, amount: val } : x))
                            );
                          }}
                          className="w-24 h-7 text-right rounded-md border border-border bg-background px-1.5 font-mono text-xs font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInstallments(
                              installments.map((x, i) => (i === idx ? { ...x, dueDate: val } : x))
                            );
                          }}
                          className="w-full h-7 rounded-md border border-border bg-background px-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground block">
                Observaciones o Acuerdos de Cobranza
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: El cliente cancelará quincenalmente vía transferencia bancaria..."
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-border px-6 py-4 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {deliveryMode === 'IMMEDIATE' ? (
              <span className="text-blue-500 font-semibold flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Entrega física inmediata + Registro de venta formal
              </span>
            ) : (
              <span className="text-amber-500 font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Entrega reservada hasta cancelación completa del 100%
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 sm:flex-none h-11 px-5 rounded-xl border border-border bg-background font-semibold text-foreground hover:bg-muted transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmitOperation}
              disabled={isPending || items.length === 0 || !customerId}
              className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Operación a Crédito
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL RÁPIDO PARA CREAR CLIENTE NUEVO */}
      {showQuickCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Registrar Nuevo Cliente en el CRM
              </h3>
              <button
                onClick={() => setShowQuickCustomer(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Nombre Completo o Razón Social *</label>
                <input
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ej: Andrea Gómez"
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Tipo Doc</label>
                  <select
                    value={newCustDocType}
                    onChange={(e) => setNewCustDocType(e.target.value)}
                    className="w-full h-9 rounded-xl border border-border bg-background px-2 text-xs"
                  >
                    <option value="CC">Cédula (CC)</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">Cédula Ext. (CE)</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Número de Identificación</label>
                  <input
                    value={newCustDocNumber}
                    onChange={(e) => setNewCustDocNumber(e.target.value)}
                    placeholder="Ej: 1020304050"
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Teléfono Principal *</label>
                  <input
                    required
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Teléfono Alternativo</label>
                  <input
                    value={newCustAltPhone}
                    onChange={(e) => setNewCustAltPhone(e.target.value)}
                    placeholder="Teléfono fijo o familiar"
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Dirección de Domicilio</label>
                  <input
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    placeholder="Calle 123 # 45-67"
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Barrio / Sector</label>
                  <input
                    value={newCustNeighborhood}
                    onChange={(e) => setNewCustNeighborhood(e.target.value)}
                    placeholder="Ej: Chapinero"
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">Dirección Alternativa de Entrega (si es diferente)</label>
                <input
                  value={newCustDeliveryAddress}
                  onChange={(e) => setNewCustDeliveryAddress(e.target.value)}
                  placeholder="Dirección donde se despachará la mercancía"
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(false)}
                  className="h-9 px-4 rounded-xl border border-border bg-background font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

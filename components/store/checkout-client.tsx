'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  Store,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Package,
  CheckCircle2,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useCart } from './cart-context';
import { calculateCartTotals, submitStoreOrder } from '@/app/actions/store-actions';

interface CheckoutClientProps {
  store: {
    slug: string;
    name: string;
    phone?: string | null;
    city?: string | null;
    address?: string | null;
    pickupAddress?: string | null;
    allowDelivery: boolean;
    allowPickup: boolean;
    allowCoordinate: boolean;
    deliveryCost: number;
    deliveryNotes?: string | null;
    minOrderAmount: number;
  };
}

export function CheckoutClient({ store }: CheckoutClientProps) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'HOME_DELIVERY' | 'PICKUP' | 'COORDINATE'>('HOME_DELIVERY');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState(store.city || 'Cali');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Server authoritative calculations
  const [serverTotals, setServerTotals] = useState<{
    subtotal: number;
    deliveryCost: number;
    total: number;
    itemsBreakdown: any[];
  } | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Recalcular autoritativamente en el servidor cuando cambian los ítems o la modalidad
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;
    calculateCartTotals(
      store.slug,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      deliveryMode
    ).then((res) => {
      if (!isMounted) return;
      if (res.success) {
        setServerTotals({
          subtotal: res.subtotal || 0,
          deliveryCost: res.deliveryCost || 0,
          total: res.total || 0,
          itemsBreakdown: res.itemsBreakdown || [],
        });
        setCalcError(null);
      } else {
        setCalcError(res.error || 'Error al recalcular pedido.');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [items, deliveryMode, store.slug]);

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Tu carrito está vacío</h2>
        <p className="text-xs text-muted-foreground">
          No tienes productos en el carrito para realizar un pedido.
        </p>
        <Link
          href={`/t/${store.slug}`}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones en cliente
    if (customerName.trim().length < 3) {
      setFormError('Ingresa un nombre completo válido de al menos 3 caracteres.');
      return;
    }

    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      setFormError('Ingresa un número de teléfono o WhatsApp válido (entre 7 y 15 dígitos).');
      return;
    }

    if (customerEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
        setFormError('El correo electrónico no tiene un formato válido.');
        return;
      }
    }

    if (deliveryMode === 'HOME_DELIVERY') {
      if (deliveryAddress.trim().length < 5) {
        setFormError('La dirección de entrega es obligatoria para el envío a domicilio (mínimo 5 caracteres).');
        return;
      }
      if (deliveryCity.trim().length < 2) {
        setFormError('Ingresa la ciudad o municipio de entrega.');
        return;
      }
    }

    if (!privacyAccepted) {
      setFormError('Debes aceptar el tratamiento de datos personales para continuar.');
      return;
    }

    startTransition(async () => {
      const res = await submitStoreOrder({
        storeSlug: store.slug,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        deliveryMode,
        deliveryAddress: deliveryMode === 'HOME_DELIVERY' ? deliveryAddress.trim() : undefined,
        deliveryCity: deliveryMode === 'HOME_DELIVERY' ? deliveryCity.trim() : undefined,
        deliveryNeighborhood: deliveryMode === 'HOME_DELIVERY' ? deliveryNeighborhood.trim() : undefined,
        notes: notes.trim() || undefined,
        privacyAccepted: true,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (res.success && res.orderToken) {
        clearCart();
        router.push(`/t/${store.slug}/order/${res.orderToken}`);
      } else {
        setFormError(res.error || 'No fue posible enviar el pedido. Inténtalo nuevamente.');
      }
    });
  };

  const currentSubtotal = serverTotals ? serverTotals.subtotal : items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const currentDeliveryCost = deliveryMode === 'HOME_DELIVERY' ? (serverTotals ? serverTotals.deliveryCost : store.deliveryCost) : 0;
  const currentTotal = currentSubtotal + currentDeliveryCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href={`/t/${store.slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Checkout Form */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary block mb-1">
              Finalizar Pedido
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Datos de contacto y entrega
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Completa el formulario para enviar tu pedido a <strong>{store.name}</strong>. El negocio confirmará disponibilidad y condiciones comerciales.
            </p>
          </div>

          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {calcError && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{calcError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Datos Personales */}
            <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                1. Información de contacto
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez García"
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 300 123 4567"
                      className="h-11 w-full rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Correo electrónico <span className="opacity-60">(Opcional)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Ej. correo@dominio.com"
                      className="h-11 w-full rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Modalidad de Entrega */}
            <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                2. Modalidad de entrega *
              </h3>

              {/* Cards de Selección */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {store.allowDelivery && (
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('HOME_DELIVERY')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      deliveryMode === 'HOME_DELIVERY'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border bg-background/50 hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Truck className={`h-5 w-5 ${deliveryMode === 'HOME_DELIVERY' ? 'text-primary' : 'text-muted-foreground'}`} />
                      {deliveryMode === 'HOME_DELIVERY' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Envío a domicilio</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Entrega en tu dirección</p>
                    </div>
                  </button>
                )}

                {store.allowPickup && (
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('PICKUP')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      deliveryMode === 'PICKUP'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border bg-background/50 hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Store className={`h-5 w-5 ${deliveryMode === 'PICKUP' ? 'text-primary' : 'text-muted-foreground'}`} />
                      {deliveryMode === 'PICKUP' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Recoger en el negocio</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Retiras en el punto físico</p>
                    </div>
                  </button>
                )}

                {store.allowCoordinate && (
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('COORDINATE')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                      deliveryMode === 'COORDINATE'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border bg-background/50 hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <MessageSquare className={`h-5 w-5 ${deliveryMode === 'COORDINATE' ? 'text-primary' : 'text-muted-foreground'}`} />
                      {deliveryMode === 'COORDINATE' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Coordinar con vendedor</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Acuerdas por WhatsApp</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Campos condicionales para Domicilio */}
              {deliveryMode === 'HOME_DELIVERY' && (
                <div className="pt-2 space-y-3 border-t border-border/60 animate-in fade-in-50 duration-200">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Dirección de entrega *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ej. Calle 10 # 5-20, apartamento 201"
                      className="h-11 w-full rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Ciudad o municipio *
                      </label>
                      <input
                        type="text"
                        required
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="Ej. Cali"
                        className="h-11 w-full rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Barrio <span className="opacity-60">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryNeighborhood}
                        onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                        placeholder="Ej. San Fernando"
                        className="h-11 w-full rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Información para Recogida */}
              {deliveryMode === 'PICKUP' && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1 animate-in fade-in-50 duration-200">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    Punto de recogida:
                  </p>
                  <p>{store.pickupAddress || store.address || 'Se informará al confirmar el pedido con el negocio.'}</p>
                </div>
              )}

              {/* Información para Coordinar */}
              {deliveryMode === 'COORDINATE' && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground animate-in fade-in-50 duration-200">
                  <p>Las condiciones de entrega, costos de transporte y plazos se coordinarán directamente con el negocio vía WhatsApp una vez enviado tu pedido.</p>
                </div>
              )}
            </div>

            {/* 3. Observaciones */}
            <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Observaciones <span className="opacity-60">(Opcional)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">{notes.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Indicaciones de entrega, referencias o solicitudes especiales."
                className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none"
              />
            </div>

            {/* 4. Privacidad y Tratamiento de Datos */}
            <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Autorizo el tratamiento de mis datos personales para la gestión, despacho y confirmación de este pedido conforme a la normativa colombiana de protección de datos personales (Ley 1581 de 2012).
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-base shadow-xl shadow-primary/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enviando pedido...</span>
                </>
              ) : (
                <span>Enviar pedido</span>
              )}
            </button>
          </form>
        </div>

        {/* Right column: Order Summary */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Resumen del pedido
            </h3>

            {/* Items Breakdown */}
            <div className="divide-y divide-border/60 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-muted/40 overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{item.name}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {item.quantity} × {fmt(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground flex-shrink-0">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal productos</span>
                <span className="font-bold text-foreground">{fmt(currentSubtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Costo de envío</span>
                {deliveryMode === 'HOME_DELIVERY' ? (
                  currentDeliveryCost > 0 ? (
                    <span className="font-bold text-foreground">{fmt(currentDeliveryCost)}</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Gratis / A convenir</span>
                  )
                ) : (
                  <span className="italic">No aplica</span>
                )}
              </div>
              <div className="border-t border-border/80 pt-3 flex justify-between font-black text-base">
                <span>Total estimado</span>
                <span className="text-primary text-xl font-black">{fmt(currentTotal)}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border text-[11px] text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-0.5">ℹ️ Información importante:</p>
              Este formulario registra una solicitud de pedido en estado <strong>Pendiente de revisión</strong>. No realiza cobros automáticos de tarjeta ni genera pagos definitivos. El negocio se comunicará contigo para confirmar el pedido.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, ArrowLeft, Package, Clock, Truck, Store, MapPin } from 'lucide-react';
import { getPublicOrderConfirmation } from '@/app/actions/store-actions';

export const metadata = {
  title: 'Confirmación de Pedido · Tienda Virtual GNS',
  description: 'Detalle y confirmación de tu pedido online.',
};

export default async function OrderConfirmationPage(props: {
  params: Promise<{ storeSlug: string; orderToken: string }>;
}) {
  const params = await props.params;
  const res = await getPublicOrderConfirmation(params.orderToken);

  if (!res.success || !res.order) {
    notFound();
  }

  const { order } = res;
  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  const whatsappMessage = `¡Hola! Acabo de enviar el pedido *${order.orderNumber}* en su tienda virtual a nombre de *${order.customerName}*. Me gustaría confirmar el estado y entrega.`;
  const whatsappUrl = order.store.phone
    ? `https://wa.me/${order.store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const deliveryModeLabels: Record<string, string> = {
    HOME_DELIVERY: 'Envío a domicilio',
    PICKUP: 'Recoger en el negocio',
    COORDINATE: 'Coordinar con vendedor',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      {/* Success Badge & Header */}
      <div className="text-center space-y-4">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10 animate-in zoom-in-75">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-3">
            <Clock className="h-3.5 w-3.5" />
            Pendiente de revisión
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            ¡Tu pedido fue recibido!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            El negocio revisará la disponibilidad de los productos y confirmará las condiciones de entrega. Guarda tu número de pedido para cualquier consulta.
          </p>
        </div>
      </div>

      {/* Main Order Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        {/* Reference & Store */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/80 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Número de referencia
            </p>
            <p className="text-2xl font-black text-primary tracking-wide">
              {order.orderNumber}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Comercio
            </p>
            <p className="text-base font-bold text-foreground">
              {order.store.name}
            </p>
          </div>
        </div>

        {/* Customer & Delivery recap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
            <p className="font-bold text-foreground">Cliente</p>
            <p className="text-muted-foreground">{order.customerName}</p>
            <p className="text-muted-foreground">Teléfono: {order.customerPhoneMasked}</p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
            <p className="font-bold text-foreground">Modalidad de entrega</p>
            <p className="text-primary font-semibold">
              {deliveryModeLabels[order.deliveryMode] || order.deliveryMode}
            </p>
            {order.deliveryAddress && (
              <p className="text-muted-foreground">
                {order.deliveryAddress}, {order.deliveryCity}
              </p>
            )}
            {order.deliveryMode === 'PICKUP' && order.store.pickupAddress && (
              <p className="text-muted-foreground">Retiro en: {order.store.pickupAddress}</p>
            )}
          </div>
        </div>

        {/* Items */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Productos solicitados ({order.items.length})
          </h3>
          <div className="divide-y divide-border/60 border border-border rounded-2xl overflow-hidden">
            {order.items.map((it: any) => (
              <div key={it.id} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-card">
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{it.productName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {it.quantity} × {fmt(it.unitPrice)}
                  </p>
                </div>
                <span className="font-bold text-foreground flex-shrink-0">
                  {fmt(it.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="pt-2 space-y-1.5 text-xs border-t border-border/80">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-bold text-foreground">{fmt(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Envío</span>
            <span className="font-bold text-foreground">
              {order.deliveryCost > 0 ? fmt(order.deliveryCost) : 'A coordinar / Gratis'}
            </span>
          </div>
          <div className="border-t border-border/80 pt-3 flex justify-between font-black text-base sm:text-lg">
            <span>Total estimado</span>
            <span className="text-primary font-black">{fmt(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contactar al negocio por WhatsApp</span>
            </a>
          )}
          <Link
            href={`/t/${params.storeSlug}`}
            className="flex-1 h-12 rounded-2xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a la tienda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

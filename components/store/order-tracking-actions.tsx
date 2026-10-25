'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Copy, Check, Send, ExternalLink, ShieldCheck } from 'lucide-react';

interface OrderTrackingActionsProps {
  orderNumber: string;
  orderToken: string;
  storeSlug: string;
  storeName: string;
  storePhone?: string | null;
  customerName: string;
  customerPhone?: string | null;
  total: number;
}

export function OrderTrackingActions({
  orderNumber,
  orderToken,
  storeSlug,
  storeName,
  storePhone,
  customerName,
  customerPhone,
  total,
}: OrderTrackingActionsProps) {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  const trackingUrl = origin
    ? `${origin}/t/${storeSlug}/order/${orderToken}`
    : `/t/${storeSlug}/order/${orderToken}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // WhatsApp to Customer's Own Number (or universal share to self)
  const getCustomerWhatsAppUrl = () => {
    const rawDigits = (customerPhone || '').replace(/\D/g, '');
    const cleanPhone =
      rawDigits.length === 10
        ? `57${rawDigits}`
        : rawDigits.length > 10
        ? rawDigits
        : '';

    const text = `Hola *${customerName}* 👋\n\nAquí tienes el enlace de seguimiento directo de tu pedido *#${orderNumber}* en *${storeName}*.\n\n💰 Total: ${fmt(total)}\n\n🔍 Puedes revisar el estado de tu pedido en cualquier momento sin iniciar sesión:\n${trackingUrl}\n\n¡Gracias por tu compra!`;

    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp to Store Merchant
  const getStoreWhatsAppUrl = () => {
    if (!storePhone) return null;
    const rawDigits = storePhone.replace(/\D/g, '');
    const cleanPhone =
      rawDigits.length === 10
        ? `57${rawDigits}`
        : rawDigits.length > 10
        ? rawDigits
        : '';

    const msg = `¡Hola *${storeName}*! 👋\n\nAcabo de realizar el pedido *#${orderNumber}* a nombre de *${customerName}* por valor de *${fmt(total)}*.\n\n🔍 Enlace de seguimiento en vivo:\n${trackingUrl}\n\nQuedo atento(a) para confirmar la disponibilidad y coordinar la entrega. ¡Muchas gracias!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const storeWaUrl = getStoreWhatsAppUrl();

  return (
    <div className="space-y-4">
      {/* Box de Seguimiento por WhatsApp (Sin inicio de sesión) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-foreground space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 mt-0.5">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-foreground">
              Lleva el seguimiento en tu WhatsApp
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No necesitas recordar contraseñas ni crear cuenta. Guarda este enlace en tu chat personal de WhatsApp para revisar el estado de tu pedido cuando quieras.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <a
            href={getCustomerWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Guardar en mi WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopyLink}
            className="h-11 px-4 rounded-2xl border border-border bg-card hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 transition-all text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-600 font-extrabold">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar Enlace de Rastreo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Botón de Contacto con el Negocio */}
      {storeWaUrl && (
        <a
          href={storeWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-12 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Send className="h-4 w-4" />
          <span>Enviar pedido a la tienda por WhatsApp</span>
        </a>
      )}
    </div>
  );
}

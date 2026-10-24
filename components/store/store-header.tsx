'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, MessageCircle, MapPin, Store, Sparkles } from 'lucide-react';
import { useCart } from './cart-context';

interface StoreHeaderProps {
  store: {
    slug: string;
    name: string;
    logoUrl?: string | null;
    phone?: string | null;
    city?: string | null;
    whatsappMessage?: string | null;
    announcementText?: string | null;
    themeColor?: string | null;
    themeConfig?: any | null;
  };
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const { totalCount, setIsCartOpen } = useCart();
  const theme = store.themeConfig;
  const brandColor = theme?.palette?.primaryColor || store.themeColor || '#2563eb';

  // Generar URL de WhatsApp con mensaje configurado y código de país inteligente
  let whatsappUrl: string | null = null;
  if (store.phone) {
    const rawDigits = store.phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 10 ? `57${rawDigits}` : rawDigits;

    const defaultMsg = `¡Hola ${store.name}! Estoy viendo su tienda virtual y me gustaría consultar sobre sus productos.`;
    const messageTemplate = store.whatsappMessage?.trim() || defaultMsg;
    const finalMessage = messageTemplate.replace(/\{storeName\}|\{tienda\}/gi, store.name);

    whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
  }

  const announcementEnabled = theme?.announcement?.enabled !== false && Boolean(store.announcementText || theme?.announcement?.text);
  const announcementText = theme?.announcement?.text || store.announcementText;
  const announcementBg = theme?.announcement?.bgColor === 'dark'
    ? '#0f172a'
    : theme?.announcement?.bgColor === 'amber'
    ? '#d97706'
    : theme?.announcement?.bgColor === 'emerald'
    ? '#059669'
    : brandColor;

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* Top Announcement Bar if configured */}
      {announcementEnabled && announcementText && (
        <div
          style={{ backgroundColor: announcementBg }}
          className="text-white py-1.5 px-4 text-center text-xs font-bold tracking-wide shadow-inner flex items-center justify-center gap-2"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span className="truncate max-w-2xl">{announcementText}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="w-full border-b border-border/80 bg-background/85 backdrop-blur-md transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand / Logo */}
          <Link href={`/t/${store.slug}`} className="flex items-center gap-3 group min-w-0">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl object-cover border border-border shadow-sm group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform shrink-0">
                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                {store.name}
              </h1>
              {store.city && (
                <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0 text-primary" />
                  <span>{store.city}</span>
                </p>
              )}
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-4 rounded-xl sm:rounded-2xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Escríbenos a WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: brandColor }}
              className="relative flex items-center gap-2 h-9 sm:h-11 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-sm shadow-lg shadow-black/15 hover:opacity-95 active:scale-95 transition-all"
              aria-label="Abrir carrito de compras"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Carrito</span>
              {totalCount > 0 && (
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-background text-foreground text-[11px] font-black shadow-sm animate-in zoom-in-75">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

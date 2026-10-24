'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { useCart } from './cart-context';

export function CartDrawer({ storeSlug }: { storeSlug: string }) {
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalCount, isCartOpen, setIsCartOpen } = useCart();

  if (!isCartOpen) return null;

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground">Tu Carrito</h2>
              <p className="text-xs text-muted-foreground">
                {totalCount} {totalCount === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-16 w-16 rounded-3xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/60">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-foreground">Tu carrito está vacío</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Explora el catálogo y agrega los productos que deseas pedir.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 text-xs font-bold text-primary hover:underline"
              >
                Volver a la tienda
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border/80 bg-background/50 hover:bg-background transition-colors"
              >
                {/* Thumbnail */}
                <div className="h-16 w-16 rounded-xl bg-muted/40 overflow-hidden flex-shrink-0 flex items-center justify-center border border-border/50">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{item.name}</h4>
                  <p className="text-xs font-black text-primary mt-0.5">{fmt(item.price)}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-border rounded-xl bg-muted/30">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.availableQuantity}
                        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 disabled:opacity-30"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors ml-auto"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-border bg-card/95 backdrop-blur-md space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal estimado</span>
                <span className="font-bold text-foreground">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Envío</span>
                <span className="italic">Se calcula en el checkout</span>
              </div>
              <div className="border-t border-border/80 pt-2 flex justify-between font-black text-base">
                <span>Total preliminar</span>
                <span className="text-primary text-lg">{fmt(subtotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Link
                href={`/t/${storeSlug}/checkout`}
                onClick={() => setIsCartOpen(false)}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-xl shadow-primary/25 hover:opacity-95 active:scale-95 transition-all"
              >
                <span>Continuar al Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={clearCart}
                className="w-full py-1 text-center text-[11px] font-semibold text-muted-foreground hover:text-rose-500 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

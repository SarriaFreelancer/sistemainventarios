'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Package, Check, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { PublicProduct } from './product-card';
import { useCart } from './cart-context';

interface ProductModalProps {
  product: PublicProduct | null;
  onClose: () => void;
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) return null;

  const cartItem = items.find((i) => i.productId === product.id);
  const currentInCart = cartItem?.quantity || 0;
  const maxAddable = Math.max(0, product.availableQuantity - currentInCart);

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  const handleAddToCart = () => {
    if (quantity <= 0 || maxAddable <= 0) return;
    addItem(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50 duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 shadow-sm"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto">
          {/* Product Media */}
          <div className="relative aspect-square sm:aspect-auto sm:h-full bg-muted/30 flex items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-border/60">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-72 sm:max-h-80 w-auto object-contain rounded-2xl shadow-sm"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/30 py-16 gap-2">
                <Package className="h-16 w-16 stroke-[1.5]" />
                <span className="text-xs uppercase font-extrabold tracking-widest">Sin imagen</span>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.hasDiscount && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/20">
                  <Tag className="h-3 w-3" />
                  -{product.discountPercentage}% OFF
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-background/90 text-foreground border border-border backdrop-blur-md">
                {product.category}
              </span>
            </div>
          </div>

          {/* Product Info & Purchase */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block">
                  Código: {product.code}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight mt-1">
                  {product.name}
                </h2>
              </div>

              {/* Price section */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Precio unitario
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-foreground">
                    {fmt(product.price)}
                  </span>
                  {product.hasDiscount && product.regularPrice && (
                    <span className="text-sm line-through text-muted-foreground font-semibold">
                      {fmt(product.regularPrice)}
                    </span>
                  )}
                </div>
                {product.hasDiscount && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                    🎉 ¡Estás ahorrando {fmt((product.regularPrice || product.price) - product.price)}!
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description ? (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Descripción
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Producto de excelente calidad garantizada por la tienda.
                </p>
              )}

              {/* Availability */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                {product.inStock ? (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Disponible ({product.availableQuantity} unidades en stock)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-bold text-rose-500">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Agotado temporalmente
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-border/80">
              {product.inStock && maxAddable > 0 ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-muted-foreground">Cantidad:</span>
                    <div className="flex items-center border border-border rounded-xl bg-background p-1 shadow-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 transition-all"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-black text-foreground">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxAddable, q + 1))}
                        disabled={quantity >= maxAddable}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={addedAnimation}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl shadow-primary/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="h-5 w-5" />
                        <span>¡Agregado al Carrito!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5" />
                        <span>Agregar al Carrito • {fmt(product.price * quantity)}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  disabled
                  className="w-full h-12 rounded-2xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed text-center"
                >
                  {product.inStock ? 'Cantidad máxima en carrito alcanzada' : 'No disponible para compra'}
                </button>
              )}

              <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Compra 100% segura y directa con la tienda
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

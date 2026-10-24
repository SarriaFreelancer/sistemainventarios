'use client';

import React from 'react';
import { Plus, Check, Package, Tag, Eye } from 'lucide-react';
import { useCart } from './cart-context';

export interface PublicProduct {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  regularPrice?: number | null;
  webPrice?: number | null;
  hasDiscount?: boolean;
  discountPercentage?: number;
  inStock: boolean;
  availableQuantity: number;
  category: string;
  categoryId: number;
  group?: string | null;
}

interface ProductCardProps {
  product: PublicProduct;
  onSelect?: (product: PublicProduct) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const { items, addItem } = useCart();
  const cartItem = items.find((i) => i.productId === product.id);
  const currentInCart = cartItem?.quantity || 0;

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  const isLowStock = product.inStock && product.availableQuantity <= 5 && product.availableQuantity > 0;

  return (
    <div
      onClick={() => onSelect?.(product)}
      className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-3 sm:p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer"
    >
      <div>
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted/30 mb-3 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/30 gap-1">
              <Package className="h-8 w-8 sm:h-10 sm:w-10 stroke-[1.5]" />
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest">Sin foto</span>
            </div>
          )}

          {/* Quick View Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 text-foreground text-xs font-bold shadow-lg scale-90 group-hover:scale-100 transition-transform">
              <Eye className="h-3.5 w-3.5" />
              Ver detalle
            </span>
          </div>

          {/* Discount Badge */}
          {product.hasDiscount && (
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/25">
                <Tag className="h-3 w-3" />
                -{product.discountPercentage}%
              </span>
            </div>
          )}

          {/* Stock Badges */}
          <div className="absolute top-2 right-2 z-10">
            {!product.inStock ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-500/90 text-white backdrop-blur-md shadow-sm">
                Agotado
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-md shadow-sm">
                ¡Últimas {product.availableQuantity}!
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {product.category}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">
              {product.code}
            </span>
          </div>

          <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Price & Add to Cart */}
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {product.hasDiscount && product.regularPrice && (
            <span className="text-[10px] sm:text-xs line-through text-muted-foreground font-semibold block leading-none">
              {fmt(product.regularPrice)}
            </span>
          )}
          <span
            className={`text-sm sm:text-base md:text-lg font-black block truncate ${
              product.hasDiscount ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
            }`}
          >
            {fmt(product.price)}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            addItem(product);
          }}
          disabled={!product.inStock || currentInCart >= product.availableQuantity}
          className={`flex items-center justify-center gap-1 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl font-bold text-xs transition-all shadow-sm shrink-0 ${
            currentInCart > 0
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-primary text-primary-foreground hover:opacity-95 shadow-primary/20'
          } disabled:opacity-30 disabled:cursor-not-allowed active:scale-95`}
          aria-label={`Agregar ${product.name} al carrito`}
        >
          {currentInCart > 0 ? (
            <>
              <Check className="h-4 w-4" />
              <span className="text-[11px] font-black">{currentInCart}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline text-[11px]">Agregar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

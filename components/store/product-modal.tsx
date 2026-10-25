'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Package,
  Check,
  Tag,
  ShieldCheck,
  Share2,
  Video,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video'>('photos');
  const [copiedShare, setCopiedShare] = useState(false);

  if (!product) return null;

  // Build list of unique images
  const allImages: string[] = [];
  if (product.imageUrl) allImages.push(product.imageUrl);
  if (Array.isArray(product.galleryImages)) {
    product.galleryImages.forEach((img) => {
      if (img && !allImages.includes(img)) allImages.push(img);
    });
  }

  const activeImage = allImages[selectedImageIndex] || product.imageUrl;

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

  // Convert YouTube or Vimeo URLs to embed format
  const getEmbedInfo = (url?: string | null) => {
    if (!url) return null;
    const clean = url.trim();

    // YouTube
    const ytMatch = clean.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0` };
    }

    // Vimeo
    const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }

    // Direct MP4 / WebM video
    return { type: 'video', src: clean };
  };

  const embedInfo = getEmbedInfo(product.videoUrl);

  const handleShareWhatsApp = () => {
    if (typeof window === 'undefined') return;
    const productUrl = window.location.href;
    const msg = `¡Hola! Mira este producto: *${product.name}* a *${fmt(product.price)}*.\n\nPuedes verlo y pedirlo aquí:\n${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50 duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-card border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
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

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          {/* Media Column (Images & Video) */}
          <div className="relative bg-muted/20 flex flex-col justify-between p-4 sm:p-6 border-b md:border-b-0 md:border-r border-border/60">
            {/* Media Tabs if video is available */}
            {embedInfo && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background border border-border/80 mb-3 self-center sm:self-start text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('photos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeMediaTab === 'photos'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Fotos ({Math.max(1, allImages.length)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeMediaTab === 'video'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Video Demostrativo</span>
                </button>
              </div>
            )}

            {/* Main Preview Container */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-background/60 border border-border/60 flex items-center justify-center">
              {activeMediaTab === 'video' && embedInfo ? (
                embedInfo.type === 'iframe' ? (
                  <iframe
                    src={embedInfo.src}
                    title={product.name}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={embedInfo.src} controls className="w-full h-full object-contain bg-black" />
                )
              ) : activeImage ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="max-h-80 w-auto object-contain transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground/30 py-16 gap-2">
                  <Package className="h-16 w-16 stroke-[1.5]" />
                  <span className="text-xs uppercase font-extrabold tracking-widest">Sin imagen</span>
                </div>
              )}

              {/* Discount Badge */}
              {product.hasDiscount && (
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-md shadow-rose-500/25">
                    <Tag className="h-3 w-3" />
                    -{product.discountPercentage}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel (if more than 1 image) */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 pt-1 scrollbar-none justify-start sm:justify-center">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setActiveMediaTab('photos');
                    }}
                    className={`relative h-14 w-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeMediaTab === 'photos' && selectedImageIndex === idx
                        ? 'border-primary ring-2 ring-primary/20 scale-105'
                        : 'border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                    {product.category} • Código: {product.code}
                  </span>

                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border hover:bg-muted text-[11px] font-semibold text-emerald-600 transition-colors"
                    title="Compartir producto por WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Compartir</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight mt-1">
                  {product.name}
                </h2>
              </div>

              {/* Price section */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
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
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Descripción
                </h4>
                {product.description ? (
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Producto oficial garantizado con disponibilidad inmediata.
                  </p>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                {product.inStock ? (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Disponible ({product.availableQuantity} unidades listas para entrega)
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

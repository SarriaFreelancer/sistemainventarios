'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Store,
  ShoppingBag,
  MapPin,
  Truck,
  Clock,
  ArrowRight,
  MessageCircle,
  Tag,
  SlidersHorizontal,
  ChevronDown,
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Headphones,
  BadgePercent,
  CreditCard,
  Heart,
  Package,
  Mail,
  Calendar,
  Layers,
} from 'lucide-react';
import { ProductCard, PublicProduct } from './product-card';
import { ProductModal } from './product-modal';
import { CartDrawer } from './cart-drawer';
import { useCart } from './cart-context';
import { StoreThemeConfig, parseStoreThemeConfig } from '@/lib/store-theme';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.12-.11.23-.23.33-.35V11.2a8.16 8.16 0 0 0 5.4 2.06v-3.41a4.85 4.85 0 0 1-2.9-1.07c-.4-.32-.73-.72-.98-1.17z" />
  </svg>
);

function renderFeatureIcon(icon: string, className = 'h-5 w-5') {
  switch (icon) {
    case 'truck':
      return <Truck className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'badge-percent':
      return <BadgePercent className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'package':
      return <Package className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

interface PublicCatalogClientProps {
  store: {
    slug: string;
    name: string;
    description?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    currency?: string;
    whatsappMessage?: string | null;
    announcementText?: string | null;
    themeColor?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    tiktokUrl?: string | null;
    themeConfig?: StoreThemeConfig | null;
    allowDelivery: boolean;
    allowPickup: boolean;
    allowCoordinate: boolean;
    deliveryCost: number;
    deliveryNotes?: string | null;
    pickupAddress?: string | null;
    minOrderAmount: number;
    freeShippingThreshold?: number;
  };
  products: PublicProduct[];
  categories: { id: number; name: string; count: number }[];
}

export function PublicCatalogClient({ store, products, categories }: PublicCatalogClientProps) {
  const { totalCount, subtotal, setIsCartOpen } = useCart();
  const theme = useMemo(
    () => store.themeConfig || parseStoreThemeConfig(null, store.name, store.themeColor),
    [store.themeConfig, store.name, store.themeColor]
  );

  const brandColor = theme.palette.primaryColor || store.themeColor || '#2563eb';
  const brandSecondary = theme.palette.secondaryColor || '#1d4ed8';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [sortBy, setSortBy] = useState<'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISCOUNT_DESC' | 'NAME_ASC'>('FEATURED');
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  // Conteo de ofertas
  const discountedProducts = useMemo(() => {
    return products.filter((p) => p.hasDiscount);
  }, [products]);

  // Filtrado y ordenamiento interactivo
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      const matchesDiscounts = !onlyDiscounts || Boolean(p.hasDiscount);

      return matchesSearch && matchesCategory && matchesDiscounts;
    });

    if (sortBy === 'PRICE_ASC') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'PRICE_DESC') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'DISCOUNT_DESC') {
      result.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    } else if (sortBy === 'NAME_ASC') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, search, selectedCategory, onlyDiscounts, sortBy]);

  // Generador de URL de WhatsApp con mensaje configurado
  const whatsappUrl = useMemo(() => {
    if (!store.phone) return null;
    const rawDigits = store.phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 10 ? `57${rawDigits}` : rawDigits;
    const defaultMsg = `¡Hola ${store.name}! Estoy visitando su tienda virtual y me gustaría consultar sobre sus productos.`;
    const messageTemplate = store.whatsappMessage?.trim() || defaultMsg;
    const finalMessage = messageTemplate.replace(/\{storeName\}|\{tienda\}/gi, store.name);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;
  }, [store.phone, store.whatsappMessage, store.name]);

  // Scroll suave al catálogo o sección
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroAction = (action: 'CATALOG' | 'OFFERS' | 'WHATSAPP') => {
    if (action === 'WHATSAPP' && whatsappUrl) {
      window.open(whatsappUrl, '_blank');
    } else if (action === 'OFFERS') {
      setOnlyDiscounts(true);
      scrollToSection('catalogo');
    } else {
      setOnlyDiscounts(false);
      scrollToSection('catalogo');
    }
  };

  // Categorías a destacar en la sección de categorías
  const featuredCategories = useMemo(() => {
    const selectedIds = theme.categoriesSection.featuredCategoryIds || [];
    if (selectedIds.length > 0) {
      return categories.filter((c) => selectedIds.includes(c.id));
    }
    return categories.slice(0, 8);
  }, [categories, theme.categoriesSection.featuredCategoryIds]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 sm:pb-12">
      {/* 1. SECCIÓN HERO / PORTADA CONFIGURABLE */}
      {theme.hero.enabled && (
        <section
          style={{
            background: theme.hero.bannerImageUrl
              ? `linear-gradient(rgba(15,23,42,0.65), rgba(15,23,42,0.85)), url(${theme.hero.bannerImageUrl})`
              : theme.hero.style === 'gradient'
              ? `linear-gradient(135deg, ${brandColor}18 0%, ${brandSecondary}10 50%, transparent 100%)`
              : theme.hero.style === 'dark-banner'
              ? '#0f172a'
              : undefined,
            backgroundSize: theme.hero.bannerImageUrl ? 'cover' : undefined,
            backgroundPosition: theme.hero.bannerImageUrl ? 'center' : undefined,
          }}
          className={`relative border-b border-border/80 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden ${
            theme.hero.style === 'dark-banner' || theme.hero.bannerImageUrl ? 'text-white' : ''
          } ${theme.hero.style === 'modern-card' && !theme.hero.bannerImageUrl ? 'bg-card/70 backdrop-blur-sm' : ''}`}
        >
          {/* Subtle Glow */}
          <div
            style={{ backgroundColor: `${brandColor}20` }}
            className="absolute top-0 right-1/4 -mt-20 h-72 w-72 rounded-full blur-[100px] pointer-events-none"
          />

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            {/* Identidad y Título */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="h-20 w-20 sm:h-28 sm:w-28 rounded-3xl object-cover border-2 border-border shadow-xl shrink-0"
                />
              ) : (
                <div
                  style={{ backgroundColor: brandColor }}
                  className="h-20 w-20 sm:h-28 sm:w-28 rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0"
                >
                  <Store className="h-10 w-10 sm:h-14 sm:w-14" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {theme.hero.badgeText && (
                    <span
                      style={{
                        backgroundColor: `${brandColor}20`,
                        color: theme.hero.style === 'dark-banner' ? '#fff' : brandColor,
                      }}
                      className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
                    >
                      <Sparkles className="h-3 w-3" />
                      {theme.hero.badgeText}
                    </span>
                  )}

                  {discountedProducts.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      <Tag className="h-3 w-3" />
                      {discountedProducts.length} ofertas activas
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  {theme.hero.title || store.name}
                </h1>

                <p className="text-xs sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                  {theme.hero.subtitle || store.description}
                </p>

                {/* Botones de Acción Hero */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {theme.hero.primaryBtnText && (
                    <button
                      type="button"
                      onClick={() => handleHeroAction(theme.hero.primaryBtnAction)}
                      style={{ backgroundColor: brandColor }}
                      className="h-11 sm:h-12 px-6 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-lg shadow-black/15 hover:opacity-95 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{theme.hero.primaryBtnText}</span>
                    </button>
                  )}

                  {theme.hero.secondaryBtnAction !== 'NONE' && theme.hero.secondaryBtnText && (
                    <button
                      type="button"
                      onClick={() => handleHeroAction(theme.hero.secondaryBtnAction as any)}
                      className="h-11 sm:h-12 px-5 rounded-2xl border border-border bg-card/80 hover:bg-card text-foreground font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      {theme.hero.secondaryBtnAction === 'WHATSAPP' ? (
                        <MessageCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Tag className="h-4 w-4 text-rose-500" />
                      )}
                      <span>{theme.hero.secondaryBtnText}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Píldoras de Confianza / Envíos si activadas */}
            {theme.hero.showStats && (
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 text-xs font-bold text-muted-foreground w-full lg:w-auto">
                {store.allowDelivery && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl border border-border/80 bg-card shadow-sm">
                    <Truck className="h-4 w-4" style={{ color: brandColor }} />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Envíos a Domicilio {store.deliveryCost > 0 ? `(${fmt(store.deliveryCost)})` : 'Disponibles'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Directo a tu dirección indicada</p>
                    </div>
                  </div>
                )}
                {store.allowPickup && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl border border-border/80 bg-card shadow-sm">
                    <Store className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Retiro en Local</p>
                      <p className="text-[10px] text-muted-foreground">Recoge tu pedido sin costo adicional</p>
                    </div>
                  </div>
                )}
                {store.city && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl border border-border/80 bg-card shadow-sm">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Sede Principal</p>
                      <p className="text-[10px] text-muted-foreground">{store.city}, Colombia</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. SECCIÓN DE BENEFICIOS / PROPUESTA DE VALOR */}
      {theme.features.enabled && theme.features.items.length > 0 && (
        <section className="border-b border-border bg-card/40 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {theme.features.title && (
              <h3 className="text-center text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                {theme.features.title}
              </h3>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {theme.features.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-colors shadow-xs space-y-2 text-left"
                >
                  <div
                    style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  >
                    {renderFeatureIcon(item.icon, 'h-5 w-5')}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. SECCIÓN DE CATEGORÍAS DESTACADAS */}
      {theme.categoriesSection.enabled && featuredCategories.length > 0 && (
        <section className="py-8 sm:py-10 border-b border-border/60 bg-background px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                  {theme.categoriesSection.title || 'Explora por Categorías'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {theme.categoriesSection.subtitle || 'Selecciona una categoría para filtrar los productos.'}
                </p>
              </div>
              {selectedCategory !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-xs font-bold text-primary hover:underline self-start sm:self-auto"
                >
                  Mostrar todas las categorías
                </button>
              )}
            </div>

            {/* Categorías en formato Cápsulas Shopify (Pills) o Tarjetas según diseño */}
            {theme.categoriesSection.style === 'cards' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {featuredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        scrollToSection('catalogo');
                      }}
                      style={{
                        borderColor: isSelected ? brandColor : undefined,
                        backgroundColor: isSelected ? `${brandColor}10` : undefined,
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all group flex flex-col justify-between h-20 ${
                        isSelected
                          ? 'shadow-sm font-bold'
                          : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                          className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0"
                        >
                          <Tag className="h-3.5 w-3.5" />
                        </span>
                        {theme.categoriesSection.showProductCount && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {cat.count}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-foreground truncate block">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Estilo Shopify: Cápsulas / Filtros Horizontales Compactos Deslizables */
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    scrollToSection('catalogo');
                  }}
                  style={{
                    backgroundColor: selectedCategory === 'ALL' ? brandColor : undefined,
                    borderColor: selectedCategory === 'ALL' ? brandColor : undefined,
                  }}
                  className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    selectedCategory === 'ALL'
                      ? 'text-white shadow-md shadow-black/10 scale-102'
                      : 'bg-card border-border/80 text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>Todas las categorías</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {products.length}
                  </span>
                </button>

                {featuredCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        scrollToSection('catalogo');
                      }}
                      style={{
                        backgroundColor: isSelected ? brandColor : undefined,
                        borderColor: isSelected ? brandColor : undefined,
                      }}
                      className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                        isSelected
                          ? 'text-white shadow-md shadow-black/10 scale-102'
                          : 'bg-card border-border/80 text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {theme.categoriesSection.showProductCount && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {cat.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. SECCIÓN DE OFERTAS ESPECIALES */}
      {theme.offersSection.enabled && discountedProducts.length > 0 && !onlyDiscounts && (
        <section id="ofertas" className="py-10 border-b border-border bg-rose-500/5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-foreground">
                    {theme.offersSection.title || 'Ofertas y Liquidaciones'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {theme.offersSection.subtitle || 'Aprovecha precios especiales por tiempo limitado'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOnlyDiscounts(true);
                  scrollToSection('catalogo');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <span>Ver todas las ofertas ({discountedProducts.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
              {discountedProducts.slice(0, theme.offersSection.maxItems || 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. SECCIÓN CATÁLOGO GENERAL */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="space-y-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
                {theme.catalogSection.title || 'Catálogo de Productos'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {theme.catalogSection.subtitle || 'Consulta precios actualizados, disponibilidad y haz tu pedido en línea.'}
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              Mostrando {filteredProducts.length} de {products.length} productos
            </span>
          </div>

          {/* Barra de Filtros: Buscador, Categorías & Orden */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Buscador */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full pl-10 pr-9 rounded-2xl border border-border bg-card text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Botón Solo Ofertas & Selector de Orden */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {discountedProducts.length > 0 && (
                  <button
                    onClick={() => setOnlyDiscounts(!onlyDiscounts)}
                    className={`h-10 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border ${
                      onlyDiscounts
                        ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-rose-500/40'
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>Solo Ofertas</span>
                    <span className="text-[10px] opacity-80">({discountedProducts.length})</span>
                  </button>
                )}

                {/* Sort selector */}
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer shadow-xs pr-8"
                  >
                    <option value="FEATURED">⭐ Destacados</option>
                    <option value="PRICE_ASC">💰 Menor precio</option>
                    <option value="PRICE_DESC">💎 Mayor precio</option>
                    <option value="DISCOUNT_DESC">🔥 Mayor descuento %</option>
                    <option value="NAME_ASC">🔤 Nombre A-Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Píldoras de Categorías en el catálogo */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`h-8 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === 'ALL'
                      ? 'bg-foreground text-background border-foreground shadow-xs'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todas ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`h-8 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === c.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.name} ({c.count})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cuadrícula de Productos: 2 cols móvil, 3 en tablet, 4 en PC */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border bg-card/60 p-8 space-y-4 shadow-sm">
            <div className="h-16 w-16 mx-auto rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">No se encontraron productos</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search
                  ? `No hay coincidencias para "${search}". Prueba con otra palabra clave o restablece los filtros.`
                  : 'No hay productos disponibles bajo los filtros seleccionados.'}
              </p>
            </div>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setOnlyDiscounts(false);
              }}
              style={{ backgroundColor: brandColor }}
              className="h-10 px-5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 transition-all inline-flex items-center gap-1.5"
            >
              Ver todo el catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. BANNER PROMOCIONAL CTA INTERMEDIO */}
      {theme.promoBanner.enabled && (
        <section className="mt-16 px-4 sm:px-6 lg:px-8">
          <div
            style={{
              background: `linear-gradient(135deg, ${brandColor} 0%, ${brandSecondary} 100%)`,
            }}
            className="max-w-7xl mx-auto rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left"
          >
            <div className="space-y-2 max-w-2xl">
              <h3 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
                {theme.promoBanner.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {theme.promoBanner.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (theme.promoBanner.btnAction === 'WHATSAPP' && whatsappUrl) {
                  window.open(whatsappUrl, '_blank');
                } else if (theme.promoBanner.btnAction === 'OFFERS') {
                  setOnlyDiscounts(true);
                  scrollToSection('catalogo');
                } else {
                  scrollToSection('catalogo');
                }
              }}
              className="h-12 px-6 rounded-2xl bg-white text-slate-900 font-extrabold text-xs sm:text-sm shadow-xl hover:bg-white/95 active:scale-95 transition-all shrink-0 inline-flex items-center gap-2"
            >
              {theme.promoBanner.btnAction === 'WHATSAPP' ? (
                <MessageCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
              <span>{theme.promoBanner.btnText}</span>
            </button>
          </div>
        </section>
      )}

      {/* 7. MODAL DE DETALLE / VISTA RÁPIDA DE PRODUCTO */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* 8. BOTÓN FLOTANTE DE WHATSAPP (FAB) */}
      {whatsappUrl && (
        <aside aria-label="Contacto por WhatsApp" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 h-12 sm:h-14 px-4 sm:px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all group"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <MessageCircle className="h-5 w-5 shrink-0 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Atención WhatsApp</span>
          </a>
        </aside>
      )}

      {/* 9. BARRA FIJA DE CARRITO EN MÓVILES */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: brandColor }}
            className="w-full h-12 rounded-2xl text-white font-black text-xs flex items-center justify-between px-4 shadow-lg shadow-black/20 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-900 text-[11px] font-black">
                {totalCount}
              </span>
              <span>Ver mi pedido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{fmt(subtotal)}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* 10. CARRITO LATERAL (DRAWER) */}
      <CartDrawer
        storeSlug={store.slug}
        freeShippingThreshold={store.freeShippingThreshold || 0}
      />

      {/* 11. PIE DE PÁGINA (FOOTER) PERSONALIZABLE */}
      <footer className="mt-20 border-t border-border bg-card pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {/* Col 1: Sobre la Empresa */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="h-8 w-8 rounded-xl object-cover" />
                ) : (
                  <div
                    style={{ backgroundColor: brandColor }}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-white"
                  >
                    <Store className="h-4 w-4" />
                  </div>
                )}
                <span className="font-extrabold text-sm text-foreground">{store.name}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {theme.footer.aboutText || store.description}
              </p>
            </div>

            {/* Col 2: Contacto & Sucursales */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Contacto y Atención</h4>
              {store.address && (
                <p className="flex items-start gap-2 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    {store.address}
                    {store.city ? `, ${store.city}` : ''}
                  </span>
                </p>
              )}
              {store.phone && (
                <p className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{store.phone}</span>
                </p>
              )}
              {store.email && (
                <p className="flex items-center gap-2 text-xs">
                  <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>{store.email}</span>
                </p>
              )}
              {theme.footer.openingHours && (
                <p className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{theme.footer.openingHours}</span>
                </p>
              )}
            </div>

            {/* Col 3: Políticas y Garantía */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Garantía & Envíos</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {theme.footer.policiesText ||
                  'Todos nuestros pedidos se procesan con total seguridad y verificación directa con el negocio.'}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-semibold text-foreground">Compras 100% Protegidas</span>
              </div>
            </div>

            {/* Col 4: Redes Sociales */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">Síguenos</h4>
              <div className="flex flex-wrap items-center gap-2">
                {store.instagramUrl && (
                  <a
                    href={store.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <span>Instagram</span>
                  </a>
                )}
                {store.facebookUrl && (
                  <a
                    href={store.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <span>Facebook</span>
                  </a>
                )}
                {store.tiktokUrl && (
                  <a
                    href={store.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <TikTokIcon className="h-3.5 w-3.5" />
                    <span>TikTok</span>
                  </a>
                )}
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-[11px]">{theme.footer.copyrightText}</p>
            <p className="text-[11px]">
              Plataforma tecnológica <strong className="text-foreground font-bold">GNS</strong> — SarriaTech
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

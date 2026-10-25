'use client';

import React, { useState } from 'react';
import {
  StoreThemeConfig,
  THEME_COLOR_PRESETS,
  getDefaultStoreTheme,
} from '@/lib/store-theme';
import { saveStoreVisualTheme } from '@/app/actions/store-actions';
import {
  Palette,
  Layout,
  Type,
  Layers,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Save,
  RotateCcw,
  Check,
  Megaphone,
  Compass,
  Truck,
  ShieldCheck,
  Headphones,
  BadgePercent,
  Clock,
  CreditCard,
  Heart,
  FolderTree,
  Sliders,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  MessageCircle,
} from 'lucide-react';

interface CategoryItem {
  id: number;
  name: string;
  code?: string | null;
  productGroupId?: number;
  productGroup?: { id: number; name: string } | null;
  _count?: { products: number };
}

interface ProductGroupItem {
  id: number;
  name: string;
  code?: string | null;
  _count?: { products: number; categories: number };
}

interface ThemeCustomizerProps {
  initialConfig: StoreThemeConfig;
  storeSlug: string;
  storeName: string;
  publicBaseUrl: string;
  categories: CategoryItem[];
  productGroups: ProductGroupItem[];
}

export function ThemeCustomizer({
  initialConfig,
  storeSlug,
  storeName,
  publicBaseUrl,
  categories,
  productGroups,
}: ThemeCustomizerProps) {
  const [config, setConfig] = useState<StoreThemeConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'colors' | 'announcement' | 'hero' | 'categories' | 'features' | 'offers' | 'promo' | 'footer'>('colors');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Selector de presets de colores
  const handleSelectPreset = (key: string) => {
    const preset = THEME_COLOR_PRESETS[key];
    if (!preset) return;
    setConfig((prev) => ({
      ...prev,
      palette: {
        ...prev.palette,
        preset: key as any,
        primaryColor: preset.primary,
        secondaryColor: preset.secondary,
        accentColor: preset.accent,
      },
    }));
  };

  // Guardar configuración en la base de datos
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await saveStoreVisualTheme(config);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        setSaveError(res.error || 'Error al guardar el diseño.');
      }
    } catch (e: any) {
      setSaveError(e.message || 'Error de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar valores por defecto
  const handleResetDefaults = () => {
    if (confirm('¿Deseas restaurar el diseño a los valores predeterminados de la tienda?')) {
      setConfig(getDefaultStoreTheme(storeName));
    }
  };

  // Toggle de categoría destacada
  const toggleFeaturedCategory = (catId: number) => {
    setConfig((prev) => {
      const current = prev.categoriesSection.featuredCategoryIds || [];
      const exists = current.includes(catId);
      const updated = exists ? current.filter((id) => id !== catId) : [...current, catId];
      return {
        ...prev,
        categoriesSection: {
          ...prev.categoriesSection,
          featuredCategoryIds: updated,
        },
      };
    });
  };

  // Seleccionar todas o ninguna categoría
  const handleSelectAllCategories = (select: boolean) => {
    setConfig((prev) => ({
      ...prev,
      categoriesSection: {
        ...prev.categoriesSection,
        featuredCategoryIds: select ? categories.map((c) => c.id) : [],
      },
    }));
  };

  const storeUrl = `${publicBaseUrl}/t/${storeSlug}`;

  return (
    <div className="space-y-6">
      {/* Barra Superior de Control del Personalizador */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Personalizador Visual de Tienda
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Modifica en tiempo real la paleta de colores, la portada, las secciones de la landing, categorías destacadas y el pie de página estilo WordPress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors"
            title="Restaurar valores de diseño predeterminados"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer
          </button>

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver Tienda en Vivo
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{ backgroundColor: config.palette.primaryColor }}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-white font-bold text-xs shadow-md shadow-black/10 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveSuccess ? '¡Guardado Exitoso!' : isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
          {saveError}
        </div>
      )}

      {/* Grid: Controles de Personalización (Izquierda) + Previsualización en Vivo (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Panel de Controles (7 Columnas en escritorio) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Navegación por Pestañas del Constructor */}
          <div className="flex items-center gap-1.5 p-1.5 bg-muted/60 border border-border rounded-2xl overflow-x-auto text-xs font-medium no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('colors')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'colors'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              Colores & Tema
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('announcement')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'announcement'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Megaphone className="h-3.5 w-3.5" />
              Barra Anuncio
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hero')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'hero'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Hero / Portada
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'categories'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              Categorías
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'features'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Beneficios
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('promo')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'promo'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              Banner CTA
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'footer'
                  ? 'bg-card text-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              Pie de Página
            </button>
          </div>

          {/* TAB 1: COLORES & TEMA */}
          {activeTab === 'colors' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-6 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-foreground">Paleta de Colores de la Tienda</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Elige un estilo profesional listo para usar o personaliza el color exacto de tu marca comercial.
                </p>
              </div>

              {/* Presets predefinidos */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Estilos Predefinidos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(THEME_COLOR_PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPreset(key)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        config.palette.preset === key
                          ? 'border-foreground shadow-sm bg-muted/40 font-bold'
                          : 'border-border hover:border-border/80 bg-background'
                      }`}
                    >
                      <span
                        className="h-6 w-6 rounded-full flex-shrink-0 shadow-sm flex items-center justify-center text-white text-[10px]"
                        style={{ backgroundColor: p.primary }}
                      >
                        {config.palette.preset === key && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                      <span className="text-xs truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector personalizado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Color Primario Personalizado
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.palette.primaryColor}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          palette: {
                            ...prev.palette,
                            preset: 'custom',
                            primaryColor: e.target.value,
                          },
                        }))
                      }
                      className="h-10 w-12 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={config.palette.primaryColor}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          palette: {
                            ...prev.palette,
                            preset: 'custom',
                            primaryColor: e.target.value,
                          },
                        }))
                      }
                      className="h-10 flex-1 px-3 rounded-xl border border-border bg-background text-xs font-mono uppercase"
                      placeholder="#2563eb"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Usado en botones, destacados, badges y enlaces.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Redondeo de Tarjetas y Botones
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 h-10 p-1 bg-muted/50 rounded-xl border border-border">
                    {(['sm', 'md', 'lg', 'full'] as const).map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            palette: { ...prev.palette, borderRadius: rad },
                          }))
                        }
                        className={`text-xs font-medium rounded-lg capitalize transition-all ${
                          config.palette.borderRadius === rad
                            ? 'bg-card text-foreground font-bold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {rad === 'full' ? 'Cápsula' : rad.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BARRA SUPERIOR DE ANUNCIOS */}
          {activeTab === 'announcement' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Barra Superior de Anuncios</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Muestra un mensaje de promoción o aviso importante en la parte más alta de la tienda.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.announcement.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.announcement.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Texto del Anuncio
                    </label>
                    <input
                      type="text"
                      value={config.announcement.text}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          announcement: { ...prev.announcement, text: e.target.value },
                        }))
                      }
                      placeholder="🚚 Envíos gratis por compras superiores a $100.000..."
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Fondo de la Barra
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'primary', label: 'Color de Marca', color: config.palette.primaryColor },
                        { id: 'dark', label: 'Oscuro Elegante', color: '#0f172a' },
                        { id: 'amber', label: 'Ámbar Llamativo', color: '#d97706' },
                        { id: 'emerald', label: 'Verde Éxito', color: '#059669' },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              announcement: { ...prev.announcement, bgColor: bg.id as any },
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs transition-all ${
                            config.announcement.bgColor === bg.id
                              ? 'border-foreground font-bold shadow-xs'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: bg.color }}
                          />
                          <span className="truncate">{bg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HERO / PORTADA */}
          {activeTab === 'hero' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Portada Principal (Hero Banner)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    El bloque de bienvenida que reciben los compradores al ingresar a la tienda.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.hero.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.hero.enabled && (
                <div className="space-y-4">
                  {/* Estilo visual */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Estilo de Portada
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'gradient', label: 'Degradado Marca' },
                        { id: 'minimal', label: 'Minimalista Blanco' },
                        { id: 'modern-card', label: 'Tarjeta Elevada' },
                        { id: 'dark-banner', label: 'Banner Oscuro' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, style: st.id as any },
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                            config.hero.style === st.id
                              ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Imagen de Portada / Banner */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Imagen de Portada / Banner (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={config.hero.bannerImageUrl || ''}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, bannerImageUrl: e.target.value.trim() || undefined },
                          }))
                        }
                        placeholder="https://images.unsplash.com/... o enlace de tu banner"
                        className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono"
                      />
                      {config.hero.bannerImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, bannerImageUrl: undefined },
                            }))
                          }
                          className="h-9 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-red-500 hover:bg-muted"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      Opcional. Si colocas una imagen, actuará como fondo estilizado para la cabecera.
                    </span>
                    {config.hero.bannerImageUrl && (
                      <div className="mt-2 h-20 rounded-xl overflow-hidden border border-border bg-muted relative">
                        <img
                          src={config.hero.bannerImageUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Insignia Superior (Badge)
                    </label>
                    <input
                      type="text"
                      value={config.hero.badgeText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, badgeText: e.target.value },
                        }))
                      }
                      placeholder="✨ Catálogo Oficial Disponible"
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Título Principal
                    </label>
                    <input
                      type="text"
                      value={config.hero.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, title: e.target.value },
                        }))
                      }
                      placeholder="Todo lo que buscas para tu hogar o negocio"
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Subtítulo / Lema Descriptivo
                    </label>
                    <textarea
                      rows={2}
                      value={config.hero.subtitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, subtitle: e.target.value },
                        }))
                      }
                      placeholder="Productos garantizados con entregas directas y atención personalizada."
                      className="w-full p-3 rounded-xl border border-border bg-background text-xs resize-none"
                    />
                  </div>

                  {/* Botones CTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Botón Principal (Texto & Acción)
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={config.hero.primaryBtnText}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, primaryBtnText: e.target.value },
                            }))
                          }
                          className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                          placeholder="Ver Catálogo"
                        />
                        <select
                          value={config.hero.primaryBtnAction}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, primaryBtnAction: e.target.value as any },
                            }))
                          }
                          className="w-full h-9 px-2 rounded-xl border border-border bg-background text-xs"
                        >
                          <option value="CATALOG">Ir al Catálogo</option>
                          <option value="OFFERS">Ir a las Ofertas</option>
                          <option value="WHATSAPP">Abrir Chat WhatsApp</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Botón Secundario (Texto & Acción)
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={config.hero.secondaryBtnText}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, secondaryBtnText: e.target.value },
                            }))
                          }
                          className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                          placeholder="Promociones"
                        />
                        <select
                          value={config.hero.secondaryBtnAction}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, secondaryBtnAction: e.target.value as any },
                            }))
                          }
                          className="w-full h-9 px-2 rounded-xl border border-border bg-background text-xs"
                        >
                          <option value="OFFERS">Ir a las Ofertas</option>
                          <option value="WHATSAPP">Abrir Chat WhatsApp</option>
                          <option value="CATALOG">Ir al Catálogo</option>
                          <option value="NONE">Ocultar Botón Secundario</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.hero.showStats}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, showStats: e.target.checked },
                          }))
                        }
                        className="rounded border-border text-primary"
                      />
                      <span className="text-xs text-foreground">
                        Mostrar insignias de confianza en la portada (Envíos, Disponibilidad, Atención directa)
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GRUPOS & CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Sección de Categorías en Portada</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permite a los clientes filtrar visualmente haciendo clic en las líneas de productos principales.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.categoriesSection.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        categoriesSection: { ...prev.categoriesSection, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.categoriesSection.enabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Título de la Sección
                      </label>
                      <input
                        type="text"
                        value={config.categoriesSection.title}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            categoriesSection: { ...prev.categoriesSection, title: e.target.value },
                          }))
                        }
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Subtítulo
                      </label>
                      <input
                        type="text"
                        value={config.categoriesSection.subtitle}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            categoriesSection: { ...prev.categoriesSection, subtitle: e.target.value },
                          }))
                        }
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                      />
                    </div>
                  </div>

                  {/* Estilo de Visualización de Categorías (Shopify style pills vs cards vs chips) */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1.5">
                      Estilo de Visualización de Categorías
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'pills', label: 'Cápsulas Modernas (Shopify)', desc: 'Botones redondeados con conteo e ícono' },
                        { id: 'chips', label: 'Chips Minimalistas', desc: 'Filtros limpios horizontales' },
                        { id: 'cards', label: 'Tarjetas Clásicas', desc: 'Bloques con fondo suave' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              categoriesSection: {
                                ...prev.categoriesSection,
                                style: st.id as any,
                              },
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            (config.categoriesSection.style || 'pills') === st.id
                              ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className="font-semibold">{st.label}</div>
                          <div className="text-[10px] opacity-75 mt-0.5">{st.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de categorías destacadas */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        Seleccionar Categorías a Destacar en la Portada
                      </label>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleSelectAllCategories(true)}
                          className="text-primary hover:underline font-semibold"
                        >
                          Marcar todas
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllCategories(false)}
                          className="text-muted-foreground hover:underline"
                        >
                          Desmarcar todas
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Si no marcas ninguna, la tienda mostrará automáticamente las primeras categorías activas que tengan productos publicados.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-border/80 rounded-xl bg-muted/20">
                      {categories.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground col-span-2 text-center">
                          No tienes categorías registradas en el módulo de Inventario.
                        </p>
                      ) : (
                        categories.map((cat) => {
                          const isChecked = config.categoriesSection.featuredCategoryIds.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? 'border-primary bg-primary/5 font-semibold text-primary'
                                  : 'border-border/70 hover:bg-muted/40 text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleFeaturedCategory(cat.id)}
                                  className="rounded border-border text-primary"
                                />
                                <span className="truncate">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {cat.productGroup && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    {cat.productGroup.name}
                                  </span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                  {cat._count?.products || 0}
                                </span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BENEFICIOS (TRUST BADGES) */}
          {activeTab === 'features' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Beneficios y Confianza</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tarjetas de valor que aumentan la confianza del comprador (Envíos, Garantía, Medios de pago).
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.features.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        features: { ...prev.features, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.features.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Título de la Sección (Opcional)
                    </label>
                    <input
                      type="text"
                      value={config.features.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          features: { ...prev.features, title: e.target.value },
                        }))
                      }
                      placeholder="¿Por qué comprar con nosotros?"
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-3">
                    {config.features.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            Beneficio #{idx + 1}
                          </span>
                          <select
                            value={item.icon}
                            onChange={(e) => {
                              const updated = [...config.features.items];
                              updated[idx].icon = e.target.value as any;
                              setConfig((prev) => ({
                                ...prev,
                                features: { ...prev.features, items: updated },
                              }));
                            }}
                            className="h-8 px-2 rounded-lg border border-border bg-background text-xs"
                          >
                            <option value="truck">🚚 Envíos / Camión</option>
                            <option value="shield">🛡️ Garantía / Escudo</option>
                            <option value="badge-percent">🏷️ Descuento / Precios</option>
                            <option value="headphones">🎧 Asesoría / WhatsApp</option>
                            <option value="credit-card">💳 Pagos Seguros</option>
                            <option value="clock">⏱️ Entregas Rápidas</option>
                            <option value="heart">❤️ Calidad Premium</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...config.features.items];
                              updated[idx].title = e.target.value;
                              setConfig((prev) => ({
                                ...prev,
                                features: { ...prev.features, items: updated },
                              }));
                            }}
                            placeholder="Título del beneficio"
                            className="h-8 px-3 rounded-lg border border-border bg-background text-xs font-semibold"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...config.features.items];
                              updated[idx].description = e.target.value;
                              setConfig((prev) => ({
                                ...prev,
                                features: { ...prev.features, items: updated },
                              }));
                            }}
                            placeholder="Descripción corta"
                            className="h-8 px-3 rounded-lg border border-border bg-background text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BANNER PROMOCIONAL CTA */}
          {activeTab === 'promo' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Banner Promocional / WhatsApp Directo</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Un bloque intermedio llamativo para incentivar cotizaciones o atención al por mayor.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.promoBanner.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        promoBanner: { ...prev.promoBanner, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {config.promoBanner.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Título Llamativo
                    </label>
                    <input
                      type="text"
                      value={config.promoBanner.title}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          promoBanner: { ...prev.promoBanner, title: e.target.value },
                        }))
                      }
                      placeholder="¿Compras al por mayor o necesitas asesoría?"
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Subtítulo Explicativo
                    </label>
                    <input
                      type="text"
                      value={config.promoBanner.subtitle}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          promoBanner: { ...prev.promoBanner, subtitle: e.target.value },
                        }))
                      }
                      placeholder="Escríbenos en WhatsApp y recibe cotización inmediata."
                      className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Texto del Botón
                      </label>
                      <input
                        type="text"
                        value={config.promoBanner.btnText}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            promoBanner: { ...prev.promoBanner, btnText: e.target.value },
                          }))
                        }
                        placeholder="Chatear con un Asesor"
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Acción al Clic
                      </label>
                      <select
                        value={config.promoBanner.btnAction}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            promoBanner: { ...prev.promoBanner, btnAction: e.target.value as any },
                          }))
                        }
                        className="w-full h-9 px-2 rounded-xl border border-border bg-background text-xs"
                      >
                        <option value="WHATSAPP">Abrir Chat de WhatsApp</option>
                        <option value="OFFERS">Ir a Sección de Ofertas</option>
                        <option value="CATALOG">Ir al Catálogo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: PIE DE PÁGINA (FOOTER) */}
          {activeTab === 'footer' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-foreground">Pie de Página (Footer)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Personaliza la información corporativa, horarios de atención, garantías y derechos de autor.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Sobre la Empresa / Descripción Corta
                  </label>
                  <textarea
                    rows={2}
                    value={config.footer.aboutText}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, aboutText: e.target.value },
                      }))
                    }
                    placeholder="Breve reseña sobre la empresa o compromiso comercial..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Horarios de Atención
                    </label>
                    <input
                      type="text"
                      value={config.footer.openingHours}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, openingHours: e.target.value },
                        }))
                      }
                      placeholder="Lunes a Sábado: 8:00 AM - 6:00 PM"
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Políticas de Compra y Garantía
                    </label>
                    <input
                      type="text"
                      value={config.footer.policiesText}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          footer: { ...prev.footer, policiesText: e.target.value },
                        }))
                      }
                      placeholder="Garantía oficial y soporte continuo..."
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Texto de Copyright / Derechos
                  </label>
                  <input
                    type="text"
                    value={config.footer.copyrightText}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        footer: { ...prev.footer, copyrightText: e.target.value },
                      }))
                    }
                    placeholder="© 2026 Mi Negocio. Todos los derechos reservados."
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel de Previsualización en Tiempo Real (5 Columnas en escritorio) */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Vista Previa en Vivo
            </span>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg transition-all ${
                  previewDevice === 'desktop' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
                }`}
                title="Vista Monitor / Tablet"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg transition-all ${
                  previewDevice === 'mobile' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground'
                }`}
                title="Vista Teléfono Móvil"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Marco simulador del navegador */}
          <div
            className={`mx-auto bg-slate-900/5 dark:bg-black/40 border-2 border-border/80 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
              previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
            }`}
          >
            {/* Barra de dirección ficticia */}
            <div className="px-3 py-2 bg-muted/80 border-b border-border flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 text-center truncate text-[10px] text-muted-foreground bg-background/80 rounded px-2 py-0.5 font-mono">
                {storeSlug}.gns.sarriatech.tech
              </div>
            </div>

            {/* Contenido interactivo simulado */}
            <div className="bg-background text-foreground text-xs overflow-y-auto max-h-[580px] p-0 select-none">
              {/* Barra de anuncio simulada */}
              {config.announcement.enabled && (
                <div
                  style={{
                    backgroundColor:
                      config.announcement.bgColor === 'primary'
                        ? config.palette.primaryColor
                        : config.announcement.bgColor === 'dark'
                        ? '#0f172a'
                        : config.announcement.bgColor === 'amber'
                        ? '#d97706'
                        : '#059669',
                  }}
                  className="px-3 py-1 text-center text-white text-[10px] font-medium truncate"
                >
                  {config.announcement.text}
                </div>
              )}

              {/* Encabezado simulado */}
              <div className="p-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ backgroundColor: config.palette.primaryColor }}
                  >
                    {storeName.charAt(0)}
                  </span>
                  <span className="font-bold text-xs truncate max-w-[120px]">{storeName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-1 rounded-lg text-[10px] text-white flex items-center gap-1 font-bold"
                    style={{ backgroundColor: config.palette.primaryColor }}
                  >
                    <ShoppingBag className="h-3 w-3" />
                    Carrito (0)
                  </span>
                </div>
              </div>

              {/* Hero Simulado */}
              {config.hero.enabled && (
                <div
                  style={{
                    backgroundColor:
                      config.hero.style === 'dark-banner'
                        ? '#0f172a'
                        : undefined,
                    backgroundImage: config.hero.bannerImageUrl
                      ? `linear-gradient(rgba(15,23,42,0.65), rgba(15,23,42,0.85)), url(${config.hero.bannerImageUrl})`
                      : config.hero.style === 'gradient'
                      ? `linear-gradient(135deg, ${config.palette.primaryColor}15 0%, ${config.palette.secondaryColor}25 100%)`
                      : undefined,
                    backgroundSize: config.hero.bannerImageUrl ? 'cover' : undefined,
                    backgroundPosition: config.hero.bannerImageUrl ? 'center' : undefined,
                  }}
                  className={`p-4 border-b border-border/50 text-center space-y-2 ${
                    config.hero.style === 'dark-banner' || config.hero.bannerImageUrl ? 'text-white' : ''
                  }`}
                >
                  {config.hero.badgeText && (
                    <span
                      style={{
                        backgroundColor: `${config.palette.primaryColor}20`,
                        color: config.palette.primaryColor,
                      }}
                      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                    >
                      {config.hero.badgeText}
                    </span>
                  )}
                  <h4 className="font-extrabold text-sm sm:text-base leading-tight">
                    {config.hero.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {config.hero.subtitle}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span
                      style={{ backgroundColor: config.palette.primaryColor }}
                      className="px-3 py-1.5 rounded-lg text-white font-bold text-[10px] shadow-sm cursor-pointer"
                    >
                      {config.hero.primaryBtnText}
                    </span>
                    {config.hero.secondaryBtnAction !== 'NONE' && (
                      <span className="px-3 py-1.5 rounded-lg border border-border font-semibold text-[10px] cursor-pointer">
                        {config.hero.secondaryBtnText}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Categorías Destacadas Simuladas */}
              {config.categoriesSection.enabled && (
                <div className="p-3 border-b border-border/50 space-y-2">
                  <div className="text-center">
                    <span className="font-bold text-xs">{config.categoriesSection.title}</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-center">
                    {categories.slice(0, 5).map((c) => (
                      <span
                        key={c.id}
                        className="px-2 py-1 rounded-lg border border-border/80 bg-muted/40 text-[10px] whitespace-nowrap font-medium"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Beneficios Simulados */}
              {config.features.enabled && (
                <div className="p-3 border-b border-border/50 grid grid-cols-2 gap-2 bg-muted/10">
                  {config.features.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="p-2 rounded-lg border border-border/60 bg-background text-left space-y-0.5">
                      <span className="text-[11px] font-bold block truncate" style={{ color: config.palette.primaryColor }}>
                        {item.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground line-clamp-1 block">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tarjetas de Producto Mockup */}
              <div className="p-3 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  {config.catalogSection.title}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl border border-border bg-card space-y-1">
                    <div className="h-14 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                      📦 Foto
                    </div>
                    <span className="text-[10px] font-bold truncate block">Producto Muestra 1</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold" style={{ color: config.palette.primaryColor }}>
                        $25.000
                      </span>
                      <span
                        className="h-5 px-1.5 rounded text-[9px] text-white font-bold flex items-center"
                        style={{ backgroundColor: config.palette.primaryColor }}
                      >
                        +
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl border border-border bg-card space-y-1">
                    <div className="h-14 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground relative">
                      <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-emerald-500 text-white text-[8px] font-bold">
                        -20%
                      </span>
                      📦 Foto
                    </div>
                    <span className="text-[10px] font-bold truncate block">Producto Oferta 2</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-600">
                        $40.000
                      </span>
                      <span
                        className="h-5 px-1.5 rounded text-[9px] text-white font-bold flex items-center"
                        style={{ backgroundColor: config.palette.primaryColor }}
                      >
                        +
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner CTA Simulado */}
              {config.promoBanner.enabled && (
                <div
                  style={{
                    backgroundColor: `${config.palette.primaryColor}15`,
                    borderColor: `${config.palette.primaryColor}30`,
                  }}
                  className="p-3 border-y text-center space-y-1"
                >
                  <span className="font-bold text-[11px] block">{config.promoBanner.title}</span>
                  <span
                    style={{ backgroundColor: config.palette.primaryColor }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-white text-[10px] font-bold cursor-pointer"
                  >
                    <MessageCircle className="h-3 w-3" />
                    {config.promoBanner.btnText}
                  </span>
                </div>
              )}

              {/* Footer Simulado */}
              <div className="p-3 bg-muted/60 border-t border-border space-y-1.5 text-center text-[10px] text-muted-foreground">
                <span className="font-bold text-foreground block">{storeName}</span>
                <p className="text-[9px] line-clamp-1">{config.footer.aboutText}</p>
                <p className="text-[9px]">{config.footer.copyrightText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

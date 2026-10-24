export interface StoreFeatureItem {
  id: string;
  icon: 'truck' | 'shield' | 'sparkles' | 'headphones' | 'badge-percent' | 'clock' | 'credit-card' | 'heart' | 'package';
  title: string;
  description: string;
}

export interface StoreThemeConfig {
  palette: {
    preset: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'dark' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    borderRadius: 'sm' | 'md' | 'lg' | 'full';
  };
  announcement: {
    enabled: boolean;
    text: string;
    bgColor: 'primary' | 'dark' | 'amber' | 'emerald';
  };
  hero: {
    enabled: boolean;
    style: 'gradient' | 'minimal' | 'modern-card' | 'dark-banner';
    badgeText: string;
    title: string;
    subtitle: string;
    primaryBtnText: string;
    primaryBtnAction: 'CATALOG' | 'OFFERS' | 'WHATSAPP';
    secondaryBtnText: string;
    secondaryBtnAction: 'OFFERS' | 'WHATSAPP' | 'NONE';
    showStats: boolean;
  };
  features: {
    enabled: boolean;
    title: string;
    items: StoreFeatureItem[];
  };
  categoriesSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    featuredCategoryIds: number[];
    showProductCount: boolean;
  };
  offersSection: {
    enabled: boolean;
    title: string;
    subtitle: string;
    maxItems: number;
  };
  catalogSection: {
    title: string;
    subtitle: string;
    defaultSort: 'featured' | 'price-asc' | 'price-desc' | 'discount-desc' | 'name-asc';
    showFilters: boolean;
  };
  promoBanner: {
    enabled: boolean;
    title: string;
    subtitle: string;
    btnText: string;
    btnAction: 'WHATSAPP' | 'CATALOG' | 'OFFERS';
    style: 'gradient' | 'dark' | 'brand';
  };
  footer: {
    aboutTitle: string;
    aboutText: string;
    showContact: boolean;
    contactAddress: string;
    contactPhone: string;
    contactEmail: string;
    openingHours: string;
    showSocials: boolean;
    showPolicies: boolean;
    policiesText: string;
    copyrightText: string;
  };
}

export const THEME_COLOR_PRESETS: Record<
  string,
  { name: string; primary: string; secondary: string; accent: string; sampleBg: string }
> = {
  blue: {
    name: 'Azul Profesional',
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#38bdf8',
    sampleBg: 'bg-blue-600',
  },
  emerald: {
    name: 'Verde Esmeralda / Eco',
    primary: '#059669',
    secondary: '#047857',
    accent: '#34d399',
    sampleBg: 'bg-emerald-600',
  },
  purple: {
    name: 'Púrpura / Boutique',
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#a78bfa',
    sampleBg: 'bg-purple-600',
  },
  amber: {
    name: 'Ámbar / Dinámico',
    primary: '#d97706',
    secondary: '#b45309',
    accent: '#fbbf24',
    sampleBg: 'bg-amber-600',
  },
  rose: {
    name: 'Rosa / Glamour',
    primary: '#e11d48',
    secondary: '#be123c',
    accent: '#fb7185',
    sampleBg: 'bg-rose-600',
  },
  dark: {
    name: 'Negro / Minimalista Luxe',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#64748b',
    sampleBg: 'bg-slate-900',
  },
};

export function getDefaultStoreTheme(storeName?: string): StoreThemeConfig {
  const name = storeName || 'Nuestra Tienda';
  return {
    palette: {
      preset: 'blue',
      primaryColor: '#2563eb',
      secondaryColor: '#1d4ed8',
      accentColor: '#38bdf8',
      borderRadius: 'lg',
    },
    announcement: {
      enabled: true,
      text: '🚚 ¡Envíos a todo el país! Paga seguro o coordina tu entrega por WhatsApp.',
      bgColor: 'primary',
    },
    hero: {
      enabled: true,
      style: 'gradient',
      badgeText: 'Catálogo Oficial Disponible',
      title: `Bienvenido a ${name}`,
      subtitle:
        'Explora nuestro catálogo en línea, aprovecha nuestras ofertas y recibe tus productos con total comodidad.',
      primaryBtnText: 'Ver Productos',
      primaryBtnAction: 'CATALOG',
      secondaryBtnText: 'Promociones',
      secondaryBtnAction: 'OFFERS',
      showStats: true,
    },
    features: {
      enabled: true,
      title: '¿Por qué elegirnos?',
      items: [
        {
          id: 'f1',
          icon: 'truck',
          title: 'Envíos Rápidos',
          description: 'Entrega ágil y confiable directo a tu puerta o sucursal.',
        },
        {
          id: 'f2',
          icon: 'shield',
          title: 'Compra Protegida',
          description: 'Todos tus pedidos son revisados y respaldados formalmente.',
        },
        {
          id: 'f3',
          icon: 'badge-percent',
          title: 'Precios Exclusivos',
          description: 'Descuentos y tarifas especiales en compras por catálogo web.',
        },
        {
          id: 'f4',
          icon: 'headphones',
          title: 'Atención WhatsApp',
          description: 'Asesoría directa y personalizada antes y después de comprar.',
        },
      ],
    },
    categoriesSection: {
      enabled: true,
      title: 'Explora por Categorías',
      subtitle: 'Encuentra rápidamente lo que buscas organizado por líneas y colecciones',
      featuredCategoryIds: [],
      showProductCount: true,
    },
    offersSection: {
      enabled: true,
      title: 'Ofertas y Liquidaciones',
      subtitle: 'Aprovecha descuentos por tiempo limitado en artículos seleccionados',
      maxItems: 8,
    },
    catalogSection: {
      title: 'Todos los Productos',
      subtitle: 'Navega por nuestro inventario disponible con precios actualizados',
      defaultSort: 'featured',
      showFilters: true,
    },
    promoBanner: {
      enabled: true,
      title: '¿Necesitas pedidos al por mayor o asesoría personalizada?',
      subtitle: 'Escríbenos directamente a WhatsApp y te atenderemos con gusto en minutos.',
      btnText: 'Chatear con un Asesor',
      btnAction: 'WHATSAPP',
      style: 'gradient',
    },
    footer: {
      aboutTitle: 'Sobre Nosotros',
      aboutText: `${name} es tu aliado comercial confiable. Comprometidos con la calidad, excelencia y el mejor servicio a nuestros clientes.`,
      showContact: true,
      contactAddress: '',
      contactPhone: '',
      contactEmail: '',
      openingHours: 'Lunes a Sábado: 8:00 AM - 6:00 PM',
      showSocials: true,
      showPolicies: true,
      policiesText: 'Garantía oficial en todos nuestros productos. Cambios y devoluciones según términos vigentes.',
      copyrightText: `© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.`,
    },
  };
}

export function parseStoreThemeConfig(
  rawJson?: string | null,
  storeName?: string,
  primaryColorFallback?: string | null
): StoreThemeConfig {
  const defaults = getDefaultStoreTheme(storeName);
  if (primaryColorFallback) {
    defaults.palette.primaryColor = primaryColorFallback;
  }

  if (!rawJson || typeof rawJson !== 'string') {
    return defaults;
  }

  try {
    const parsed = JSON.parse(rawJson);
    return {
      ...defaults,
      ...parsed,
      palette: {
        ...defaults.palette,
        ...(parsed.palette || {}),
        primaryColor: parsed.palette?.primaryColor || primaryColorFallback || defaults.palette.primaryColor,
      },
      announcement: {
        ...defaults.announcement,
        ...(parsed.announcement || {}),
      },
      hero: {
        ...defaults.hero,
        ...(parsed.hero || {}),
      },
      features: {
        ...defaults.features,
        ...(parsed.features || {}),
        items: Array.isArray(parsed.features?.items) && parsed.features.items.length > 0
          ? parsed.features.items
          : defaults.features.items,
      },
      categoriesSection: {
        ...defaults.categoriesSection,
        ...(parsed.categoriesSection || {}),
        featuredCategoryIds: Array.isArray(parsed.categoriesSection?.featuredCategoryIds)
          ? parsed.categoriesSection.featuredCategoryIds
          : [],
      },
      offersSection: {
        ...defaults.offersSection,
        ...(parsed.offersSection || {}),
      },
      catalogSection: {
        ...defaults.catalogSection,
        ...(parsed.catalogSection || {}),
      },
      promoBanner: {
        ...defaults.promoBanner,
        ...(parsed.promoBanner || {}),
      },
      footer: {
        ...defaults.footer,
        ...(parsed.footer || {}),
      },
    };
  } catch (e) {
    console.warn('Error parsing store themeConfig JSON', e);
    return defaults;
  }
}

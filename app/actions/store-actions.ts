"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { resolveActionCompanyId, resolveActionUserId } from '@/lib/session';
import { assertStoreModuleActive, getStoreAuthContext, resolvePublicStore } from '@/lib/store-auth';
import { logActivity } from '@/lib/audit';
import crypto from 'crypto';
import { parseStoreThemeConfig, StoreThemeConfig } from '@/lib/store-theme';

// ─── ESQUEMA DE VALIDACIÓN CHECKOUT PÚBLICO ──────────────────────────────────

const checkoutSchema = z.object({
  storeSlug: z.string().min(1, 'Identificador de tienda no válido'),
  customerName: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(120, 'El nombre completo no puede superar los 120 caracteres.'),
  customerPhone: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos.')
    .max(20, 'El número de teléfono es demasiado largo.')
    .refine((val) => {
      const clean = val.replace(/[\s\-\(\)]/g, '');
      return /^\+?[0-9]{7,15}$/.test(clean);
    }, 'Ingresa un número de teléfono o WhatsApp válido (7 a 15 dígitos).'),
  customerEmail: z
    .string()
    .trim()
    .email('El correo electrónico no tiene un formato válido.')
    .optional()
    .or(z.literal('')),
  deliveryMode: z.enum(['HOME_DELIVERY', 'PICKUP', 'COORDINATE'], {
    errorMap: () => ({ message: 'Selecciona una modalidad de entrega válida.' }),
  }),
  deliveryAddress: z.string().trim().max(250).optional(),
  deliveryCity: z.string().trim().max(100).optional(),
  deliveryNeighborhood: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500, 'Las observaciones no pueden superar los 500 caracteres.').optional(),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de tratamiento de datos personales.' }),
  }),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().min(1),
        quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
      })
    )
    .min(1, 'El carrito está vacío. Agrega al menos un producto.'),
});

// ─── ACCIONES PÚBLICAS (COMPRADORES / TIENDA) ────────────────────────────────

/**
 * Obtiene la información pública del negocio y los productos publicados.
 */
export async function getPublicStoreData(slugOrDomain: string) {
  try {
    const resolved = await resolvePublicStore(slugOrDomain);
    if (!resolved || !resolved.store) {
      return { success: false, error: 'Tienda no encontrada', notFound: true };
    }

    const { store, isAvailable, isPaused, isSuspended } = resolved;

    if (!isAvailable) {
      return {
        success: false,
        store: {
          name: store.name,
          logoUrl: store.logoUrl,
          slug: store.slug,
          status: store.status,
        },
        isPaused,
        isSuspended,
        error: isPaused
          ? 'Esta tienda se encuentra temporalmente en pausa por mantenimiento.'
          : 'Esta tienda no se encuentra disponible actualmente.',
      };
    }

    // Obtener productos publicados de la empresa con stock
    const products = await prisma.product.findMany({
      where: {
        companyId: store.companyId,
        isPublishedWeb: true,
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        imageUrl: true,
        galleryImages: true,
        videoUrl: true,
        salePrice: true,
        webPrice: true,
        quantityAvailable: true,
        reservedQuantity: true,
        category: {
          select: { id: true, name: true },
        },
        productGroup: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Formatear productos para exposición pública (sin costos ni márgenes)
    const formattedProducts = products.map((p) => {
      const effectiveStock = Math.max(0, p.quantityAvailable - p.reservedQuantity);
      const regularPrice = p.salePrice;
      const webPrice = p.webPrice && p.webPrice > 0 ? p.webPrice : null;
      const finalPrice = webPrice ?? regularPrice;
      const hasDiscount = webPrice !== null && webPrice < regularPrice;
      const discountPercentage = hasDiscount
        ? Math.round(((regularPrice - webPrice) / regularPrice) * 100)
        : 0;

      let parsedGallery: string[] = [];
      if (p.galleryImages) {
        try {
          const parsed = JSON.parse(p.galleryImages);
          if (Array.isArray(parsed)) {
            parsedGallery = parsed.filter((img) => typeof img === 'string' && img.trim().length > 0);
          }
        } catch {}
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        galleryImages: parsedGallery,
        videoUrl: p.videoUrl || null,
        price: finalPrice,
        regularPrice,
        webPrice,
        hasDiscount,
        discountPercentage,
        inStock: effectiveStock > 0,
        availableQuantity: effectiveStock,
        category: p.category.name,
        categoryId: p.category.id,
        group: p.productGroup?.name || null,
      };
    });

    // Extraer categorías únicas con productos publicados
    const categoriesMap = new Map<number, { id: number; name: string; count: number }>();
    formattedProducts.forEach((p) => {
      const existing = categoriesMap.get(p.categoryId);
      if (existing) {
        existing.count += 1;
      } else {
        categoriesMap.set(p.categoryId, { id: p.categoryId, name: p.category, count: 1 });
      }
    });

    return {
      success: true,
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        description: store.description,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        phone: store.phone,
        email: store.email,
        address: store.address,
        city: store.city,
        currency: store.currency,
        whatsappMessage: store.whatsappMessage,
        announcementText: store.announcementText,
        themeColor: store.themeColor || '#3b82f6',
        instagramUrl: store.instagramUrl,
        facebookUrl: store.facebookUrl,
        tiktokUrl: (store as any).tiktokUrl || null,
        themeConfig: parseStoreThemeConfig((store as any).themeConfig, store.name, store.themeColor),
        allowDelivery: store.allowDelivery,
        allowPickup: store.allowPickup,
        allowCoordinate: store.allowCoordinate,
        deliveryCost: store.deliveryCost,
        deliveryNotes: store.deliveryNotes,
        pickupAddress: store.pickupAddress,
        minOrderAmount: store.minOrderAmount,
        freeShippingThreshold: (store as any).freeShippingThreshold ?? 0,
      },
      products: formattedProducts,
      categories: Array.from(categoriesMap.values()),
    };
  } catch (error: any) {
    console.error('[GET_PUBLIC_STORE_DATA]', error);
    return { success: false, error: 'Error al cargar la tienda virtual.' };
  }
}

/**
 * Recalcula de forma autoritativa en el servidor los importes y valida disponibilidad.
 */
export async function calculateCartTotals(
  storeSlug: string,
  items: { productId: number; quantity: number }[],
  deliveryMode: string
) {
  try {
    const resolved = await resolvePublicStore(storeSlug);
    if (!resolved || !resolved.store || !resolved.isAvailable) {
      return { success: false, error: 'Tienda no disponible.' };
    }

    const { store } = resolved;
    if (!items || items.length === 0) {
      return {
        success: true,
        subtotal: 0,
        deliveryCost: 0,
        discount: 0,
        total: 0,
        itemsBreakdown: [],
      };
    }

    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        companyId: store.companyId,
        isPublishedWeb: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        salePrice: true,
        webPrice: true,
        quantityAvailable: true,
        reservedQuantity: true,
        imageUrl: true,
      },
    });

    const productsMap = new Map(dbProducts.map((p) => [p.id, p]));
    let subtotal = 0;
    const itemsBreakdown: any[] = [];

    for (const item of items) {
      const prod = productsMap.get(item.productId);
      if (!prod) {
        return {
          success: false,
          error: `Uno de los productos seleccionados ya no se encuentra disponible en la tienda.`,
        };
      }

      const effectiveStock = prod.quantityAvailable - prod.reservedQuantity;
      if (item.quantity > effectiveStock) {
        return {
          success: false,
          error: `Disponibilidad insuficiente para "${prod.name}". Disponibles: ${Math.max(0, effectiveStock)}, Solicitados: ${item.quantity}.`,
        };
      }

      const unitPrice = prod.webPrice && prod.webPrice > 0 ? prod.webPrice : prod.salePrice;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      itemsBreakdown.push({
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        productImage: prod.imageUrl,
        unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    let deliveryCost = 0;
    const freeShippingThreshold = (store as any).freeShippingThreshold || 0;
    const isFreeShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;

    if (deliveryMode === 'HOME_DELIVERY') {
      deliveryCost = isFreeShipping ? 0 : (store.deliveryCost || 0);
    }

    const total = subtotal + deliveryCost;

    return {
      success: true,
      subtotal,
      deliveryCost,
      discount: 0,
      total,
      itemsBreakdown,
    };
  } catch (error: any) {
    console.error('[CALCULATE_CART_TOTALS]', error);
    return { success: false, error: 'Error al calcular totales del pedido.' };
  }
}

/**
 * Crea un nuevo pedido web en estado PENDING_REVIEW desde el checkout.
 */
export async function submitStoreOrder(input: any) {
  try {
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Datos de formulario incompletos.',
      };
    }

    const data = parsed.data;

    // Validación condicional de dirección para envío a domicilio
    if (data.deliveryMode === 'HOME_DELIVERY') {
      if (!data.deliveryAddress || data.deliveryAddress.trim().length < 5) {
        return { success: false, error: 'La dirección de entrega es obligatoria para envíos a domicilio (mínimo 5 caracteres).' };
      }
      if (!data.deliveryCity || data.deliveryCity.trim().length < 2) {
        return { success: false, error: 'La ciudad o municipio de entrega es obligatoria.' };
      }
    }

    // Resolver tienda
    const resolved = await resolvePublicStore(data.storeSlug);
    if (!resolved || !resolved.store || !resolved.isAvailable) {
      return { success: false, error: 'La tienda no se encuentra disponible para recibir pedidos.' };
    }

    const { store } = resolved;
    const companyId = store.companyId;

    // Recalcular autoritativamente precios y disponibilidad en el servidor
    const calc = await calculateCartTotals(store.slug, data.items, data.deliveryMode);
    if (!calc.success || !calc.itemsBreakdown) {
      return { success: false, error: calc.error || 'No se pudo verificar el carrito.' };
    }

    // Validar monto mínimo si está configurado
    if (store.minOrderAmount > 0 && calc.subtotal < store.minOrderAmount) {
      return {
        success: false,
        error: `El pedido mínimo para esta tienda es de $${store.minOrderAmount.toLocaleString('es-CO')}. Subtotal actual: $${calc.subtotal.toLocaleString('es-CO')}.`,
      };
    }

    // Normalizar teléfono
    const normalizedPhone = data.customerPhone.replace(/[\s\-\(\)]/g, '');

    // Generar consecutivo y token seguro
    const orderToken = crypto.randomUUID();

    const createdOrder = await prisma.$transaction(async (tx) => {
      // Obtener y actualizar consecutivo en CompanySetting
      const setting = await tx.companySetting.findUnique({
        where: { companyId },
      });

      const prefix = setting?.storeOrderPrefix || 'PED';
      const consecutive = setting?.storeOrderConsecutive || 1;
      const orderNumber = `${prefix}-${consecutive.toString().padStart(5, '0')}`;

      await tx.companySetting.upsert({
        where: { companyId },
        update: { storeOrderConsecutive: consecutive + 1 },
        create: { companyId, storeOrderConsecutive: consecutive + 1 },
      });

      // Crear pedido en estado PENDING_REVIEW
      const order = await tx.storeOrder.create({
        data: {
          orderNumber,
          orderToken,
          storeId: store.id,
          companyId,
          customerName: data.customerName,
          customerPhone: normalizedPhone,
          customerEmail: data.customerEmail || null,
          deliveryMode: data.deliveryMode,
          deliveryAddress: data.deliveryMode === 'HOME_DELIVERY' ? data.deliveryAddress : null,
          deliveryCity: data.deliveryMode === 'HOME_DELIVERY' ? data.deliveryCity : null,
          deliveryNeighborhood: data.deliveryMode === 'HOME_DELIVERY' ? data.deliveryNeighborhood : null,
          notes: data.notes || null,
          subtotal: calc.subtotal,
          deliveryCost: calc.deliveryCost,
          discount: 0,
          total: calc.total,
          status: 'PENDING_REVIEW',
          privacyAccepted: true,
          privacyVersion: '1.0',
          privacyAcceptedAt: new Date(),
          items: {
            create: calc.itemsBreakdown.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              productImage: item.productImage,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          history: {
            create: {
              previousStatus: null,
              newStatus: 'PENDING_REVIEW',
              comment: 'Pedido enviado por el cliente desde la tienda virtual.',
            },
          },
        },
      });

      return order;
    });

    return {
      success: true,
      orderToken: createdOrder.orderToken,
      orderNumber: createdOrder.orderNumber,
      total: createdOrder.total,
    };
  } catch (error: any) {
    console.error('[SUBMIT_STORE_ORDER_ERROR]', error);
    return { success: false, error: 'Ocurrió un error al procesar el pedido. Por favor intenta de nuevo.' };
  }
}

/**
 * Consulta pública de confirmación de pedido usando el orderToken opaco.
 */
export async function getPublicOrderConfirmation(orderToken: string) {
  try {
    if (!orderToken) return { success: false, error: 'Token de pedido no válido.' };

    const order = await prisma.storeOrder.findUnique({
      where: { orderToken },
      include: {
        store: {
          select: {
            name: true,
            slug: true,
            phone: true,
            email: true,
            pickupAddress: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Pedido no encontrado.' };
    }

    return {
      success: true,
      order: {
        orderNumber: order.orderNumber,
        orderToken: order.orderToken,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        customerName: order.customerName,
        customerPhoneRaw: order.customerPhone,
        customerPhoneMasked: order.customerPhone.slice(0, 3) + '****' + order.customerPhone.slice(-3),
        deliveryMode: order.deliveryMode,
        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        notes: order.notes,
        subtotal: order.subtotal,
        deliveryCost: order.deliveryCost,
        discount: order.discount,
        total: order.total,
        items: order.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          productCode: it.productCode,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
        })),
        store: order.store,
      },
    };
  } catch (error: any) {
    console.error('[GET_PUBLIC_ORDER_CONFIRMATION]', error);
    return { success: false, error: 'Error al consultar la confirmación del pedido.' };
  }
}

// ─── ACCIONES ADMINISTRATIVAS (PANEL GNS) ────────────────────────────────────

/**
 * Obtiene los datos de configuración y métricas de la tienda para el dashboard.
 */
export async function getStoreAdminData() {
  try {
    const { companyId } = await getStoreAuthContext();

    const [store, stats, publishedCount, totalProducts] = await Promise.all([
      prisma.onlineStore.findUnique({
        where: { companyId },
        include: {
          domains: true,
        },
      }),
      prisma.storeOrder.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.product.count({
        where: { companyId, isPublishedWeb: true },
      }),
      prisma.product.count({
        where: { companyId },
      }),
    ]);

    const statsMap: Record<string, { count: number; total: number }> = {};
    let totalRevenue = 0;
    let pendingReviewCount = 0;
    let acceptedCount = 0;
    let completedCount = 0;

    stats.forEach((s) => {
      const count = s._count.id;
      const sum = s._sum.total || 0;
      statsMap[s.status] = { count, total: sum };

      if (s.status === 'COMPLETED_SALE') {
        totalRevenue += sum;
        completedCount += count;
      } else if (s.status === 'PENDING_REVIEW') {
        pendingReviewCount += count;
      } else if (s.status === 'ACCEPTED') {
        acceptedCount += count;
      }
    });

    return {
      success: true,
      store,
      metrics: {
        totalOrders: stats.reduce((acc, s) => acc + s._count.id, 0),
        pendingReviewCount,
        acceptedCount,
        completedCount,
        totalRevenue,
        publishedCount,
        totalProducts,
      },
    };
  } catch (error: any) {
    console.error('[GET_STORE_ADMIN_DATA]', error);
    return { success: false, error: error.message || 'Error al obtener datos de la tienda.' };
  }
}

/**
 * Actualiza la configuración de la tienda virtual de la empresa.
 */
export async function updateStoreConfig(data: {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  allowDelivery?: boolean;
  allowPickup?: boolean;
  allowCoordinate?: boolean;
  deliveryCost?: number;
  deliveryNotes?: string;
  pickupAddress?: string;
  minOrderAmount?: number;
  freeShippingThreshold?: number;
  status?: string;
  logoUrl?: string;
  bannerUrl?: string;
  whatsappMessage?: string;
  announcementText?: string;
  themeColor?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  themeConfig?: string;
}) {
  try {
    const { companyId, userId } = await getStoreAuthContext();

    const updated = await prisma.onlineStore.upsert({
      where: { companyId },
      update: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || 'Cali',
        allowDelivery: data.allowDelivery ?? true,
        allowPickup: data.allowPickup ?? true,
        allowCoordinate: data.allowCoordinate ?? true,
        deliveryCost: Number(data.deliveryCost || 0),
        deliveryNotes: data.deliveryNotes?.trim() || null,
        pickupAddress: data.pickupAddress?.trim() || null,
        minOrderAmount: Number(data.minOrderAmount || 0),
        freeShippingThreshold: data.freeShippingThreshold !== undefined ? Number(data.freeShippingThreshold || 0) : undefined,
        status: data.status || 'ACTIVE',
        logoUrl: data.logoUrl || undefined,
        bannerUrl: data.bannerUrl || undefined,
        whatsappMessage: data.whatsappMessage !== undefined ? data.whatsappMessage.trim() : undefined,
        announcementText: data.announcementText !== undefined ? data.announcementText.trim() : undefined,
        themeColor: data.themeColor || '#3b82f6',
        instagramUrl: data.instagramUrl?.trim() || null,
        facebookUrl: data.facebookUrl?.trim() || null,
        tiktokUrl: data.tiktokUrl?.trim() || null,
        themeConfig: data.themeConfig !== undefined ? data.themeConfig : undefined,
      },
      create: {
        slug: `store_${companyId}_${Math.random().toString(16).substring(2, 10)}`,
        companyId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || 'Cali',
        allowDelivery: data.allowDelivery ?? true,
        allowPickup: data.allowPickup ?? true,
        allowCoordinate: data.allowCoordinate ?? true,
        deliveryCost: Number(data.deliveryCost || 0),
        deliveryNotes: data.deliveryNotes?.trim() || null,
        pickupAddress: data.pickupAddress?.trim() || null,
        minOrderAmount: Number(data.minOrderAmount || 0),
        freeShippingThreshold: Number(data.freeShippingThreshold || 0),
        status: data.status || 'ACTIVE',
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        whatsappMessage: data.whatsappMessage?.trim() || null,
        announcementText: data.announcementText?.trim() || null,
        themeColor: data.themeColor || '#3b82f6',
        instagramUrl: data.instagramUrl?.trim() || null,
        facebookUrl: data.facebookUrl?.trim() || null,
        tiktokUrl: data.tiktokUrl?.trim() || null,
        themeConfig: data.themeConfig || null,
      },
    });

    await logActivity({
      action: 'UPDATE',
      module: 'TIENDA_VIRTUAL',
      entity: 'OnlineStore',
      description: `Actualizada configuración de la tienda virtual ${updated.name}`,
      userId,
      newValues: { storeId: updated.id, name: updated.name, status: updated.status },
    });

    revalidatePath('/dashboard/tienda');
    revalidatePath(`/t/${updated.slug}`);
    return { success: true, store: updated };
  } catch (error: any) {
    console.error('[UPDATE_STORE_CONFIG]', error);
    return { success: false, error: error.message || 'Error al actualizar configuración.' };
  }
}

/**
 * Guarda la configuración visual completa (themeConfig) tipo WordPress de la tienda.
 */
export async function saveStoreVisualTheme(config: StoreThemeConfig) {
  try {
    const { companyId, userId } = await getStoreAuthContext();
    if (!config) {
      return { success: false, error: 'Configuración visual inválida.' };
    }

    const jsonString = JSON.stringify(config);
    const primaryColor = config.palette?.primaryColor || '#2563eb';
    const announcement = config.announcement?.text || null;

    const updated = await prisma.onlineStore.update({
      where: { companyId },
      data: {
        themeConfig: jsonString,
        themeColor: primaryColor,
        announcementText: announcement,
      },
    });

    await logActivity({
      action: 'UPDATE',
      module: 'TIENDA_VIRTUAL',
      entity: 'OnlineStore',
      description: `Actualizado diseño visual y secciones de la tienda virtual ${updated.name}`,
      userId,
      newValues: {
        preset: config.palette?.preset,
        primaryColor,
        heroEnabled: config.hero?.enabled,
        featuresEnabled: config.features?.enabled,
        categoriesCount: config.categoriesSection?.featuredCategoryIds?.length || 0,
      },
    });

    revalidatePath('/dashboard/tienda');
    revalidatePath(`/t/${updated.slug}`);
    return { success: true, themeConfig: config };
  } catch (error: any) {
    console.error('[SAVE_STORE_VISUAL_THEME]', error);
    return { success: false, error: error.message || 'Error al guardar el diseño visual.' };
  }
}

/**
 * Publica u oculta un producto en la tienda virtual, con precio web y descripción opcionales.
 */
export async function toggleProductWebPublish(
  productId: number,
  data: {
    isPublishedWeb: boolean;
    webPrice?: number | null;
    description?: string | null;
    imageUrl?: string | null;
    galleryImages?: string[] | string | null;
    videoUrl?: string | null;
  }
) {
  try {
    const { companyId, userId } = await getStoreAuthContext();

    const product = await prisma.product.findFirst({
      where: { id: productId, companyId },
    });

    if (!product) {
      return { success: false, error: 'Producto no encontrado o no pertenece a tu empresa.' };
    }

    const galleryString =
      data.galleryImages !== undefined
        ? Array.isArray(data.galleryImages)
          ? JSON.stringify(data.galleryImages.filter(Boolean))
          : data.galleryImages
        : undefined;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        isPublishedWeb: data.isPublishedWeb,
        webPrice: data.webPrice !== undefined ? (data.webPrice ? Number(data.webPrice) : null) : undefined,
        description: data.description !== undefined ? data.description : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        galleryImages: galleryString !== undefined ? galleryString : undefined,
        videoUrl: data.videoUrl !== undefined ? (data.videoUrl ? data.videoUrl.trim() : null) : undefined,
      },
    });

    await logActivity({
      action: data.isPublishedWeb ? 'PUBLISH' : 'UNPUBLISH',
      module: 'TIENDA_VIRTUAL',
      entity: 'Product',
      entityId: productId,
      description: `${data.isPublishedWeb ? 'Publicado' : 'Ocultado'} producto "${updated.name}" en catálogo web`,
      userId,
      newValues: { isPublishedWeb: updated.isPublishedWeb, webPrice: updated.webPrice },
    });

    revalidatePath('/dashboard/tienda');
    revalidatePath('/dashboard/products');
    return { success: true, product: updated };
  } catch (error: any) {
    console.error('[TOGGLE_PRODUCT_WEB_PUBLISH]', error);
    return { success: false, error: error.message || 'Error al actualizar producto.' };
  }
}

/**
 * Publica u oculta un conjunto de productos en lote.
 */
export async function bulkToggleProductPublish(productIds: number[], isPublishedWeb: boolean) {
  try {
    const { companyId, userId } = await getStoreAuthContext();
    if (!productIds || productIds.length === 0) {
      return { success: false, error: 'No se seleccionaron productos.' };
    }

    const updated = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        companyId,
      },
      data: {
        isPublishedWeb,
      },
    });

    await logActivity({
      action: isPublishedWeb ? 'BULK_PUBLISH' : 'BULK_UNPUBLISH',
      module: 'TIENDA_VIRTUAL',
      entity: 'Product',
      description: `${isPublishedWeb ? 'Publicados' : 'Ocultados'} ${updated.count} productos en lote en catálogo web`,
      userId,
      newValues: { count: updated.count, isPublishedWeb },
    });

    revalidatePath('/dashboard/tienda');
    revalidatePath('/dashboard/products');
    return { success: true, count: updated.count };
  } catch (error: any) {
    console.error('[BULK_TOGGLE_PRODUCT_PUBLISH]', error);
    return { success: false, error: error.message || 'Error al procesar productos en lote.' };
  }
}

/**
 * Obtiene la lista de pedidos web para la bandeja administrativa.
 */
export async function getStoreOrders(filters?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  try {
    const { companyId } = await getStoreAuthContext();

    const where: any = { companyId };

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ];
    }

    const orders = await prisma.storeOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
      include: {
        items: true,
        sale: {
          select: { id: true, saleNumber: true, total: true, status: true },
        },
      },
    });

    return { success: true, orders };
  } catch (error: any) {
    console.error('[GET_STORE_ORDERS]', error);
    return { success: false, error: error.message || 'Error al obtener pedidos.' };
  }
}

/**
 * Cambia el estado de un pedido (ACEPTAR, RECHAZAR, CANCELAR).
 */
export async function updateStoreOrderStatus(
  orderId: number,
  newStatus: 'ACCEPTED' | 'REJECTED' | 'CANCELLED',
  reason?: string
) {
  try {
    const { companyId, userId } = await getStoreAuthContext();

    const order = await prisma.storeOrder.findFirst({
      where: { id: orderId, companyId },
    });

    if (!order) {
      return { success: false, error: 'Pedido no encontrado.' };
    }

    if (order.status === 'COMPLETED_SALE') {
      return { success: false, error: 'No se puede cambiar el estado de un pedido que ya fue convertido en venta.' };
    }

    const updated = await prisma.storeOrder.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? reason || 'Rechazado por el negocio' : null,
        reviewedById: userId,
        reviewedAt: new Date(),
        history: {
          create: {
            previousStatus: order.status,
            newStatus,
            comment: reason || `Estado cambiado a ${newStatus} por el administrador.`,
            changedByUserId: userId,
          },
        },
      },
    });

    await logActivity({
      action: newStatus,
      module: 'TIENDA_VIRTUAL',
      entity: 'StoreOrder',
      entityId: orderId,
      description: `Pedido #${order.orderNumber} actualizado a estado ${newStatus}`,
      userId,
      newValues: { status: newStatus, reason },
    });

    revalidatePath('/dashboard/tienda');
    return { success: true, order: updated };
  } catch (error: any) {
    console.error('[UPDATE_STORE_ORDER_STATUS]', error);
    return { success: false, error: error.message || 'Error al actualizar estado del pedido.' };
  }
}

/**
 * Convierte un pedido web en una venta real de GNS de manera transaccional y sin duplicados.
 */
export async function convertStoreOrderToSale(orderId: number) {
  try {
    const { companyId, userId } = await getStoreAuthContext();

    const order = await prisma.storeOrder.findFirst({
      where: { id: orderId, companyId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Pedido no encontrado.' };
    }

    // Guardia de Idempotencia: Verificar que no haya sido convertido previamente
    if (order.saleId || order.status === 'COMPLETED_SALE') {
      return { success: false, error: 'Este pedido ya fue convertido en venta previamente.' };
    }

    if (order.status === 'REJECTED' || order.status === 'CANCELLED') {
      return { success: false, error: `No se puede convertir a venta un pedido con estado "${order.status}".` };
    }

    // Ejecutar conversión transaccional
    const result = await prisma.$transaction(async (tx) => {
      // 1. Vincular o crear cliente en CRM de manera segura
      let customer = await tx.customer.findFirst({
        where: {
          companyId,
          phone: order.customerPhone,
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            companyId,
            name: order.customerName,
            phone: order.customerPhone,
            email: order.customerEmail || null,
            address: order.deliveryAddress || null,
            city: order.deliveryCity || 'Cali',
            country: 'Colombia',
            status: 'ACTIVE',
          },
        });
      }

      // 2. Verificar y descontar existencias físicas en bodega
      for (const item of order.items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!prod) {
          throw new Error(`El producto "${item.productName}" no existe.`);
        }

        if (prod.quantityAvailable < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${prod.name}". Disponible en bodega: ${prod.quantityAvailable}, requerido: ${item.quantity}.`
          );
        }

        // Descontar inventario físico
        await tx.product.update({
          where: { id: prod.id },
          data: {
            quantityAvailable: prod.quantityAvailable - item.quantity,
            soldQuantity: prod.soldQuantity + item.quantity,
          },
        });

        // Sincronizar bodega física (WMS si aplica)
        const defWarehouse = await tx.warehouse.findFirst({
          where: { companyId, isDefault: true, status: 'ACTIVE' },
        }) || await tx.warehouse.findFirst({
          where: { companyId, status: 'ACTIVE' },
        });

        if (defWarehouse) {
          const wStock = await tx.warehouseStock.findFirst({
            where: { productId: prod.id, warehouseId: defWarehouse.id },
          });
          if (wStock) {
            await tx.warehouseStock.update({
              where: { id: wStock.id },
              data: { physical: Math.max(0, wStock.physical - item.quantity) },
            });
          }
        }
      }

      // 3. Generar número de venta oficial
      const setting = await tx.companySetting.findUnique({
        where: { companyId },
      });

      const prefix = setting?.invoicePrefix || 'VEN';
      const consecutive = setting?.invoiceConsecutive || 1;
      const saleNumber = `${prefix}-${consecutive.toString().padStart(5, '0')}`;

      await tx.companySetting.upsert({
        where: { companyId },
        update: { invoiceConsecutive: consecutive + 1 },
        create: { companyId, invoiceConsecutive: consecutive + 1 },
      });

      // 4. Crear registro oficial de Venta
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          userId,
          client: order.customerName,
          customerId: customer.id,
          total: order.total,
          discount: order.discount,
          paymentMethod: 'TRANSFERENCIA',
          status: 'COMPLETED',
          remarks: `Venta generada a partir del pedido web ${order.orderNumber}. Modalidad: ${order.deliveryMode}`,
          companyId,
          details: {
            create: order.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              subtotal: it.subtotal,
              discount: 0,
              total: it.subtotal,
              companyId,
            })),
          },
        },
      });

      // 5. Actualizar el pedido web a COMPLETED_SALE
      const updatedOrder = await tx.storeOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED_SALE',
          saleId: sale.id,
          customerId: customer.id,
          reviewedById: userId,
          reviewedAt: new Date(),
          history: {
            create: {
              previousStatus: order.status,
              newStatus: 'COMPLETED_SALE',
              comment: `Pedido convertido exitosamente en la venta #${sale.saleNumber}.`,
              changedByUserId: userId,
            },
          },
        },
      });

      return { sale, order: updatedOrder };
    });

    await logActivity({
      action: 'CONVERT_TO_SALE',
      module: 'TIENDA_VIRTUAL',
      entity: 'StoreOrder',
      entityId: orderId,
      description: `Pedido #${order.orderNumber} convertido exitosamente en la venta #${result.sale.saleNumber}`,
      userId,
      newValues: {
        orderId,
        orderNumber: order.orderNumber,
        saleId: result.sale.id,
        saleNumber: result.sale.saleNumber,
      },
    });

    revalidatePath('/dashboard/tienda');
    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/products');
    return { success: true, sale: result.sale, order: result.order };
  } catch (error: any) {
    console.error('[CONVERT_STORE_ORDER_TO_SALE_ERROR]', error);
    return { success: false, error: error.message || 'Error al convertir el pedido en venta.' };
  }
}

/**
 * Asocia un dominio personalizado a la tienda y genera su token DNS de verificación.
 */
export async function requestCustomDomain(domain: string) {
  try {
    const { companyId } = await getStoreAuthContext();

    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}$/.test(cleanDomain)) {
      return { success: false, error: 'Por favor ingresa un nombre de dominio válido (ej: mitienda.com o tienda.minegocio.co).' };
    }

    const store = await prisma.onlineStore.findUnique({
      where: { companyId },
    });

    if (!store) {
      return { success: false, error: 'Primero debes inicializar la tienda virtual.' };
    }

    // Verificar si el dominio ya está registrado por otra empresa
    const existing = await prisma.storeDomain.findUnique({
      where: { domain: cleanDomain },
    });

    if (existing && existing.storeId !== store.id) {
      return { success: false, error: 'Este dominio ya está asociado a otra tienda.' };
    }

    const token = `gns-verify=${crypto.randomBytes(16).toString('hex')}`;

    const storeDomain = await prisma.storeDomain.upsert({
      where: { domain: cleanDomain },
      update: {
        verificationToken: token,
        status: 'PENDING_VERIFICATION',
      },
      create: {
        domain: cleanDomain,
        storeId: store.id,
        companyId,
        verificationType: 'TXT',
        verificationToken: token,
        status: 'PENDING_VERIFICATION',
      },
    });

    await prisma.onlineStore.update({
      where: { id: store.id },
      data: {
        customDomain: cleanDomain,
        domainStatus: 'PENDING_VERIFICATION',
        domainVerificationToken: token,
      },
    });

    revalidatePath('/dashboard/tienda');
    return { success: true, domain: storeDomain };
  } catch (error: any) {
    console.error('[REQUEST_CUSTOM_DOMAIN]', error);
    return { success: false, error: error.message || 'Error al registrar dominio.' };
  }
}

/**
 * Verifica en tiempo real mediante consultas DNS si los registros TXT y CNAME/A
 * del dominio personalizado ya se encuentran propagados y configurados.
 */
export async function verifyCustomDomain(domain: string) {
  try {
    const { companyId } = await getStoreAuthContext();
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    const store = await prisma.onlineStore.findUnique({
      where: { companyId },
    });

    if (!store) {
      return { success: false, error: 'Tienda virtual no encontrada.' };
    }

    const domainRecord = await prisma.storeDomain.findUnique({
      where: { domain: cleanDomain },
    });

    if (!domainRecord || domainRecord.storeId !== store.id) {
      return { success: false, error: 'El dominio no se encuentra registrado para esta tienda.' };
    }

    const dns = await import('dns/promises');

    let txtFound = false;
    let foundTxtRecords: string[] = [];
    try {
      const txtList = await dns.resolveTxt(cleanDomain);
      foundTxtRecords = txtList.map((chunks) => chunks.join(''));
      txtFound = foundTxtRecords.some((txt) =>
        txt.includes(domainRecord.verificationToken)
      );
    } catch (e: any) {
      // Ignorar error si aún no propaga TXT
    }

    let cnameTarget = '';
    try {
      const cnames = await dns.resolveCname(cleanDomain);
      if (cnames && cnames.length > 0) {
        cnameTarget = cnames[0];
      }
    } catch (e: any) {
      // Si no tiene CNAME puede ser dominio raíz con registro A
    }

    let ipAddresses: string[] = [];
    try {
      ipAddresses = await dns.resolve4(cleanDomain);
    } catch (e: any) {
      //
    }

    // Se considera verificado si el TXT coincide con el token
    const isVerified = txtFound;

    if (isVerified) {
      await prisma.storeDomain.update({
        where: { domain: cleanDomain },
        data: {
          status: 'ACTIVE',
          verifiedAt: new Date(),
        },
      });

      await prisma.onlineStore.update({
        where: { id: store.id },
        data: {
          customDomain: cleanDomain,
          domainStatus: 'ACTIVE',
        },
      });

      revalidatePath('/dashboard/tienda');
      return {
        success: true,
        status: 'ACTIVE',
        message: '¡Dominio verificado con éxito! Ahora tu tienda responde en ' + cleanDomain,
        details: {
          txtFound,
          cnameTarget,
          ipAddresses,
        },
      };
    } else {
      return {
        success: false,
        status: 'PENDING_VERIFICATION',
        error: `No encontramos aún el registro TXT con el valor "${domainRecord.verificationToken}".`,
        details: {
          foundTxtRecords,
          cnameTarget,
          ipAddresses,
          hint: 'La propagación DNS puede demorarse entre 5 minutos y hasta 24 horas dependiendo de tu proveedor de dominio. Si acabas de agregarlo, espera unos minutos e inténtalo de nuevo.',
        },
      };
    }
  } catch (error: any) {
    console.error('[VERIFY_CUSTOM_DOMAIN]', error);
    return { success: false, error: error.message || 'Error al verificar el dominio.' };
  }
}

/**
 * Desvincula un dominio personalizado de la tienda virtual.
 */
export async function removeCustomDomain(domain: string) {
  try {
    const { companyId } = await getStoreAuthContext();
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    const store = await prisma.onlineStore.findUnique({
      where: { companyId },
    });

    if (!store) {
      return { success: false, error: 'Tienda virtual no encontrada.' };
    }

    await prisma.storeDomain.deleteMany({
      where: {
        domain: cleanDomain,
        storeId: store.id,
      },
    });

    if (store.customDomain === cleanDomain) {
      await prisma.onlineStore.update({
        where: { id: store.id },
        data: {
          customDomain: null,
          domainStatus: 'PENDING_VERIFICATION',
          domainVerificationToken: null,
        },
      });
    }

    revalidatePath('/dashboard/tienda');
    return { success: true };
  } catch (error: any) {
    console.error('[REMOVE_CUSTOM_DOMAIN]', error);
    return { success: false, error: error.message || 'Error al desvincular el dominio.' };
  }
}

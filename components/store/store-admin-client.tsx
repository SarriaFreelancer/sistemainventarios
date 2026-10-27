'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Store,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Globe,
  Settings,
  DollarSign,
  Search,
  Filter,
  Eye,
  ArrowRight,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
  ShieldCheck,
  Sliders,
  MapPin,
  Tag,
  Sparkles,
  Percent,
  Send,
  CheckSquare,
  Square,
  Share2,
  Palette,
  FolderTree,
  Layers,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  updateStoreConfig,
  toggleProductWebPublish,
  bulkToggleProductPublish,
  updateStoreOrderStatus,
  convertStoreOrderToSale,
  requestCustomDomain,
  verifyCustomDomain,
  removeCustomDomain,
} from '@/app/actions/store-actions';
import { successAlert, errorAlert, confirmAction, brandAlert } from '@/lib/sweetalert';
import { ThemeCustomizer } from './theme-customizer';
import { parseStoreThemeConfig } from '@/lib/store-theme';

interface StoreAdminClientProps {
  store: any;
  metrics: {
    totalOrders: number;
    pendingReviewCount: number;
    acceptedCount: number;
    completedCount: number;
    totalRevenue: number;
    publishedCount: number;
    totalProducts: number;
  };
  orders: any[];
  products: any[];
  categories?: any[];
  productGroups?: any[];
  publicBaseUrl: string;
}

export function StoreAdminClient({
  store: initialStore,
  metrics: initialMetrics,
  orders: initialOrders,
  products: initialProducts,
  categories = [],
  productGroups = [],
  publicBaseUrl,
}: StoreAdminClientProps) {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CATALOG' | 'DESIGN' | 'SETTINGS' | 'DOMAINS'>('ORDERS');
  const [store, setStore] = useState(initialStore);
  const [orders, setOrders] = useState(initialOrders);
  const [products, setProducts] = useState(initialProducts);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isPending, startTransition] = useTransition();

  // Search & Filter
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED' | 'DISCOUNTS'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ALL'>('ALL');
  const [groupFilter, setGroupFilter] = useState<number | 'ALL'>('ALL');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Pagination for catalog
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productGalleryUrls, setProductGalleryUrls] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState<string>('');
  const [productVideoUrl, setProductVideoUrl] = useState<string>('');
  const [newDomainInput, setNewDomainInput] = useState('');
  const [currentOrigin, setCurrentOrigin] = useState(publicBaseUrl);

  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    let parsedGallery: string[] = [];
    try {
      if (prod.galleryImages) {
        parsedGallery = typeof prod.galleryImages === 'string' ? JSON.parse(prod.galleryImages) : prod.galleryImages;
      }
    } catch (e) {
      parsedGallery = [];
    }
    setProductGalleryUrls(Array.isArray(parsedGallery) ? parsedGallery : []);
    setProductVideoUrl(prod.videoUrl || '');
    setNewGalleryInput('');
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const publicStoreUrl = store ? `${currentOrigin || publicBaseUrl}/t/${store.slug}` : '';

  const buildWhatsAppNotifyUrl = (ord: any) => {
    const rawDigits = (ord.customerPhone || '').replace(/\D/g, '');
    const cleanPhone = rawDigits.startsWith('57') ? rawDigits : rawDigits.length === 10 ? `57${rawDigits}` : rawDigits;
    const statusLabel =
      ord.status === 'PENDING_REVIEW'
        ? 'Pendiente de Revisión'
        : ord.status === 'ACCEPTED'
        ? 'Aceptado y en Preparación'
        : ord.status === 'COMPLETED_SALE'
        ? 'Venta Confirmada'
        : ord.status === 'REJECTED'
        ? 'Rechazado'
        : ord.status;
    const trackingUrl = `${currentOrigin || publicBaseUrl}/t/${store?.slug}/order/${ord.orderToken || ord.id}`;
    const text = `Hola *${ord.customerName}* 👋 Te informamos sobre tu pedido *#${ord.orderNumber}* en *${store?.name}*.\n\n📦 *Estado:* ${statusLabel}\n💰 *Total:* ${fmt(ord.total)}\n\n🔍 Puedes hacer seguimiento en vivo y consultar el detalle de tu pedido sin iniciar sesión aquí:\n${trackingUrl}\n\n¡Gracias por preferirnos!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyUrl = () => {
    if (!publicStoreUrl) return;
    navigator.clipboard.writeText(publicStoreUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const fmt = (n: number) =>
    n.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.toLowerCase();
    const matchesSearch =
      q === '' ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q);

    const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    const matchesSearch =
      q === '' ||
      p.name?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
      (p.productGroup?.name && p.productGroup.name.toLowerCase().includes(q));

    let matchesStatus = true;
    if (productStatusFilter === 'PUBLISHED') matchesStatus = Boolean(p.isPublishedWeb);
    else if (productStatusFilter === 'UNPUBLISHED') matchesStatus = !p.isPublishedWeb;
    else if (productStatusFilter === 'DISCOUNTS') matchesStatus = Boolean(p.webPrice && p.webPrice < p.salePrice);

    let matchesCategory = true;
    if (categoryFilter !== 'ALL') {
      matchesCategory = p.categoryId === categoryFilter || p.category?.id === categoryFilter;
    }

    let matchesGroup = true;
    if (groupFilter !== 'ALL') {
      matchesGroup = p.productGroupId === groupFilter || p.productGroup?.id === groupFilter;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesGroup;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredProducts.length);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const publishedCount = products.filter((p) => p.isPublishedWeb).length;
  const discountProductsCount = products.filter((p) => p.webPrice && p.webPrice < p.salePrice).length;

  const handleSelectAllFiltered = (check: boolean) => {
    if (check) {
      const allIds = Array.from(new Set([...selectedProductIds, ...filteredProducts.map((p) => p.id)]));
      setSelectedProductIds(allIds);
    } else {
      const filteredIdSet = new Set(filteredProducts.map((p) => p.id));
      setSelectedProductIds(selectedProductIds.filter((id) => !filteredIdSet.has(id)));
    }
  };

  const handleToggleSelectProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = (publish: boolean) => {
    if (selectedProductIds.length === 0) return;
    startTransition(async () => {
      const res = await bulkToggleProductPublish(selectedProductIds, publish);
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.includes(p.id) ? { ...p, isPublishedWeb: publish } : p
          )
        );
        setMetrics((prev) => ({
          ...prev,
          publishedCount: products.filter((p) =>
            selectedProductIds.includes(p.id) ? publish : p.isPublishedWeb
          ).length,
        }));
        setSelectedProductIds([]);
        successAlert(
          publish ? 'Productos Publicados' : 'Productos Ocultados',
          `Se actualizaron ${res.count} productos correctamente.`
        );
      } else {
        errorAlert('Error', res.error || 'No se pudo procesar la acción en lote.');
      }
    });
  };

  // Handle Order Status Change
  const handleUpdateStatus = async (orderId: number, newStatus: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
    let reason: string | undefined = undefined;

    if (newStatus === 'REJECTED') {
      const { value, isConfirmed } = await brandAlert.fire({
        title: 'Rechazar Pedido',
        text: 'Ingresa el motivo del rechazo para conocimiento del cliente:',
        input: 'text',
        inputPlaceholder: 'Ej. Sin existencias disponibles / Fuera de zona de entrega',
        showCancelButton: true,
        confirmButtonText: 'Rechazar Pedido',
        cancelButtonText: 'Cancelar',
        inputValidator: (val) => (!val ? 'Debes ingresar un motivo' : null),
      });
      if (!isConfirmed) return;
      reason = value;
    } else {
      const confirmed = await confirmAction(
        newStatus === 'ACCEPTED' ? '¿Aceptar Pedido?' : '¿Cancelar Pedido?',
        `¿Confirmas cambiar el estado del pedido a ${newStatus}?`,
        'Sí, confirmar'
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      const res = await updateStoreOrderStatus(orderId, newStatus, reason);
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        successAlert('Estado Actualizado', `El pedido ahora está en estado ${newStatus}.`);
      } else {
        errorAlert('Error', res.error || 'No se pudo actualizar el estado.');
      }
    });
  };

  // Handle Convert to Sale
  const handleConvertToSale = async (order: any) => {
    const confirmed = await confirmAction(
      '¿CONVERTIR PEDIDO EN VENTA?',
      `Se creará una Venta oficial en GNS, se descontará el inventario físico de bodega y se vinculará al cliente en el CRM.`,
      'Sí, convertir en venta'
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await convertStoreOrderToSale(order.id);
      if (res.success && res.sale && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: 'COMPLETED_SALE', sale: res.sale } : o))
        );
        if (selectedOrder && selectedOrder.id === order.id) {
          setSelectedOrder({ ...selectedOrder, status: 'COMPLETED_SALE', sale: res.sale });
        }
        setMetrics((prev) => ({
          ...prev,
          completedCount: prev.completedCount + 1,
          totalRevenue: prev.totalRevenue + order.total,
          pendingReviewCount: Math.max(0, prev.pendingReviewCount - 1),
        }));
        successAlert('Venta Creada', `Pedido convertido exitosamente en la Venta #${res.sale.saleNumber}.`);
      } else {
        errorAlert('Error de Conversión', res.error || 'No se pudo convertir el pedido.');
      }
    });
  };

  // Handle Toggle Product Publication
  const handleTogglePublish = (prod: any) => {
    const nextState = !prod.isPublishedWeb;
    startTransition(async () => {
      const res = await toggleProductWebPublish(prod.id, {
        isPublishedWeb: nextState,
      });
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, isPublishedWeb: nextState } : p))
        );
        setMetrics((prev) => ({
          ...prev,
          publishedCount: prev.publishedCount + (nextState ? 1 : -1),
        }));
      } else {
        errorAlert('Error', res.error || 'No se pudo actualizar la publicación.');
      }
    });
  };

  // Handle Save Store Settings Form
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateStoreConfig({
        name: String(formData.get('name') || store.name),
        description: String(formData.get('description') || ''),
        phone: String(formData.get('phone') || ''),
        email: String(formData.get('email') || ''),
        address: String(formData.get('address') || ''),
        city: String(formData.get('city') || 'Cali'),
        allowDelivery: formData.get('allowDelivery') === 'on',
        allowPickup: formData.get('allowPickup') === 'on',
        allowCoordinate: formData.get('allowCoordinate') === 'on',
        deliveryCost: Number(formData.get('deliveryCost') || 0),
        pickupAddress: String(formData.get('pickupAddress') || ''),
        minOrderAmount: Number(formData.get('minOrderAmount') || 0),
        freeShippingThreshold: Number(formData.get('freeShippingThreshold') || 0),
        status: String(formData.get('status') || 'ACTIVE'),
        whatsappMessage: String(formData.get('whatsappMessage') || ''),
        announcementText: String(formData.get('announcementText') || ''),
        themeColor: String(formData.get('themeColor') || '#3b82f6'),
        instagramUrl: String(formData.get('instagramUrl') || ''),
        facebookUrl: String(formData.get('facebookUrl') || ''),
        tiktokUrl: String(formData.get('tiktokUrl') || ''),
      });

      if (res.success && res.store) {
        setStore(res.store);
        successAlert('Configuración Guardada', 'Los ajustes de la tienda virtual fueron actualizados.');
      } else {
        errorAlert('Error', res.error || 'No se pudo guardar la configuración.');
      }
    });
  };

  // Handle Request Custom Domain
  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;

    startTransition(async () => {
      const res = await requestCustomDomain(newDomainInput.trim());
      if (res.success && res.domain) {
        setStore((prev: any) => ({
          ...prev,
          customDomain: res.domain.domain,
          domainStatus: res.domain.status,
          domainVerificationToken: res.domain.verificationToken,
          domains: [res.domain, ...(prev.domains || [])],
        }));
        setNewDomainInput('');
        successAlert('Dominio Registrado', 'Configura los registros DNS indicados para completar la verificación.');
      } else {
        errorAlert('Error', res.error || 'No se pudo vincular el dominio.');
      }
    });
  };

  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);

  const handleVerifyDomain = async (domain: string) => {
    if (!domain || isVerifyingDomain) return;
    setIsVerifyingDomain(true);
    try {
      const res = await verifyCustomDomain(domain);
      if (res.success && res.status === 'ACTIVE') {
        setStore((prev: any) => ({
          ...prev,
          domainStatus: 'ACTIVE',
        }));
        successAlert(
          '¡Dominio Verificado con Éxito!',
          `Tu dominio ${domain} ya está enlazado y activo. Ahora responderá directamente en tu tienda.`
        );
      } else {
        errorAlert(
          'Aún no detectamos los registros DNS',
          res.error || 'Asegúrate de haber guardado los registros TXT y CNAME en el panel de tu proveedor de dominio. Ten en cuenta que la propagación DNS puede demorarse entre 5 minutos y varias horas.'
        );
      }
    } catch (err: any) {
      errorAlert('Error de Verificación', err.message || 'No se pudo consultar los servidores DNS.');
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    const ok = await confirmAction(
      '¿Desvincular dominio?',
      `El dominio ${domain} dejará de apuntar a tu tienda virtual de GNS.`,
      'Sí, desvincular'
    );
    if (!ok) return;

    startTransition(async () => {
      const res = await removeCustomDomain(domain);
      if (res.success) {
        setStore((prev: any) => ({
          ...prev,
          customDomain: null,
          domainStatus: 'PENDING_VERIFICATION',
          domainVerificationToken: null,
        }));
        successAlert('Dominio Desvinculado', 'Tu tienda continuará activa con su enlace permanente oficial.');
      } else {
        errorAlert('Error', res.error || 'No se pudo desvincular el dominio.');
      }
    });
  };

  const statusBadge = (st: string) => {
    switch (st) {
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3" />
            Pendiente revisión
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Aceptado
          </span>
        );
      case 'COMPLETED_SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Check className="h-3 w-3" />
            Venta completada
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            Rechazado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
            Cancelado
          </span>
        );
      default:
        return <span className="text-xs font-bold text-muted-foreground">{st}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Share */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Tienda Virtual
              </h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  store?.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                }`}
              >
                {store?.status === 'ACTIVE' ? 'En línea' : 'Pausada'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Catálogo web público para que tus clientes exploren productos y envíen pedidos online.
            </p>
          </div>
        </div>

        {/* Public Store Link Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-background/80 border border-border px-3.5 py-2 rounded-2xl text-xs font-mono text-muted-foreground overflow-hidden">
            <Globe className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate max-w-[240px]">{publicStoreUrl}</span>
          </div>

          <button
            onClick={handleCopyUrl}
            className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{copiedUrl ? 'Copiado' : 'Copiar URL'}</span>
          </button>

          <a
            href={publicStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:opacity-90 transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Ver Tienda</span>
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Pedidos Web
            </p>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{metrics.totalOrders}</p>
          <p className="text-xs text-muted-foreground">Recibidos en total</p>
        </div>

        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Pendientes
            </p>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600">{metrics.pendingReviewCount}</p>
          <p className="text-xs text-muted-foreground">Requieren revisión</p>
        </div>

        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Ventas Web
            </p>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{fmt(metrics.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">{metrics.completedCount} ventas convertidas</p>
        </div>

        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Productos Publicados
            </p>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{metrics.publishedCount}</p>
          <p className="text-xs text-muted-foreground">de {metrics.totalProducts} en inventario</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`h-11 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'ORDERS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Bandeja de Pedidos ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`h-11 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'CATALOG'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Catálogo Web ({metrics.publishedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('DESIGN')}
          className={`h-11 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'DESIGN'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Diseño & Landing (Visual)</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`h-11 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'SETTINGS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Configuración de Tienda</span>
        </button>

        <button
          onClick={() => setActiveTab('DOMAINS')}
          className={`h-11 px-5 font-bold text-xs border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'DOMAINS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Dominios Personalizados</span>
        </button>
      </div>

      {/* TAB 1: BANDEJA DE PEDIDOS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar por # pedido, cliente o teléfono..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="h-10 w-full pl-10 pr-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { label: 'Todos', value: 'ALL' },
                { label: 'Pendientes', value: 'PENDING_REVIEW' },
                { label: 'Aceptados', value: 'ACCEPTED' },
                { label: 'Ventas Realizadas', value: 'COMPLETED_SALE' },
                { label: 'Rechazados', value: 'REJECTED' },
              ].map((st) => (
                <button
                  key={st.value}
                  onClick={() => setOrderStatusFilter(st.value)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    orderStatusFilter === st.value
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Pedido / Fecha</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Modalidad</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No se encontraron pedidos web registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-extrabold text-foreground">{ord.orderNumber}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(ord.createdAt).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-foreground">{ord.customerName}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <a
                              href={`https://wa.me/${ord.customerPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {ord.customerPhone}
                            </a>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-foreground">
                            {ord.deliveryMode === 'HOME_DELIVERY'
                              ? 'Domicilio'
                              : ord.deliveryMode === 'PICKUP'
                              ? 'Recogida'
                              : 'Coordinar'}
                          </span>
                          {ord.deliveryCity && (
                            <p className="text-[10px] text-muted-foreground">{ord.deliveryCity}</p>
                          )}
                        </td>

                        <td className="px-5 py-4 font-black text-foreground">
                          {fmt(ord.total)}
                        </td>

                        <td className="px-5 py-4">
                          {statusBadge(ord.status)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={buildWhatsAppNotifyUrl(ord)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-2.5 rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                              title="Enviar seguimiento por WhatsApp al comprador"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span className="hidden xl:inline">Notificar</span>
                            </a>

                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors"
                            >
                              Ver Detalle
                            </button>

                            {ord.status === 'PENDING_REVIEW' && (
                              <button
                                onClick={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                                className="h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                              >
                                Aceptar
                              </button>
                            )}

                            {(ord.status === 'PENDING_REVIEW' || ord.status === 'ACCEPTED') && !ord.saleId && (
                              <button
                                onClick={() => handleConvertToSale(ord)}
                                className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                              >
                                Vender
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATÁLOGO WEB Y GESTIÓN DE DESCUENTOS */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-4">
          {/* Guía Informativa */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Tag className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  Gestión de Catálogo Web, Precios Especiales y Descuentos
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Activa el switch para publicar u ocultar productos en tu tienda virtual. Al definir un <strong>Precio Tienda Web</strong> inferior al precio regular de mostrador, el sistema calculará y mostrará automáticamente el badge de <strong>% de descuento</strong> en el catálogo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-extrabold text-foreground px-3 py-1 rounded-full bg-card border border-border shadow-sm">
                {publishedCount} de {products.length} publicados
              </span>
            </div>
          </div>

          {/* Filtros de Estado & Buscador */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar por nombre o código..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full pl-10 pr-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => {
                  setProductStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  productStatusFilter === 'ALL'
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => {
                  setProductStatusFilter('PUBLISHED');
                  setCurrentPage(1);
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  productStatusFilter === 'PUBLISHED'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                Publicados ({publishedCount})
              </button>
              <button
                onClick={() => {
                  setProductStatusFilter('UNPUBLISHED');
                  setCurrentPage(1);
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  productStatusFilter === 'UNPUBLISHED'
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                No Publicados ({products.length - publishedCount})
              </button>
              <button
                onClick={() => {
                  setProductStatusFilter('DISCOUNTS');
                  setCurrentPage(1);
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  productStatusFilter === 'DISCOUNTS'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                En Oferta ({discountProductsCount})
              </button>
            </div>
          </div>

          {/* Filtros por Categoría y Grupo de Inventario */}
          {(categories.length > 0 || productGroups.length > 0) && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5 shrink-0">
                <FolderTree className="h-3.5 w-3.5 text-primary" />
                Filtrar Inventario:
              </span>

              {/* Selector de Grupo */}
              {productGroups.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">Grupo:</span>
                  <select
                    value={groupFilter}
                    onChange={(e) => {
                      setGroupFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">Todos los grupos ({productGroups.length})</option>
                    {productGroups.map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de Categoría */}
              {categories.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">Categoría:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">Todas las categorías ({categories.length})</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c._count?.products ? `(${c._count.products})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(categoryFilter !== 'ALL' || groupFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('ALL');
                    setGroupFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className="text-[11px] text-primary hover:underline font-bold ml-auto"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Barra de Acciones Masivas (cuando hay seleccionados) */}
          {selectedProductIds.length > 0 && (
            <div className="p-3 rounded-2xl bg-primary text-primary-foreground flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-primary/20 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-xs font-black">
                <CheckSquare className="h-4 w-4" />
                <span>{selectedProductIds.length} producto(s) seleccionado(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkPublish(true)}
                  disabled={isPending}
                  className="h-8 px-3 rounded-xl bg-background text-foreground hover:bg-background/90 text-xs font-extrabold shadow-sm active:scale-95 transition-all"
                >
                  Publicar en Tienda
                </button>
                <button
                  onClick={() => handleBulkPublish(false)}
                  disabled={isPending}
                  className="h-8 px-3 rounded-xl bg-black/30 hover:bg-black/40 text-white text-xs font-bold active:scale-95 transition-all"
                >
                  Ocultar de Tienda
                </button>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="h-8 px-2.5 text-xs text-primary-foreground/80 hover:text-primary-foreground underline"
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          )}

          {/* Tabla de Productos */}
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredProducts.length > 0 &&
                          filteredProducts.every((p) => selectedProductIds.includes(p.id))
                        }
                        onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                        title="Seleccionar todos los visibles"
                      />
                    </th>
                    <th className="px-5 py-4">Producto</th>
                    <th className="px-5 py-4">Stock Libre</th>
                    <th className="px-5 py-4">Precio POS (Mostrador)</th>
                    <th className="px-5 py-4">Precio Web & Descuento</th>
                    <th className="px-5 py-4 text-center">Publicado</th>
                    <th className="px-5 py-4 text-right">Ficha y Descuentos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                        No hay productos que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((prod) => {
                      const hasDiscount = Boolean(prod.webPrice && prod.webPrice > 0 && prod.webPrice < prod.salePrice);
                      const discountPct = hasDiscount
                        ? Math.round(((prod.salePrice - (prod.webPrice || 0)) / prod.salePrice) * 100)
                        : 0;
                      const isSelected = selectedProductIds.includes(prod.id);

                      return (
                        <tr
                          key={prod.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectProduct(prod.id)}
                              className="h-4 w-4 rounded border-border text-primary cursor-pointer"
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-muted/50 overflow-hidden flex items-center justify-center border border-border flex-shrink-0">
                                {prod.imageUrl ? (
                                  <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-5 w-5 text-muted-foreground/40" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-foreground line-clamp-1">{prod.name}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span>{prod.code}</span>
                                  {prod.category && <span>• {prod.category.name || prod.category}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-bold">
                            <span
                              className={
                                prod.quantityAvailable - prod.reservedQuantity > 0
                                  ? 'text-emerald-600'
                                  : 'text-rose-500'
                              }
                            >
                              {Math.max(0, prod.quantityAvailable - prod.reservedQuantity)} und
                            </span>
                          </td>

                          <td className="px-5 py-4 font-semibold text-muted-foreground">
                            {fmt(prod.salePrice)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-0.5">
                              {hasDiscount ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-rose-600 dark:text-rose-400">
                                    {fmt(prod.webPrice!)}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    -{discountPct}% OFF
                                  </span>
                                </div>
                              ) : prod.webPrice && prod.webPrice > 0 ? (
                                <span className="font-bold text-foreground">{fmt(prod.webPrice)}</span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  Usa precio POS ({fmt(prod.salePrice)})
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => handleTogglePublish(prod)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                prod.isPublishedWeb ? 'bg-primary' : 'bg-muted'
                              }`}
                              title={prod.isPublishedWeb ? 'Ocultar de la tienda' : 'Publicar en la tienda'}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  prod.isPublishedWeb ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors inline-flex items-center gap-1.5"
                            >
                              <Tag className="h-3 w-3 text-primary" />
                              <span>Editar Ficha & Descuento</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Barra de Paginación */}
            {filteredProducts.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span>
                    Mostrando <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> de <strong>{filteredProducts.length}</strong> productos
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <span>Por página:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-7 px-2 rounded-lg border border-border bg-card text-xs font-bold text-foreground"
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage <= 1}
                    className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Anterior
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - effectivePage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-muted-foreground">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                                effectivePage === p
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : 'border border-border bg-card hover:bg-muted text-foreground'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage >= totalPages}
                    className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: DISEÑO & PERSONALIZADOR VISUAL TIPO WORDPRESS */}
      {activeTab === 'DESIGN' && (
        <ThemeCustomizer
          initialConfig={parseStoreThemeConfig(store.themeConfig, store.name, store.themeColor)}
          storeSlug={store.slug}
          storeName={store.name}
          publicBaseUrl={currentOrigin || publicBaseUrl}
          categories={categories || []}
          productGroups={productGroups || []}
        />
      )}

      {/* TAB 3: CONFIGURACIÓN DE TIENDA */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-foreground">Datos Comerciales Públicos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Información que verán tus clientes al ingresar a tu tienda online.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Nombre Comercial de la Tienda *
                </label>
                <input
                  name="name"
                  defaultValue={store?.name}
                  required
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Ciudad
                </label>
                <input
                  name="city"
                  defaultValue={store?.city ?? 'Cali'}
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Descripción o Eslogan del Negocio
                </label>
                <textarea
                  name="description"
                  defaultValue={store?.description ?? ''}
                  rows={2}
                  placeholder="Ej: Tienda oficial de moda, calzado y accesorios con envíos a todo el país."
                  className="w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Dirección Física de la Tienda
                </label>
                <input
                  name="address"
                  defaultValue={store?.address ?? ''}
                  placeholder="Ej. Carrera 15 # 8-30, Centro"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
            </div>

            <hr className="border-border" />

            {/* SECCIÓN WHATSAPP COMERCIAL */}
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">Canal de WhatsApp y Mensajería</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configura el número oficial de atención de tu tienda y el mensaje estándar o personalizado que enviarán tus clientes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Número de WhatsApp Oficial de la Tienda
                </label>
                <input
                  id="store-whatsapp-input"
                  name="phone"
                  defaultValue={store?.phone ?? ''}
                  placeholder="Ej: 3001234567 o +57 300 123 4567"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Si ingresas 10 dígitos (ej. 315...), el sistema antepone automáticamente el código de Colombia (+57).
                </p>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Mensaje Estándar / Editable para WhatsApp
                  </label>
                  <span className="text-[10px] font-semibold text-primary">
                    Variable disponible: <code>{'{storeName}'}</code>
                  </span>
                </div>
                <textarea
                  id="store-whatsapp-msg-input"
                  name="whatsappMessage"
                  defaultValue={
                    store?.whatsappMessage ??
                    '¡Hola {storeName}! Estoy viendo su catálogo web y me gustaría consultar sobre disponibilidad y pedidos.'
                  }
                  rows={2}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground resize-none"
                />
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const phoneInput = (document.getElementById('store-whatsapp-input') as HTMLInputElement)?.value || store?.phone || '';
                      const msgInput = (document.getElementById('store-whatsapp-msg-input') as HTMLTextAreaElement)?.value || '';
                      const rawDigits = phoneInput.replace(/\D/g, '');
                      const cleanPhone = rawDigits.length === 10 ? `57${rawDigits}` : rawDigits;
                      if (!cleanPhone) {
                        errorAlert('Ingresa un teléfono', 'Primero escribe el número de WhatsApp para probar el enlace.');
                        return;
                      }
                      const finalMsg = msgInput.replace(/\{storeName\}|\{tienda\}/gi, store?.name || 'la tienda');
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`, '_blank');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Probar enlace de WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* BARRA SUPERIOR DE ANUNCIOS Y REDES SOCIALES */}
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-foreground">Barra Superior de Anuncios y Redes Sociales</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Destaca ofertas, promociones de envío y conecta los canales sociales de tu negocio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Texto de la Barra de Anuncios (Marquesina Superior)
                </label>
                <input
                  name="announcementText"
                  defaultValue={store?.announcementText ?? '🎉 ¡Envíos a todo el país! Consulta promociones y haz tu pedido en línea.'}
                  placeholder="Ej: 🚚 Envíos gratis por compras superiores a $100.000"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Enlace de Instagram
                </label>
                <input
                  type="url"
                  name="instagramUrl"
                  defaultValue={store?.instagramUrl ?? ''}
                  placeholder="https://instagram.com/tu_tienda"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Enlace de Facebook
                </label>
                <input
                  type="url"
                  name="facebookUrl"
                  defaultValue={store?.facebookUrl ?? ''}
                  placeholder="https://facebook.com/tu_tienda"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Enlace de TikTok (Opcional)
                </label>
                <input
                  type="url"
                  name="tiktokUrl"
                  defaultValue={store?.tiktokUrl ?? ''}
                  placeholder="https://tiktok.com/@tu_tienda"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
            </div>

            <hr className="border-border" />

            <div>
              <h3 className="text-base font-bold text-foreground">Políticas y Modalidades de Entrega</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define cómo podrán tus clientes recibir sus compras.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-background/50 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowDelivery"
                  defaultChecked={store?.allowDelivery ?? true}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">Permitir Envío a Domicilio</p>
                  <p className="text-[11px] text-muted-foreground">Exige dirección de entrega en el checkout.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-background/50 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowPickup"
                  defaultChecked={store?.allowPickup ?? true}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">Permitir Recogida en Tienda</p>
                  <p className="text-[11px] text-muted-foreground">El cliente retira directamente en tu local.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-background/50 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowCoordinate"
                  defaultChecked={store?.allowCoordinate ?? true}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <div>
                  <p className="text-xs font-bold text-foreground">Permitir Coordinar con Vendedor</p>
                  <p className="text-[11px] text-muted-foreground">Acuerdan condiciones de entrega vía WhatsApp.</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Costo Base de Domicilio ($)
                </label>
                <input
                  type="number"
                  name="deliveryCost"
                  defaultValue={store?.deliveryCost ?? 0}
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Monto Mínimo de Pedido ($)
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  defaultValue={store?.minOrderAmount ?? 0}
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Monto Mínimo para Envío Gratis Automático ($ COP)
                </label>
                <input
                  type="number"
                  name="freeShippingThreshold"
                  defaultValue={store?.freeShippingThreshold ?? 0}
                  placeholder="Ej. 100000 (Dejar en 0 para desactivar)"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Si el subtotal del pedido alcanza o supera este monto, el costo del domicilio se vuelve $0 y la tienda muestra una barra de progreso de envío gratis.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Dirección exacta de Recogida
                </label>
                <input
                  name="pickupAddress"
                  defaultValue={store?.pickupAddress ?? ''}
                  placeholder="Ej. Calle 10 # 5-20, Local 102"
                  className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-xs shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all"
              >
                {isPending ? 'Guardando...' : 'Guardar Ajustes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: DOMINIOS PERSONALIZADOS */}
      {activeTab === 'DOMAINS' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-3xl border border-border bg-card space-y-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-foreground">Vincular Dominio Propio</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conecta tu propio dominio (ej. <code>mitienda.com</code> o <code>tienda.minegocio.co</code>) a tu tienda virtual de GNS.
              </p>
            </div>

            <form onSubmit={handleAddDomain} className="flex gap-2">
              <input
                type="text"
                placeholder="ej: mitienda.com"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                className="h-11 flex-1 rounded-2xl border border-border bg-background px-3.5 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
              />
              <button
                type="submit"
                disabled={isPending || !newDomainInput.trim()}
                className="h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                Vincular
              </button>
            </form>

            {/* Configured Domains */}
            {store?.customDomain && (
              <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <p className="text-base font-extrabold text-foreground">{store.customDomain}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>Estado:</span>
                      {store.domainStatus === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Verificado y Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Pendiente de Verificación DNS
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {store.domainStatus === 'ACTIVE' && (
                      <a
                        href={`https://${store.customDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Abrir Tienda</span>
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={isVerifyingDomain}
                      onClick={() => handleVerifyDomain(store.customDomain)}
                      className="h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isVerifyingDomain ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Consultando DNS...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Verificar DNS en Vivo</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://www.whatsmydns.net/#TXT/${store.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                      title="Ver mapa de propagación global en WhatsMyDNS"
                    >
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">WhatsMyDNS</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(store.customDomain)}
                      className="h-9 px-3 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold text-xs inline-flex items-center gap-1 transition-all"
                      title="Desvincular este dominio"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Desvincular</span>
                    </button>
                  </div>
                </div>

                {/* Explicación paso a paso de registros DNS */}
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black">
                        1
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-foreground">Registro TXT (Validación de Titularidad)</p>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Agrega este registro en el panel DNS de tu registrador (GoDaddy, Cloudflare, Namecheap, Hostinger, etc.) para certificar que eres el dueño del dominio:
                        </p>
                        <div className="mt-2 p-3 rounded-lg bg-card border border-border font-mono text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div><strong className="text-primary font-sans">Tipo:</strong> TXT</div>
                            <div><strong className="text-primary font-sans">Nombre / Host:</strong> @ (o el subdominio)</div>
                            <div><strong className="text-primary font-sans">Valor:</strong> {store.domainVerificationToken || 'gns-verify=auto'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(store.domainVerificationToken || '');
                              successAlert('Copiado', 'Token de verificación copiado al portapapeles.');
                            }}
                            className="h-8 px-3 rounded-lg border border-border bg-muted/60 hover:bg-muted font-bold text-xs text-foreground shrink-0 inline-flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" /> Copiar Valor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black">
                        2
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-foreground">Registro CNAME o A (Enrutamiento del Tráfico Web)</p>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Para que tus clientes lleguen a tu tienda al escribir tu dominio en el navegador, agrega el enrutamiento:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <div className="p-3 rounded-lg bg-card border border-border font-mono text-[11px] space-y-1">
                            <span className="font-sans font-bold text-foreground block">Opción A: Subdominio (ej. tienda.minegocio.com)</span>
                            <div><strong className="text-primary font-sans">Tipo:</strong> CNAME</div>
                            <div><strong className="text-primary font-sans">Nombre / Host:</strong> tienda (o www)</div>
                            <div><strong className="text-primary font-sans">Destino:</strong> gns.sarriatech.tech</div>
                          </div>
                          <div className="p-3 rounded-lg bg-card border border-border font-mono text-[11px] space-y-1">
                            <span className="font-sans font-bold text-foreground block">Opción B: Dominio Raíz (ej. minegocio.com)</span>
                            <div><strong className="text-primary font-sans">Tipo:</strong> CNAME Flattening / ANAME</div>
                            <div><strong className="text-primary font-sans">Nombre / Host:</strong> @</div>
                            <div><strong className="text-primary font-sans">Destino:</strong> gns.sarriatech.tech</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico & Ayuda */}
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-300 text-[11px] space-y-1.5 leading-relaxed">
                    <p className="font-bold flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
                      <Sparkles className="h-3.5 w-3.5" /> ¿Cómo saber si ya funciona?
                    </p>
                    <p>
                      1. Guarda los dos registros anteriores en el panel donde compraste tu dominio.
                    </p>
                    <p>
                      2. Haz clic en el botón <strong>&quot;Verificar DNS en Vivo&quot;</strong>. Nuestro servidor consultará los servidores DNS mundiales.
                    </p>
                    <p>
                      3. En cuanto el registro sea detectado, el estado cambiará a <strong>&quot;Verificado y Activo&quot;</strong> y podrás presionar el botón <strong>&quot;Abrir Tienda&quot;</strong> para ver tu catálogo respondiendo en tu dominio propio.
                    </p>
                    <p className="text-[10px] opacity-80 pt-1">
                      <em>Nota: La propagación mundial de DNS puede demorarse entre 5 minutos y hasta 24 horas dependiendo de las directivas TTL de tu registrador.</em>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DEL PEDIDO */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Pedido Web
                </span>
                <h3 className="text-xl font-black text-foreground">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {/* Buyer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1">
                <p className="font-bold text-foreground">Comprador</p>
                <p className="text-foreground">{selectedOrder.customerName}</p>
                <p className="text-muted-foreground">Teléfono: {selectedOrder.customerPhone}</p>
                {selectedOrder.customerEmail && (
                  <p className="text-muted-foreground">Email: {selectedOrder.customerEmail}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1">
                <p className="font-bold text-foreground">Entrega</p>
                <p className="text-primary font-semibold">
                  {selectedOrder.deliveryMode === 'HOME_DELIVERY'
                    ? 'Envío a domicilio'
                    : selectedOrder.deliveryMode === 'PICKUP'
                    ? 'Recoger en tienda'
                    : 'Coordinar con vendedor'}
                </p>
                {selectedOrder.deliveryAddress && (
                  <p className="text-muted-foreground">
                    {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Productos ({selectedOrder.items.length})
              </p>
              <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {selectedOrder.items.map((it: any) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">{it.productName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {it.quantity} × {fmt(it.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold text-foreground">{fmt(it.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-bold text-foreground">{fmt(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span className="font-bold text-foreground">{fmt(selectedOrder.deliveryCost)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-black text-base">
                <span>Total</span>
                <span className="text-primary">{fmt(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex flex-wrap gap-2 justify-end">
              <a
                href={buildWhatsAppNotifyUrl(selectedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-4 rounded-xl border border-emerald-500/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/20 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                title="Notificar por WhatsApp y enviar enlace de seguimiento"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Notificar por WhatsApp</span>
              </a>

              <button
                onClick={() => setSelectedOrder(null)}
                className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold"
              >
                Cerrar
              </button>

              {selectedOrder.status === 'PENDING_REVIEW' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'REJECTED')}
                    className="h-10 px-4 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-bold"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')}
                    className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  >
                    Aceptar Pedido
                  </button>
                </>
              )}

              {(selectedOrder.status === 'PENDING_REVIEW' || selectedOrder.status === 'ACCEPTED') &&
                !selectedOrder.saleId && (
                  <button
                    onClick={() => handleConvertToSale(selectedOrder)}
                    className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20"
                  >
                    Convertir en Venta
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR FICHA WEB DE PRODUCTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Ficha Web: {editingProduct.name}</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const isPublished = fd.get('isPublishedWeb') === 'on';
                const webPrice = fd.get('webPrice') ? Number(fd.get('webPrice')) : null;
                const description = String(fd.get('description') || '');
                const imageUrl = String(fd.get('imageUrl') || '');

                startTransition(async () => {
                  const res = await toggleProductWebPublish(editingProduct.id, {
                    isPublishedWeb: isPublished,
                    webPrice,
                    description,
                    imageUrl,
                    galleryImages: productGalleryUrls,
                    videoUrl: productVideoUrl,
                  });
                  if (res.success && res.product) {
                    setProducts((prev) =>
                      prev.map((p) => (p.id === editingProduct.id ? { ...p, ...res.product } : p))
                    );
                    setEditingProduct(null);
                    successAlert('Producto Actualizado', 'La ficha web se actualizó correctamente.');
                  } else {
                    errorAlert('Error', res.error || 'No se pudo actualizar.');
                  }
                });
              }}
              className="space-y-4 text-xs"
            >
              <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublishedWeb"
                  defaultChecked={editingProduct.isPublishedWeb}
                  className="h-4 w-4 rounded border-border text-primary"
                />
                <span className="font-bold text-foreground">Publicado en la Tienda Virtual</span>
              </label>

              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground">Precio Regular Mostrador (POS):</span>
                  <span className="text-sm font-black text-foreground">{fmt(editingProduct.salePrice)}</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Precio Tienda Web con Descuento (Dejar vacío para usar precio POS)
                  </label>
                  <input
                    type="number"
                    name="webPrice"
                    id="modal-web-price-input"
                    defaultValue={editingProduct.webPrice ?? ''}
                    placeholder={`Ej: ${Math.round(editingProduct.salePrice * 0.85)}`}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const el = document.getElementById('discount-calc-preview');
                      if (!el) return;
                      if (val > 0 && val < editingProduct.salePrice) {
                        const pct = Math.round(((editingProduct.salePrice - val) / editingProduct.salePrice) * 100);
                        const diff = editingProduct.salePrice - val;
                        el.innerHTML = `🎉 <strong>¡Oferta activa!</strong> Descuento del ${pct}% (Ahorro de $${diff.toLocaleString('es-CO')})`;
                        el.className = "text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block";
                      } else if (val >= editingProduct.salePrice) {
                        el.innerHTML = `El precio web es mayor o igual al regular (no generará badge de oferta).`;
                        el.className = "text-[11px] text-muted-foreground mt-1 block";
                      } else {
                        el.innerHTML = `Sin precio web: se usará el precio regular POS (${fmt(editingProduct.salePrice)}).`;
                        el.className = "text-[11px] text-muted-foreground italic mt-1 block";
                      }
                    }}
                  />
                  <span id="discount-calc-preview" className="text-[11px] text-muted-foreground mt-1 block">
                    {editingProduct.webPrice && editingProduct.webPrice < editingProduct.salePrice
                      ? `🎉 ¡Oferta activa! Descuento del ${Math.round(((editingProduct.salePrice - editingProduct.webPrice) / editingProduct.salePrice) * 100)}%`
                      : `Si defines un precio web menor a ${fmt(editingProduct.salePrice)}, se creará un badge de descuento en la tienda.`}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Foto Principal de Portada (URL)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  defaultValue={editingProduct.imageUrl ?? ''}
                  placeholder="https://ejemplo.com/foto-principal.jpg"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>

              {/* Galería Múltiple (Hasta 5 fotos) */}
              <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Galería de Fotos Adicionales ({productGalleryUrls.length}/5)
                  </label>
                  <span className="text-[10px] text-primary font-semibold">Máximo 5 imágenes</span>
                </div>

                {/* Lista de fotos añadidas */}
                {productGalleryUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2">
                    {productGalleryUrls.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-border bg-card aspect-square">
                        <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input para agregar foto */}
                {productGalleryUrls.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newGalleryInput}
                      onChange={(e) => setNewGalleryInput(e.target.value)}
                      placeholder="https://ejemplo.com/otra-foto.jpg"
                      className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={!newGalleryInput.trim()}
                      onClick={() => {
                        if (newGalleryInput.trim() && productGalleryUrls.length < 5) {
                          setProductGalleryUrls((prev) => [...prev, newGalleryInput.trim()]);
                          setNewGalleryInput('');
                        }
                      }}
                      className="h-9 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs disabled:opacity-40"
                    >
                      + Agregar Foto
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Se mostrarán en carrusel en la vista rápida y ficha del producto en la tienda virtual.
                </p>
              </div>

              {/* Video del Producto */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Video del Producto (YouTube, Vimeo o URL directa .mp4)
                </label>
                <input
                  type="url"
                  value={productVideoUrl}
                  onChange={(e) => setProductVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Opcional. Permite reproducir una demostración del producto directamente en la tienda.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Descripción Pública del Producto
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProduct.description ?? ''}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

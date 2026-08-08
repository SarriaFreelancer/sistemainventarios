"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { deleteProduct, quickSellProduct } from "@/app/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dynamic from 'next/dynamic';

const EditProductDialog = dynamic(() => import('@/components/edit-product-dialog').then(mod => mod.EditProductDialog), { ssr: false });
const CreateProductDialog = dynamic(() => import('@/components/create-product-dialog').then(mod => mod.CreateProductDialog), { ssr: false });
import {
  Package, Trash2, TrendingUp, Archive, DollarSign, ShoppingCart,
  Search, SlidersHorizontal, ChevronUp, ChevronDown, ChevronsUpDown, Folder
} from "lucide-react";
import { confirmAction, successAlert, errorAlert, brandAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; }
interface Supplier { id: string; companyName: string; }
interface ProductGroup { id: string; name: string; }

interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  supplierId: string;
  quantityAvailable: number;
  unitCost: number;
  salePrice: number;
  soldQuantity: number;
  status: string;
  type?: string;
  productGroupId: string | null;
  category: Category | null;
  supplier: { id: string; companyName: string } | null;
  productGroup: ProductGroup | null;
}

type SortField = 'name' | 'code' | 'quantityAvailable' | 'salePrice' | 'unitCost';
type SortDir = 'asc' | 'desc';

export function ProductsClient(props: {
  initialProducts: Product[];
  categories: Category[];
  suppliers: Supplier[];
  groups: ProductGroup[];
  userId: string;
  allowNegativeStock?: boolean;
  maxProducts?: number;
  currentProducts?: number;
  planName?: string;
  role?: string;
  planLimits?: any;
  currentProductsCount?: number;
  registerInventoryCostAsExpense?: boolean;
}) {
  const { 
    initialProducts, categories, suppliers, groups, userId, allowNegativeStock = false,
    maxProducts = 999999, currentProducts = 0, planName = 'Plan Premium',
    registerInventoryCostAsExpense = false
  } = props;
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterSupplier, filterStatus, filterGroup, filterType, sortField, sortDir]);

  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];
    const q = search.toLowerCase();

    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      );
    }
    if (filterCategory) list = list.filter(p => p.categoryId === filterCategory);
    if (filterSupplier) list = list.filter(p => p.supplierId === filterSupplier);
    
    if (filterType !== 'ALL') {
      list = list.filter(p => (p.type || 'SALE') === filterType);
    }
    
    // CORRECTION of status filtering logic checking real stock quantity:
    if (filterStatus) {
      if (filterStatus === 'AVAILABLE') {
        list = list.filter(p => p.quantityAvailable > 0);
      } else if (filterStatus === 'OUT_OF_STOCK') {
        list = list.filter(p => p.quantityAvailable <= 0);
      }
    }

    if (filterGroup) list = list.filter(p => p.productGroupId === filterGroup);

    list.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const result = typeof av === 'string'
        ? av.localeCompare(bv as string)
        : (av as number) - (bv as number);
      return sortDir === 'asc' ? result : -result;
    });

    return list;
  }, [initialProducts, search, filterCategory, filterSupplier, filterStatus, filterGroup, filterType, sortField, sortDir]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const totalStock = filteredProducts.reduce((s, p) => s + p.quantityAvailable, 0);
  const totalValue = filteredProducts.reduce((s, p) => s + p.salePrice * p.quantityAvailable, 0);
  const outOfStock = filteredProducts.filter(p => p.quantityAvailable <= 0).length;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40 inline ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary inline ml-1" />
      : <ChevronDown className="h-3 w-3 text-primary inline ml-1 text-[#8B5CF6]" />;
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction(
      '¿Eliminar Producto?',
      `Estás a punto de eliminar "${name}". Esta acción es irreversible.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result.success) {
        successAlert('Producto Eliminado', `"${name}" fue removido del catálogo.`);
      } else {
        errorAlert('Error al Eliminar', 'No fue posible eliminar el producto.');
      }
    });
  };

  const handleQuickSell = async (product: Product) => {
    if (!allowNegativeStock && product.quantityAvailable <= 0) {
      errorAlert('Sin Existencias', 'Este producto no tiene unidades disponibles para vender.');
      return;
    }

    const { value: resultValues, isConfirmed } = await brandAlert.fire({
      title: `Venta Rápida`,
      html: `
        <div class="text-left space-y-4 font-sans">
          <div class="rounded-xl bg-muted/10 border border-border/60 p-3 text-xs space-y-1.5">
            <p class="text-muted-foreground">Producto: <strong class="text-foreground">${product.name}</strong></p>
            <p class="text-muted-foreground">Código: <strong class="text-foreground">${product.code}</strong></p>
            <p class="text-muted-foreground">Precio Unitario: <strong class="text-foreground">${product.salePrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}</strong></p>
            <p class="text-muted-foreground">Disponible: <strong class="text-primary">${product.quantityAvailable} unidades</strong></p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Cantidad a vender</label>
            <input id="swal-qty" type="number" min="1" max="${product.quantityAvailable}" value="1"
              class="flex h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition" />
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Descuento total ($)</label>
            <input id="swal-discount" type="number" min="0" value="0"
              class="flex h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Venta',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const qtyEl = document.getElementById('swal-qty') as HTMLInputElement;
        const discEl = document.getElementById('swal-discount') as HTMLInputElement;
        const qty = parseInt(qtyEl.value, 10);
        const discount = parseFloat(discEl.value) || 0;

        if (isNaN(qty) || qty < 1) {
          brandAlert.showValidationMessage('Ingresa una cantidad válida.');
          return false;
        }
        if (!allowNegativeStock && qty > product.quantityAvailable) {
          brandAlert.showValidationMessage(`Máximo disponible: ${product.quantityAvailable} u.`);
          return false;
        }
        if (isNaN(discount) || discount < 0) {
          brandAlert.showValidationMessage('El descuento debe ser mayor o igual a 0.');
          return false;
        }
        const subtotal = qty * product.salePrice;
        if (discount > subtotal) {
          brandAlert.showValidationMessage('El descuento no puede superar el subtotal.');
          return false;
        }

        return { qty, discount };
      },
      customClass: {
        popup: 'rounded-3xl border border-border bg-card text-foreground font-sans shadow-2xl p-6',
        confirmButton: 'bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold text-sm hover:opacity-95 transition mr-2',
        cancelButton: 'bg-secondary/10 hover:bg-secondary/20 border border-border text-foreground rounded-xl px-6 py-3 font-semibold text-sm transition ml-2',
      },
      buttonsStyling: false,
    });

    if (!isConfirmed || !resultValues) return;

    const { qty, discount } = resultValues;

    startTransition(async () => {
      const result = await quickSellProduct({
        productId: product.id,
        quantity: qty,
        discount: discount,
        userId,
      });

      if (result.success) {
        if (result.hasSalesModule) {
          // Tiene módulo Ventas → venta PENDIENTE, debe ir a completarla
          await successAlert(
            '¡Venta Pendiente Registrada!',
            `Venta #${result.saleNumber} creada como pendiente en el módulo de Ventas. Dirígete allí para seleccionar el método de pago y completarla.`
          );
        } else {
          // Sin módulo Ventas → venta COMPLETADA automáticamente con stock descontado
          await successAlert(
            '¡Venta Completada!',
            `Venta #${result.saleNumber} registrada y cobrada por ${result.total?.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}. El stock fue descontado automáticamente.`
          );
        }
      } else {
        errorAlert('Error en Venta', result.error ?? 'No fue posible registrar la venta.');
      }
    });
  };

  const thCls = "px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors";
  const selectFilterCls = "h-10 rounded-xl border border-border/80 bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-[32px] bg-card border border-border shadow-md shadow-primary/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-primary to-[#C5A059] rounded-2xl text-white shadow-lg shadow-primary/25">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Productos</h1>
            <p className="text-sm text-muted-foreground">Gestiona el catálogo de productos de GNS SarriaTech.</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-end gap-2">
          <CreateProductDialog 
            categories={categories} 
            suppliers={suppliers} 
            groups={groups}
            disabled={currentProducts >= maxProducts}
            limitMessage={`Has alcanzado el límite de ${maxProducts} productos de tu ${planName}.`}
            registerInventoryCostAsExpense={registerInventoryCostAsExpense}
          />
          {maxProducts < 999999 && (
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              {currentProducts} / {maxProducts} Productos ({planName})
            </p>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Productos', value: String(filteredProducts.length), sub: 'en catálogo', icon: ShoppingCart },
          { label: 'Stock Total', value: totalStock.toLocaleString(), sub: 'unidades disponibles', icon: Archive },
          { label: 'Valor Inventario', value: totalValue.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), sub: 'precio de venta', icon: DollarSign },
          { label: 'Sin Stock', value: String(outOfStock), sub: 'productos agotados', icon: TrendingUp, danger: outOfStock > 0 },
        ].map(({ label, value, sub, icon: Icon, danger }) => (
          <div key={label} className="p-5 rounded-[24px] bg-card border border-border shadow-sm flex flex-col gap-3 hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
              <div className={`p-1.5 rounded-lg ${danger ? 'bg-red-500/10' : 'bg-primary/10'}`}>
                <Icon className={`h-4 w-4 ${danger ? 'text-red-500' : 'text-primary'}`} />
              </div>
            </div>
            <p className={`text-2xl font-black leading-tight ${danger && outOfStock > 0 ? 'text-red-500' : 'text-foreground'}`}>
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Type Tabs ── */}
      <div className="flex gap-2 flex-wrap p-1 bg-card border border-border rounded-2xl shadow-sm">
        {[
          { value: 'ALL',          label: 'Todos' },
          { value: 'SALE',         label: 'Para Venta' },
          { value: 'FINISHED_GOOD',label: 'Prod. Terminado' },
          { value: 'SERVICE',      label: 'Servicios' },
          { value: 'RAW_MATERIAL', label: 'Materia Prima' },
          { value: 'SUPPLY',       label: 'Insumos' },
          { value: 'FIXED_ASSET',  label: 'Activos Fijos' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterType(value)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              filterType === value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-border/80 bg-background/50 pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 gap-2 shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {(filterCategory || filterSupplier || filterStatus || filterGroup) && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {[filterCategory, filterSupplier, filterStatus, filterGroup].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="px-5 py-4 bg-muted/10 border-b border-border/60 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-200">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectFilterCls}>
              <option value="">Todas las categorías</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className={selectFilterCls}>
              <option value="">Todos los proveedores</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectFilterCls}>
              <option value="">Todos los estados</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="OUT_OF_STOCK">Sin Stock</option>
            </select>
            <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className={selectFilterCls}>
              <option value="">Todos los grupos</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        {/* ── Table (Desktop) ── */}
        <div className="hidden md:block overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-primary/50" />
              </div>
              <p className="text-foreground font-semibold">No se encontraron productos</p>
              <p className="text-muted-foreground text-sm mt-1">Prueba ajustando los filtros de búsqueda.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/60">
                  <th className={thCls} onClick={() => toggleSort('code')}>Código <SortIcon field="code" /></th>
                  <th className={thCls} onClick={() => toggleSort('name')}>Producto <SortIcon field="name" /></th>
                  <th className={`${thCls} hidden lg:table-cell`}>Categoría / Grupo</th>
                  <th className={`${thCls} hidden lg:table-cell`}>Proveedor</th>
                  <th className={thCls} onClick={() => toggleSort('quantityAvailable')}>Stock <SortIcon field="quantityAvailable" /></th>
                  <th className={`${thCls} hidden xl:table-cell`} onClick={() => toggleSort('unitCost')}>Costo <SortIcon field="unitCost" /></th>
                  <th className={thCls} onClick={() => toggleSort('salePrice')}>Precio <SortIcon field="salePrice" /></th>
                  <th className={`${thCls} hidden sm:table-cell`}>Estado</th>
                  <th className="px-4 py-3 text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedProducts.map((product) => {
                  const isOut = product.quantityAvailable <= 0;
                  return (
                    <tr key={product.id} className="group hover:bg-primary/5 transition-colors duration-200">
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/10 whitespace-nowrap inline-block">
                          {product.code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 min-w-[160px]">
                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {product.name}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-muted-foreground">{product.category?.name ?? '—'}</p>
                        {product.productGroup && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/40 text-secondary-foreground mt-0.5 inline-block">
                            {product.productGroup.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{product.supplier?.companyName ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-black ${isOut ? 'text-red-500' : 'text-foreground'}`}>
                          {product.quantityAvailable}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {product.unitCost.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-extrabold text-primary">
                          {product.salePrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                            Agotado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Disponible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {['SALE', 'FINISHED_GOOD', 'SERVICE'].includes(product.type || 'SALE') ? (
                            <button
                              onClick={() => handleQuickSell(product)}
                              className="h-9 px-3 text-xs font-bold text-white bg-gradient-to-tr from-primary to-[#C5A059] hover:opacity-90 rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-1"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Vender
                            </button>
                          ) : (
                            <span className="inline-flex items-center h-9 text-xs font-medium text-muted-foreground px-3 bg-muted/30 rounded-xl">
                              Uso interno
                            </span>
                          )}
                          <EditProductDialog product={product} categories={categories} suppliers={suppliers} groups={groups} registerInventoryCostAsExpense={registerInventoryCostAsExpense} />
                          <Button
                            aria-label="Eliminar producto"
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => handleDelete(product.id, product.name)}
                            className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Table (Mobile) ── */}
        <div className="md:hidden divide-y divide-border/40">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No hay productos.</div>
          ) : (
            paginatedProducts.map(product => {
              const isOut = product.quantityAvailable <= 0;
              return (
                <div key={product.id} className="p-5 space-y-3 hover:bg-primary/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/10">
                        {product.code}
                      </span>
                      <h3 className="font-semibold text-foreground text-sm mt-1.5">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.category?.name ?? 'Sin categoría'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-primary">
                        {product.salePrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                      </p>
                      <p className={`text-xs mt-1 ${isOut ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                        Stock: {product.quantityAvailable}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    {isOut ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">Agotado</span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Disponible</span>
                    )}
                    <div className="flex gap-2 justify-end">
                      {['SALE', 'FINISHED_GOOD', 'SERVICE'].includes(product.type || 'SALE') ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickSell(product)}
                          className="h-8 text-xs font-semibold px-3"
                          disabled={product.quantityAvailable === 0 || isPending}
                        >
                          Venta rápida
                        </Button>
                      ) : (
                        <span className="inline-flex items-center h-8 text-xs font-medium text-muted-foreground px-3 bg-muted/30 rounded-md">
                          Uso interno
                        </span>
                      )}
                      <EditProductDialog product={product} categories={categories} suppliers={suppliers} groups={groups} registerInventoryCostAsExpense={registerInventoryCostAsExpense} />
                      <Button
                        aria-label="Eliminar producto"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/5 shrink-0">
            <p className="text-xs text-muted-foreground font-medium">
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredProducts.length)} de {filteredProducts.length} registros
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={currentPage === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(p)}
                  className={`h-8 w-8 rounded-lg text-xs p-0 font-bold ${currentPage === p ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-8 rounded-lg px-2.5 text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

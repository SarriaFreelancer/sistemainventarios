'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Loader2, X, Filter, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface LookupData {
  categories: { id: number; name: string; productGroupId?: number | null }[];
  suppliers: { id: number; companyName: string }[];
  groups: { id: number; name: string }[];
  productMappings?: { type: string; productGroupId: number | null; categoryId: number; supplierId: number }[];
}

interface ReportDownloadButtonProps {
  href: string;
  reportType: string;
  label?: string;
  lookupData?: LookupData;
}

type FiltersState = {
  categoryId: string;
  supplierId: string;
  productGroupId: string;
  productType: string;
  startDate: string;
  endDate: string;
  status: string;
};

const PRODUCT_TYPES = [
  { value: '', label: 'Todos los tipos' },
  { value: 'SALE', label: 'Venta' },
  { value: 'RAW_MATERIAL', label: 'Materia Prima' },
  { value: 'FINISHED_GOOD', label: 'Producto Terminado' },
  { value: 'SUPPLY', label: 'Insumo' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'FIXED_ASSET', label: 'Activo Fijo' },
];

const SALE_STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'REVIEWED', label: 'Revisada' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'VOIDED', label: 'Anulada' },
  { value: 'RETURNED', label: 'Devuelta' },
];

const EMPLOYEE_STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'TERMINATED', label: 'Liquidado' },
];

const isProductReport = (type: string) => ['products', 'stock'].includes(type);
const isSalesReport = (type: string) => type === 'sales';
const isEmployeeReport = (type: string) => type === 'employees';
const isDateFilteredReport = (type: string) => ['sales', 'employees', 'purchases', 'payroll'].includes(type);

export function ReportDownloadButton({
  href,
  reportType,
  label = 'Descargar Excel',
  lookupData,
}: ReportDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    categoryId: '',
    supplierId: '',
    productGroupId: '',
    productType: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  const hasFilters = isProductReport(reportType) || isDateFilteredReport(reportType);

  // --- Cascading Logic ---
  const validGroups = useMemo(() => {
    if (!isProductReport(reportType) || !lookupData) return lookupData?.groups || [];
    let mappings = lookupData.productMappings || [];
    if (filters.productType) mappings = mappings.filter(m => m.type === filters.productType);
    const validGroupIds = new Set(mappings.map(m => m.productGroupId));
    return lookupData.groups.filter(g => validGroupIds.has(g.id) || !filters.productType); // Fallback if no strict mapping
  }, [lookupData, filters.productType, reportType]);

  const validCategories = useMemo(() => {
    if (!isProductReport(reportType) || !lookupData) return lookupData?.categories || [];
    let cats = lookupData.categories;
    if (filters.productGroupId) {
      cats = cats.filter(c => String(c.productGroupId) === String(filters.productGroupId));
    } else if (filters.productType) {
       // if a type is selected but no group, show categories that have products of that type
       const mappings = lookupData.productMappings || [];
       const validCategoryIds = new Set(mappings.filter(m => m.type === filters.productType).map(m => m.categoryId));
       cats = cats.filter(c => validCategoryIds.has(c.id));
    }
    return cats;
  }, [lookupData, filters.productGroupId, filters.productType, reportType]);

  const validSuppliers = useMemo(() => {
    if (reportType !== 'products' || !lookupData) return lookupData?.suppliers || [];
    let mappings = lookupData.productMappings || [];
    if (filters.productType) mappings = mappings.filter(m => m.type === filters.productType);
    if (filters.productGroupId) mappings = mappings.filter(m => String(m.productGroupId) === String(filters.productGroupId));
    if (filters.categoryId) mappings = mappings.filter(m => String(m.categoryId) === String(filters.categoryId));
    
    const validSupplierIds = new Set(mappings.map(m => m.supplierId));
    // If no filters selected, show all suppliers, otherwise show only valid ones
    if (!filters.productType && !filters.productGroupId && !filters.categoryId) return lookupData.suppliers;
    return lookupData.suppliers.filter(s => validSupplierIds.has(s.id));
  }, [lookupData, filters.productType, filters.productGroupId, filters.categoryId, reportType]);

  // Reset dependent filters when parent changes
  useEffect(() => {
    setFilters(prev => {
      let next = { ...prev };
      let changed = false;
      if (prev.productGroupId && !validGroups.some(g => String(g.id) === String(prev.productGroupId))) {
        next.productGroupId = ''; changed = true;
      }
      if (prev.categoryId && !validCategories.some(c => String(c.id) === String(prev.categoryId))) {
        next.categoryId = ''; changed = true;
      }
      if (prev.supplierId && !validSuppliers.some(s => String(s.id) === String(prev.supplierId))) {
        next.supplierId = ''; changed = true;
      }
      return changed ? next : prev;
    });
  }, [validGroups, validCategories, validSuppliers]);

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (isProductReport(reportType)) {
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.supplierId) params.set('supplierId', filters.supplierId);
      if (filters.productGroupId) params.set('productGroupId', filters.productGroupId);
      if (filters.productType) params.set('productType', filters.productType);
    }
    if (isDateFilteredReport(reportType)) {
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.status) params.set('status', filters.status);
    }
    const qs = params.toString();
    return qs ? `${href}?${qs}` : href;
  };

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    setShowModal(false);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/i);
      const filename = filenameMatch?.[1] ?? 'reporte.xlsx';
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('No se pudo descargar el reporte. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (hasFilters) {
      setShowModal(true);
    } else {
      handleDownload();
    }
  };

  const set = (key: keyof FiltersState) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFilters(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Generando…</>
        ) : (
          <><Filter className="h-4 w-4" />{label}</>
        )}
      </button>

      {/* ── Filter Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border rounded-3xl">
          <div className="p-7">
            <DialogHeader className="mb-6 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">Filtros del Reporte</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">Selecciona los criterios de exportación</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* ── Product / Stock filters ── */}
              {isProductReport(reportType) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tipo de Producto</label>
                    <select
                      value={filters.productType}
                      onChange={set('productType')}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {PRODUCT_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Grupo de Producto</label>
                    <select
                      value={filters.productGroupId}
                      onChange={set('productGroupId')}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Todos los grupos</option>
                      {validGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoría</label>
                    <select
                      value={filters.categoryId}
                      onChange={set('categoryId')}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Todas las categorías</option>
                      {validCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {reportType === 'products' && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Proveedor</label>
                      <select
                        value={filters.supplierId}
                        onChange={set('supplierId')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Todos los proveedores</option>
                        {validSuppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.companyName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* ── Date & Status filters ── */}
              {isDateFilteredReport(reportType) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {isEmployeeReport(reportType) ? 'Contratado Desde' : 'Fecha Inicio'}
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={set('startDate')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {isEmployeeReport(reportType) ? 'Contratado Hasta' : 'Fecha Fin'}
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={set('endDate')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {(isEmployeeReport(reportType) || isSalesReport(reportType)) && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {isEmployeeReport(reportType) ? 'Estado del Empleado' : 'Estado de Venta'}
                      </label>
                      <select
                        value={filters.status}
                        onChange={set('status')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {(isEmployeeReport(reportType) ? EMPLOYEE_STATUSES : SALE_STATUSES).map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => setFilters({ categoryId: '', supplierId: '', productGroupId: '', productType: '', startDate: '', endDate: '', status: '' })}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition"
              >
                Limpiar filtros
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition shadow-md"
              >
                <Download className="h-4 w-4" />
                Descargar Excel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

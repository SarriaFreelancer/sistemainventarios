'use client';

import { useState } from 'react';
import { Download, Loader2, X, Filter, Calendar } from 'lucide-react';

interface LookupData {
  categories: { id: number; name: string }[];
  suppliers: { id: number; companyName: string }[];
  groups: { id: number; name: string }[];
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

const isProductReport = (type: string) => ['products', 'stock'].includes(type);
const isSalesReport = (type: string) => type === 'sales';

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

  const hasFilters = isProductReport(reportType) || isSalesReport(reportType);

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (isProductReport(reportType)) {
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.supplierId) params.set('supplierId', filters.supplierId);
      if (filters.productGroupId) params.set('productGroupId', filters.productGroupId);
      if (filters.productType) params.set('productType', filters.productType);
    }
    if (isSalesReport(reportType)) {
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
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md mx-4 bg-card border border-border rounded-3xl shadow-2xl p-7"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Filtros del Reporte</h3>
                  <p className="text-xs text-muted-foreground">Selecciona los criterios de exportación</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 hover:bg-muted text-muted-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoría</label>
                    <select
                      value={filters.categoryId}
                      onChange={set('categoryId')}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Todas las categorías</option>
                      {lookupData?.categories.map(c => (
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
                        {lookupData?.suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.companyName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Grupo de Producto</label>
                    <select
                      value={filters.productGroupId}
                      onChange={set('productGroupId')}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Todos los grupos</option>
                      {lookupData?.groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* ── Sales filters ── */}
              {isSalesReport(reportType) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        <Calendar className="inline h-3 w-3 mr-1" />Fecha Inicio
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
                        <Calendar className="inline h-3 w-3 mr-1" />Fecha Fin
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={set('endDate')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Estado de Venta</label>
                    <select
                      value={filters.status}
                      onChange={set('status')}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {SALE_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
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
        </div>
      )}
    </>
  );
}

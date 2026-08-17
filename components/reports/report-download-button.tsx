'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Loader2, Filter, Calendar, CheckSquare, Square, Save, Trash2, Layers, Sparkles, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generatePdfReport } from '@/lib/pdf-report-generator';

interface LookupData {
  categories: { id: number; name: string; productGroupId?: number | null }[];
  suppliers: { id: number; companyName: string }[];
  groups: { id: number; name: string }[];
  productMappings?: { type: string; productGroupId: number | null; categoryId: number; supplierId: number }[];
  trackExpirationDates?: boolean;
}

interface ReportDownloadButtonProps {
  href: string;
  reportType: string;
  label?: string;
  lookupData?: LookupData;
  supportPdf?: boolean;
}

interface ReportPresetDB {
  id: number;
  name: string;
  fields: string[];
}

type FiltersState = {
  categoryId: string;
  supplierId: string;
  productGroupId: string;
  productType: string;
  startDate: string;
  endDate: string;
  status: string;
  includeBatches: boolean;
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

export const REPORT_COLUMNS: Record<string, { id: string; label: string }[]> = {
  products: [
    { id: 'Código', label: 'Código de producto' },
    { id: 'Nombre', label: 'Nombre de producto' },
    { id: 'Tipo', label: 'Tipo de producto' },
    { id: 'Cód. Grupo', label: 'Código de grupo' },
    { id: 'Grupo', label: 'Nombre de grupo' },
    { id: 'Cód. Categoría', label: 'Código de categoría' },
    { id: 'Categoría', label: 'Nombre de categoría' },
    { id: 'Cód. Proveedor', label: 'Código de proveedor' },
    { id: 'Proveedor', label: 'Nombre de proveedor' },
    { id: 'Stock Total Disponible', label: 'Stock total disponible' },
    { id: 'Costo Unitario', label: 'Costo unitario' },
    { id: 'Precio Venta', label: 'Precio de venta' },
    { id: 'Margen (%)', label: 'Margen de ganancia (%)' },
    { id: 'Vendidos', label: 'Unidades vendidas' },
    { id: 'Estado Producto', label: 'Estado del producto' },
  ],
  stock: [
    { id: 'Código', label: 'Código de producto' },
    { id: 'Nombre', label: 'Nombre de producto' },
    { id: 'Tipo', label: 'Tipo de producto' },
    { id: 'Grupo', label: 'Grupo de producto' },
    { id: 'Categoría', label: 'Categoría' },
    { id: 'Stock Actual', label: 'Stock actual' },
    { id: 'Stock Mínimo', label: 'Stock mínimo' },
    { id: 'Estado Stock', label: 'Estado del stock' },
  ],
  sales: [
    { id: '# Venta', label: 'Número de venta' },
    { id: 'Fecha', label: 'Fecha' },
    { id: 'Cliente', label: 'Cliente' },
    { id: 'Productos', label: 'Productos comprados' },
    { id: 'Cantidad Total', label: 'Cantidad total' },
    { id: 'Descuento', label: 'Descuento' },
    { id: 'Costo Total', label: 'Costo total' },
    { id: 'Venta Total', label: 'Venta total' },
    { id: 'Utilidad Bruta', label: 'Utilidad bruta' },
    { id: 'Método de Pago', label: 'Método de pago' },
    { id: 'Estado', label: 'Estado de venta' },
  ],
  suppliers: [
    { id: 'Razón Social', label: 'Razón social / Empresa' },
    { id: 'Contacto', label: 'Persona de contacto' },
    { id: 'Teléfono', label: 'Teléfono' },
    { id: 'Email', label: 'Email' },
    { id: 'Dirección', label: 'Dirección' },
    { id: 'Ciudad', label: 'Ciudad' },
    { id: 'País', label: 'País' },
    { id: '# Productos', label: 'Productos asociados' },
    { id: 'Estado', label: 'Estado del proveedor' },
  ],
  purchases: [
    { id: 'Número Orden', label: 'Número de orden' },
    { id: 'Fecha Creación', label: 'Fecha de creación' },
    { id: 'Fecha Esperada', label: 'Fecha esperada' },
    { id: 'Proveedor', label: 'Proveedor' },
    { id: 'Subtotal', label: 'Subtotal' },
    { id: 'Impuestos', label: 'Impuestos' },
    { id: 'Total', label: 'Total' },
    { id: 'Estado', label: 'Estado de orden' },
    { id: 'Notas', label: 'Notas' },
  ],
  payroll: [
    { id: 'Código Nómina', label: 'Código de nómina' },
    { id: 'Período Inicio', label: 'Período inicio' },
    { id: 'Período Fin', label: 'Período fin' },
    { id: 'Fecha Pago', label: 'Fecha de pago' },
    { id: 'Estado', label: 'Estado de nómina' },
    { id: 'Empleado', label: 'Nombre del empleado' },
    { id: 'Documento', label: 'Documento de identidad' },
    { id: 'Cargo', label: 'Cargo' },
    { id: 'Salario Base', label: 'Salario base' },
    { id: 'Adiciones', label: 'Total adiciones' },
    { id: 'Deducciones', label: 'Total deducciones' },
    { id: 'Neto Pagado', label: 'Neto pagado' },
  ],
  employees: [
    { id: 'Nombres', label: 'Nombres' },
    { id: 'Apellidos', label: 'Apellidos' },
    { id: 'Documento', label: 'Documento de identidad' },
    { id: 'Correo Electrónico', label: 'Correo electrónico' },
    { id: 'Teléfono', label: 'Teléfono' },
    { id: 'Cargo', label: 'Cargo' },
    { id: 'Salario Base', label: 'Salario base' },
    { id: 'Fecha de Contratación', label: 'Fecha de contratación' },
    { id: 'Estado', label: 'Estado del empleado' },
  ],
};

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
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Selection mode: 'ALL' (todos los campos) vs 'CUSTOM' (escoger campos)
  const [exportMode, setExportMode] = useState<'ALL' | 'CUSTOM'>('ALL');
  
  const [filters, setFilters] = useState<FiltersState>({
    categoryId: '',
    supplierId: '',
    productGroupId: '',
    productType: '',
    startDate: '',
    endDate: '',
    status: '',
    includeBatches: false,
  });

  // Available columns for this report
  const availableColumns = useMemo(() => {
    let cols = REPORT_COLUMNS[reportType] || [];
    if (reportType === 'products' && filters.includeBatches) {
      cols = [
        ...cols,
        { id: 'Nº Lote', label: 'Nº Lote' },
        { id: 'Fecha Vencimiento', label: 'Fecha Vencimiento Lote' },
        { id: 'Cant. Lote', label: 'Cantidad Lote' },
        { id: 'Estado Lote', label: 'Estado Lote' },
        { id: 'Notas Lote', label: 'Notas Lote' },
      ];
    }
    return cols;
  }, [reportType, filters.includeBatches]);

  // Selected fields for custom export
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  // Saved DB presets state
  const [presets, setPresets] = useState<ReportPresetDB[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);

  // Initialize selected fields when columns change
  useEffect(() => {
    if (availableColumns.length > 0 && selectedFields.length === 0) {
      setSelectedFields(availableColumns.map(c => c.id));
    }
  }, [availableColumns]);

  // Fetch presets from MySQL DB via API
  const loadDbPresets = async () => {
    try {
      const res = await fetch(`/api/reports/presets?reportType=${encodeURIComponent(reportType)}`);
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets || []);
      }
    } catch (err) {
      console.error('Error loading DB report presets:', err);
    }
  };

  useEffect(() => {
    if (showModal) {
      loadDbPresets();
    }
  }, [showModal, reportType]);

  // Save preset to MySQL DB
  const handleSavePreset = async () => {
    if (!newPresetName.trim() || selectedFields.length === 0 || savingPreset) return;
    setSavingPreset(true);
    try {
      const res = await fetch('/api/reports/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          name: newPresetName.trim(),
          fields: selectedFields,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.preset) {
          setPresets(prev => [data.preset, ...prev]);
          setSelectedPresetId(String(data.preset.id));
        }
      } else {
        alert('No se pudo guardar la plantilla en la base de datos.');
      }
    } catch (err) {
      console.error('Error saving preset to DB:', err);
    } finally {
      setNewPresetName('');
      setShowSaveInput(false);
      setSavingPreset(false);
    }
  };

  // Delete preset from MySQL DB
  const handleDeletePreset = async (idStr: string) => {
    const id = Number(idStr);
    if (!id) return;
    try {
      const res = await fetch(`/api/reports/presets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPresets(prev => prev.filter(p => p.id !== id));
        if (selectedPresetId === idStr) setSelectedPresetId('');
      } else {
        alert('No se pudo eliminar la plantilla.');
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
    }
  };

  // Handle selecting a preset
  const handleSelectPreset = (idStr: string) => {
    setSelectedPresetId(idStr);
    if (!idStr) return;
    const preset = presets.find(p => String(p.id) === idStr);
    if (preset && Array.isArray(preset.fields)) {
      setSelectedFields(preset.fields as string[]);
    }
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(availableColumns.map(c => c.id));
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  // --- Cascading Logic ---
  const validGroups = useMemo(() => {
    if (!isProductReport(reportType) || !lookupData) return lookupData?.groups || [];
    let mappings = lookupData.productMappings || [];
    if (filters.productType) mappings = mappings.filter(m => m.type === filters.productType);
    const validGroupIds = new Set(mappings.map(m => m.productGroupId));
    return lookupData.groups.filter(g => validGroupIds.has(g.id) || !filters.productType);
  }, [lookupData, filters.productType, reportType]);

  const validCategories = useMemo(() => {
    if (!isProductReport(reportType) || !lookupData) return lookupData?.categories || [];
    let cats = lookupData.categories;
    if (filters.productGroupId) {
      cats = cats.filter(c => String(c.productGroupId) === String(filters.productGroupId));
    } else if (filters.productType) {
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
    if (!filters.productType && !filters.productGroupId && !filters.categoryId) return lookupData.suppliers;
    return lookupData.suppliers.filter(s => validSupplierIds.has(s.id));
  }, [lookupData, filters.productType, filters.productGroupId, filters.categoryId, reportType]);

  // Reset dependent filters
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

  const buildUrl = (extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (isProductReport(reportType)) {
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      if (filters.supplierId) params.set('supplierId', filters.supplierId);
      if (filters.productGroupId) params.set('productGroupId', filters.productGroupId);
      if (filters.productType) params.set('productType', filters.productType);
      if (filters.includeBatches) params.set('includeBatches', 'true');
    }
    if (isDateFilteredReport(reportType)) {
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);
      if (filters.status) params.set('status', filters.status);
    }
    if (exportMode === 'CUSTOM' && selectedFields.length > 0) {
      params.set('fields', selectedFields.join(','));
    }
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    }
    const qs = params.toString();
    return qs ? `${href}?${qs}` : href;
  };

  const handleDownloadExcel = async () => {
    if (loadingExcel || loadingPdf) return;
    setLoadingExcel(true);
    setShowModal(false);
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename="?([^";\n]+)"?/i);
      const filename = filenameMatch?.[1] ?? `reporte_${reportType}.xlsx`;
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('No se pudo descargar el reporte Excel. Intenta de nuevo.');
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (loadingExcel || loadingPdf) return;
    setLoadingPdf(true);
    setShowModal(false);
    try {
      const res = await fetch(buildUrl({ format: 'json' }));
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      const rows = json.rows || [];

      // Determine PDF column headers
      let targetCols = availableColumns;
      if (exportMode === 'CUSTOM' && selectedFields.length > 0) {
        targetCols = availableColumns.filter(c => selectedFields.includes(c.id));
      }

      const pdfColumns = targetCols.map(c => ({
        header: c.label,
        dataKey: c.id,
      }));

      generatePdfReport({
        title: json.title || `Reporte de ${reportType}`,
        subtitle: `Criterios: ${exportMode === 'CUSTOM' ? 'Campos seleccionados' : 'Listado completo'}`,
        filename: `reporte_${reportType}.pdf`,
        columns: pdfColumns,
        data: rows,
      });
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('No se pudo generar el reporte PDF. Intenta de nuevo.');
    } finally {
      setLoadingPdf(false);
    }
  };

  const set = (key: keyof FiltersState) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setFilters(f => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          disabled={loadingExcel || loadingPdf}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold transition-all duration-150 hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {loadingExcel ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Excel…</>
          ) : (
            <><Filter className="h-4 w-4" />Excel</>
          )}
        </button>

        <button
          onClick={() => setShowModal(true)}
          disabled={loadingExcel || loadingPdf}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-slate-800 text-white hover:bg-slate-700 text-xs font-semibold transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {loadingPdf ? (
            <><Loader2 className="h-4 w-4 animate-spin" />PDF…</>
          ) : (
            <><FileText className="h-4 w-4 text-red-400" />PDF</>
          )}
        </button>
      </div>

      {/* ── Filter & Custom Fields Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-card border-border rounded-3xl max-h-[90vh] flex flex-col">
          <div className="p-7 overflow-y-auto space-y-6 flex-1">
            <DialogHeader className="text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">Configuración de Reporte</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">Filtros y personalización de campos de exportación</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* ── Mode Switcher: Todos los Campos vs Campos Personalizados ── */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Modo de Exportación</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-2xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setExportMode('ALL')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    exportMode === 'ALL'
                      ? 'bg-card text-primary shadow-sm border border-border/80'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Listado Completo (Todos)
                </button>
                <button
                  type="button"
                  onClick={() => setExportMode('CUSTOM')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    exportMode === 'CUSTOM'
                      ? 'bg-card text-primary shadow-sm border border-border/80'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Escoger Campos
                </button>
              </div>
            </div>

            {/* ── Section 1: Filters ── */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" /> Filtros de Datos
              </h4>

              {isProductReport(reportType) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Tipo de Producto</label>
                      <select
                        value={filters.productType}
                        onChange={set('productType')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {PRODUCT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Grupo</label>
                      <select
                        value={filters.productGroupId}
                        onChange={set('productGroupId')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Todos los grupos</option>
                        {validGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Categoría</label>
                      <select
                        value={filters.categoryId}
                        onChange={set('categoryId')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Todas las categorías</option>
                        {validCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {reportType === 'products' && (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Proveedor</label>
                        <select
                          value={filters.supplierId}
                          onChange={set('supplierId')}
                          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">Todos los proveedores</option>
                          {validSuppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.companyName}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {lookupData?.trackExpirationDates && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="report-include-batches"
                        checked={filters.includeBatches}
                        onChange={(e) => setFilters(f => ({ ...f, includeBatches: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary cursor-pointer"
                      />
                      <label htmlFor="report-include-batches" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                        Incluir información de Lotes / Vencimientos
                      </label>
                    </div>
                  )}
                </>
              )}

              {isDateFilteredReport(reportType) && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {isEmployeeReport(reportType) ? 'Contratado Desde' : 'Fecha Inicio'}
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={set('startDate')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {isEmployeeReport(reportType) ? 'Contratado Hasta' : 'Fecha Fin'}
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={set('endDate')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {(isEmployeeReport(reportType) || isSalesReport(reportType)) && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        {isEmployeeReport(reportType) ? 'Estado del Empleado' : 'Estado de Venta'}
                      </label>
                      <select
                        value={filters.status}
                        onChange={set('status')}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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

            {/* ── Section 2: Custom Field Selection & Presets ── */}
            {exportMode === 'CUSTOM' && (
              <div className="space-y-4 pt-3 border-t border-border/40 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Campos a Incluir
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllFields}
                      className="text-primary hover:underline font-semibold"
                    >
                      Todos
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={clearAllFields}
                      className="text-muted-foreground hover:underline"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                {/* Preset Dropdown & Save Button (Stored in Database) */}
                <div className="space-y-2 p-3 bg-muted/20 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPresetId}
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Plantillas guardadas en BD...</option>
                      {presets.map(p => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>

                    {selectedPresetId && (
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(selectedPresetId)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition"
                        title="Eliminar plantilla de la BD"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowSaveInput(!showSaveInput)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Guardar BD
                    </button>
                  </div>

                  {showSaveInput && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40 animate-in slide-in-from-top-1 duration-150">
                      <input
                        type="text"
                        placeholder="Nombre de la plantilla (ej. Reporte de Precios)"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={handleSavePreset}
                        disabled={savingPreset}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition disabled:opacity-50"
                      >
                        {savingPreset ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Checkboxes Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableColumns.map((col) => {
                    const isChecked = selectedFields.includes(col.id);
                    return (
                      <button
                        type="button"
                        key={col.id}
                        onClick={() => toggleField(col.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all ${
                          isChecked
                            ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                            : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 shrink-0 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 shrink-0 text-muted-foreground/60" />
                        )}
                        <span className="truncate">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedFields.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-bold text-center">
                    ⚠️ Debes seleccionar al menos 1 campo para exportar.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer buttons: Excel and PDF */}
          <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
            <button
              onClick={() => setFilters({ categoryId: '', supplierId: '', productGroupId: '', productType: '', startDate: '', endDate: '', status: '', includeBatches: false })}
              className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
            >
              Limpiar
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={(exportMode === 'CUSTOM' && selectedFields.length === 0) || loadingPdf || loadingExcel}
                className="flex items-center gap-2 rounded-xl bg-slate-800 text-white px-4 py-2.5 text-xs font-semibold hover:bg-slate-700 active:scale-95 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPdf ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Generando PDF…</>
                ) : (
                  <><FileText className="h-4 w-4 text-red-400" />Descargar PDF</>
                )}
              </button>

              <button
                onClick={handleDownloadExcel}
                disabled={(exportMode === 'CUSTOM' && selectedFields.length === 0) || loadingPdf || loadingExcel}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingExcel ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Generando Excel…</>
                ) : (
                  <><Download className="h-4 w-4" />Descargar Excel</>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

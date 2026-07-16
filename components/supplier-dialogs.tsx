"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { updateSupplier, createSupplier, deleteSupplier } from "@/app/actions/supplier-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Plus, Factory, Trash2, CheckCircle2, XCircle, Mail, Phone, MapPin, Globe, Search } from "lucide-react";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { COLOMBIAN_CITIES } from "@/lib/colombian-cities";

interface Supplier {
  id: string;
  companyName: string;
  code: string | null;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  status: string;
  _count?: { products: number };
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

// ── Create Dialog ──────────────────────────────────────────────
export function CreateSupplierDialog() {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Bogotá");
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    formData.set('city', city);
    startTransition(async () => {
      const result = await createSupplier(formData);
      if (result.success) {
        successAlert('Proveedor Creado', 'El nuevo proveedor fue registrado exitosamente.');
        setOpen(false);
        setCity("Bogotá");
      } else {
        errorAlert('Error al Crear', result.error ?? 'No fue posible registrar el proveedor.');
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 h-11 rounded-2xl">
        <Plus className="h-4 w-4" />
        Nuevo Proveedor
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-violet-500/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Nuevo Proveedor
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sup-code" className={labelCls}>Código o NIT de Empresa</Label>
                <Input id="sup-code" name="code" placeholder="Ej. 900.123.456-1 o PROV-LOR" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-company" className={labelCls}>Nombre de la Empresa</Label>
                <Input id="sup-company" name="companyName" placeholder="Ej. L'Oréal S.A." className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-contact" className={labelCls}>Nombre de Contacto</Label>
                <Input id="sup-contact" name="contactName" placeholder="Ej. María Gómez" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-phone" className={labelCls}>Teléfono</Label>
                <Input id="sup-phone" name="phone" placeholder="+57 300 123 4567" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-email" className={labelCls}>Correo Electrónico</Label>
                <Input id="sup-email" name="email" type="email" placeholder="contacto@empresa.com" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-address" className={labelCls}>Dirección</Label>
                <Input id="sup-address" name="address" placeholder="Calle 123 #45-67" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-country" className={labelCls}>País</Label>
                <Input id="sup-country" name="country" defaultValue="Colombia" placeholder="Colombia" className={inputCls} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={labelCls}>Ciudad (Colombia)</Label>
                <SearchableSelect
                  options={COLOMBIAN_CITIES}
                  value={city}
                  onChange={setCity}
                  placeholder="Selecciona la ciudad..."
                  searchPlaceholder="Buscar ciudad colombiana..."
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sup-status" className={labelCls}>Estado</Label>
                <select id="sup-status" name="status" className={selectCls}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Crear Proveedor'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Edit Dialog ────────────────────────────────────────────────
export function EditSupplierDialog({ supplier }: { supplier: Supplier }) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(supplier.city);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    formData.set('city', city);
    startTransition(async () => {
      const result = await updateSupplier(formData);
      if (result.success) {
        successAlert('Proveedor Actualizado', 'Los cambios se guardaron correctamente.');
        setOpen(false);
      } else {
        errorAlert('Error al Actualizar', result.error ?? 'No fue posible guardar los cambios.');
      }
    });
  }

  return (
    <>
      <Button
        onClick={() => { setCity(supplier.city); setOpen(true); }}
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-violet-500/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Editar Proveedor
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <input type="hidden" name="id" value={supplier.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`edit-sup-code-${supplier.id}`} className={labelCls}>Código o NIT de Empresa</Label>
                <Input id={`edit-sup-code-${supplier.id}`} name="code" defaultValue={supplier.code ?? ""} placeholder="Ej. 900.123.456-1 o PROV-LOR" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-company-${supplier.id}`} className={labelCls}>Nombre de la Empresa</Label>
                <Input id={`edit-sup-company-${supplier.id}`} name="companyName" defaultValue={supplier.companyName} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-contact-${supplier.id}`} className={labelCls}>Nombre de Contacto</Label>
                <Input id={`edit-sup-contact-${supplier.id}`} name="contactName" defaultValue={supplier.contactName} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-phone-${supplier.id}`} className={labelCls}>Teléfono</Label>
                <Input id={`edit-sup-phone-${supplier.id}`} name="phone" defaultValue={supplier.phone} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-email-${supplier.id}`} className={labelCls}>Correo Electrónico</Label>
                <Input id={`edit-sup-email-${supplier.id}`} name="email" type="email" defaultValue={supplier.email} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-address-${supplier.id}`} className={labelCls}>Dirección</Label>
                <Input id={`edit-sup-address-${supplier.id}`} name="address" defaultValue={supplier.address} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-sup-country-${supplier.id}`} className={labelCls}>País</Label>
                <Input id={`edit-sup-country-${supplier.id}`} name="country" defaultValue={supplier.country || "Colombia"} className={inputCls} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className={labelCls}>Ciudad (Colombia)</Label>
                <SearchableSelect
                  options={COLOMBIAN_CITIES}
                  value={city}
                  onChange={setCity}
                  placeholder="Selecciona la ciudad..."
                  searchPlaceholder="Buscar ciudad colombiana..."
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`edit-sup-status-${supplier.id}`} className={labelCls}>Estado</Label>
                <select id={`edit-sup-status-${supplier.id}`} name="status" defaultValue={supplier.status} className={selectCls}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Delete Button ──────────────────────────────────────────────
export function DeleteSupplierButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await confirmAction(
      '¿Eliminar Proveedor?',
      `Se eliminará "${name}". Si hay productos asociados, primero deberás reasignarlos.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id);
        const result = await deleteSupplier(formData);
        if (result.success) {
          successAlert('Proveedor Eliminado', `"${name}" fue removido del sistema.`);
        } else {
          errorAlert('Error al Eliminar', result.error ?? 'No fue posible eliminar el proveedor.');
        }
      } catch {
        errorAlert('Error al Eliminar', 'No fue posible eliminar el proveedor. Puede tener productos asociados.');
      }
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={handleDelete}
      className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

// ── Full Page Component ────────────────────────────────────────
export function SuppliersClient({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const active = suppliers.filter(s => s.status === 'ACTIVE').length;
  const inactive = suppliers.filter(s => s.status === 'INACTIVE').length;

  const filteredSuppliers = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(s =>
      s.companyName.toLowerCase().includes(q) ||
      (s.code ?? '').toLowerCase().includes(q) ||
      s.contactName.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-[32px] bg-card border border-border shadow-md shadow-violet-500/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#B18ACF] to-[#8B5CF6] rounded-2xl text-white shadow-lg shadow-violet-500/25">
            <Factory className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Proveedores</h1>
            <p className="text-sm text-muted-foreground">Administra la lista de marcas y proveedores de tu inventario.</p>
          </div>
        </div>
        <div className="relative z-10">
          <CreateSupplierDialog />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: String(suppliers.length), sub: 'proveedores', color: 'text-foreground' },
          { label: 'Activos', value: String(active), sub: 'operativos', color: 'text-emerald-600' },
          { label: 'Inactivos', value: String(inactive), sub: 'sin actividad', color: 'text-muted-foreground' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="p-5 rounded-[24px] bg-card border border-border shadow-sm flex flex-col gap-2 hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Buscar por código, empresa, contacto o ciudad..."
          value={search}
          onChange={handleSearchChange}
          className="flex h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">Listado de proveedores</h2>
          <span className="text-xs text-muted-foreground font-medium">{filteredSuppliers.length} registros</span>
        </div>

        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Factory className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-foreground font-semibold">No se encontraron proveedores</p>
            <p className="text-muted-foreground text-sm mt-1">Registra tu primer proveedor o ajusta el filtro de búsqueda.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/20 border-b border-border/60">
                    <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Código</th>
                    <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Empresa</th>
                    <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden md:table-cell">Contacto</th>
                    <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden lg:table-cell">Correo</th>
                    <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden lg:table-cell">País / Ciudad</th>
                    <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden xl:table-cell">Productos</th>
                    <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Estado</th>
                    <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="group hover:bg-primary/5 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-muted-foreground bg-muted border border-border/80 px-2 py-1 rounded">
                          {supplier.code || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {supplier.companyName}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground md:hidden">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-sm font-medium text-foreground">{supplier.contactName}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{supplier.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex flex-col text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            {supplier.country}
                          </span>
                          <span className="flex items-center gap-1 mt-0.5 font-semibold text-foreground/80">
                            <MapPin className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            {supplier.city}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground font-medium">
                          {supplier._count?.products ?? 0} asignados
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {supplier.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary/20 text-muted-foreground border border-border">
                            <XCircle className="h-3 w-3" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <EditSupplierDialog supplier={supplier} />
                          <DeleteSupplierButton id={supplier.id} name={supplier.companyName} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/5 shrink-0">
                <p className="text-xs text-muted-foreground font-medium">
                  Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredSuppliers.length)} de {filteredSuppliers.length} registros
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
        )}
      </div>
    </div>
  );
}

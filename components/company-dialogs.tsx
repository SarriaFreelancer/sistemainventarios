"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Plus, Pencil, Trash2, XCircle, Folder, Search } from "lucide-react";
import { confirmAction, errorAlert, successAlert } from "@/lib/sweetalert";
import { createCompany, deleteCompany, updateCompany } from "@/app/actions/company-actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { COLOMBIAN_CITIES } from "@/lib/colombian-cities";
import { WORLD_COUNTRIES } from "@/lib/world-countries";

interface Module {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string;
  status: string;
  themeConfig?: { primaryColor?: string; mode?: string } | null;
  modules: number[];
  nit?: string | null;
  planId?: string | null;
  maxUsers?: number | null;
  maxProducts?: number | null;
  _count: { users: number };
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

const POPULAR_COUNTRIES = [
  "Colombia", "México", "España", "Argentina", "Chile", "Perú", "Ecuador", "Venezuela", 
  "Bolivia", "Uruguay", "Paraguay", "Costa Rica", "Panamá", "Guatemala", "Honduras", 
  "El Salvador", "República Dominicana", "Estados Unidos"
];

const POPULAR_CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", 
  "Manizales", "Cúcuta", "Ibagué", "Santa Marta", "Ciudad de México", "Guadalajara", 
  "Monterrey", "Puebla", "Tijuana", "León", "Madrid", "Barcelona", "Valencia", "Sevilla", 
  "Zaragoza", "Málaga", "Buenos Aires", "Santiago", "Lima", "Quito", "Guayaquil", 
  "Caracas", "Montevideo", "Asunción"
];

export function CreateCompanyDialog({ modules }: { modules: Module[] }) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Bogotá");
  const [country, setCountry] = useState("Colombia");
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    formData.set('city', city);
    formData.set('country', country);
    startTransition(async () => {
      const result = await createCompany(formData);
      if (result?.success) {
        successAlert('Empresa creada', 'La empresa fue registrada correctamente.');
        setOpen(false);
        setCity("Bogotá");
        setCountry("Colombia");
      } else {
        errorAlert('Error al crear', result?.error ?? 'No se pudo crear la empresa.');
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 h-11 rounded-2xl">
        <Plus className="h-4 w-4" />
        Nueva Empresa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-primary to-[#C5A059] rounded-full" />
              Nueva Empresa
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAction(new FormData(e.currentTarget)); }} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="company-name" className={labelCls}>Nombre</Label>
                <Input id="company-name" name="name" placeholder="Ej. GNS SarriaTech S.A.S." className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-nit" className={labelCls}>NIT / Código de Empresa</Label>
                <Input id="company-nit" name="nit" placeholder="Ej. 900.123.456-7" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-plan" className={labelCls}>Plan (Licencia)</Label>
                <select id="company-plan" name="planId" className={selectCls}>
                  <option value="basic">Básico</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-max-users" className={labelCls}>Límite Usuarios</Label>
                <Input id="company-max-users" name="maxUsers" type="number" placeholder="Ej. 10 (Opcional)" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-max-products" className={labelCls}>Límite Productos</Label>
                <Input id="company-max-products" name="maxProducts" type="number" placeholder="Ej. 2000 (Opcional)" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>País</Label>
                <SearchableSelect
                  options={WORLD_COUNTRIES}
                  value={country}
                  onChange={setCountry}
                  placeholder="Selecciona el país..."
                  searchPlaceholder="Buscar país..."
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-address" className={labelCls}>Dirección</Label>
                <Input id="company-address" name="address" placeholder="Calle 95 #14-60" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Ciudad</Label>
                <SearchableSelect
                  options={COLOMBIAN_CITIES}
                  value={city}
                  onChange={setCity}
                  placeholder="Selecciona la ciudad..."
                  searchPlaceholder="Buscar ciudad..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-status" className={labelCls}>Estado</Label>
                <select id="company-status" name="status" className={selectCls}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-theme-color" className={labelCls}>Color Primario</Label>
                <div className="flex gap-2 items-center">
                  <Input id="company-theme-color" type="color" name="themeColor" defaultValue="#8B5CF6" className="w-12 p-1 h-11 rounded-xl cursor-pointer bg-background" />
                  <span className="text-xs text-muted-foreground">Color de énfasis</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-theme-mode" className={labelCls}>Modo</Label>
                <select id="company-theme-mode" name="themeMode" className={selectCls}>
                  <option value="dark">Oscuro</option>
                  <option value="light">Claro</option>
                </select>
              </div>

              {/* Campos de Tema Oscuro Personalizable (Vacíos por defecto para usar diseño plano estándar) */}
              <input type="hidden" name="darkBgColor" value="" />
              <input type="hidden" name="darkCardBg" value="" />
              <input type="hidden" name="darkSidebarBg" value="" />
              <input type="hidden" name="darkTextColor" value="" />
              <div className="sm:col-span-2 space-y-2 mt-2">
                <Label className={labelCls}>Módulos Asignados</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-background/50 rounded-xl border border-border/80">
                  {modules.map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="modules" value={mod.id} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                      <span className="text-sm font-medium">{mod.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Crear Empresa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditCompanyDialog({ company, modules }: { company: Company; modules: Module[] }) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(company.city || "Bogotá");
  const [country, setCountry] = useState(company.country || "Colombia");
  const [primaryColor, setPrimaryColor] = useState(company.themeConfig?.primaryColor || "#3b82f6");
  const [darkBgColor, setDarkBgColor] = useState((company.themeConfig as any)?.darkBgColor || "#0a192f");
  const [darkCardBg, setDarkCardBg] = useState((company.themeConfig as any)?.darkCardBg || "#0f2744");
  const [darkSidebarBg, setDarkSidebarBg] = useState((company.themeConfig as any)?.darkSidebarBg || "#0d1f38");
  const [darkTextColor, setDarkTextColor] = useState((company.themeConfig as any)?.darkTextColor || "#93c5fd");
  const [isPending, startTransition] = useTransition();

  const applyPreset = (key: string) => {
    if (key === 'NONE') { setDarkBgColor(''); setDarkCardBg(''); setDarkSidebarBg(''); setDarkTextColor(''); }
    else if (key === 'BLUE') { setPrimaryColor('#3b82f6'); setDarkBgColor('#0a192f'); setDarkCardBg('#0f2744'); setDarkSidebarBg('#0d1f38'); setDarkTextColor('#93c5fd'); }
    else if (key === 'PURPLE') { setPrimaryColor('#8b5cf6'); setDarkBgColor('#130d2b'); setDarkCardBg('#1e1442'); setDarkSidebarBg('#1a1038'); setDarkTextColor('#c084fc'); }
    else if (key === 'EMERALD') { setPrimaryColor('#10b981'); setDarkBgColor('#062319'); setDarkCardBg('#0d3829'); setDarkSidebarBg('#0a2e22'); setDarkTextColor('#34d399'); }
    else if (key === 'AMBER') { setPrimaryColor('#f59e0b'); setDarkBgColor('#1c1917'); setDarkCardBg('#2b241c'); setDarkSidebarBg('#241e17'); setDarkTextColor('#fbbf24'); }
  };

  async function handleAction(formData: FormData) {
    formData.set('city', city);
    formData.set('country', country);
    startTransition(async () => {
      const result = await updateCompany(formData);
      if (result?.success) {
        successAlert('Empresa actualizada', 'Los cambios se guardaron correctamente.');
        setOpen(false);
      } else {
        errorAlert('Error al actualizar', result?.error ?? 'No se pudo actualizar la empresa.');
      }
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-primary to-[#C5A059] rounded-full" />
              Editar Empresa
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <input type="hidden" name="id" value={String(company.id)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`edit-name-${company.id}`} className={labelCls}>Nombre</Label>
                <Input id={`edit-name-${company.id}`} name="name" defaultValue={company.name} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-nit-${company.id}`} className={labelCls}>NIT / Código de Empresa</Label>
                <Input id={`edit-nit-${company.id}`} name="nit" defaultValue={company.nit || ''} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-plan-${company.id}`} className={labelCls}>Plan (Licencia)</Label>
                <select id={`edit-plan-${company.id}`} name="planId" defaultValue={company.planId || 'basic'} className={selectCls}>
                  <option value="basic">Básico</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-max-users-${company.id}`} className={labelCls}>Límite Usuarios</Label>
                <Input id={`edit-max-users-${company.id}`} name="maxUsers" type="number" defaultValue={company.maxUsers ?? ''} placeholder="Ej. 10 (Opcional)" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-max-products-${company.id}`} className={labelCls}>Límite Productos</Label>
                <Input id={`edit-max-products-${company.id}`} name="maxProducts" type="number" defaultValue={company.maxProducts ?? ''} placeholder="Ej. 2000 (Opcional)" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>País</Label>
                <SearchableSelect
                  options={WORLD_COUNTRIES}
                  value={country}
                  onChange={setCountry}
                  placeholder="Selecciona el país..."
                  searchPlaceholder="Buscar país..."
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`edit-company-address-${company.id}`} className={labelCls}>Dirección</Label>
                <Input id={`edit-company-address-${company.id}`} name="address" defaultValue={company.address ?? ''} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelCls}>Ciudad</Label>
                <SearchableSelect
                  options={COLOMBIAN_CITIES}
                  value={city}
                  onChange={setCity}
                  placeholder="Selecciona la ciudad..."
                  searchPlaceholder="Buscar ciudad..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-company-status-${company.id}`} className={labelCls}>Estado</Label>
                <select id={`edit-company-status-${company.id}`} name="status" defaultValue={company.status} className={selectCls}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-company-theme-color-${company.id}`} className={labelCls}>Color Primario</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    id={`edit-company-theme-color-${company.id}`} 
                    type="color" 
                    name="themeColor" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)} 
                    className="w-12 p-1 h-11 rounded-xl cursor-pointer bg-background" 
                  />
                  <span className="text-xs text-muted-foreground">{primaryColor}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-company-theme-mode-${company.id}`} className={labelCls}>Modo</Label>
                <select id={`edit-company-theme-mode-${company.id}`} name="themeMode" defaultValue={company.themeConfig?.mode ?? "dark"} className={selectCls}>
                  <option value="dark">Oscuro</option>
                  <option value="light">Claro</option>
                </select>
              </div>

              {/* Tema Oscuro Personalizable */}
              <input type="hidden" name="darkBgColor" value={darkBgColor} />
              <input type="hidden" name="darkCardBg" value={darkCardBg} />
              <input type="hidden" name="darkSidebarBg" value={darkSidebarBg} />
              <input type="hidden" name="darkTextColor" value={darkTextColor} />

              <div className="sm:col-span-2 space-y-2 pt-2 border-t border-border/40">
                <div className="flex justify-between items-center">
                  <Label className={labelCls}>Combinaciones de Tema Oscuro</Label>
                  <button type="button" onClick={() => applyPreset('NONE')} className="text-[10px] font-extrabold text-primary hover:underline cursor-pointer">
                    Restablecer (Sin Fondo)
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <button type="button" onClick={() => applyPreset('NONE')} className="p-1.5 rounded-xl border border-border bg-background text-muted-foreground text-[9.5px] font-extrabold text-center cursor-pointer hover:border-primary">Sin Fondo</button>
                  <button type="button" onClick={() => applyPreset('BLUE')} className="p-1.5 rounded-xl border border-blue-500/30 bg-[#0a192f] text-[#93c5fd] text-[9.5px] font-bold text-center cursor-pointer">Azul</button>
                  <button type="button" onClick={() => applyPreset('PURPLE')} className="p-1.5 rounded-xl border border-purple-500/30 bg-[#130d2b] text-[#c084fc] text-[9.5px] font-bold text-center cursor-pointer">Púrpura</button>
                  <button type="button" onClick={() => applyPreset('EMERALD')} className="p-1.5 rounded-xl border border-emerald-500/30 bg-[#062319] text-[#34d399] text-[9.5px] font-bold text-center cursor-pointer">Verde</button>
                  <button type="button" onClick={() => applyPreset('AMBER')} className="p-1.5 rounded-xl border border-amber-500/30 bg-[#1c1917] text-[#fbbf24] text-[9.5px] font-bold text-center cursor-pointer">Ámbar</button>
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2 mt-2">
                <Label className={labelCls}>Módulos Asignados</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-background/50 rounded-xl border border-border/80">
                  {modules.map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="modules" value={mod.id} defaultChecked={company.modules.includes(mod.id)} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                      <span className="text-sm font-medium">{mod.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
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

export function DeleteCompanyButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await confirmAction(
      '¿Eliminar Empresa?',
      `Se eliminará "${name}" si no tiene usuarios asignados.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', String(id));
      const result = await deleteCompany(formData);
      if (result?.success) {
        successAlert('Empresa eliminada', `La empresa "${name}" fue removida.`);
      } else {
        errorAlert('Error al eliminar', result?.error ?? 'No se pudo eliminar la empresa.');
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

export function CompaniesClient({ companies, modules }: { companies: Company[]; modules: Module[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const active = companies.filter((company) => company.status === 'ACTIVE').length;
  const inactive = companies.filter((company) => company.status === 'INACTIVE').length;

  const filteredCompanies = companies.filter(company => {
    const term = searchTerm.toLowerCase();
    const nameMatch = company.name.toLowerCase().includes(term);
    const nitMatch = company.nit?.toLowerCase().includes(term);
    const idMatch = String(company.id).includes(term); // Treated as "code"
    return nameMatch || nitMatch || idMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-7 rounded-[32px] bg-card border border-border shadow-md shadow-primary/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-primary to-[#C5A059] rounded-2xl text-white shadow-lg shadow-primary/25">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Empresas</h1>
            <p className="text-sm text-muted-foreground">Administra las empresas y sus usuarios dentro del ERP.</p>
          </div>
        </div>
        <div className="relative z-10">
          <CreateCompanyDialog modules={modules} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: String(companies.length), color: 'text-foreground' },
          { label: 'Activas', value: String(active), color: 'text-emerald-600' },
          { label: 'Inactivas', value: String(inactive), color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-5 rounded-[24px] bg-card border border-border shadow-sm flex flex-col gap-2 hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground">{label.toLowerCase()}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Buscar empresa por nombre, NIT o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card border-border shadow-sm rounded-2xl w-full text-base focus:ring-primary/20"
        />
      </div>

      <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">Listado de empresas</h2>
          <span className="text-xs text-muted-foreground font-medium">{filteredCompanies.length} registros</span>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-foreground font-semibold">No hay empresas registradas</p>
            <p className="text-muted-foreground text-sm mt-1">Agrega tu primera empresa con el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/60">
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Empresa</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden md:table-cell">Dirección</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden lg:table-cell">Ciudad</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Usuarios</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Estado</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="group hover:bg-primary/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.country} {company.nit ? `• NIT: ${company.nit}` : ''}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{company.address ?? '—'}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-sm text-muted-foreground">{company.city ?? '—'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted-foreground font-medium">{company._count.users} usuarios</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {company.status === 'ACTIVE' ? (
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
                        <EditCompanyDialog company={company} modules={modules} />
                        <DeleteCompanyButton id={company.id} name={company.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <datalist id="countries-list">
        {POPULAR_COUNTRIES.map(c => <option key={c} value={c} />)}
      </datalist>

      <datalist id="cities-list">
        {POPULAR_CITIES.map(c => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}

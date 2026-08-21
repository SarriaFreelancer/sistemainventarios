"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Plus, Pencil, Trash2, XCircle, Folder, Search, Building2, Users, FileText, SlidersHorizontal, ChevronDown, RotateCw, ChevronsUpDown } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const activeCount = companies.filter((company) => company.status === 'ACTIVE').length;
  const inactiveCount = companies.filter((company) => company.status === 'INACTIVE').length;
  const totalUsersCount = companies.reduce((acc, curr) => acc + (curr._count?.users || 0), 0);

  const filteredCompanies = companies.filter(company => {
    const term = searchTerm.toLowerCase();
    const nameMatch = company.name.toLowerCase().includes(term);
    const nitMatch = company.nit?.toLowerCase().includes(term);
    const cityMatch = company.city?.toLowerCase().includes(term);
    const addressMatch = company.address?.toLowerCase().includes(term);
    const idMatch = String(company.id).includes(term);
    return nameMatch || nitMatch || cityMatch || addressMatch || idMatch;
  });

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Iconos o tonos aleatorios ordenados para la estética de las tarjetas de lista
  const companyIconColors = [
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
    "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── 1. Encabezado Módulo Empresas ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Empresas</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Administra las empresas y sus usuarios dentro del ERP.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CreateCompanyDialog modules={modules} />
        </div>
      </div>

      {/* ── 2. Tarjetas de Estadísticas Principales (Sparklines) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Empresas */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">TOTAL EMPRESAS</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{companies.length}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Empresas registradas</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          {/* Wave SVG */}
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-emerald-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 20 Q 25 5, 50 15 T 100 10 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 20 Q 25 5, 50 15 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Activas */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">ACTIVAS</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{activeCount}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Empresas activas</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-blue-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 15 Q 30 22, 60 8 T 100 12 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 15 Q 30 22, 60 8 T 100 12" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Inactivas */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">INACTIVAS</p>
              <h3 className="text-3xl font-black text-amber-500 dark:text-amber-400 mt-1">{inactiveCount}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Empresas inactivas</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-amber-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 18 Q 20 10, 50 18 T 100 14 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 18 Q 20 10, 50 18 T 100 14" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Usuarios Totales */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">USUARIOS TOTALES</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{totalUsersCount}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Usuarios en todas las empresas</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-purple-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 22 Q 35 6, 70 18 T 100 8 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 22 Q 35 6, 70 18 T 100 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── 3. Buscador y Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar empresa por nombre, NIT o código..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border/60 rounded-2xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition"
          />
        </div>
        <button
          type="button"
          className="w-full sm:w-auto px-4 py-3 bg-card border border-border/60 rounded-2xl text-xs font-bold text-foreground flex items-center justify-center gap-2 hover:bg-muted/60 shadow-sm transition cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          Filtros
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
        </button>
      </div>

      {/* ── 4. Tabla / Listado de Empresas ── */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-black text-foreground tracking-tight">Listado de empresas</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-bold">{filteredCompanies.length} registros</span>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Refrescar listado"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {paginatedCompanies.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-3 text-muted-foreground">
              <Building2 className="h-7 w-7" />
            </div>
            <p className="text-foreground font-bold text-sm">No se encontraron empresas</p>
            <p className="text-muted-foreground text-xs mt-1">Intenta ajustando el término de búsqueda o crea una nueva empresa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">EMPRESA <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">DIRECCIÓN <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">CIUDAD <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">USUARIOS <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4 text-center">ESTADO</th>
                  <th className="py-2.5 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company, idx) => {
                  const iconColor = companyIconColors[idx % companyIconColors.length];
                  return (
                    <tr key={company.id} className="bg-muted/20 hover:bg-muted/50 transition border border-border/40 rounded-2xl group">
                      {/* Nombre & NIT */}
                      <td className="py-3 px-4 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-border/40 ${iconColor}`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-xs text-foreground group-hover:text-primary transition">{company.name}</h3>
                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              {company.country || 'Colombia'} {company.nit ? `• NIT: ${company.nit}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Dirección */}
                      <td className="py-3 px-4 text-xs font-medium text-foreground/80">
                        {company.address || '—'}
                      </td>

                      {/* Ciudad */}
                      <td className="py-3 px-4 text-xs font-medium text-foreground/80">
                        {company.city || '—'}
                      </td>

                      {/* Usuarios */}
                      <td className="py-3 px-4 text-xs font-semibold text-foreground/80">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {company._count?.users || 0} {company._count?.users === 1 ? 'usuario' : 'usuarios'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        {company.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center rounded-r-2xl">
                        <div className="flex items-center justify-center gap-1">
                          <EditCompanyDialog company={company} modules={modules} />
                          <DeleteCompanyButton id={company.id} name={company.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. Paginación Inferior ── */}
        {filteredCompanies.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium">
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredCompanies.length)} a {Math.min(currentPage * pageSize, filteredCompanies.length)} de {filteredCompanies.length} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                    currentPage === p
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "border border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

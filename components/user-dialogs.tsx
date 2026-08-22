"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Search, Eye, EyeOff, LockOpen, Building2, Globe, Shield, SlidersHorizontal, ChevronDown, RotateCw, ChevronsUpDown } from "lucide-react";
import { confirmAction, errorAlert, successAlert } from "@/lib/sweetalert";
import { createUser, updateUser, deleteUser, unlockUser } from "@/app/actions/user-actions";

interface Role { id: number; name: string; }
interface Company { id: number; name: string; }
interface User { id: number; name: string; email: string; image?: string | null; password?: string; role?: Role | null; company?: Company | null; isLocked?: boolean; }

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

function UserPasswordCell({ password }: { password?: string }) {
  const [show, setShow] = useState(false);

  if (!password) {
    return (
      <span className="text-[11px] font-medium text-muted-foreground/70 italic">
        (Sin clave legible)
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60 select-all">
        {show ? password : '••••••••'}
      </span>
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
        title={show ? "Ocultar contraseña" : "Ver contraseña"}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export function CreateUserDialog({ roles, companies, disabled = false, limitMessage = '' }: { roles: Role[]; companies: Company[], disabled?: boolean, limitMessage?: string }) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result?.success) {
        successAlert('Usuario creado', 'La cuenta fue creada correctamente.');
        setOpen(false);
      } else {
        errorAlert('Error al crear', result?.error ?? 'No se pudo crear el usuario.');
      }
    });
  }

  return (
    <>
      <button 
        type="button"
        onClick={() => {
          if (disabled) {
            errorAlert('Límite alcanzado', limitMessage);
            return;
          }
          setOpen(true);
        }} 
        className={`px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus className="h-4 w-4" />
        Nuevo Usuario
        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-primary to-[#C5A059] rounded-full" />
              Crear Usuario
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-name" className={labelCls}>Nombre</Label>
                <Input id="user-name" name="name" placeholder="Ej. Juan Pérez" className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email" className={labelCls}>Correo</Label>
                <Input id="user-email" name="email" type="email" placeholder="correo@empresa.com" className={inputCls} required />
              </div>
              <div className="space-y-1.5 relative">
                <Label htmlFor="user-password" className={labelCls}>Contraseña</Label>
                <div className="relative flex items-center">
                  <Input id="user-password" name="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" className={`${inputCls} pr-10`} required />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-role" className={labelCls}>Rol</Label>
                <select id="user-role" name="roleId" className={selectCls} required>
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="user-company" className={labelCls}>Empresa</Label>
                <select id="user-company" name="companyId" className={selectCls}>
                  <option value="">Sin empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditUserDialog({ user, roles, companies }: { user: User; roles: Role[]; companies: Company[] }) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await updateUser(formData);
      if (result?.success) {
        successAlert('Usuario actualizado', 'Los cambios se guardaron correctamente.');
        setOpen(false);
      } else {
        errorAlert('Error al actualizar', result?.error ?? 'No se pudo actualizar el usuario.');
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
              Editar Usuario
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <input type="hidden" name="id" value={String(user.id)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`edit-user-name-${user.id}`} className={labelCls}>Nombre</Label>
                <Input id={`edit-user-name-${user.id}`} name="name" defaultValue={user.name} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-user-email-${user.id}`} className={labelCls}>Correo</Label>
                <Input id={`edit-user-email-${user.id}`} name="email" type="email" defaultValue={user.email} className={inputCls} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-user-password-${user.id}`} className={labelCls}>Contraseña</Label>
                <div className="relative flex items-center">
                  <Input id={`edit-user-password-${user.id}`} name="password" type={showPassword ? "text" : "password"} defaultValue={user.password ?? ''} placeholder="Dejar en blanco para no cambiar" className={`${inputCls} pr-10`} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`edit-user-role-${user.id}`} className={labelCls}>Rol</Label>
                <select id={`edit-user-role-${user.id}`} name="roleId" defaultValue={user.role?.id ?? ''} className={selectCls} required>
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`edit-user-company-${user.id}`} className={labelCls}>Empresa</Label>
                <select id={`edit-user-company-${user.id}`} name="companyId" defaultValue={user.company?.id ?? ''} className={selectCls}>
                  <option value="">Sin empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
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

export function DeleteUserButton({ id, name }: { id: number, name: string }) {
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    const confirmed = await confirmAction(
      '¿Eliminar usuario?',
      `Esta acción eliminará a "${name}" y es irreversible.`
    );
    if (confirmed) {
      startTransition(async () => {
        const formData = new FormData();
        formData.append('id', String(id));
        const result = await deleteUser(formData);
        if (result?.success) {
          successAlert('Usuario eliminado', 'El usuario ha sido eliminado con éxito.');
        } else {
          errorAlert('Error', result?.error ?? 'Hubo un error al eliminar el usuario.');
        }
      });
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function UnlockUserButton({ id, name }: { id: number, name: string }) {
  const [isPending, startTransition] = useTransition();

  async function handleUnlock() {
    const confirmed = await confirmAction(
      '¿Desbloquear usuario?',
      `El usuario "${name}" podrá volver a iniciar sesión.`
    );
    if (confirmed) {
      startTransition(async () => {
        const result = await unlockUser(id);
        if (result?.success) {
          successAlert('Usuario desbloqueado', 'El usuario ha sido desbloqueado con éxito.');
        } else {
          errorAlert('Error', result?.error ?? 'Hubo un error al desbloquear el usuario.');
        }
      });
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleUnlock} disabled={isPending} className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl" title="Desbloquear cuenta">
      <LockOpen className="h-4 w-4" />
    </Button>
  );
}

export function UsersClient({ 
  users, 
  roles, 
  companies,
  maxUsers = 9999,
  currentUsers = 0,
  planName = 'Plan Premium'
}: { 
  users: User[]; 
  roles: Role[]; 
  companies: Company[];
  maxUsers?: number;
  currentUsers?: number;
  planName?: string;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalUsers = users.length;
  const companyUsers = users.filter((user) => !!user.company).length;
  const globalUsers = totalUsers - companyUsers;
  const activeRolesCount = roles.length;

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchesSearch = !q || (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.role?.name ?? '').toLowerCase().includes(q) ||
        (u.company?.name ?? '').toLowerCase().includes(q)
      );

      const matchesRole = !roleFilter || u.role?.name === roleFilter;
      const matchesCompany = !companyFilter || (
        companyFilter === 'GLOBAL' ? !u.company : u.company?.name === companyFilter
      );

      return matchesSearch && matchesRole && matchesCompany;
    });
  }, [users, search, roleFilter, companyFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Mapeo de estilos pastel para badges de roles
  const getRoleBadgeStyle = (roleName?: string) => {
    switch (roleName?.toUpperCase()) {
      case 'SUPERADMIN':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20';
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20';
      case 'VENTAS':
      case 'SELLER':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ── 1. Encabezado Módulo Usuarios ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">Gestión de usuarios</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Administra usuarios, roles y permisos en todas las empresas.</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
          <CreateUserDialog 
            roles={roles} 
            companies={companies} 
            disabled={currentUsers >= maxUsers}
            limitMessage={`Has alcanzado el límite de ${maxUsers} usuarios de tu ${planName}.`}
          />
          {maxUsers < 9999 && (
            <p className="text-[10px] font-black tracking-wider text-muted-foreground uppercase">
              {currentUsers} / {maxUsers} USUARIOS ({planName.toUpperCase()})
            </p>
          )}
        </div>
      </div>

      {/* ── 2. Tarjetas de Estadísticas Principales (Sparklines) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Usuarios */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">TOTAL USUARIOS</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{totalUsers}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">En todo el sistema</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-emerald-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 20 Q 25 5, 50 15 T 100 10 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 20 Q 25 5, 50 15 T 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Usuarios con Empresa */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">USUARIOS CON EMPRESA</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{companyUsers}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Asignados a empresas</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-blue-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 15 Q 30 22, 60 8 T 100 12 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 15 Q 30 22, 60 8 T 100 12" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Usuarios Globales */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">USUARIOS GLOBALES</p>
              <h3 className="text-3xl font-black text-purple-500 dark:text-purple-400 mt-1">{globalUsers}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Sin empresa asignada</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-purple-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 22 Q 35 6, 70 18 T 100 8 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 22 Q 35 6, 70 18 T 100 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Roles Activos */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">ROLES ACTIVOS</p>
              <h3 className="text-3xl font-black text-foreground mt-1">{activeRolesCount}</h3>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">Roles configurados</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full h-8 mt-2">
            <svg className="w-full h-full text-amber-500/30" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M0 18 Q 20 10, 50 18 T 100 14 L 100 25 L 0 25 Z" fill="currentColor" />
              <path d="M0 18 Q 20 10, 50 18 T 100 14" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── 3. Buscador y Filtros Desplegables ── */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, rol o empresa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border/60 rounded-2xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Select de Roles */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-card border border-border/60 rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer"
          >
            <option value="">Todos los roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          {/* Select de Empresas */}
          <select
            value={companyFilter}
            onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
            className="px-4 py-3 bg-card border border-border/60 rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer"
          >
            <option value="">Todas las empresas</option>
            <option value="GLOBAL">Global (Sin empresa)</option>
            {companies.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* Botón Filtros */}
          <button
            type="button"
            className="px-4 py-3 bg-card border border-border/60 rounded-2xl text-xs font-bold text-foreground flex items-center gap-2 hover:bg-muted/60 shadow-sm transition cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            Filtros
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center">1</span>
          </button>
        </div>
      </div>

      {/* ── 4. Tabla / Listado de Usuarios ── */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-black text-foreground tracking-tight">Listado de usuarios</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-bold">{filteredUsers.length} registros</span>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Refrescar listado"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {paginatedUsers.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-3 text-muted-foreground">
              <Users className="h-7 w-7" />
            </div>
            <p className="text-foreground font-bold text-sm">No se encontraron usuarios</p>
            <p className="text-muted-foreground text-xs mt-1">Intenta ajustando los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">USUARIO <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">CORREO <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">ROL <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">
                    <span className="flex items-center gap-1">EMPRESA <ChevronsUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                  <th className="py-2.5 px-4">CONTRASEÑA</th>
                  <th className="py-2.5 px-4 text-center">ESTADO</th>
                  <th className="py-2.5 px-4">ACCESO</th>
                  <th className="py-2.5 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const isUserActive = !user.isLocked;
                  const roleStyle = getRoleBadgeStyle(user.role?.name);

                  return (
                    <tr key={user.id} className="bg-muted/20 hover:bg-muted/50 transition border border-border/40 rounded-2xl group">
                      {/* Avatar & Nombre */}
                      <td className="py-3 px-4 rounded-l-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-border/60 bg-muted shrink-0 shadow-sm">
                            <img
                              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-xs text-foreground group-hover:text-primary transition">{user.name}</h3>
                            {user.name.toLowerCase().includes('admin') && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px]">Tú</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="py-3 px-4 text-xs font-medium text-foreground/80">
                        {user.email}
                      </td>

                      {/* Rol */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${roleStyle}`}>
                          {user.role?.name ?? 'USER'}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="py-3 px-4 text-xs font-medium text-foreground/80">
                        {user.company?.name ?? 'Global'}
                      </td>

                      {/* Contraseña */}
                      <td className="py-3 px-4">
                        <UserPasswordCell password={user.password} />
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        {isUserActive ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acceso */}
                      <td className="py-3 px-4 text-[11px] font-medium text-muted-foreground">
                        12/05/2024 09:15 a. m.
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center rounded-r-2xl">
                        <div className="flex items-center justify-center gap-1">
                          <EditUserDialog user={user} roles={roles} companies={companies} />
                          <DeleteUserButton id={user.id} name={user.name} />
                          {user.isLocked && <UnlockUserButton id={user.id} name={user.name} />}
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
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground font-medium">
              Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredUsers.length)} a {Math.min(currentPage * pageSize, filteredUsers.length)} de {filteredUsers.length} registros
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

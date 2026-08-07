"use client";

import { useState, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Search, Eye, EyeOff } from "lucide-react";
import { confirmAction, errorAlert, successAlert } from "@/lib/sweetalert";
import { createUser, updateUser, deleteUser } from "@/app/actions/user-actions";

interface Role { id: number; name: string; }
interface Company { id: number; name: string; }
interface User { id: number; name: string; email: string; image?: string | null; password?: string; role?: Role | null; company?: Company | null; }

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
      <Button 
        onClick={() => {
          if (disabled) {
            errorAlert('Límite alcanzado', limitMessage);
            return;
          }
          setOpen(true);
        }} 
        className={`flex items-center gap-2 px-5 h-11 rounded-2xl ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus className="h-4 w-4" />
        Nuevo Usuario
      </Button>

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

export function DeleteUserButton({ id, name }: { id: number; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await confirmAction(
      '¿Eliminar Usuario?',
      `Se eliminará el usuario "${name}" de la plataforma.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', String(id));
      const result = await deleteUser(formData);
      if (result?.success) {
        successAlert('Usuario eliminado', `El usuario "${name}" fue removido.`);
      } else {
        errorAlert('Error al eliminar', result?.error ?? 'No fue posible eliminar el usuario.');
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
  const activeUsers = users.length;
  const companyScoped = users.filter((user) => !!user.company).length;
  const globalUsers = users.length - companyScoped;

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role?.name ?? '').toLowerCase().includes(q) ||
      (u.company?.name ?? '').toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-[32px] bg-card border border-border shadow-md shadow-primary/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-primary to-[#C5A059] rounded-2xl text-white shadow-lg shadow-primary/25">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Usuarios</h1>
            <p className="text-sm text-muted-foreground">Gestiona cuentas, roles y alcance de empresas.</p>
          </div>
        </div>
        <div className="relative z-10">
          <div className="flex flex-col items-end gap-2">
            <CreateUserDialog 
              roles={roles} 
              companies={companies} 
              disabled={currentUsers >= maxUsers}
              limitMessage={`Has alcanzado el límite de ${maxUsers} usuarios de tu ${planName}.`}
            />
            {maxUsers < 9999 && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                {currentUsers} / {maxUsers} Usuarios ({planName})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: String(activeUsers), color: 'text-foreground' },
          { label: 'Usuarios con Empresa', value: String(companyScoped), color: 'text-emerald-600' },
          { label: 'Usuarios Globales', value: String(globalUsers), color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-5 rounded-[24px] bg-card border border-border shadow-sm flex flex-col gap-2 hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground">{label.toLowerCase()}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo, rol o empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-border/80 bg-card pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">Listado de usuarios</h2>
          <span className="text-xs text-muted-foreground font-medium">{filteredUsers.length} registros</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-foreground font-semibold">No se encontraron usuarios</p>
            <p className="text-muted-foreground text-sm mt-1">Prueba con otro término de búsqueda o crea uno nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-muted/20 border-b border-border/60">
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Nombre</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Correo</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Contraseña</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden lg:table-cell">Rol</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden xl:table-cell">Empresa</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-primary/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-muted shrink-0 shadow-sm">
                          <img
                            src={user.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-muted-foreground truncate max-w-[240px]">{user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <UserPasswordCell password={user.password} />
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm font-bold text-foreground">{user.role?.name ?? 'Sin rol'}</span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">{user.company?.name ?? 'Global'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <EditUserDialog user={user} roles={roles} companies={companies} />
                        <DeleteUserButton id={user.id} name={user.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

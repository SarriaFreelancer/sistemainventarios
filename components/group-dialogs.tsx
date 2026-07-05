"use client";

import { useState, useTransition } from "react";
import { createGroup, updateGroup, deleteGroup } from "@/app/actions/group-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Plus, Folder, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";

interface ProductGroup {
  id: string;
  name: string;
  status: string;
  _count?: { products: number };
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      const res = await createGroup(formData);
      if (res.success) {
        successAlert('Grupo Creado', 'El grupo fue registrado correctamente.');
        setOpen(false);
      } else {
        errorAlert('Error', res.error ?? 'No se pudo crear el grupo.');
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 h-11 rounded-2xl">
        <Plus className="h-4 w-4" />
        Nuevo Grupo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-violet-500/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Nuevo Grupo de Producto
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="group-name" className={labelCls}>Nombre del Grupo</Label>
              <Input id="group-name" name="name" placeholder="Ej. Skin Care Premium" className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="group-status" className={labelCls}>Estado</Label>
              <select id="group-status" name="status" className={selectCls}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Crear Grupo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditGroupDialog({ group }: { group: ProductGroup }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      const res = await updateGroup(formData);
      if (res.success) {
        successAlert('Grupo Actualizado', 'Los cambios fueron guardados exitosamente.');
        setOpen(false);
      } else {
        errorAlert('Error', res.error ?? 'No se pudo actualizar el grupo.');
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
        <DialogContent className="sm:max-w-[450px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-violet-500/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Editar Grupo
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <input type="hidden" name="id" value={group.id} />
            <div className="space-y-1.5">
              <Label htmlFor={`edit-group-name-${group.id}`} className={labelCls}>Nombre del Grupo</Label>
              <Input id={`edit-group-name-${group.id}`} name="name" defaultValue={group.name} className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-group-status-${group.id}`} className={labelCls}>Estado</Label>
              <select id={`edit-group-status-${group.id}`} name="status" defaultValue={group.status} className={selectCls}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
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

export function DeleteGroupButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await confirmAction(
      '¿Eliminar Grupo?',
      `Se eliminará el grupo "${name}". Si hay productos asociados, primero deberás reasignarlos.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id);
      const res = await deleteGroup(formData);
      if (res.success) {
        successAlert('Grupo Eliminado', `"${name}" fue removido.`);
      } else {
        errorAlert('Error al Eliminar', res.error ?? 'No se pudo eliminar el grupo.');
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

export function GroupsClient({ groups }: { groups: ProductGroup[] }) {
  const active = groups.filter(g => g.status === 'ACTIVE').length;
  const inactive = groups.filter(g => g.status === 'INACTIVE').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-[32px] bg-card border border-border shadow-md shadow-violet-500/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#B18ACF] to-[#8B5CF6] rounded-2xl text-white shadow-lg shadow-violet-500/25">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Grupos de Productos</h1>
            <p className="text-sm text-muted-foreground">Clasifica y administra los grupos principales de tus productos.</p>
          </div>
        </div>
        <div className="relative z-10">
          <CreateGroupDialog />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Grupos', value: String(groups.length), sub: 'clasificaciones', color: 'text-foreground' },
          { label: 'Activos', value: String(active), sub: 'en uso', color: 'text-emerald-600' },
          { label: 'Inactivos', value: String(inactive), sub: 'desactivados', color: 'text-muted-foreground' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="p-5 rounded-[24px] bg-card border border-border shadow-sm flex flex-col gap-2 hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground">Listado de Grupos</h2>
          <span className="text-xs text-muted-foreground font-medium">{groups.length} registros</span>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Folder className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-foreground font-semibold">No hay grupos registrados</p>
            <p className="text-muted-foreground text-sm mt-1">Crea tu primer grupo con el botón de arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/60">
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Nombre</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Productos Asociados</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Estado</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {groups.map((group) => (
                  <tr key={group.id} className="group hover:bg-primary/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {group.name}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-muted-foreground font-medium">
                        {group._count?.products ?? 0} productos
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {group.status === 'ACTIVE' ? (
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
                        <EditGroupDialog group={group} />
                        <DeleteGroupButton id={group.id} name={group.name} />
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

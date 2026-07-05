"use client";

import { useState, useTransition } from "react";
import { updateCategory, createCategory, deleteCategory } from "@/app/actions/category-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Plus, Tags, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";

interface Category {
  id: string;
  name: string;
  description: string | null;
  status: string;
  _count?: { products: number };
}

const inputCls = "bg-background/50 border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground placeholder:text-muted-foreground/50 h-11 rounded-xl";
const selectCls = "flex h-11 w-full rounded-xl border border-border/80 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300";
const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

// ── Create Dialog ──────────────────────────────────────────────
export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      await createCategory(formData);
      successAlert('Categoría Creada', 'La nueva categoría fue registrada exitosamente.');
      setOpen(false);
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2 px-5 h-11 rounded-2xl">
        <Plus className="h-4 w-4" />
        Nueva Categoría
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[32px] border-border/60 bg-card p-8 shadow-2xl shadow-violet-500/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-[#B18ACF] to-[#8B5CF6] rounded-full" />
              Nueva Categoría
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className={labelCls}>Nombre</Label>
              <Input id="cat-name" name="name" placeholder="Ej. Labiales" className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className={labelCls}>Descripción</Label>
              <Input id="cat-desc" name="description" placeholder="Descripción opcional..." className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-status" className={labelCls}>Estado</Label>
              <select id="cat-status" name="status" className={selectCls}>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando...' : 'Crear Categoría'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Edit Dialog ────────────────────────────────────────────────
export function EditCategoryDialog({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      await updateCategory(formData);
      successAlert('Categoría Actualizada', 'Los cambios se guardaron correctamente.');
      setOpen(false);
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
              Editar Categoría
            </DialogTitle>
          </DialogHeader>
          <form action={handleAction} className="space-y-5 mt-2">
            <input type="hidden" name="id" value={category.id} />
            <div className="space-y-1.5">
              <Label htmlFor={`edit-cat-name-${category.id}`} className={labelCls}>Nombre</Label>
              <Input id={`edit-cat-name-${category.id}`} name="name" defaultValue={category.name} className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-cat-desc-${category.id}`} className={labelCls}>Descripción</Label>
              <Input id={`edit-cat-desc-${category.id}`} name="description" defaultValue={category.description ?? ""} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`edit-cat-status-${category.id}`} className={labelCls}>Estado</Label>
              <select id={`edit-cat-status-${category.id}`} name="status" defaultValue={category.status} className={selectCls}>
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

// ── Delete Button ──────────────────────────────────────────────
export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await confirmAction(
      '¿Eliminar Categoría?',
      `Se eliminará "${name}". Si hay productos asignados, primero deberás reasignarlos.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmed) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id);
        await deleteCategory(formData);
        successAlert('Categoría Eliminada', `"${name}" fue removida del sistema.`);
      } catch {
        errorAlert('Error al Eliminar', 'No fue posible eliminar la categoría. Puede tener productos asignados.');
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
export function CategoriesClient({ categories }: { categories: Category[] }) {
  const active = categories.filter(c => c.status === 'ACTIVE').length;
  const inactive = categories.filter(c => c.status === 'INACTIVE').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-7 rounded-[32px] bg-card border border-border shadow-md shadow-violet-500/5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-[#B18ACF] to-[#8B5CF6] rounded-2xl text-white shadow-lg shadow-violet-500/25">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Categorías</h1>
            <p className="text-sm text-muted-foreground">Organiza los productos de Dulche Dorelle por categoría.</p>
          </div>
        </div>
        <div className="relative z-10">
          <CreateCategoryDialog />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: String(categories.length), sub: 'categorías', color: 'text-foreground' },
          { label: 'Activas', value: String(active), sub: 'en uso', color: 'text-emerald-600' },
          { label: 'Inactivas', value: String(inactive), sub: 'desactivadas', color: 'text-muted-foreground' },
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
          <h2 className="text-base font-extrabold text-foreground">Listado de categorías</h2>
          <span className="text-xs text-muted-foreground font-medium">{categories.length} registros</span>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Tags className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-foreground font-semibold">No hay categorías registradas</p>
            <p className="text-muted-foreground text-sm mt-1">Crea tu primera categoría con el botón de arriba.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/20 border-b border-border/60">
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Nombre</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden sm:table-cell">Descripción</th>
                  <th className="text-left text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3 hidden md:table-cell">Productos</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-4 py-3">Estado</th>
                  <th className="text-center text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {categories.map((category) => (
                  <tr key={category.id} className="group hover:bg-primary/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {category.name}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {category.description || <span className="italic text-muted-foreground/40">Sin descripción</span>}
                      </p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground font-medium">
                        {category._count?.products ?? 0} productos
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {category.status === 'ACTIVE' ? (
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
                        <EditCategoryDialog category={category} />
                        <DeleteCategoryButton id={category.id} name={category.name} />
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

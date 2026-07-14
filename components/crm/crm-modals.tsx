'use client';

import { useRef, useState, useTransition } from 'react';
import {
  createCustomer,
  updateCustomer,
  createOpportunity,
} from '@/app/actions/crm-actions';
import { CustomerStatus, OpportunityStage } from '@prisma/client';
import { X, UserPlus, Briefcase, Loader2 } from 'lucide-react';
import { successAlert, errorAlert } from '@/lib/sweetalert';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  city: string | null;
  status: CustomerStatus;
}

interface CrmModalsProps {
  customers: { id: string; name: string }[];
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputCls =
  'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200';
const selectCls =
  'h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200';
const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5';

// ─── Backdrop ─────────────────────────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60"
      onClick={onClick}
    />
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

function ModalPanel({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl shadow-violet-500/10">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-7 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                {icon}
              </span>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Body */}
          <div className="px-7 py-6">{children}</div>
        </div>
      </div>
    </>
  );
}

// ─── Submit Button ────────────────────────────────────────────────────────────

function SubmitBtn({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );
}

// ─── Create Customer Modal ────────────────────────────────────────────────────

function CreateCustomerModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCustomer(formData);
      if (res.success) {
        successAlert('Cliente Creado', 'El cliente fue registrado exitosamente.');
        onClose();
      } else {
        errorAlert('Error', res.error ?? 'Error al crear el cliente.');
      }
    });
  }

  return (
    <ModalPanel
      title="Nuevo Cliente"
      icon={<UserPlus className="h-5 w-5" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input name="name" required placeholder="Ej. Juan Pérez" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input name="email" type="email" placeholder="juan@empresa.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input name="phone" placeholder="+57 300 123 4567" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Empresa</label>
            <input name="company" placeholder="Nombre de empresa" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Ciudad</label>
            <input name="city" placeholder="Bogotá" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select name="status" className={selectCls} defaultValue={CustomerStatus.ACTIVE}>
              <option value={CustomerStatus.ACTIVE}>Activo</option>
              <option value={CustomerStatus.INACTIVE}>Inactivo</option>
              <option value={CustomerStatus.PROSPECT}>Prospecto</option>
              <option value={CustomerStatus.WON}>Ganado</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Dirección</label>
          <input name="address" placeholder="Calle 123 # 45-67" className={inputCls} />
        </div>
        <div className="pt-2">
          <SubmitBtn pending={isPending} label="Crear Cliente" />
        </div>
      </form>
    </ModalPanel>
  );
}

// ─── Edit Customer Modal ──────────────────────────────────────────────────────

function EditCustomerModal({
  customer,
  onClose,
}: {
  customer: CustomerRow;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('id', customer.id);
    startTransition(async () => {
      const res = await updateCustomer(formData);
      if (res.success) {
        successAlert('Cliente Actualizado', 'El cliente fue actualizado exitosamente.');
        onClose();
      } else {
        errorAlert('Error', res.error ?? 'Error al actualizar el cliente.');
      }
    });
  }

  return (
    <ModalPanel
      title="Editar Cliente"
      icon={<UserPlus className="h-5 w-5" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="id" value={customer.id} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input
              name="name"
              required
              defaultValue={customer.name}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              name="email"
              type="email"
              defaultValue={customer.email ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Teléfono</label>
            <input
              name="phone"
              defaultValue={customer.phone ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Empresa</label>
            <input
              name="company"
              defaultValue={customer.company ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Ciudad</label>
            <input
              name="city"
              defaultValue={customer.city ?? ''}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Estado</label>
            <select name="status" className={selectCls} defaultValue={customer.status}>
              <option value={CustomerStatus.ACTIVE}>Activo</option>
              <option value={CustomerStatus.INACTIVE}>Inactivo</option>
              <option value={CustomerStatus.PROSPECT}>Prospecto</option>
              <option value={CustomerStatus.WON}>Ganado</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <SubmitBtn pending={isPending} label="Guardar Cambios" />
        </div>
      </form>
    </ModalPanel>
  );
}

// ─── Create Opportunity Modal ─────────────────────────────────────────────────

function CreateOpportunityModal({
  customers,
  defaultCustomerId,
  onClose,
}: {
  customers: { id: string; name: string }[];
  defaultCustomerId?: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createOpportunity(formData);
      if (res.success) {
        successAlert('Oportunidad Creada', 'La oportunidad fue registrada exitosamente.');
        onClose();
      } else {
        errorAlert('Error', res.error ?? 'Error al crear la oportunidad.');
      }
    });
  }

  return (
    <ModalPanel
      title="Nueva Oportunidad"
      icon={<Briefcase className="h-5 w-5" />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Título *</label>
          <input
            name="title"
            required
            placeholder="Ej. Propuesta de software"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cliente *</label>
            <select
              name="customerId"
              required
              className={selectCls}
              defaultValue={defaultCustomerId ?? ''}
            >
              <option value="">Seleccionar cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Etapa</label>
            <select name="stage" className={selectCls} defaultValue={OpportunityStage.NEW}>
              <option value={OpportunityStage.NEW}>Nueva</option>
              <option value={OpportunityStage.CONTACTED}>Contactado</option>
              <option value={OpportunityStage.QUALIFIED}>Calificado</option>
              <option value={OpportunityStage.PROPOSAL}>Propuesta</option>
              <option value={OpportunityStage.WON}>Ganado</option>
              <option value={OpportunityStage.LOST}>Perdido</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Valor Estimado ($)</label>
            <input
              name="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Probabilidad (%)</label>
            <input
              name="probability"
              type="number"
              min="0"
              max="100"
              defaultValue="50"
              className={inputCls}
            />
          </div>
        </div>
        <div className="pt-2">
          <SubmitBtn pending={isPending} label="Crear Oportunidad" />
        </div>
      </form>
    </ModalPanel>
  );
}

// ─── Main Export: CRM Modals Controller ──────────────────────────────────────

export type ModalType =
  | { kind: 'none' }
  | { kind: 'createCustomer' }
  | { kind: 'editCustomer'; customer: CustomerRow }
  | { kind: 'createOpportunity'; defaultCustomerId?: string };

interface CrmModalControllerProps {
  modal: ModalType;
  customers: { id: string; name: string }[];
  onClose: () => void;
}

export function CrmModalController({
  modal,
  customers,
  onClose,
}: CrmModalControllerProps) {
  if (modal.kind === 'none') return null;

  if (modal.kind === 'createCustomer') {
    return <CreateCustomerModal onClose={onClose} />;
  }

  if (modal.kind === 'editCustomer') {
    return <EditCustomerModal customer={modal.customer} onClose={onClose} />;
  }

  if (modal.kind === 'createOpportunity') {
    return (
      <CreateOpportunityModal
        customers={customers}
        defaultCustomerId={modal.defaultCustomerId}
        onClose={onClose}
      />
    );
  }

  return null;
}

'use client';

import { useState, useTransition } from 'react';
import { deleteCustomer } from '@/app/actions/crm-actions';
import { CustomerStatus } from '@prisma/client';
import { Pencil, Trash2, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { confirmAction, successAlert, errorAlert } from '@/lib/sweetalert';
import { CrmModalController, ModalType, CustomerRow } from '@/components/crm/crm-modals';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  CustomerStatus,
  { label: string; cls: string }
> = {
  ACTIVE: {
    label: 'Activo',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  INACTIVE: {
    label: 'Inactivo',
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  PROSPECT: {
    label: 'Prospecto',
    cls: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  },
  WON: {
    label: 'Ganado',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
};

function StatusBadge({ status }: { status: CustomerStatus }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.ACTIVE;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Customer Table ───────────────────────────────────────────────────────────

interface CrmCustomerTableProps {
  customers: CustomerRow[];
  customerOptions: { id: string; name: string }[];
}

export function CrmCustomerTable({
  customers,
  customerOptions,
}: CrmCustomerTableProps) {
  const [modal, setModal] = useState<ModalType>({ kind: 'none' });
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string, name: string) {
    const confirmed = await confirmAction(
      '¿Eliminar cliente?',
      `Se eliminará "${name}" y todos sus datos asociados. Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar',
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteCustomer(id);
      if (res.success) {
        successAlert('Eliminado', 'El cliente fue eliminado correctamente.');
      } else {
        errorAlert('Error', res.error ?? 'No se pudo eliminar el cliente.');
      }
    });
  }

  return (
    <>
      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          placeholder="Buscar por nombre, empresa o ciudad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-sm rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Cliente
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:table-cell">
                Empresa
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground lg:table-cell">
                Teléfono
              </th>
              <th className="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground xl:table-cell">
                Ciudad
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {search ? 'No se encontraron resultados.' : 'No hay clientes registrados.'}
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="group transition-colors hover:bg-muted/30"
                >
                  {/* Name + Email */}
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    {customer.email && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </p>
                    )}
                  </td>
                  {/* Company */}
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    {customer.company ? (
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.company}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  {/* Phone */}
                  <td className="hidden px-4 py-3.5 lg:table-cell">
                    {customer.phone ? (
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.phone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  {/* City */}
                  <td className="hidden px-4 py-3.5 xl:table-cell">
                    {customer.city ? (
                      <span className="flex items-center gap-1.5 text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.city}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={customer.status} />
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          setModal({ kind: 'editCustomer', customer })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        disabled={isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      {filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Mostrando {filtered.length} de {customers.length} clientes
        </p>
      )}

      {/* Modals */}
      <CrmModalController
        modal={modal}
        customers={customerOptions}
        onClose={() => setModal({ kind: 'none' })}
      />
    </>
  );
}

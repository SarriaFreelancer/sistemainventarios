'use client';

import { useState } from 'react';
import { Plus, Users, Briefcase } from 'lucide-react';
import { CrmModalController, ModalType } from '@/components/crm/crm-modals';

interface CrmPageHeaderProps {
  customerOptions: { id: string; name: string }[];
}

export function CrmPageHeader({ customerOptions }: CrmPageHeaderProps) {
  const [modal, setModal] = useState<ModalType>({ kind: 'none' });

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            CRM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona clientes, prospectos y oportunidades comerciales.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setModal({ kind: 'createOpportunity' })}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-950 dark:hover:text-violet-300"
          >
            <Briefcase className="h-4 w-4" />
            Nueva Oportunidad
          </button>
          <button
            onClick={() => setModal({ kind: 'createCustomer' })}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-all hover:opacity-90 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Modals */}
      <CrmModalController
        modal={modal}
        customers={customerOptions}
        onClose={() => setModal({ kind: 'none' })}
      />
    </>
  );
}

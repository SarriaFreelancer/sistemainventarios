'use client';

import { useState, useTransition } from 'react';
import { updateOpportunityStage, deleteOpportunity } from '@/app/actions/crm-actions';
import { OpportunityStage } from '@prisma/client';
import {
  Plus,
  Trash2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import { confirmAction, successAlert, errorAlert } from '@/lib/sweetalert';
import { CrmModalController, ModalType } from '@/components/crm/crm-modals';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpportunityCard {
  id: string;
  title: string;
  customerName: string;
  estimatedValue: number;
  probability: number;
  stage: OpportunityStage;
}

// ─── Stage Config ─────────────────────────────────────────────────────────────

const STAGES: {
  key: OpportunityStage;
  label: string;
  color: string;
  headerBg: string;
  dot: string;
}[] = [
  {
    key: OpportunityStage.NEW,
    label: 'Nueva',
    color: 'border-slate-200 dark:border-slate-700',
    headerBg: 'bg-slate-50 dark:bg-slate-900',
    dot: 'bg-slate-400',
  },
  {
    key: OpportunityStage.CONTACTED,
    label: 'Contactado',
    color: 'border-blue-200 dark:border-blue-900',
    headerBg: 'bg-blue-50 dark:bg-blue-950',
    dot: 'bg-blue-500',
  },
  {
    key: OpportunityStage.QUALIFIED,
    label: 'Calificado',
    color: 'border-violet-200 dark:border-violet-900',
    headerBg: 'bg-violet-50 dark:bg-violet-950',
    dot: 'bg-violet-500',
  },
  {
    key: OpportunityStage.PROPOSAL,
    label: 'Propuesta',
    color: 'border-amber-200 dark:border-amber-900',
    headerBg: 'bg-amber-50 dark:bg-amber-950',
    dot: 'bg-amber-500',
  },
  {
    key: OpportunityStage.WON,
    label: 'Ganado',
    color: 'border-emerald-200 dark:border-emerald-900',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950',
    dot: 'bg-emerald-500',
  },
  {
    key: OpportunityStage.LOST,
    label: 'Perdido',
    color: 'border-red-200 dark:border-red-900',
    headerBg: 'bg-red-50 dark:bg-red-950',
    dot: 'bg-red-400',
  },
];

const STAGE_LABEL: Record<OpportunityStage, string> = {
  NEW: 'Nueva',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  WON: 'Ganado',
  LOST: 'Perdido',
};

// ─── Format currency ──────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

function OpCard({
  opportunity,
  customers,
  onStageChange,
  onDelete,
}: {
  opportunity: OpportunityCard;
  customers: { id: string; name: string }[];
  onStageChange: (id: string, stage: OpportunityStage) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const [showMove, setShowMove] = useState(false);

  const stages = STAGES.filter((s) => s.key !== opportunity.stage);

  return (
    <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800">
      {/* Title */}
      <p className="pr-6 text-sm font-semibold text-foreground leading-snug">
        {opportunity.title}
      </p>
      {/* Customer */}
      <p className="mt-1 text-xs text-muted-foreground">{opportunity.customerName}</p>

      {/* Value & probability */}
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400">
          <DollarSign className="h-3 w-3" />
          {formatCurrency(opportunity.estimatedValue)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {opportunity.probability}%
        </span>
      </div>

      {/* Probability bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
          style={{ width: `${opportunity.probability}%` }}
        />
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Move stage */}
        <div className="relative">
          <button
            onClick={() => setShowMove((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-violet-300 hover:text-violet-600"
          >
            Mover
            {showMove ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          {showMove && (
            <div className="absolute bottom-full left-0 z-10 mb-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              {stages.map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    onStageChange(opportunity.id, s.key);
                    setShowMove(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
                >
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(opportunity.id, opportunity.title)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:border-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  opportunities,
  customers,
  onAddOpportunity,
  onStageChange,
  onDelete,
}: {
  stage: (typeof STAGES)[number];
  opportunities: OpportunityCard[];
  customers: { id: string; name: string }[];
  onAddOpportunity: (stageKey: OpportunityStage) => void;
  onStageChange: (id: string, newStage: OpportunityStage) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const total = opportunities.reduce((s, o) => s + o.estimatedValue, 0);

  return (
    <div
      className={`flex min-w-[260px] max-w-[280px] flex-shrink-0 flex-col rounded-2xl border ${stage.color} bg-card`}
    >
      {/* Column header */}
      <div className={`rounded-t-2xl px-4 py-3 ${stage.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              {stage.label}
            </span>
          </div>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-[10px] font-bold text-foreground shadow-sm">
            {opportunities.length}
          </span>
        </div>
        {opportunities.length > 0 && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(total)}
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3" style={{ maxHeight: 480 }}>
        {opportunities.map((op) => (
          <OpCard
            key={op.id}
            opportunity={op}
            customers={customers}
            onStageChange={onStageChange}
            onDelete={onDelete}
          />
        ))}
        {opportunities.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-6">
            <p className="text-center text-xs text-muted-foreground/60">Sin oportunidades</p>
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="border-t border-border p-2.5">
        <button
          onClick={() => onAddOpportunity(stage.key)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
    </div>
  );
}

// ─── Main Kanban Board ────────────────────────────────────────────────────────

interface CrmKanbanProps {
  opportunities: OpportunityCard[];
  customers: { id: string; name: string }[];
}

export function CrmKanban({ opportunities, customers }: CrmKanbanProps) {
  const [items, setItems] = useState<OpportunityCard[]>(opportunities);
  const [modal, setModal] = useState<ModalType>({ kind: 'none' });
  const [isPending, startTransition] = useTransition();

  // Group by stage
  const byStage = (stage: OpportunityStage) =>
    items.filter((o) => o.stage === stage);

  function handleStageChange(id: string, newStage: OpportunityStage) {
    // Optimistic update
    setItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, stage: newStage } : o)),
    );
    startTransition(async () => {
      const res = await updateOpportunityStage(id, newStage);
      if (!res.success) {
        // Revert on failure
        setItems(opportunities);
        errorAlert('Error', res.error ?? 'No se pudo mover la oportunidad.');
      }
    });
  }

  async function handleDelete(id: string, title: string) {
    const confirmed = await confirmAction(
      '¿Eliminar oportunidad?',
      `Se eliminará "${title}". Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar',
    );
    if (!confirmed) return;

    // Optimistic update
    setItems((prev) => prev.filter((o) => o.id !== id));

    startTransition(async () => {
      const res = await deleteOpportunity(id);
      if (!res.success) {
        setItems(opportunities);
        errorAlert('Error', res.error ?? 'No se pudo eliminar la oportunidad.');
      } else {
        successAlert('Eliminado', 'La oportunidad fue eliminada correctamente.');
      }
    });
  }

  return (
    <>
      {/* Horizontal scroll kanban */}
      <div className="flex gap-4 overflow-x-auto pb-3">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage.key}
            stage={stage}
            opportunities={byStage(stage.key)}
            customers={customers}
            onAddOpportunity={(stageKey) =>
              setModal({ kind: 'createOpportunity' })
            }
            onStageChange={handleStageChange}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Modals */}
      <CrmModalController
        modal={modal}
        customers={customers}
        onClose={() => setModal({ kind: 'none' })}
      />
    </>
  );
}

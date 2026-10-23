'use client';

import React, { useState, useTransition } from 'react';
import { X, PhoneCall, Loader2, Calendar, MessageSquare } from 'lucide-react';
import { registerCreditCollectionActivity } from '@/app/actions/credit-actions';
import { successAlert, errorAlert } from '@/lib/sweetalert';
import { useRouter } from 'next/navigation';

interface CreditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: number;
  operationCode: string;
  clientName: string;
  clientPhone?: string | null;
  balance: number;
}

export function CreditCollectionModal({
  isOpen,
  onClose,
  operationId,
  operationCode,
  clientName,
  clientPhone,
  balance
}: CreditCollectionModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [channel, setChannel] = useState('WHATSAPP');
  const [result, setResult] = useState('COMPROMISO_PAGO');
  const [notes, setNotes] = useState('');
  const [commitmentDate, setCommitmentDate] = useState('');
  const [commitmentAmount, setCommitmentAmount] = useState<number | ''>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      errorAlert('Notas requeridas', 'Describe el resultado de la gestión de cobro');
      return;
    }

    startTransition(async () => {
      const res = await registerCreditCollectionActivity({
        creditOperationId: operationId,
        channel,
        result,
        notes: notes.trim(),
        commitmentDate: commitmentDate || null,
        commitmentAmount: commitmentAmount ? Number(commitmentAmount) : null
      });

      if (res.success) {
        successAlert('Gestión Registrada', 'La actividad de cobranza fue registrada en la bitácora.');
        onClose();
        router.refresh();
      } else {
        errorAlert('Error al guardar gestión', res.error || 'Ocurrió un error');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
              <PhoneCall className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Gestión de Cobranza</h3>
              <p className="text-xs text-muted-foreground">{operationCode} · {clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Canal y Resultado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                Canal de Contacto *
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-2.5 font-semibold text-xs"
              >
                <option value="WHATSAPP">WhatsApp</option>
                <option value="LLAMADA">Llamada Telefónica</option>
                <option value="CORREO">Correo Electrónico</option>
                <option value="VISITA">Visita Presencial</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                Resultado de la Gestión *
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-2.5 font-semibold text-xs"
              >
                <option value="COMPROMISO_PAGO">Compromiso de Pago</option>
                <option value="CONTACTADO">Contactado / Recordatorio</option>
                <option value="NO_RESPONDE">No Contesta / Buzón</option>
                <option value="ACUERDO">Acuerdo de Refinanciación</option>
                <option value="RECHAZO">Rechazo / Reclamo</option>
              </select>
            </div>
          </div>

          {/* Compromiso Pactado */}
          <div className="p-3.5 rounded-2xl bg-muted/20 border border-border space-y-3">
            <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" /> Compromiso o Fecha Acordada (Opcional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Fecha Prometida</label>
                <input
                  type="date"
                  value={commitmentDate}
                  onChange={(e) => setCommitmentDate(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Valor Prometido ($)</label>
                <input
                  type="number"
                  min={0}
                  max={balance}
                  value={commitmentAmount}
                  onChange={(e) => setCommitmentAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ej: 50000"
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
              Detalle de la Conversación y Observaciones *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: El cliente manifiesta que consignará la cuota el día viernes por la tarde..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-10 px-4 rounded-xl border border-border bg-background font-semibold text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !notes.trim()}
              className="h-10 px-6 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-600/25 hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar Gestión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

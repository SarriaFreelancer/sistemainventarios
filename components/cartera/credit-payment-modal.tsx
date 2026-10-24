'use client';

import React, { useState, useTransition } from 'react';
import { X, DollarSign, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerCreditPayment } from '@/app/actions/credit-actions';
import { successAlert, errorAlert } from '@/lib/sweetalert';
import { useRouter } from 'next/navigation';

interface CreditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: number;
  operationCode: string;
  clientName: string;
  balance: number;
  nextInstallmentAmount?: number;
}

export function CreditPaymentModal({
  isOpen,
  onClose,
  operationId,
  operationCode,
  clientName,
  balance,
  nextInstallmentAmount
}: CreditPaymentModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState<number>(nextInstallmentAmount || balance);
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      errorAlert('Monto inválido', 'El monto a abonar debe ser mayor a 0');
      return;
    }
    if (amount > balance + 0.01) {
      errorAlert('Monto excedido', `El monto no puede superar el saldo pendiente de $${balance.toLocaleString()}`);
      return;
    }

    startTransition(async () => {
      const res = await registerCreditPayment({
        creditOperationId: operationId,
        amount: Number(amount),
        paymentMethod,
        reference: reference || null,
        notes: notes || null
      });

      if (res.success) {
        successAlert(
          'Abono Registrado',
          `Se registró exitosamente el pago por $${Number(amount).toLocaleString()} (${(res.data as any).receiptNumber}).`
        );
        onClose();
        router.refresh();
      } else {
        errorAlert('Error al abonar', res.error || 'Ocurrió un error al procesar el pago');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Registrar Abono a Cartera</h3>
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

        {/* Saldo Pendiente Card */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Saldo Pendiente Actual
            </p>
            <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              ${balance.toLocaleString()}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background border border-amber-500/30 text-amber-600 dark:text-amber-400">
            En cobro
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Monto con sugerencias rápidas */}
          <div className="space-y-1.5">
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
              Monto del Abono *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-base font-bold text-muted-foreground">$</span>
              <input
                type="number"
                min={1}
                max={balance}
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-11 pl-8 pr-3 rounded-xl border border-border bg-background text-base font-bold font-mono text-foreground focus:ring-2 focus:ring-primary"
              />
            </div>
            {/* Botones de atajo rápido */}
            <div className="flex gap-2 pt-1">
              {nextInstallmentAmount && nextInstallmentAmount < balance && (
                <button
                  type="button"
                  onClick={() => setAmount(nextInstallmentAmount)}
                  className="flex-1 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-semibold text-[11px] border border-border"
                >
                  1 Cuota (${nextInstallmentAmount.toLocaleString()})
                </button>
              )}
              <button
                type="button"
                onClick={() => setAmount(Math.round(balance / 2))}
                className="flex-1 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-semibold text-[11px] border border-border"
              >
                50% (${Math.round(balance / 2).toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setAmount(balance)}
                className="flex-1 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold text-[11px] border border-primary/20"
              >
                Total (${balance.toLocaleString()})
              </button>
            </div>
          </div>

          {/* Medio de pago */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                Medio de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="TARJETA">Tarjeta Débito/Crédito</option>
                <option value="BOLD">Bold Link/Datafono</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
                N° Transacción / Ref
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej: Aprobación #9876"
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-muted-foreground text-[10px] block">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el pago recibido..."
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
            />
          </div>

          {/* Acciones */}
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
              disabled={isPending || amount <= 0 || amount > balance}
              className="h-10 px-6 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirmar y Emitir Recibo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

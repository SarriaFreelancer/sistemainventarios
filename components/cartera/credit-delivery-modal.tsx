'use client';

import React, { useState, useTransition } from 'react';
import { X, Truck, Loader2, CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { confirmCreditDelivery } from '@/app/actions/credit-actions';
import { successAlert, errorAlert } from '@/lib/sweetalert';
import { useRouter } from 'next/navigation';

interface CreditDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: number;
  operationCode: string;
  clientName: string;
  balance: number;
  deliveryMode: string;
  items: {
    productId?: number | null;
    productName: string;
    productCode?: string | null;
    totalQuantity: number;
    deliveredQuantity: number;
    availableStock?: number;
  }[];
}

export function CreditDeliveryModal({
  isOpen,
  onClose,
  operationId,
  operationCode,
  clientName,
  balance,
  deliveryMode,
  items
}: CreditDeliveryModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const isFullyPaid = balance <= 0.01;
  const isUponPayment = deliveryMode === 'UPON_PAYMENT';

  const handleConfirm = () => {
    if (isUponPayment && !isFullyPaid) {
      errorAlert(
        'Pago Incompleto',
        `Esta operación está en modalidad "Entrega posterior al pago completo" y presenta un saldo pendiente de $${balance.toLocaleString()}. No se puede despachar sin el pago total.`
      );
      return;
    }

    startTransition(async () => {
      const res = await confirmCreditDelivery({
        creditOperationId: operationId,
        notes: notes || null
      });

      if (res.success) {
        successAlert(
          'Entrega Confirmada',
          `Se ha confirmado la entrega física y descontado el inventario del almacén (${(res.data as any).deliveryNumber}).`
        );
        onClose();
        router.refresh();
      } else {
        errorAlert('Error al confirmar entrega', res.error || 'Ocurrió un error inesperado');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Confirmar Entrega de Mercancía</h3>
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

        {/* Estado Financiero / Advertencia */}
        {isUponPayment && !isFullyPaid ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-600 dark:text-amber-400">
                Entrega Bloqueada por Modalidad de Negocio
              </p>
              <p className="text-muted-foreground mt-0.5">
                La modalidad pactada es <strong>Entrega posterior al pago completo</strong>. El cliente aún debe <strong>${balance.toLocaleString()}</strong>. Registre los abonos pendientes antes de despachar.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                Listo para Despacho y Salida Física
              </p>
              <p className="text-muted-foreground mt-0.5">
                {isFullyPaid
                  ? 'El pedido ha sido 100% pagado. Al confirmar, se registrará la salida física definitiva del almacén.'
                  : 'Entrega autorizada bajo modalidad inmediata a crédito.'}
              </p>
            </div>
          </div>
        )}

        {/* Lista de Artículos a Entregar */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Artículos y Unidades por Despachar
          </label>
          <div className="border border-border rounded-2xl overflow-hidden bg-muted/10 divide-y divide-border">
            {items.map((it, idx) => {
              const pending = it.totalQuantity - it.deliveredQuantity;
              return (
                <div key={idx} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-foreground">{it.productName}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{it.productCode || 'Sin código'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary font-mono text-sm">
                      {pending} u.
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      (Total pactado: {it.totalQuantity} u.)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Observaciones de la Entrega (Transportadora, Guía, Receptor)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Entregado en mostrador a titular con firma en remisión..."
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
            type="button"
            onClick={handleConfirm}
            disabled={isPending || (isUponPayment && !isFullyPaid)}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar Despacho Físico
          </button>
        </div>
      </div>
    </div>
  );
}

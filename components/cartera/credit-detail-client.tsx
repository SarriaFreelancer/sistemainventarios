'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Truck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PhoneCall,
  XCircle,
  FileText,
  User,
  MapPin,
  MessageCircle,
  ShieldAlert,
  Loader2,
  Share2,
  Printer
} from 'lucide-react';
import { CreditPaymentModal } from './credit-payment-modal';
import { CreditDeliveryModal } from './credit-delivery-modal';
import { CreditCollectionModal } from './credit-collection-modal';
import { cancelCreditOperation, voidCreditPayment } from '@/app/actions/credit-actions';
import { confirmAction, successAlert, errorAlert } from '@/lib/sweetalert';
import { useRouter } from 'next/navigation';

interface CreditDetailClientProps {
  operation: any;
  userRole?: string;
}

export function CreditDetailClient({ operation, userRole }: CreditDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Anulación de Pago
  const [voidingPaymentId, setVoidingPaymentId] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const now = new Date();
  const percentPaid = operation.totalAmount > 0
    ? Math.min(100, Math.round((operation.paidAmount / operation.totalAmount) * 100))
    : 0;

  const isOverdue = operation.balance > 0 && operation.dueDate && new Date(operation.dueDate).getTime() < now.getTime();
  const isReadyForDelivery = operation.deliveryMode === 'UPON_PAYMENT' && operation.balance <= 0.01 && operation.deliveryStatus !== 'DELIVERED';

  // Cancelar operación
  const handleCancelOperation = async () => {
    const isConfirmed = await confirmAction(
      '¿Cancelar esta operación a crédito?',
      'Si existen productos reservados, serán liberados de inmediato para el catálogo de ventas.'
    );
    if (!isConfirmed) return;

    const reason = prompt('Ingrese el motivo de la cancelación:');
    if (!reason || reason.trim().length < 4) {
      errorAlert('Cancelación abortada', 'Debe especificar un motivo válido.');
      return;
    }

    startTransition(async () => {
      const res = await cancelCreditOperation({
        creditOperationId: operation.id,
        reason: reason.trim()
      });
      if (res.success) {
        successAlert('Operación Cancelada', 'La operación ha sido cancelada y los productos liberados.');
        router.refresh();
      } else {
        errorAlert('Error al cancelar', res.error || 'Ocurrió un error');
      }
    });
  };

  // Anular pago
  const handleVoidPayment = async (paymentId: number) => {
    const isConfirmed = await confirmAction(
      '¿Anular este comprobante de pago?',
      'Esta acción revertirá el abono en el saldo de la cartera y registrará una anulación compensatoria en auditoría.'
    );
    if (!isConfirmed) return;

    const reason = prompt('Ingrese el motivo detallado de la anulación del pago:');
    if (!reason || reason.trim().length < 5) {
      errorAlert('Anulación abortada', 'Debe especificar el motivo (mínimo 5 caracteres).');
      return;
    }

    startTransition(async () => {
      const res = await voidCreditPayment({
        paymentId,
        reason: reason.trim()
      });
      if (res.success) {
        successAlert('Pago Anulado', 'El recibo ha sido anulado y el saldo del cliente fue restaurado.');
        router.refresh();
      } else {
        errorAlert('Error al anular pago', res.error || 'Ocurrió un error');
      }
    });
  };

  // WhatsApp Link
  const phoneClean = operation.customer?.phone?.replace(/\D/g, '') || '';
  const whatsappUrl = phoneClean
    ? `https://wa.me/57${phoneClean.startsWith('57') ? phoneClean.slice(2) : phoneClean}?text=${encodeURIComponent(
        `Hola ${operation.customer.name}, te saludamos para compartirte el estado de tu cuenta ${operation.code}. Tu saldo actual es de $${operation.balance.toLocaleString()}.`
      )}`
    : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Barra Superior de Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cartera"
            className="h-10 w-10 flex items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-foreground">{operation.code}</h1>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  operation.status === 'PAID'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : operation.status === 'CANCELLED'
                    ? 'bg-muted text-muted-foreground border-border'
                    : isOverdue
                    ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}
              >
                {operation.status === 'PAID'
                  ? 'Pagado'
                  : operation.status === 'CANCELLED'
                  ? 'Cancelado'
                  : isOverdue
                  ? 'En Mora'
                  : 'Activo'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Apertura: {new Date(operation.startDate).toLocaleDateString()} · Responsable: {operation.user?.name || 'Sistema'}
            </p>
          </div>
        </div>

        {/* Acciones Principales */}
        <div className="flex items-center gap-2 flex-wrap">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold text-xs flex items-center gap-1.5 transition-colors border border-emerald-500/20"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}

          <button
            onClick={() => setShowCollectionModal(true)}
            className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall className="h-4 w-4 text-violet-500" />
            Registrar Cobro
          </button>

          {operation.deliveryStatus !== 'DELIVERED' && operation.status !== 'CANCELLED' && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                isReadyForDelivery
                  ? 'bg-primary text-primary-foreground shadow-primary/25'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              <Truck className="h-4 w-4" />
              Confirmar Entrega
            </button>
          )}

          {operation.balance > 0 && operation.status !== 'CANCELLED' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="h-10 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <DollarSign className="h-4 w-4" />
              Registrar Abono
            </button>
          )}

          {operation.status !== 'CANCELLED' && operation.deliveryStatus !== 'DELIVERED' && (
            <button
              onClick={handleCancelOperation}
              disabled={isPending}
              className="h-10 px-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-xs flex items-center gap-1 transition-colors"
              title="Cancelar crédito y liberar reservas"
            >
              <XCircle className="h-4 w-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Banner de Modalidad y Estado de Entrega */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 ${
            operation.deliveryMode === 'IMMEDIATE'
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-amber-500/10 text-amber-500'
          }`}>
            {operation.deliveryMode === 'IMMEDIATE' ? <Truck className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {operation.deliveryMode === 'IMMEDIATE'
                ? 'Modalidad A: Entrega Inmediata a Crédito'
                : 'Modalidad B: Entrega después del Pago Completo'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {operation.deliveryMode === 'IMMEDIATE'
                ? 'El inventario ya fue descontado físicamente del almacén. La operación respalda la cuenta por cobrar.'
                : operation.isStockReserved
                ? `La mercancía se encuentra reservada en almacén (Vigencia hasta: ${operation.reservationExpiresAt ? new Date(operation.reservationExpiresAt).toLocaleDateString() : 'Indefinida'}). La salida física se habilitará al cancelar el 100%.`
                : 'Mercancía bajo pedido. Se autorizará la entrega al recibir el pago total.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Estado de Entrega
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full ${
              operation.deliveryStatus === 'DELIVERED'
                ? 'bg-emerald-500/10 text-emerald-500'
                : isReadyForDelivery
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'bg-amber-500/10 text-amber-500'
            }`}>
              {operation.deliveryStatus === 'DELIVERED' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Entregado Totalmente
                </>
              ) : isReadyForDelivery ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> ¡100% Pagado - Listo para Despacho!
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" /> Pendiente de Despacho
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Datos del Cliente y Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta del Cliente */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" /> Datos del Cliente
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              CRM
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-foreground text-sm">{operation.customer.name}</p>
            {operation.customer.documentNumber && (
              <p className="text-muted-foreground">
                <strong>{operation.customer.documentType || 'Doc'}:</strong> {operation.customer.documentNumber}
              </p>
            )}
            <p className="text-muted-foreground">
              <strong>Teléfono:</strong> {operation.customer.phone || 'No registrado'}
            </p>
            {operation.customer.altPhone && (
              <p className="text-muted-foreground">
                <strong>Tel. Alternativo:</strong> {operation.customer.altPhone}
              </p>
            )}
            <p className="text-muted-foreground">
              <strong>Email:</strong> {operation.customer.email || 'No registrado'}
            </p>
            <p className="text-muted-foreground">
              <strong>Dirección de Entrega:</strong> {operation.customer.deliveryAddress || operation.customer.address || 'Principal'}
            </p>
            {operation.customer.neighborhood && (
              <p className="text-muted-foreground">
                <strong>Barrio/Sector:</strong> {operation.customer.neighborhood} ({operation.customer.city || 'Bogotá'})
              </p>
            )}
            {operation.customer.creditNotes && (
              <div className="mt-2 p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
                <strong>Observaciones de Cobranza:</strong> {operation.customer.creditNotes}
              </div>
            )}
          </div>
        </div>

        {/* Resumen Financiero y Balance */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" /> Resumen Financiero y Estado de Pagos
            </h3>
            <span className="text-xs font-bold font-mono text-primary">{percentPaid}% Amortizado</span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentPaid === 100 ? 'bg-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${percentPaid}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/20 border border-border rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total Pactado</span>
              <span className="text-base font-extrabold font-mono text-foreground">
                ${operation.totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-muted/20 border border-border rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Anticipo Inicial</span>
              <span className="text-base font-extrabold font-mono text-foreground">
                ${operation.downPayment.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Total Abonado</span>
              <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ${operation.paidAmount.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Saldo Pendiente</span>
              <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">
                ${operation.balance.toLocaleString()}
              </span>
            </div>
          </div>

          {operation.dueDate && (
            <div className="text-xs flex items-center justify-between text-muted-foreground pt-1">
              <span>
                Próximo o último vencimiento: <strong>{new Date(operation.dueDate).toLocaleDateString()}</strong>
              </span>
              {isOverdue && (
                <span className="text-red-500 font-bold uppercase text-[11px] flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Cartera en Mora
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Artículos de la Operación */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" /> Productos y Artículos Pactados (Fotografía Histórica)
        </h3>
        <div className="border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Artículo</th>
                <th className="py-2.5 px-3">Cant. Total</th>
                <th className="py-2.5 px-3">Cant. Entregada</th>
                <th className="py-2.5 px-3">Precio Unit.</th>
                <th className="py-2.5 px-3">Descuento</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {operation.items.map((it: any) => (
                <tr key={it.id}>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-foreground">{it.product?.name || it.comboName || 'Producto'}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{it.product?.code || 'S/C'}</p>
                  </td>
                  <td className="py-2.5 px-3 font-bold font-mono">{it.quantity} u.</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={`font-bold ${
                        it.deliveredQuantity >= it.quantity ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {it.deliveredQuantity} u.
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">${it.unitPrice.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono">${it.discount.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-foreground">
                    ${it.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan de Cuotas y Vencimientos */}
      {operation.installments && operation.installments.length > 0 && (
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Calendario de Cuotas y Amortización
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {operation.installments.map((inst: any) => {
              const isInstPaid = inst.paidAmount >= inst.amount - 0.01;
              const isInstOverdue = !isInstPaid && new Date(inst.dueDate).getTime() < now.getTime();

              return (
                <div
                  key={inst.id}
                  className={`p-3.5 rounded-2xl border ${
                    isInstPaid
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : isInstOverdue
                      ? 'bg-red-500/5 border-red-500/30'
                      : 'bg-muted/10 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-foreground">Cuota #{inst.installmentNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                        isInstPaid
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : isInstOverdue
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isInstPaid ? 'Pagada' : isInstOverdue ? 'Vencida' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-lg font-extrabold font-mono text-foreground">
                    ${inst.amount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Vence: {new Date(inst.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Abonado: <strong className="font-mono">${inst.paidAmount.toLocaleString()}</strong>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de Abonos y Pagos */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Historial de Abonos y Recibos de Caja
          </h3>
          <span className="text-xs text-muted-foreground">
            {operation.payments.length} comprobante(s) emitido(s)
          </span>
        </div>

        {operation.payments.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground">
            No se han registrado abonos para esta operación.
          </div>
        ) : (
          <div className="border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Recibo</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Medio</th>
                  <th className="py-2.5 px-3">Referencia</th>
                  <th className="py-2.5 px-3">Responsable</th>
                  <th className="py-2.5 px-3 text-right">Monto</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {operation.payments.map((p: any) => {
                  const isVoided = p.status === 'VOIDED';
                  return (
                    <tr key={p.id} className={isVoided ? 'bg-muted/30 opacity-60' : ''}>
                      <td className="py-2.5 px-3 font-bold font-mono text-primary">
                        {p.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(p.paymentDate).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{p.paymentMethod}</td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono">{p.reference || '-'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{p.registeredByUser?.name || 'Usuario'}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-foreground">
                        ${p.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isVoided ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}
                        >
                          {isVoided ? 'Anulado' : 'Confirmado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!isVoided && (userRole === 'ADMIN' || userRole === 'SUPERADMIN') && (
                          <button
                            type="button"
                            onClick={() => handleVoidPayment(p.id)}
                            disabled={isPending}
                            className="text-[11px] font-bold text-red-500 hover:underline"
                          >
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Entregas y Remisiones */}
      {operation.deliveries && operation.deliveries.length > 0 && (
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-primary" /> Remisiones de Entrega Física
          </h3>
          <div className="space-y-2">
            {operation.deliveries.map((del: any) => (
              <div
                key={del.id}
                className="p-3.5 rounded-2xl border border-border bg-muted/10 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold font-mono text-foreground">{del.deliveryNumber}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Despachado el {new Date(del.deliveryDate).toLocaleString()} por {del.deliveredByUser?.name || 'Usuario'}
                  </p>
                  {del.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{del.notes}"</p>}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                  Entrega Confirmada
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bitácora de Gestión de Cobranza */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <PhoneCall className="h-3.5 w-3.5 text-violet-500" /> Bitácora de Gestiones de Cobranza
          </h3>
          <button
            onClick={() => setShowCollectionModal(true)}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Registrar Gestión
          </button>
        </div>

        {operation.collectionActivities.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground">
            No se han registrado llamadas o gestiones de cobranza aún.
          </div>
        ) : (
          <div className="space-y-2.5">
            {operation.collectionActivities.map((act: any) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl border border-border bg-muted/10 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground uppercase text-[11px]">
                      {act.channel}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {act.result}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(act.createdAt).toLocaleString()} · {act.user?.name}
                  </span>
                </div>
                <p className="text-foreground">{act.notes}</p>
                {act.commitmentDate && (
                  <p className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Compromiso pactado: {new Date(act.commitmentDate).toLocaleDateString()}
                    {act.commitmentAmount ? ` por $${act.commitmentAmount.toLocaleString()}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {showPaymentModal && (
        <CreditPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          operationId={operation.id}
          operationCode={operation.code}
          clientName={operation.customer.name}
          balance={operation.balance}
        />
      )}

      {showDeliveryModal && (
        <CreditDeliveryModal
          isOpen={showDeliveryModal}
          onClose={() => setShowDeliveryModal(false)}
          operationId={operation.id}
          operationCode={operation.code}
          clientName={operation.customer.name}
          balance={operation.balance}
          deliveryMode={operation.deliveryMode}
          items={operation.items.map((i: any) => ({
            productId: i.productId,
            productName: i.product?.name || i.comboName || 'Producto',
            productCode: i.product?.code,
            totalQuantity: i.quantity,
            deliveredQuantity: i.deliveredQuantity
          }))}
        />
      )}

      {showCollectionModal && (
        <CreditCollectionModal
          isOpen={showCollectionModal}
          onClose={() => setShowCollectionModal(false)}
          operationId={operation.id}
          operationCode={operation.code}
          clientName={operation.customer.name}
          clientPhone={operation.customer.phone}
          balance={operation.balance}
        />
      )}
    </div>
  );
}

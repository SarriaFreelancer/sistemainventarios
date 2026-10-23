'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  Filter,
  UserCheck,
  RefreshCw,
  XCircle,
  FileText
} from 'lucide-react';
import { CreateCreditModal } from './create-credit-modal';
import { CreditPaymentModal } from './credit-payment-modal';
import { CreditDeliveryModal } from './credit-delivery-modal';

interface CarteraClientProps {
  stats: {
    totalPortfolio: number;
    overduePortfolio: number;
    overdueCount: number;
    totalOperations: number;
    activeCount: number;
    paidPendingDelivery: number;
    reservedOperations: number;
    todayCollections: number;
  };
  operations: any[];
  customers: any[];
  products: any[];
  branches?: any[];
  defaultDeliveryMode?: string;
  enableStockReservation?: boolean;
  initialOpenCreate?: boolean;
}

export function CarteraClient({
  stats,
  operations,
  customers,
  products,
  branches = [],
  defaultDeliveryMode = 'IMMEDIATE',
  enableStockReservation = true,
  initialOpenCreate = false
}: CarteraClientProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'PENDING_DELIVERY' | 'PAID' | 'CANCELLED'>('ALL');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(Boolean(initialOpenCreate));
  const [paymentModalData, setPaymentModalData] = useState<{
    isOpen: boolean;
    operationId: number;
    code: string;
    client: string;
    balance: number;
  } | null>(null);

  const [deliveryModalData, setDeliveryModalData] = useState<{
    isOpen: boolean;
    operationId: number;
    code: string;
    client: string;
    balance: number;
    deliveryMode: string;
    items: any[];
  } | null>(null);

  const now = new Date();

  // Filtrado de operaciones
  const filtered = operations.filter((op) => {
    // Filtro por Tab
    if (activeTab === 'ACTIVE' && (op.status !== 'ACTIVE' || op.balance <= 0)) return false;
    if (activeTab === 'OVERDUE') {
      const isOverdue = op.status === 'OVERDUE' || (op.balance > 0 && op.dueDate && new Date(op.dueDate).getTime() < now.getTime());
      if (!isOverdue) return false;
    }
    if (activeTab === 'PENDING_DELIVERY') {
      if (op.deliveryStatus === 'DELIVERED' || op.status === 'CANCELLED') return false;
      if (op.deliveryMode === 'UPON_PAYMENT' && op.balance > 0.01) return false; // solo las listas
    }
    if (activeTab === 'PAID' && op.status !== 'PAID' && op.balance > 0.01) return false;
    if (activeTab === 'CANCELLED' && op.status !== 'CANCELLED') return false;

    // Filtro por Texto de búsqueda
    if (search.trim()) {
      const q = search.toLowerCase();
      const codeMatch = op.code.toLowerCase().includes(q);
      const nameMatch = op.customer?.name?.toLowerCase().includes(q);
      const docMatch = op.customer?.documentNumber?.includes(q);
      const phoneMatch = op.customer?.phone?.includes(q);
      return codeMatch || nameMatch || docMatch || phoneMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartera Total Activa */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Cartera Total Pendiente
            </span>
            <p className="text-2xl font-extrabold font-mono text-foreground">
              ${stats.totalPortfolio.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.activeCount} operaciones activas por cobrar
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DollarSign className="h-6 w-6" />
          </span>
        </div>

        {/* Cartera Vencida */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Cartera Vencida / Mora
            </span>
            <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              ${stats.overduePortfolio.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount} créditos en fecha vencida
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Clock className="h-6 w-6" />
          </span>
        </div>

        {/* Pagados Listos para Despacho (Modalidad B) */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Listos para Entrega
            </span>
            <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.paidPendingDelivery} pedidos
            </p>
            <p className="text-xs text-muted-foreground">
              100% pagados pendientes de despacho
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </span>
        </div>

        {/* Cobros de Hoy */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Recuperación Hoy
            </span>
            <p className="text-2xl font-extrabold font-mono text-foreground">
              ${stats.todayCollections.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.reservedOperations} pedidos con stock reservado
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
            <Calendar className="h-6 w-6" />
          </span>
        </div>
      </div>

      {/* Barra de Acciones y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código (CRE-...), cliente o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-2xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>

        {/* Botón Nueva Venta a Crédito */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-10 px-5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/25 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Operación a Crédito
        </button>
      </div>

      {/* Tabs Rápidos */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: 'ALL', label: `Todos (${operations.length})` },
          { key: 'ACTIVE', label: `Por Cobrar (${stats.activeCount})` },
          { key: 'OVERDUE', label: `En Mora (${stats.overdueCount})` },
          { key: 'PENDING_DELIVERY', label: `Listos p/ Entrega (${stats.paidPendingDelivery})` },
          { key: 'PAID', label: 'Pagados' },
          { key: 'CANCELLED', label: 'Cancelados' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-foreground text-background font-bold shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla de Operaciones */}
      <div className="border border-border rounded-3xl overflow-hidden bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="font-bold text-sm text-foreground">No se encontraron operaciones a crédito</p>
            <p>Utiliza el botón "+ Nueva Operación a Crédito" para registrar una venta a plazos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Operación</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Modalidad</th>
                  <th className="py-3 px-4">Total / Pagado</th>
                  <th className="py-3 px-4">Saldo Pendiente</th>
                  <th className="py-3 px-4">Entrega</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((op) => {
                  const percentPaid = op.totalAmount > 0 ? Math.min(100, Math.round((op.paidAmount / op.totalAmount) * 100)) : 0;
                  const isOverdue = op.balance > 0 && op.dueDate && new Date(op.dueDate).getTime() < now.getTime();
                  const isReadyForDelivery = op.deliveryMode === 'UPON_PAYMENT' && op.balance <= 0.01 && op.deliveryStatus !== 'DELIVERED';

                  return (
                    <tr key={op.id} className="hover:bg-muted/10 transition-colors">
                      {/* Código */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/cartera/${op.id}`}
                          className="font-bold font-mono text-primary hover:underline flex items-center gap-1.5"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          {op.code}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(op.startDate || op.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">{op.customer?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {op.customer?.documentNumber ? `${op.customer.documentType || 'CC'}: ${op.customer.documentNumber}` : op.customer?.phone || 'Sin tel'}
                        </p>
                      </td>

                      {/* Modalidad de entrega */}
                      <td className="py-3 px-4">
                        {op.deliveryMode === 'IMMEDIATE' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            <Truck className="h-3 w-3" /> Inmediata
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Clock className="h-3 w-3" /> Tras Pago {op.isStockReserved ? '(Reservado)' : ''}
                          </span>
                        )}
                      </td>

                      {/* Importes y Progreso */}
                      <td className="py-3 px-4">
                        <p className="font-bold font-mono text-foreground">
                          ${op.totalAmount.toLocaleString()}
                        </p>
                        <div className="w-28 bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percentPaid === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Abonado: ${op.paidAmount.toLocaleString()} ({percentPaid}%)
                        </p>
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="py-3 px-4">
                        <p
                          className={`font-mono font-extrabold text-sm ${
                            op.balance <= 0 ? 'text-emerald-500' : isOverdue ? 'text-red-500' : 'text-amber-500'
                          }`}
                        >
                          ${op.balance.toLocaleString()}
                        </p>
                        {op.balance <= 0 ? (
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">100% Pagado</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Saldo activo</span>
                        )}
                      </td>

                      {/* Estado de Entrega */}
                      <td className="py-3 px-4">
                        {op.deliveryStatus === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Entregado
                          </span>
                        ) : isReadyForDelivery ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full animate-pulse border border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3" /> ¡Listo p/ Entrega!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" /> Pendiente
                          </span>
                        )}
                      </td>

                      {/* Vencimiento */}
                      <td className="py-3 px-4">
                        {op.dueDate ? (
                          <div>
                            <p className={`font-semibold ${isOverdue ? 'text-red-500 font-bold' : 'text-foreground'}`}>
                              {new Date(op.dueDate).toLocaleDateString()}
                            </p>
                            {isOverdue && (
                              <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight">
                                ¡Vencido!
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Sin vencimiento</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Abonar */}
                          {op.balance > 0 && op.status !== 'CANCELLED' && (
                            <button
                              onClick={() =>
                                setPaymentModalData({
                                  isOpen: true,
                                  operationId: op.id,
                                  code: op.code,
                                  client: op.customer?.name || '',
                                  balance: op.balance
                                })
                              }
                              className="px-2.5 py-1 rounded-xl bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 font-bold text-xs transition-colors"
                            >
                              Abonar
                            </button>
                          )}

                          {/* Botón Entregar (si está lista o entrega pendiente) */}
                          {op.deliveryStatus !== 'DELIVERED' && op.status !== 'CANCELLED' && (
                            <button
                              onClick={() =>
                                setDeliveryModalData({
                                  isOpen: true,
                                  operationId: op.id,
                                  code: op.code,
                                  client: op.customer?.name || '',
                                  balance: op.balance,
                                  deliveryMode: op.deliveryMode,
                                  items: op.items || []
                                })
                              }
                              className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-colors ${
                                isReadyForDelivery
                                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                  : 'bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              Entregar
                            </button>
                          )}

                          {/* Ver Detalle */}
                          <Link
                            href={`/dashboard/cartera/${op.id}`}
                            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Ver Detalle Completo"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CreateCreditModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          customers={customers}
          products={products}
          branches={branches}
          defaultDeliveryMode={defaultDeliveryMode}
          enableStockReservation={enableStockReservation}
        />
      )}

      {paymentModalData && (
        <CreditPaymentModal
          isOpen={paymentModalData.isOpen}
          onClose={() => setPaymentModalData(null)}
          operationId={paymentModalData.operationId}
          operationCode={paymentModalData.code}
          clientName={paymentModalData.client}
          balance={paymentModalData.balance}
        />
      )}

      {deliveryModalData && (
        <CreditDeliveryModal
          isOpen={deliveryModalData.isOpen}
          onClose={() => setDeliveryModalData(null)}
          operationId={deliveryModalData.operationId}
          operationCode={deliveryModalData.code}
          clientName={deliveryModalData.client}
          balance={deliveryModalData.balance}
          deliveryMode={deliveryModalData.deliveryMode}
          items={deliveryModalData.items}
        />
      )}
    </div>
  );
}

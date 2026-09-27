"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Building2,
  Plus,
  Network,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Send,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBranches,
  createBranch,
  updateBranch,
  requestBranch,
  getBranchRequests,
  reviewBranchRequest,
} from "@/app/actions/branch-actions";

interface BranchesManagerProps {
  isSuperAdmin: boolean;
  role?: string;
}

export function BranchesManager({ isSuperAdmin, role }: BranchesManagerProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Forms
  const [requestForm, setRequestForm] = useState({
    branchName: "",
    city: "",
    address: "",
    phone: "",
    justification: "",
  });

  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    phone: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchesRes, requestsRes] = await Promise.all([
        getBranches(),
        getBranchRequests(),
      ]);

      if (branchesRes.success) setBranches(branchesRes.branches || []);
      if (requestsRes.success) setRequests(requestsRes.requests || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar configuración de sedes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Request Sede
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.branchName.trim() || !requestForm.justification.trim()) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    startTransition(async () => {
      const res = await requestBranch(requestForm);
      if (res.success) {
        toast.success("Solicitud enviada exitosamente a soporte/SuperAdmin.");
        setShowRequestModal(false);
        setRequestForm({ branchName: "", city: "", address: "", phone: "", justification: "" });
        loadData();
      } else {
        toast.error(res.error || "Error al enviar solicitud");
      }
    });
  };

  // Handle Create Sede
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    startTransition(async () => {
      const res = await createBranch(branchForm);
      if (res.success) {
        toast.success("Sede registrada exitosamente");
        setShowCreateModal(false);
        setBranchForm({ name: "", code: "", city: "", address: "", phone: "" });
        loadData();
      } else {
        toast.error(res.error || "No se pudo crear la sede");
      }
    });
  };

  // Handle Update Sede
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    startTransition(async () => {
      const res = await updateBranch(editingBranch.id, {
        name: editingBranch.name,
        code: editingBranch.code,
        city: editingBranch.city,
        address: editingBranch.address,
        phone: editingBranch.phone,
        active: editingBranch.active,
      });

      if (res.success) {
        toast.success("Sede actualizada");
        setEditingBranch(null);
        loadData();
      } else {
        toast.error(res.error || "Error al actualizar");
      }
    });
  };

  // Handle Review Request (SuperAdmin)
  const handleReview = async (requestId: number, status: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      const res = await reviewBranchRequest({
        requestId,
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
      });

      if (res.success) {
        toast.success(status === "APPROVED" ? "Solicitud aprobada y sede habilitada" : "Solicitud rechazada");
        setRejectingRequestId(null);
        setRejectionReason("");
        loadData();
      } else {
        toast.error(res.error || "Error al procesar solicitud");
      }
    });
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <p className="text-sm">Cargando módulo de sedes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-400/20 text-xs font-semibold mb-2">
            <Network className="w-3.5 h-3.5" />
            GNS Enterprise Multi-Sedes
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Gestión de Sedes y Sucursales
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Administra los puntos de venta y sucursales de tu empresa. Cada sede cuenta con inventario diferenciado, bodegas vinculadas y trazabilidad total.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium border border-slate-700 transition-all shadow-sm"
          >
            <Send className="w-4 h-4 text-blue-400" />
            Solicitar Nueva Sede
          </button>

          {(isSuperAdmin || branches.length > 0) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              Crear Sede
            </button>
          )}
        </div>
      </div>

      {/* Active Branches Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-500" />
          Sedes Registradas ({branches.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3 px-4">Sede / Código</th>
                <th className="py-3 px-4">Ciudad / Dirección</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Productos</th>
                <th className="py-3 px-4">Ventas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {branches.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {b.name}
                      {b.isMain && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-bold">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{b.code || "Sin código"}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {b.city || "N/A"}
                    </div>
                    <div className="text-xs text-slate-400">{b.address || "Sin dirección"}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                    {b.phone || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {b._count?.products || 0} productos
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {b._count?.sales || 0} facturas
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        b.active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}
                    >
                      {b.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setEditingBranch(b)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Requests Section (SuperAdmin view or Company Admin View) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Solicitudes de Ampliación de Sedes ({requests.length})
        </h3>

        {requests.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No hay solicitudes de sedes pendientes en este momento.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {req.branchName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : req.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {req.status === "APPROVED" ? "Aprobada" : req.status === "REJECTED" ? "Rechazada" : "Pendiente de Aprobación"}
                    </span>
                    {req.company && isSuperAdmin && (
                      <span className="text-xs text-slate-400">
                        Empresa: <strong>{req.company.name}</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <strong>Ciudad:</strong> {req.city || "N/A"} | <strong>Dirección:</strong> {req.address || "N/A"} | <strong>Tel:</strong> {req.phone || "N/A"}
                  </p>
                  <p className="text-xs text-slate-500 italic">
                    &ldquo;{req.justification}&rdquo;
                  </p>
                  {req.rejectionReason && (
                    <p className="text-xs text-rose-400 font-semibold">
                      Motivo de rechazo: {req.rejectionReason}
                    </p>
                  )}
                </div>

                {/* SuperAdmin Actions */}
                {isSuperAdmin && req.status === "PENDING" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReview(req.id, "APPROVED")}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aprobar Sede
                    </button>
                    <button
                      onClick={() => setRejectingRequestId(req.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Solicitar Sede */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                Solicitar Nueva Sede Enterprise
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sede Chapinero / Sucursal Laureles"
                  value={requestForm.branchName}
                  onChange={(e) => setRequestForm({ ...requestForm, branchName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Bogotá"
                    value={requestForm.city}
                    onChange={(e) => setRequestForm({ ...requestForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="300 000 0000"
                    value={requestForm.phone}
                    onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Carrera 15 # 85-30"
                  value={requestForm.address}
                  onChange={(e) => setRequestForm({ ...requestForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Justificación Comercial *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explica el motivo de apertura de la nueva sede, volumen estimado y requerimientos..."
                  value={requestForm.justification}
                  onChange={(e) => setRequestForm({ ...requestForm, justification: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isPending ? "Enviando..." : "Enviar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Sede Directa */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Registrar Sede
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Sede Sur"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    placeholder="SEDE-03"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Medellín"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Calle 30 # 45-12"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isPending ? "Guardando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Sede */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Editar Sede: {editingBranch.name}
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingBranch.name}
                  onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={editingBranch.code || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={editingBranch.city || ""}
                    onChange={(e) => setEditingBranch({ ...editingBranch, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  value={editingBranch.address || ""}
                  onChange={(e) => setEditingBranch({ ...editingBranch, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editingBranch.phone || ""}
                  onChange={(e) => setEditingBranch({ ...editingBranch, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="branchActive"
                  checked={editingBranch.active}
                  onChange={(e) => setEditingBranch({ ...editingBranch, active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="branchActive" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                  Sede activa y operativa para ventas
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isPending ? "Guardando..." : "Actualizar Sede"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rechazar Solicitud (SuperAdmin) */}
      {rejectingRequestId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Motivo del Rechazo
            </h3>
            <textarea
              rows={3}
              placeholder="Indica la razón por la cual no se aprueba la apertura de esta sede..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectingRequestId, "REJECTED")}
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

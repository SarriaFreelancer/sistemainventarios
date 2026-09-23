"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Check, Copy, X, Loader2, ShieldCheck, Building2, User, Clock, AlertCircle } from "lucide-react";
import { getPendingPasswordResetRequests, approvePasswordResetRequest, rejectPasswordResetRequest } from "@/app/actions/password-actions";
import { successAlert, errorAlert } from "@/lib/sweetalert";

export function SuperAdminPasswordRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Modal para mostrar la clave temporal generada
  const [approvalResult, setApprovalResult] = useState<{
    isOpen: boolean;
    tempPassword: string;
    userEmail: string;
    companyName: string;
  }>({
    isOpen: false,
    tempPassword: "",
    userEmail: "",
    companyName: "",
  });

  const [copied, setCopied] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await getPendingPasswordResetRequests();
    if (res.success && res.requests) {
      setRequests(res.requests);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: number) => {
    setProcessingId(requestId);
    const res = await approvePasswordResetRequest(requestId);
    setProcessingId(null);

    if (res.success && res.tempPassword) {
      setApprovalResult({
        isOpen: true,
        tempPassword: res.tempPassword,
        userEmail: res.userEmail || "",
        companyName: res.companyName || "",
      });
      fetchRequests();
    } else {
      errorAlert("Error", res.error || "No se pudo aprobar la solicitud.");
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessingId(requestId);
    const res = await rejectPasswordResetRequest(requestId);
    setProcessingId(null);

    if (res.success) {
      successAlert("Solicitud rechazada", "La solicitud fue descartada.");
      fetchRequests();
    } else {
      errorAlert("Error", res.error || "No se pudo rechazar la solicitud.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(approvalResult.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={16} className="animate-spin text-primary" />
        <span>Cargando solicitudes de contraseña...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Si no hay solicitudes pendientes, no ocupa espacio visual
  }

  return (
    <>
      <div className="bg-card border border-amber-500/30 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Solicitudes de Restablecimiento de Contraseña de Admin</h3>
              <p className="text-[11px] text-muted-foreground">
                Administradores que han solicitado una nueva clave temporal al SuperAdmin.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black rounded-full">
            {requests.length} Pendiente{requests.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-2xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-foreground truncate">{req.user?.name || req.user?.email}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-black uppercase">
                    {req.user?.role?.name || "ADMIN"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Building2 size={12} />
                    {req.company?.name || "Sin Empresa"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(req.requestedAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                {req.notes && (
                  <p className="text-[10px] text-muted-foreground italic">&ldquo;{req.notes}&rdquo;</p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={processingId === req.id}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {processingId === req.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>Aprobar con 1 Clic</span>
                </button>

                <button
                  onClick={() => handleReject(req.id)}
                  disabled={processingId === req.id}
                  className="px-3 py-2 rounded-xl bg-muted border border-border text-muted-foreground text-xs font-bold hover:bg-destructive/10 hover:text-destructive transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X size={14} />
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Contraseña Temporal Generada */}
      {approvalResult.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <ShieldCheck size={30} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">¡Solicitud Aprobada Exitosamente!</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Se generó una contraseña temporal para <strong>{approvalResult.userEmail}</strong> ({approvalResult.companyName}).
              </p>
            </div>

            <div className="bg-muted/50 border border-border rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Clave Temporal Generada (1 solo uso)
              </span>
              <div className="flex items-center justify-center gap-2">
                <code className="text-base sm:text-lg font-mono font-black text-primary bg-card px-4 py-2 rounded-xl border border-border">
                  {approvalResult.tempPassword}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-95 transition cursor-pointer"
                  title="Copiar contraseña"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Al ingresar con esta clave, el sistema le pedirá de inmediato definir en <strong>dos inputs</strong> su contraseña definitiva.
              </p>
            </div>

            <button
              onClick={() => setApprovalResult({ isOpen: false, tempPassword: "", userEmail: "", companyName: "" })}
              className="w-full py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}
    </>
  );
}

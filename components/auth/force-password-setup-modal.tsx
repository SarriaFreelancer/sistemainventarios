"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, KeyRound, AlertTriangle, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { checkAdminPasswordStatus, setInitialAdminPassword, completePasswordReset } from "@/app/actions/password-actions";
import { successAlert, errorAlert } from "@/lib/sweetalert";

export function ForcePasswordSetupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [modalType, setModalType] = useState<"INITIAL_GOOGLE" | "MUST_CHANGE_TEMP" | "EXPIRED_6_MONTHS" | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function evaluateStatus() {
      try {
        const status = await checkAdminPasswordStatus();
        if (status.success && status.authenticated) {
          setUserEmail(status.email || "");
          if (status.needsInitialPassword) {
            setModalType("INITIAL_GOOGLE");
            setIsOpen(true);
          } else if (status.mustChangePassword) {
            setModalType("MUST_CHANGE_TEMP");
            setIsOpen(true);
          } else if (status.isExpired) {
            setModalType("EXPIRED_6_MONTHS");
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }
      } catch (err) {
        console.error("Error evaluating password status:", err);
      } finally {
        setLoadingStatus(false);
      }
    }

    evaluateStatus();
  }, []);

  if (!isOpen || loadingStatus) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPassword || newPassword.trim().length < 6) {
      setErrorMsg("La nueva contraseña debe contener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden. Por favor verifica ambos campos.");
      return;
    }

    setSubmitting(true);
    let res: { success: boolean; message?: string; error?: string };

    if (modalType === "INITIAL_GOOGLE") {
      res = await setInitialAdminPassword({ newPassword, confirmPassword });
    } else {
      res = await completePasswordReset({ newPassword, confirmPassword });
    }

    setSubmitting(false);

    if (res.success) {
      setIsOpen(false);
      await successAlert("¡Contraseña configurada!", res.message || "Tu contraseña de Administrador ha sido guardada exitosamente.");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Ocurrió un error al procesar la contraseña.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
        {/* Encabezado */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner">
            {modalType === "INITIAL_GOOGLE" ? (
              <KeyRound size={28} className="animate-pulse" />
            ) : modalType === "MUST_CHANGE_TEMP" ? (
              <ShieldCheck size={28} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={28} className="text-amber-500" />
            )}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              {modalType === "INITIAL_GOOGLE" && "Configura tu Contraseña de Administrador"}
              {modalType === "MUST_CHANGE_TEMP" && "Define tu Contraseña Definitiva"}
              {modalType === "EXPIRED_6_MONTHS" && "Renovación Semestral de Contraseña"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {modalType === "INITIAL_GOOGLE" && (
                <>
                  Has iniciado sesión con <strong>Google</strong> como <strong>Administrador</strong>. Para autorizar permisos de seguridad, eliminaciones de datos y habilitar el ingreso tradicional opcional, define tu contraseña de Admin.
                </>
              )}
              {modalType === "MUST_CHANGE_TEMP" && (
                <>
                  Has ingresado con una <strong>contraseña temporal</strong> generada por el SuperAdmin. Por favor ingresa y confirma la nueva contraseña que deseas utilizar.
                </>
              )}
              {modalType === "EXPIRED_6_MONTHS" && (
                <>
                  Tu contraseña de Administrador ha cumplido su ciclo de <strong>6 meses de vigencia</strong>. Por seguridad de tu empresa, ingresa una nueva contraseña.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-2xl text-xs font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Nueva Contraseña de Administrador
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres..."
                  required
                  autoFocus
                  className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña exactamente..."
                  required
                  className="w-full bg-muted/40 border border-border rounded-2xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary pr-10"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-black text-xs rounded-2xl shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Guardando Contraseña...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Guardar Contraseña de Administrador</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-[10px] text-muted-foreground">
          🔒 Conexión cifrada de extremo a extremo • Hash bcrypt seguro
        </div>
      </div>
    </div>
  );
}

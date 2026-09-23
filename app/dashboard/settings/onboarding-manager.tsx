"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Trash2,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Building2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Info,
  X,
  ShieldCheck,
  PackageCheck
} from "lucide-react";
import { successAlert, errorAlert } from "@/lib/sweetalert";
import Swal from "sweetalert2";
import {
  generateDemoData,
  clearDemoData,
  clearGlobalSystemData,
  getDemoDataStatus
} from "@/app/actions/demo-actions";
import { useRouter } from "next/navigation";
import { resetTourCompleted } from "@/app/actions/user-actions";

export function OnboardingManager({
  userId,
  role,
  companies = []
}: {
  userId: string;
  role?: string;
  companies?: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Estado del lote de prueba
  const [hasDemoData, setHasDemoData] = useState<boolean>(false);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(true);

  // Modal de Limpieza por Empresa
  const [cleanModalOpen, setCleanModalOpen] = useState(false);
  const [cleanTarget, setCleanTarget] = useState<{ id?: number; name?: string } | null>(null);
  const [cleanMode, setCleanMode] = useState<'ONLY_DEMO' | 'ALL'>('ONLY_DEMO');
  const [cleanPassword, setCleanPassword] = useState("");
  const [showCleanPassword, setShowCleanPassword] = useState(false);
  const [cleanModalError, setCleanModalError] = useState("");

  // Modal de Reset Global (SuperAdmin)
  const [globalModalOpen, setGlobalModalOpen] = useState(false);
  const [globalPassword, setGlobalPassword] = useState("");
  const [showGlobalPassword, setShowGlobalPassword] = useState(false);
  const [globalModalError, setGlobalModalError] = useState("");

  const isSuperAdmin = role === 'SUPERADMIN';

  // Cargar estado de datos de prueba
  const fetchStatus = useCallback(async (targetId?: number) => {
    setCheckingStatus(true);
    try {
      const res = await getDemoDataStatus(targetId);
      setHasDemoData(res.hasDemoData);
      setBatchInfo((res as any).batchInfo || null);
    } catch (err) {
      console.error("Error al obtener estado de datos demo:", err);
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRestartTour = async () => {
    localStorage.removeItem(`gns_sarriatech_tour_completed_${userId}`);
    await resetTourCompleted(Number(userId));
    router.push("/dashboard");
    router.refresh();
  };

  const handleGenerate = async () => {
    if (hasDemoData) {
      await Swal.fire({
        title: 'Datos de prueba ya existentes',
        text: 'Ya existen datos de demostración activos en tu empresa. Debes eliminarlos antes de generar un nuevo lote de prueba.',
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Generar datos de prueba?',
      text: "Se inyectarán categorías, productos, ventas, clientes, nómina e inventario de demostración en tu empresa.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, generar'
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      const res = await generateDemoData();
      setLoading(false);

      if (res.success) {
        await successAlert("Datos generados", res.message || "Se crearon los registros de prueba exitosamente.");
        await fetchStatus();
        window.location.reload();
      } else {
        errorAlert("Error", res.error || "Ocurrió un error");
      }
    }
  };

  // Abrir modal de limpieza por empresa
  const openCleanCompanyModal = (targetId?: number, targetName?: string) => {
    setCleanTarget({ id: targetId, name: targetName });
    setCleanMode('ONLY_DEMO');
    setCleanPassword("");
    setShowCleanPassword(false);
    setCleanModalError("");
    setCleanModalOpen(true);
  };

  // Ejecutar limpieza por empresa
  const handleConfirmCompanyClean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanPassword.trim()) {
      setCleanModalError("Por favor ingresa tu contraseña de administrador para continuar.");
      return;
    }

    setCleaning(true);
    setCleanModalError("");

    const res = await clearDemoData({
      targetCompanyId: cleanTarget?.id,
      mode: cleanMode,
      password: cleanPassword
    });

    setCleaning(false);

    if (res.success) {
      setCleanModalOpen(false);
      setCleanPassword("");
      await successAlert("Limpieza completada", res.message || "La operación se completó exitosamente.");
      await fetchStatus(cleanTarget?.id);
      window.location.reload();
    } else {
      setCleanModalError(res.error || "Error al procesar la eliminación de datos.");
    }
  };

  // Abrir modal de Reset Global
  const openGlobalCleanModal = () => {
    setGlobalPassword("");
    setShowGlobalPassword(false);
    setGlobalModalError("");
    setGlobalModalOpen(true);
  };

  // Ejecutar Reset Global
  const handleConfirmGlobalClean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalPassword.trim()) {
      setGlobalModalError("Por favor ingresa tu contraseña de SuperAdmin para confirmar el Reset Global.");
      return;
    }

    setCleaning(true);
    setGlobalModalError("");

    const res = await clearGlobalSystemData({
      password: globalPassword
    });

    setCleaning(false);

    if (res.success) {
      setGlobalModalOpen(false);
      setGlobalPassword("");
      await successAlert("Reset Global Completado", res.message || "Se vaciaron los registros de todas las empresas.");
      await fetchStatus();
      window.location.reload();
    } else {
      setGlobalModalError(res.error || "Error al ejecutar la limpieza global.");
    }
  };

  return (
    <div className="space-y-6">
      {/* ── SECCIÓN 1: GESTIÓN DE DATOS Y LIMPIEZA DE LA EMPRESA ── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 p-3 rounded-xl">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">Gestión de Datos y Limpieza por Empresa</h2>

              {/* Badge de estado de datos demo */}
              {!checkingStatus && (
                hasDemoData ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertCircle size={14} />
                    Datos de prueba activos
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={14} />
                    Sin datos de prueba
                  </span>
                )
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Permite cargar un conjunto de productos, inventario, ventas y CRM de muestra para explorar las funcionalidades del sistema, o realizar limpiezas seguras.
              <b> Importante:</b> Las cuentas de usuario y el acceso a la plataforma <b>nunca se eliminan</b> para mantener tu sesión activa.
            </p>

            {/* Aviso si existen datos de prueba */}
            {hasDemoData && (
              <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                <Info size={16} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Lote de prueba activo en el sistema</p>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                    Ya existen registros de prueba inyectados. No es posible volver a generar datos de prueba hasta que elimines los actuales. Puedes usar <b>&quot;Limpiar Datos de mi Empresa&quot;</b> para borrar únicamente los datos de prueba sin afectar tus productos y clientes reales.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || cleaning || hasDemoData || checkingStatus}
                title={hasDemoData ? "Elimina los datos de prueba existentes antes de generar nuevos" : "Generar lote de prueba"}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm transition shadow-sm ${
                  hasDemoData
                    ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                }`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>Generar Datos de Prueba</span>
              </button>

              <button
                type="button"
                onClick={() => openCleanCompanyModal()}
                disabled={loading || cleaning}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 font-semibold rounded-xl text-sm hover:bg-destructive/20 active:scale-95 transition disabled:opacity-50"
              >
                {cleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                <span>Limpiar Datos de mi Empresa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: HERRAMIENTAS DE LIMPIEZA DEL SUPERADMIN ── */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 text-destructive rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Herramientas de Limpieza del SuperAdmin</h3>
              <p className="text-xs text-muted-foreground">Administra o vacía de forma selectiva o total los datos de cualquier empresa de la plataforma con autorización de contraseña.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Opción A: Limpiar empresa específica */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building2 size={14} /> Limpiar una Empresa Específica
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecciona una empresa para eliminar solo sus datos de prueba o vaciar completamente su catálogo.
                </p>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => {
                    setSelectedCompanyId(e.target.value);
                    if (e.target.value) {
                      fetchStatus(Number(e.target.value));
                    } else {
                      fetchStatus();
                    }
                  }}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="">Selecciona una empresa...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!selectedCompanyId || cleaning}
                onClick={() => {
                  const comp = companies.find(c => String(c.id) === selectedCompanyId);
                  openCleanCompanyModal(Number(selectedCompanyId), comp?.name);
                }}
                className="w-full py-2 px-3 bg-secondary text-secondary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                Limpiar Empresa Seleccionada
              </button>
            </div>

            {/* Opción B: Reset Global */}
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                  <ShieldAlert size={14} /> Reset Global Transaccional
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Borra todos los productos, inventario, finanzas y ventas de <b>todas las empresas</b> del sistema. Conserva todas las cuentas de usuario y empresas activas.
                </p>
              </div>
              <button
                type="button"
                disabled={cleaning}
                onClick={openGlobalCleanModal}
                className="w-full py-2.5 px-3 bg-destructive text-white font-bold rounded-xl text-xs hover:opacity-90 transition shadow-md shadow-destructive/20 flex items-center justify-center gap-2"
              >
                {cleaning ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Vaciar Todas las Empresas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SECCIÓN 3: TUTORIAL ── */}
      <div className="rounded-2xl border border-border p-6 bg-card">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
          <ArrowRight size={18} className="text-primary" />
          Tour Guiado
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Si deseas volver a ver el tutorial interactivo del sistema para repasar las opciones principales, presiona el siguiente botón.
        </p>
        <button
          type="button"
          onClick={handleRestartTour}
          className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg text-sm hover:opacity-90 transition"
        >
          Relanzar Tutorial
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 1: LIMPIEZA DE EMPRESA (SOLO DEMO vs TODOS LOS DATOS) */}
      {/* ══════════════════════════════════════════════════════════ */}
      {cleanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-destructive/10 text-destructive rounded-xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {cleanTarget?.name ? `Limpiar Datos de ${cleanTarget.name}` : "Limpiar Datos de la Empresa"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selecciona el alcance de la eliminación e ingresa tu contraseña.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !cleaning && setCleanModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmCompanyClean} className="mt-5 space-y-5">
              {/* Opciones de Selección de Modo */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Selecciona qué deseas eliminar:
                </label>

                {/* Opción 1: Solo datos de prueba */}
                <div
                  onClick={() => setCleanMode('ONLY_DEMO')}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                    cleanMode === 'ONLY_DEMO'
                      ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    id="mode-demo"
                    name="cleanMode"
                    checked={cleanMode === 'ONLY_DEMO'}
                    onChange={() => setCleanMode('ONLY_DEMO')}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <PackageCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <label htmlFor="mode-demo" className="text-sm font-bold text-foreground cursor-pointer">
                        Eliminar solo datos de prueba <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">(Recomendado)</span>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Elimina únicamente los productos, categorías, proveedores, ventas y nóminas inyectados por el asistente de prueba. <b>Todos los productos, proveedores y clientes creados manualmente por ti se conservarán intactos.</b>
                    </p>
                  </div>
                </div>

                {/* Opción 2: Eliminar todo */}
                <div
                  onClick={() => setCleanMode('ALL')}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3.5 ${
                    cleanMode === 'ALL'
                      ? "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <input
                    type="radio"
                    id="mode-all"
                    name="cleanMode"
                    checked={cleanMode === 'ALL'}
                    onChange={() => setCleanMode('ALL')}
                    className="mt-1 text-destructive focus:ring-destructive"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-destructive" />
                      <label htmlFor="mode-all" className="text-sm font-bold text-foreground cursor-pointer">
                        Eliminar todos los datos de la empresa
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Vacía todo el catálogo de productos, compras, finanzas, nóminas y ventas de la empresa (tanto de prueba como reales). Las cuentas de usuario y la suscripción de la empresa <b>permanecerán activas</b>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Campo de Contraseña */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock size={14} className="text-primary" />
                    Contraseña del Administrador:
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">Requerida para autorizar</span>
                </label>
                <div className="relative">
                  <input
                    type={showCleanPassword ? "text" : "password"}
                    value={cleanPassword}
                    onChange={(e) => {
                      setCleanPassword(e.target.value);
                      if (cleanModalError) setCleanModalError("");
                    }}
                    placeholder="Ingresa tu contraseña de inicio de sesión"
                    required
                    disabled={cleaning}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCleanPassword(!showCleanPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showCleanPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Mensaje de Error en el Modal */}
              {cleanModalError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-xs text-destructive font-medium">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{cleanModalError}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  disabled={cleaning}
                  onClick={() => setCleanModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cleaning || !cleanPassword.trim()}
                  className={`px-5 py-2.5 font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-md ${
                    cleanMode === 'ONLY_DEMO'
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                      : "bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20"
                  } disabled:opacity-50`}
                >
                  {cleaning ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>
                        {cleanMode === 'ONLY_DEMO' ? "Eliminar Solo Datos de Prueba" : "Confirmar Eliminación Completa"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* MODAL 2: RESET GLOBAL DEL SISTEMA (EXCLUSIVO SUPERADMIN)   */}
      {/* ══════════════════════════════════════════════════════════ */}
      {globalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card border border-destructive/40 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-destructive text-white rounded-xl shadow-lg shadow-destructive/30">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Reset Global Transaccional del Sistema
                  </h3>
                  <p className="text-xs text-destructive font-medium mt-0.5">
                    Acción de alto impacto que afecta a todas las empresas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !cleaning && setGlobalModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmGlobalClean} className="mt-5 space-y-5">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={15} /> ADVERTENCIA CRÍTICA:
                </p>
                <p className="text-muted-foreground">
                  Se eliminarán todos los productos, ventas, inventarios, cotizaciones, finanzas y nóminas de <b>TODAS las empresas</b> registradas en la plataforma.
                </p>
                <p className="text-foreground font-semibold">
                  Las cuentas de usuario, correos, accesos de inicio de sesión y licencias de cada empresa NO serán eliminados.
                </p>
              </div>

              {/* Campo de Contraseña del SuperAdmin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock size={14} className="text-destructive" />
                    Contraseña del SuperAdmin:
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground">Verificación obligatoria</span>
                </label>
                <div className="relative">
                  <input
                    type={showGlobalPassword ? "text" : "password"}
                    value={globalPassword}
                    onChange={(e) => {
                      setGlobalPassword(e.target.value);
                      if (globalModalError) setGlobalModalError("");
                    }}
                    placeholder="Ingresa tu contraseña de SuperAdmin"
                    required
                    disabled={cleaning}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGlobalPassword(!showGlobalPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showGlobalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Mensaje de Error */}
              {globalModalError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-xs text-destructive font-medium">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{globalModalError}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  disabled={cleaning}
                  onClick={() => setGlobalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cleaning || !globalPassword.trim()}
                  className="px-5 py-2.5 bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-destructive/30 disabled:opacity-50"
                >
                  {cleaning ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Ejecutando Reset Global...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      <span>Autorizar y Vaciar Todas las Empresas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Sparkles, Trash2, Loader2, ArrowRight, ShieldAlert, Building2 } from "lucide-react";
import { successAlert, errorAlert } from "@/lib/sweetalert";
import Swal from "sweetalert2";
import { generateDemoData, clearDemoData, clearGlobalSystemData } from "@/app/actions/demo-actions";
import { useRouter } from "next/navigation";

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

  const isSuperAdmin = role === 'SUPERADMIN';

  const handleRestartTour = async () => {
    localStorage.removeItem(`gns_sarriatech_tour_completed_${userId}`);
    router.push("/dashboard");
  };

  const handleGenerate = async () => {
    const confirm = await Swal.fire({
      title: '¿Generar datos de prueba?',
      text: "Se inyectarán categorías, productos, ventas e inventario de demostración en tu empresa.",
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
        await successAlert("Datos generados", "Se crearon los registros de prueba exitosamente.");
        window.location.reload();
      } else {
        errorAlert("Error", res.error || "Ocurrió un error");
      }
    }
  };

  const handleCleanCompany = async (targetId?: number, targetName?: string) => {
    const titleText = targetName ? `¿Vaciar datos de ${targetName}?` : '¿Limpiar datos de tu empresa?';
    const confirm = await Swal.fire({
      title: titleText,
      text: "Se eliminarán permanentemente las ventas, productos, clientes, categorías y proveedores. Las cuentas de usuario y la suscripción de la empresa PERMANECERÁN ACTIVAS.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, limpiar empresa'
    });

    if (confirm.isConfirmed) {
      setCleaning(true);
      const res = await clearDemoData(targetId);
      setCleaning(false);
      
      if (res.success) {
        await successAlert("Limpieza exitosa", res.message || "Los datos de la empresa han sido eliminados.");
        window.location.reload();
      } else {
        errorAlert("Error", res.error || "Ocurrió un error");
      }
    }
  };

  const handleCleanGlobal = async () => {
    const confirm = await Swal.fire({
      title: '⚠️ ¿Deseas hacer un Reset Global del Sistema?',
      text: "Se vaciarán los productos, ventas e inventarios de TODAS las empresas del sistema. TODAS las cuentas de usuario, logins y licencias de las empresas PERMANECERÁN INTACTAS.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, vaciar todas las empresas'
    });

    if (confirm.isConfirmed) {
      setCleaning(true);
      const res = await clearGlobalSystemData();
      setCleaning(false);
      
      if (res.success) {
        await successAlert("Limpieza Global Completada", res.message || "Se borraron los productos y ventas de todas las empresas.");
        window.location.reload();
      } else {
        errorAlert("Error", res.error || "Ocurrió un error al ejecutar la limpieza global");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ── SECCIÓN 1: LIMPIEZA DE LA EMPRESA ── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-primary/10 p-3 rounded-xl">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">Gestión de Datos y Limpieza por Empresa</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Permite reiniciar los catálogos y registros transaccionales (ventas, productos, clientes, categorías). 
              <b> Importante:</b> Las cuentas de usuario y el acceso a la plataforma <b>nunca se eliminan</b> para mantener la sesión activa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || cleaning}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Generar Datos de Prueba
              </button>

              <button
                type="button"
                onClick={() => handleCleanCompany()}
                disabled={loading || cleaning}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-destructive/10 text-destructive border border-destructive/20 font-semibold rounded-xl text-sm hover:bg-destructive/20 transition disabled:opacity-50"
              >
                {cleaning ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Limpiar Datos de mi Empresa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN 2: LIMPIEZA GLOBAL (EXCLUSIVO SUPERADMIN) ── */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 text-destructive rounded-xl">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Herramientas de Limpieza del SuperAdmin</h3>
              <p className="text-xs text-muted-foreground">Administra o vacía de forma independiente los datos de cualquier empresa de la plataforma.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Opción A: Limpiar empresa específica */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 size={14} /> Limpiar una Empresa Específica
              </p>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
              >
                <option value="">Selecciona una empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedCompanyId || cleaning}
                onClick={() => {
                  const comp = companies.find(c => String(c.id) === selectedCompanyId);
                  handleCleanCompany(Number(selectedCompanyId), comp?.name);
                }}
                className="w-full py-2 px-3 bg-secondary text-secondary-foreground font-semibold rounded-lg text-xs hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                Vaciar Empresa Seleccionada
              </button>
            </div>

            {/* Opción B: Reset Global */}
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                  <ShieldAlert size={14} /> Reset Global Transaccional
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Borra todos los productos, inventario y ventas de <b>todas las empresas</b> del sistema. Conserva los usuarios y empresas activos.
                </p>
              </div>
              <button
                type="button"
                disabled={cleaning}
                onClick={handleCleanGlobal}
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
    </div>
  );
}

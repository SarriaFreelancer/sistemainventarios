"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogIn, RefreshCw } from "lucide-react";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorTitle = "Error de Autenticación";
  let errorMessage = "Ha ocurrido un inconveniente al intentar iniciar sesión en tu cuenta.";

  if (error === "Configuration") {
    errorTitle = "Configuración Incompleta";
    errorMessage = "Hay un problema con la configuración del proveedor de autenticación en el servidor.";
  } else if (error === "AccessDenied") {
    errorTitle = "Acceso Denegado";
    errorMessage = "No tienes permisos para acceder a esta aplicación o la solicitud fue cancelada.";
  } else if (error === "Verification") {
    errorTitle = "Enlace Expirado";
    errorMessage = "El enlace de verificación ya no es válido o ha sido utilizado.";
  } else if (error === "OAuthCallback" || error === "Callback") {
    errorTitle = "Error en el Proveedor de Autenticación";
    errorMessage = "No pudimos completar el inicio de sesión con el proveedor seleccionado. Intenta nuevamente.";
  } else if (error) {
    errorMessage = `Detalle del error: ${error}`;
  }

  return (
    <div className="w-full max-w-md bg-card dark:bg-[#0b1329] rounded-[28px] p-8 shadow-2xl border border-border/80 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-extrabold text-foreground tracking-tight">
          {errorTitle}
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {errorMessage}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground">
        Si el problema persiste, contacta al administrador o intenta iniciar sesión con tu correo y contraseña.
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <Link
          href="/auth/login"
          className="w-full h-11 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-bold text-xs shadow-md transition-all gap-2"
        >
          <LogIn className="w-4 h-4" /> Volver a Iniciar Sesión
        </Link>

        <Link
          href="/"
          className="w-full h-11 inline-flex items-center justify-center rounded-xl border border-border text-foreground hover:bg-muted font-bold text-xs transition-all gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Regresar al Inicio
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-[#070b14] p-4 font-sans selection:bg-blue-500 selection:text-white">
      <Suspense fallback={
        <div className="text-center p-8 bg-card rounded-2xl border border-border">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs text-muted-foreground">Cargando...</p>
        </div>
      }>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}

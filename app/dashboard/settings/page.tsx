import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { getCompanySettings } from "@/app/actions/settings-actions";
import { SettingsClient } from "./settings-client";

import { getServers } from "@/app/actions/server-actions";

export const metadata = {
  title: "Configuración del Sistema - GNS SarriaTech",
  description: "Ajustes de localización, inventario, facturación y seguridad.",
};

export default async function SettingsPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");

  // Aislamiento: Solo ADMIN y SUPERADMIN pueden acceder a la configuración
  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const isSuperAdmin = session.user.role === "SUPERADMIN";
  const result = await getCompanySettings();
  const servers = isSuperAdmin ? await getServers() : [];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración General</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los parámetros comerciales, control de stock y seguridad de tu empresa.
        </p>
      </div>

      {(result.success && result.settings) || isSuperAdmin ? (
        <SettingsClient 
          initialSettings={result.settings || {} as any} 
          role={session.user.role}
          initialServers={servers}
        />
      ) : (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <p className="font-semibold">Error al cargar configuración</p>
          <p className="text-sm">{result.error || "Ocurrió un error inesperado."}</p>
        </div>
      )}
    </div>
  );
}

import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { getCompanySettings } from "@/app/actions/settings-actions";
import { SettingsClient } from "./settings-client";

import { getServers } from "@/app/actions/server-actions";
import { prisma } from "@/lib/prisma";

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
  const isAdmin = session.user.role === "ADMIN";
  
  let isPremium = false;
  if (isAdmin && session.user.companyId) {
    const userCompany = await prisma.company.findUnique({
      where: { id: Number(session.user.companyId) },
      select: { planId: true }
    });
    isPremium = userCompany?.planId === "premium";
  }

  const canManageServers = isSuperAdmin || (isAdmin && isPremium);
  const result = await getCompanySettings();
  const servers = canManageServers ? await getServers() : [];
  
  // Obtener empresas para licencias y mapeo si es superadmin
  let allCompanies: any[] = [];
  if (isSuperAdmin) {
    try {
      const dbCompanies = await prisma.company.findMany({
        select: { id: true, name: true, planId: true, status: true, databaseName: true, serverId: true, databaseType: true }
      });
      allCompanies = dbCompanies.map(c => ({
        ...c,
        active: c.status === "ACTIVE"
      }));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuración General</h1>
        <p className="text-sm text-muted-foreground">
          Modifica los parámetros comerciales, control de stock y seguridad de tu empresa.
        </p>
      </div>

      {(() => {
        const fallbackSettings = {
          nit: "", phone: "", website: "", currency: "COP", timezone: "America/Bogota", dateFormat: "DD/MM/YYYY", currencyFormat: "$",
          allowNegativeStock: false, automaticCode: true, decimals: 0, defaultIva: 19,
          invoicePrefix: "FAC", invoiceConsecutive: 1, purchasePrefix: "COM", purchaseConsecutive: 1,
          passwordMinLength: 8, maxLoginAttempts: 5, sessionTimeoutMinutes: 60, enable2FA: false,
          smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "",
          backupFrequency: "DAILY", backupTime: "02:00", backupDay: 1, backupPath: "", enableNotifications: true,
          invoiceConfig: {}
        };
        const finalSettings = result.settings || fallbackSettings;

        return ((result.success && result.settings) || isSuperAdmin) ? (
          <SettingsClient 
            initialSettings={finalSettings as any} 
            role={session.user.role} 
            initialServers={servers}
            dedicatedCompanies={allCompanies}
            canManageServers={canManageServers}
            userId={session.user.id}
          />
        ) : (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
            <p className="font-semibold">Error al cargar configuración</p>
            <p className="text-sm">{result.error || "Ocurrió un error inesperado."}</p>
          </div>
        );
      })()}
    </div>
  );
}

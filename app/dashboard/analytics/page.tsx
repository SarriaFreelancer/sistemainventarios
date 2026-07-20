import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { getSystemAnalytics } from "@/app/actions/analytics-actions";
import { AnalyticsClient } from "./analytics-client";

export const metadata = {
  title: "Analíticas del Sistema - GNS SarriaTech",
  description: "Dashboard de métricas SaaS, actividad de usuarios y uso de módulos.",
};

export default async function AnalyticsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const startDate = typeof searchParams?.start === 'string' ? searchParams.start : undefined;
  const endDate = typeof searchParams?.end === 'string' ? searchParams.end : undefined;

  const result = await getSystemAnalytics(startDate, endDate);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Centro de Analíticas
        </h1>
        <p className="text-sm text-muted-foreground">
          Métricas en tiempo real sobre actividad de usuarios, módulos y crecimiento del negocio.
        </p>
      </div>

      {result.success && result.analytics ? (
        <AnalyticsClient
          analytics={result.analytics}
          isSuperAdmin={session.user.role === "SUPERADMIN"}
        />
      ) : (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <p className="font-semibold">Error al cargar analíticas</p>
          <p className="text-sm">{result.error || "Ocurrió un error inesperado."}</p>
        </div>
      )}
    </div>
  );
}

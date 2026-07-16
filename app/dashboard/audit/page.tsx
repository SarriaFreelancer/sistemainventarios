import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { getAuditLogs } from "@/app/actions/audit-actions";
import { AuditClient } from "./audit-client";

export const metadata = {
  title: "Auditoría del Sistema - GNS SarriaTech",
  description: "Trazabilidad de acciones de usuario y auditoría de datos.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function AuditPage({ searchParams }: PageProps) {
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");

  // Aislamiento: Solo SUPERADMIN y ADMIN pueden visualizar logs de auditoría
  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page || "1");
  const search = resolvedParams.search || "";

  const result = await getAuditLogs(page, 20, search);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bitácora de Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Seguimiento transaccional de actividad, modificaciones de datos y accesos del sistema.
        </p>
      </div>

      {result.success ? (
        <AuditClient 
          initialLogs={result.logs || []} 
          total={result.total || 0} 
          currentPage={page} 
          totalPages={result.totalPages || 1}
          initialSearch={search}
          userRole={session.user.role}
        />
      ) : (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <p className="font-semibold">Error al cargar registros</p>
          <p className="text-sm">{result.error || "Ocurrió un error inesperado."}</p>
        </div>
      )}
    </div>
  );
}

import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { DocumentationClient } from "./documentation-client";
import { getCompanyAiConfig } from "@/app/actions/ai-config-actions";
import { getApiKeys } from "@/app/actions/api-key-actions";

export const metadata = {
  title: "Centro de Documentación & Guías - GNS SarriaTech",
  description: "Manual de usuario integral, cabeceras y especificaciones de APIs REST, casos de uso de IA y guía de configuración paso a paso.",
};

export default async function DocumentationPage() {
  const session = await getAuthSession();
  if (!session?.user) redirect("/auth/login");

  const [aiConfigResult, apiKeys] = await Promise.all([
    getCompanyAiConfig(),
    getApiKeys()
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Centro de Documentación & Manual Integral
        </h1>
        <p className="text-sm text-muted-foreground">
          Aprende a usar cada módulo del sistema paso a paso, integra las APIs REST y configura las capacidades de Inteligencia Artificial con tu propia API Key.
        </p>
      </div>

      <DocumentationClient
        userRole={session.user.role}
        companyAiConfig={aiConfigResult.config}
        apiKeys={apiKeys as any}
      />
    </div>
  );
}

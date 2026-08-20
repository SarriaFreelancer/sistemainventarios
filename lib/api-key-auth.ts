import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface AuthenticatedApiContext {
  companyId: number;
  keyId: string;
  permissions: Record<string, { read?: boolean; create?: boolean; update?: boolean; delete?: boolean }>;
}

export async function validateApiKeyRequest(
  request: Request,
  resource: string,
  action: "read" | "create" | "update" | "delete"
): Promise<{ errorResponse?: NextResponse; context?: AuthenticatedApiContext }> {
  const authHeader = request.headers.get("authorization") || request.headers.get("x-api-key");

  if (!authHeader) {
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Llave API no proporcionada. Envía el header Authorization: Bearer <gns_live_...> o x-api-key: <gns_live_...>" },
        { status: 401 }
      )
    };
  }

  const rawKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: rawKey },
      include: { company: true }
    });

    if (!apiKey || !apiKey.active) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Llave API inválida o desactivada" },
          { status: 403 }
        )
      };
    }

    const permissions = (apiKey.permissions as any) || {};
    const resourcePerms = permissions[resource] || {};

    if (!resourcePerms[action]) {
      return {
        errorResponse: NextResponse.json(
          { 
            success: false, 
            error: `Permiso denegado. La API Key no tiene permisos para la acción '${action}' en el recurso '${resource}'.` 
          },
          { status: 403 }
        )
      };
    }

    // Actualizar última fecha de uso en la base de datos
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    });

    // Registrar en Auditoría del Sistema
    const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "API Rest";
    const userAgent = request.headers.get("user-agent") || "API Client";

    try {
      await prisma.auditLog.create({
        data: {
          companyId: apiKey.companyId,
          module: `API_${resource.toUpperCase()}`,
          action: action.toUpperCase(),
          entity: resource,
          description: `Acción '${action}' ejecutada remotamente vía API Key '${apiKey.name}'`,
          ip: clientIp,
          browser: userAgent,
          newValues: {
            apiKeyId: apiKey.id,
            apiKeyName: apiKey.name,
            endpoint: request.url
          }
        }
      });
    } catch (auditErr) {
      console.error("[AUDIT_LOG_API_ERROR]", auditErr);
    }

    return {
      context: {
        companyId: apiKey.companyId,
        keyId: apiKey.id,
        permissions
      }
    };
  } catch (error: any) {
    console.error("[API_KEY_VALIDATION_ERROR]", error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Error en la verificación de la API Key" },
        { status: 500 }
      )
    };
  }
}

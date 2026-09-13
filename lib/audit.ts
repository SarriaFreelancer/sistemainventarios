import { headers } from "next/headers";
import { prisma } from "./prisma";
import { getSessionCompanyId } from "./session";
import { getAuthSession } from "@/auth";

// Helper para parsear de forma ligera el User Agent
function parseUserAgent(uaString: string) {
  let browser = "Desconocido";
  let operatingSystem = "Desconocido";
  let device = "Desktop";

  const ua = uaString.toLowerCase();

  // Detección de Navegador
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("opr") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("edg")) browser = "Microsoft Edge";
  else if (ua.includes("chrome") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("chromium")) browser = "Chromium";

  // Detección de Sistema Operativo
  if (ua.includes("windows")) operatingSystem = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) operatingSystem = "macOS";
  else if (ua.includes("linux")) operatingSystem = "Linux";
  else if (ua.includes("android")) {
    operatingSystem = "Android";
    device = "Móvil";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    operatingSystem = "iOS";
    device = ua.includes("ipad") ? "Tablet" : "Móvil";
  }

  return { browser, operatingSystem, device };
}

interface AuditData {
  userId?: number;
  module: string;       // e.g. "PRODUCTS", "SALES", "USERS", "COMPANY", "GROUPS", "CATEGORIES"
  action: string;       // e.g. "CREATE", "UPDATE", "DELETE", "VOID", "EXPORT", "LOGIN", "LOGOUT"
  entity: string;       // e.g. "Product", "Sale", "Category", "User", "Company"
  entityId?: number;
  description: string;
  oldValues?: any;
  newValues?: any;
}

/**
 * Registra un log de auditoría detallado en la base de datos.
 * Captura automáticamente IP, navegador, sistema operativo y dispositivo desde las cabeceras.
 */
export async function logActivity(data: AuditData) {
  try {
    const session = await getAuthSession();
    const userId = data.userId ?? (session?.user?.id ? Number(session.user.id) : null);
    const companyId = session?.user?.companyId ? Number(session.user.companyId) : null;

    const headersList = await headers();
    const uaString = headersList.get("user-agent") || "";
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    const { browser, operatingSystem, device } = parseUserAgent(uaString);

    // Detección regional simulada básica de IPs de red local
    let country = "Local";
    let city = "Localhost";

    if (ip !== "127.0.0.1" && ip !== "::1" && !ip.startsWith("192.168.") && !ip.startsWith("10.")) {
      country = "Colombia"; // Por defecto en ambiente local
      city = "Bogotá";
    }

    // Filtrar campos delicados por seguridad (como contraseñas) de los valores guardados
    const sanitize = (obj: any) => {
      if (!obj) return null;
      const copy = { ...obj };
      const sensitiveKeys = ["password", "salt", "secret", "token", "passwordId", "key"];
      sensitiveKeys.forEach(k => {
        if (k in copy) copy[k] = "[REDACTADO]";
      });
      return copy;
    };

    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        module: data.module,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        description: data.description,
        oldValues: sanitize(data.oldValues),
        newValues: sanitize(data.newValues),
        ip,
        browser,
        operatingSystem,
        device,
        country,
        city,
      }
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}

interface LoginLogData {
  userId?: number;
  companyId?: number | null;
  email: string;
  status: "SUCCESS" | "FAILED";
  reason?: string;
}

/**
 * Registra un intento de inicio de sesión (exitoso o fallido) en LoginHistory y AuditLog.
 */
export async function logLoginAttempt(data: LoginLogData) {
  try {
    const headersList = await headers();
    const uaString = headersList.get("user-agent") || "";
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "127.0.0.1";

    const { browser, operatingSystem, device } = parseUserAgent(uaString);

    let companyId: number | null = data.companyId ?? null;
    let userId: number | null = data.userId ?? null;

    // Si falta companyId o userId, buscar por email o ID en la base de datos
    if (!companyId || !userId) {
      const user = await prisma.user.findFirst({
        where: userId ? { id: userId } : { email: data.email },
        select: { id: true, companyId: true }
      });
      if (user) {
        if (!userId) userId = user.id;
        if (!companyId) companyId = user.companyId;
      }
    }

    let country = "Local";
    let city = "Localhost";

    if (ip !== "127.0.0.1" && ip !== "::1") {
      country = "Colombia";
      city = "Bogotá";
    }

    // 1. Registrar en historial de login
    await prisma.loginHistory.create({
      data: {
        userId,
        email: data.email,
        companyId,
        ip,
        browser,
        operatingSystem,
        device,
        country,
        city,
        status: data.status,
        reason: data.reason,
      }
    });

    // 2. Registrar en la bitácora de auditoría general para trazabilidad del cliente y superadmin
    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        module: "SEGURIDAD",
        action: data.status === "SUCCESS" ? "LOGIN" : "LOGIN_FAILED",
        entity: "User",
        entityId: userId,
        description: data.status === "SUCCESS"
          ? `Inicio de sesión exitoso (${data.email})`
          : `Intento de inicio de sesión fallido (${data.email}${data.reason ? ` - Motivo: ${data.reason}` : ''})`,
        ip,
        browser,
        operatingSystem,
        device,
        country,
        city,
      }
    });

    // Si el inicio de sesión fue exitoso, también actualizar la fecha del último ingreso
    if (data.status === "SUCCESS" && userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() }
      }).catch(() => {});
    }
  } catch (error) {
    console.error("[LOGIN_LOG_ERROR]", error);
  }
}

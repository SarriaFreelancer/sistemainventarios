"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { revalidatePath } from "next/cache";

export interface CompanyAiConfig {
  enabled: boolean;
  provider: "gemini" | "openai" | "anthropic" | "custom";
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  features: {
    productDescriptions: boolean;
    demandForecasting: boolean;
    expenseClassification: boolean;
    hrAssistant: boolean;
    chatAssistant: boolean;
  };
}

const DEFAULT_AI_CONFIG: CompanyAiConfig = {
  enabled: false,
  provider: "gemini",
  apiKey: "",
  model: "gemini-2.0-flash",
  temperature: 0.7,
  maxTokens: 1024,
  features: {
    productDescriptions: true,
    demandForecasting: true,
    expenseClassification: true,
    hrAssistant: true,
    chatAssistant: true
  }
};

export async function getCompanyAiConfig(): Promise<{ success: boolean; config: CompanyAiConfig; error?: string }> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.companyId) {
      return { success: false, config: DEFAULT_AI_CONFIG, error: "No autenticado o sin empresa" };
    }

    const company = await prisma.company.findUnique({
      where: { id: Number(session.user.companyId) },
      select: { themeConfig: true }
    });

    const themeConfig = (company?.themeConfig as any) || {};
    const aiConfig = themeConfig.aiConfig || DEFAULT_AI_CONFIG;

    return {
      success: true,
      config: {
        ...DEFAULT_AI_CONFIG,
        ...aiConfig,
        features: {
          ...DEFAULT_AI_CONFIG.features,
          ...(aiConfig.features || {})
        }
      }
    };
  } catch (error: any) {
    console.error("[GET_AI_CONFIG_ERROR]", error);
    return { success: false, config: DEFAULT_AI_CONFIG, error: error.message };
  }
}

export async function saveCompanyAiConfig(config: Partial<CompanyAiConfig>) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.companyId) {
      return { success: false, error: "No autorizado" };
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return { success: false, error: "Solo administradores pueden configurar la Inteligencia Artificial de la empresa" };
    }

    const companyId = Number(session.user.companyId);
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { themeConfig: true }
    });

    const currentThemeConfig = (company?.themeConfig as any) || {};
    const updatedAiConfig = {
      ...DEFAULT_AI_CONFIG,
      ...(currentThemeConfig.aiConfig || {}),
      ...config
    };

    await prisma.company.update({
      where: { id: companyId },
      data: {
        themeConfig: {
          ...currentThemeConfig,
          aiConfig: updatedAiConfig
        }
      }
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/documentacion");
    return { success: true, config: updatedAiConfig };
  } catch (error: any) {
    console.error("[SAVE_AI_CONFIG_ERROR]", error);
    return { success: false, error: error.message || "Error al guardar configuración de IA" };
  }
}

export async function testAiConnection(testConfig: { provider: string; apiKey: string; model: string }) {
  const { provider, apiKey, model } = testConfig;

  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: "Debes ingresar una API Key para realizar la prueba." };
  }

  const prompt = "Responde únicamente con una frase corta confirmando que la conexión API de IA está funcionando correctamente en el sistema de inventario.";

  try {
    if (provider === "gemini") {
      const targetModel = model || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 60, temperature: 0.2 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
        return { success: false, error: `Error de autenticación con Google Gemini: ${errMsg}` };
      }

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Conexión establecida con éxito.";
      return { success: true, reply: reply.trim() };
    }

    if (provider === "openai") {
      const targetModel = model || "gpt-4o-mini";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 60
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `Error HTTP ${response.status}: ${response.statusText}`;
        return { success: false, error: `Error de autenticación con OpenAI: ${errMsg}` };
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || "Conexión establecida con éxito.";
      return { success: true, reply: reply.trim() };
    }

    return { success: false, error: "Proveedor no soportado para prueba automática directa." };
  } catch (err: any) {
    console.error("[TEST_AI_CONNECTION_ERROR]", err);
    return { success: false, error: `Error de red o conexión: ${err.message}` };
  }
}

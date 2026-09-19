"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Key,
  Bot,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Zap,
  Package,
  TrendingUp,
  Receipt,
  Users,
  MessageSquare,
  RefreshCw,
  Save
} from "lucide-react";
import { CompanyAiConfig, saveCompanyAiConfig, testAiConnection } from "@/app/actions/ai-config-actions";
import { successAlert, errorAlert } from "@/lib/sweetalert";

export function AiSettingsManager({ initialConfig }: { initialConfig?: CompanyAiConfig }) {
  const [config, setConfig] = useState<CompanyAiConfig>(initialConfig || {
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
  });

  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const providerModels: Record<string, { id: string; name: string; desc: string }[]> = {
    gemini: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Recomendado)", desc: "Ultra rápido, multimodal y de alta precisión." },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "Razonamiento avanzado para análisis financiero complejo." },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", desc: "Velocidad y eficiencia para tareas estándar." }
    ],
    openai: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Recomendado)", desc: "Rápido, económico e ideal para inventarios." },
      { id: "gpt-4o", name: "GPT-4o", desc: "Máxima capacidad analítica y redacción fluida." }
    ],
    anthropic: [
      { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", desc: "Excelente redacción para descripciones y RRHH." },
      { id: "claude-3-haiku", name: "Claude 3 Haiku", desc: "Respuestas instantáneas y bajo consumo de tokens." }
    ]
  };

  const handleProviderChange = (newProvider: any) => {
    const models = providerModels[newProvider] || [];
    setConfig(prev => ({
      ...prev,
      provider: newProvider,
      model: models[0]?.id || ""
    }));
  };

  const handleFeatureToggle = (featureKey: keyof CompanyAiConfig["features"]) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await saveCompanyAiConfig(config);
    setIsSaving(false);

    if (res.success) {
      successAlert("¡Configuración Guardada!", "Los parámetros de Inteligencia Artificial se han actualizado.");
    } else {
      errorAlert("Error al Guardar", res.error || "No se pudo guardar la configuración.");
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiKey.trim()) {
      errorAlert("Atención", "Ingresa tu API Key antes de realizar la prueba de conexión.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testAiConnection({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model
    });

    setIsTesting(false);

    if (res.success) {
      setTestResult({
        success: true,
        message: `Prueba exitosa: "${res.reply}"`
      });
      successAlert("¡Conexión Exitosa!", "La API Key es válida y el modelo respondió correctamente.");
    } else {
      setTestResult({
        success: false,
        message: res.error || "Falló la autenticación con el proveedor de IA."
      });
      errorAlert("Error de Conexión", res.error || "Verifica que la API Key sea correcta.");
    }
  };

  const getApiKeyHelpLink = () => {
    if (config.provider === "gemini") return "https://aistudio.google.com/app/apikey";
    if (config.provider === "openai") return "https://platform.openai.com/api-keys";
    if (config.provider === "anthropic") return "https://console.anthropic.com/settings/keys";
    return "#";
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Superior de Estado de IA */}
      <div className="bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-600 dark:text-purple-400 text-xs font-bold">
            <Sparkles size={14} className="animate-pulse" />
            Motor de Inteligencia Artificial del Sistema
          </div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Bot size={22} className="text-primary" />
            Configuración de IA con tu Propia API Key (BYOK)
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Conecta tu propia llave de API (Google Gemini, OpenAI o Anthropic). Podrás automatizar descripciones de productos, predecir compras a proveedores, categorizar gastos y habilitar el asistente inteligente sin costos ocultos.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2.5 bg-card border border-border p-3 rounded-2xl cursor-pointer hover:border-primary/40 transition shadow-sm">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-xs font-black text-foreground">
              {config.enabled ? "IA Activada" : "IA Desactivada"}
            </span>
          </label>
        </div>
      </div>

      {/* Proveedor y Credenciales */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm">
        <h4 className="font-black text-sm text-foreground flex items-center gap-2">
          <Key size={18} className="text-primary" />
          Proveedor & Credenciales de Acceso
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              Proveedor de Inteligencia Artificial
            </label>
            <select
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-medium"
            >
              <option value="gemini">Google Gemini (Recomendado - Gratuito)</option>
              <option value="openai">OpenAI (ChatGPT GPT-4o / GPT-4o Mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              Modelo Seleccionado
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-medium"
            >
              {(providerModels[config.provider] || []).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {(providerModels[config.provider] || []).find(m => m.id === config.model)?.desc}
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              API Key ({config.provider.toUpperCase()})
            </label>
            <a
              href={getApiKeyHelpLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Obtener mi API Key aquí</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder={config.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 pr-28 text-sm font-mono focus:outline-none focus:border-primary"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition cursor-pointer"
                title={showKey ? "Ocultar clave" : "Mostrar clave"}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !config.apiKey.trim()}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 disabled:opacity-50 transition cursor-pointer"
                title="Verificar validez de la API Key en vivo"
              >
                {isTesting ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                <span>{isTesting ? "Probando..." : "Probar"}</span>
              </button>
            </div>
          </div>

          {/* Resultado del Test de Conexión */}
          {testResult && (
            <div className={`p-3 rounded-2xl text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Capacidades de IA */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h4 className="font-black text-sm text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Capacidades de IA Habilitadas para la Empresa
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selecciona qué módulos pueden utilizar la API Key configurada para automatizar tareas.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div
            onClick={() => handleFeatureToggle("productDescriptions")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
              config.features.productDescriptions
                ? 'bg-primary/5 border-primary/40 shadow-sm'
                : 'bg-muted/20 border-border/70 opacity-60'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Package size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-xs text-foreground">Fichas & Títulos de Productos</h5>
                <input
                  type="checkbox"
                  checked={config.features.productDescriptions}
                  onChange={() => {}}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Genera descripciones comerciales persuasivas, listas de viñetas y etiquetas SEO automáticamente desde el catálogo.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleFeatureToggle("demandForecasting")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
              config.features.demandForecasting
                ? 'bg-primary/5 border-primary/40 shadow-sm'
                : 'bg-muted/20 border-border/70 opacity-60'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-xs text-foreground">Predicción de Demanda & Compras</h5>
                <input
                  type="checkbox"
                  checked={config.features.demandForecasting}
                  onChange={() => {}}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Calcula el riesgo de desabastecimiento según el ritmo de ventas y sugiere órdenes de compra inteligentes a proveedores.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleFeatureToggle("expenseClassification")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
              config.features.expenseClassification
                ? 'bg-primary/5 border-primary/40 shadow-sm'
                : 'bg-muted/20 border-border/70 opacity-60'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <Receipt size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-xs text-foreground">Clasificador de Gastos & Facturas</h5>
                <input
                  type="checkbox"
                  checked={config.features.expenseClassification}
                  onChange={() => {}}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Clasifica automáticamente el concepto contable de los egresos y detecta anomalías en compras y pagos operativos.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleFeatureToggle("hrAssistant")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
              config.features.hrAssistant
                ? 'bg-primary/5 border-primary/40 shadow-sm'
                : 'bg-muted/20 border-border/70 opacity-60'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Users size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-xs text-foreground">Asistente de Recursos Humanos</h5>
                <input
                  type="checkbox"
                  checked={config.features.hrAssistant}
                  onChange={() => {}}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Redacción asistida de perfiles de puesto, retroalimentación laboral y plantillas de certificados para colaboradores.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleFeatureToggle("chatAssistant")}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 md:col-span-2 ${
              config.features.chatAssistant
                ? 'bg-primary/5 border-primary/40 shadow-sm'
                : 'bg-muted/20 border-border/70 opacity-60'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare size={18} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-xs text-foreground">Chatbot Asistente Virtual del Negocio</h5>
                <input
                  type="checkbox"
                  checked={config.features.chatAssistant}
                  onChange={() => {}}
                  className="rounded text-primary focus:ring-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Permite a los administradores y usuarios consultar en lenguaje natural métricas, disponibilidad en bodegas y resumen de ventas diarias.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Parámetros Avanzados */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
        <h4 className="font-black text-sm text-foreground flex items-center gap-2">
          <Sliders size={18} className="text-primary" />
          Parámetros Avanzados de Generación
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-muted-foreground uppercase">Creatividad (Temperature)</label>
              <span className="text-xs font-mono font-bold text-primary">{config.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Preciso (0.0)</span>
              <span>Balanceado (0.7)</span>
              <span>Creativo (1.0)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-muted-foreground uppercase">Límite de Tokens (Max Tokens)</label>
              <span className="text-xs font-mono font-bold text-primary">{config.maxTokens}</span>
            </div>
            <input
              type="number"
              min="256"
              max="4096"
              step="128"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 1024 })}
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary font-mono"
            />
            <p className="text-[10px] text-muted-foreground">Controla la longitud máxima de respuesta de la IA.</p>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-primary text-primary-foreground font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 hover:opacity-95 active:scale-95 transition shadow-lg hover:shadow-primary/25 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          <span>{isSaving ? "Guardando Parámetros..." : "Guardar Configuración de IA"}</span>
        </button>
      </div>
    </form>
  );
}

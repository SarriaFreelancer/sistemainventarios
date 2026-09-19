"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Sparkles,
  Bot,
  Key,
  ShieldCheck,
  Code2,
  Package,
  Layers,
  Building2,
  Truck,
  ShoppingCart,
  Receipt,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  ShieldAlert,
  Settings,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  Boxes,
  Database,
  Lock,
  ArrowRight,
  Monitor
} from "lucide-react";
import { CompanyAiConfig } from "@/app/actions/ai-config-actions";

interface DocumentationClientProps {
  userRole: string;
  companyAiConfig?: CompanyAiConfig;
  apiKeys?: any[];
}

export function DocumentationClient({ userRole, companyAiConfig, apiKeys = [] }: DocumentationClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("intro");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "intro-1": true,
    "ai-1": true,
    "ai-2": true,
    "api-headers": true,
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeApiKey = apiKeys.find(k => k.isActive)?.key || "sk_live_vuestra_llave_de_api_aqui";

  const navigationSections = [
    { id: "intro", title: "Visión General & Primeros Pasos", icon: BookOpen, badge: "Inicio" },
    { id: "api-global", title: "Autenticación & Cabeceras API", icon: Code2, badge: "REST" },
    { id: "ai-module", title: "Módulo de Inteligencia Artificial (IA)", icon: Sparkles, badge: "BYOK / IA" },
    { id: "products", title: "Productos, Stock & Vencimientos", icon: Package },
    { id: "categories", title: "Categorías & Grupos de Artículos", icon: Layers },
    { id: "warehouses", title: "Bodegas & Almacén WMS", icon: Building2 },
    { id: "purchases", title: "Compras & Proveedores", icon: Truck },
    { id: "sales", title: "Ventas & Punto de Venta (POS)", icon: ShoppingCart },
    { id: "invoicing", title: "Facturación & Consecutivos", icon: Receipt },
    { id: "crm", title: "CRM & Gestión de Clientes", icon: Users },
    { id: "rrhh", title: "Recursos Humanos & Nómina", icon: Briefcase },
    { id: "finance", title: "Finanzas, Gastos & Flujo de Caja", icon: DollarSign },
    { id: "reports", title: "Reportes, Analíticas & Auditoría", icon: BarChart3 },
    { id: "settings", title: "Configuración, Respaldos & Seguridad", icon: Settings },
  ];

  const filteredSections = searchQuery.trim() === ""
    ? navigationSections
    : navigationSections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

      {/* ── Barra Lateral de Navegación del Manual ── */}
      <div className="lg:col-span-1 space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en el manual..."
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary shadow-sm font-medium"
          />
        </div>

        {/* Lista de Secciones */}
        <div className="bg-card rounded-3xl border border-border p-3 shadow-sm space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Módulos del Sistema
          </div>
          {filteredSections.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedSection(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-black uppercase shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Acceso rápido a configuración de IA */}
        <div className="bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20 rounded-3xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
            <Sparkles size={14} className="animate-pulse" />
            <span>Configuración Rápida de IA</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Estado actual:{" "}
            <span className="font-bold text-foreground">
              {companyAiConfig?.enabled ? "🟢 Activado" : "⚪ Desactivado"}
            </span>{" "}
            ({companyAiConfig?.provider || "gemini"}).
          </p>
          <Link
            href="/dashboard/settings?tab=ai"
            className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
          >
            <span>Gestionar API Key de IA</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Contenido Principal de Documentación ── */}
      <div className="lg:col-span-3 space-y-6">

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: VISIÓN GENERAL & PRIMEROS PASOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "intro" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <BookOpen size={14} />
                <span>Manual Integral del Usuario</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Bienvenido a GNS SarriaTech ERP & Inventario</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este sistema es una plataforma integral de gestión empresarial diseñada para el control total de existencias en tiempo real, facturación comercial, multibodega (WMS), compras a proveedores, nómina, finanzas, trazabilidad de auditoría y automatizaciones con Inteligencia Artificial conectable con tu propia clave.
              </p>
            </div>

            {/* Guía Rápida de Flujo Operativo */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Flujo de Trabajo Recomendado para Puesta en Marcha
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">1</div>
                  <h4 className="font-extrabold text-xs text-foreground">Parametrización Inicial</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Dirígete a <strong>Configuración</strong> para definir NIT, teléfono, moneda, logotipo de facturas, bodegas físicas y tu API Key de IA.
                  </p>
                </div>

                <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">2</div>
                  <h4 className="font-extrabold text-xs text-foreground">Catálogo & Compras</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Registra categorías, proveedores y productos con su stock inicial, precio costo y precio venta, o usa la <strong>Importación Masiva</strong>.
                  </p>
                </div>

                <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">3</div>
                  <h4 className="font-extrabold text-xs text-foreground">Operación & Facturación</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Emite ventas en el Punto de Venta (POS), descarga facturas personalizadas en PDF y consulta analíticas en vivo.
                  </p>
                </div>
              </div>
            </div>

            {/* Accesos Rápidos de Documentación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedSection("api-global")}
                className="p-5 rounded-3xl border border-border bg-card hover:border-primary/50 text-left transition flex items-start gap-3.5 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Code2 size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                    <span>Cabeceras & APIs REST</span>
                    <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition" />
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Consulta endpoints públicos, esquemas JSON y cabeceras de autorización Bearer.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedSection("ai-module")}
                className="p-5 rounded-3xl border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50 text-left transition flex items-start gap-3.5 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                    <span>Guía de Inteligencia Artificial (BYOK)</span>
                    <ArrowRight size={14} className="text-purple-500 group-hover:translate-x-1 transition" />
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Conoce los casos de uso y cómo activar Google Gemini o ChatGPT con tu propia API Key.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: AUTENTICACIÓN & CABECERAS API GLOBALES */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "api-global" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <Code2 size={14} />
                <span>Especificación de Integraciones REST v1</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Autenticación, Cabeceras & Estándares de la API</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Todas las peticiones a la API REST del sistema deben autenticarse mediante una API Key válida emitida desde el panel de <strong>Configuración &gt; Integraciones API REST</strong>.
              </p>
            </div>

            {/* Cabeceras Requeridas */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Key size={18} className="text-primary" />
                Cabeceras HTTP Obligatorias (Headers)
              </h3>

              <div className="space-y-3">
                <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-black text-primary">Authorization: Bearer &lt;TU_API_KEY&gt;</span>
                    <p className="text-[11px] text-muted-foreground">Formato estándar de autenticación Bearer Token.</p>
                  </div>
                  <button
                    onClick={() => handleCopy(`Authorization: Bearer ${activeApiKey}`, "head-1")}
                    className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs flex items-center gap-1 font-bold"
                  >
                    {copiedText === "head-1" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedText === "head-1" ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>

                <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-black text-primary">x-api-key: &lt;TU_API_KEY&gt;</span>
                    <p className="text-[11px] text-muted-foreground">Alternativa soportada si tu cliente HTTP no soporta cabeceras Authorization.</p>
                  </div>
                  <button
                    onClick={() => handleCopy(`x-api-key: ${activeApiKey}`, "head-2")}
                    className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs flex items-center gap-1 font-bold"
                  >
                    {copiedText === "head-2" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedText === "head-2" ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>

                <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-black text-foreground">Content-Type: application/json</span>
                    <p className="text-[11px] text-muted-foreground">Obligatorio para todas las peticiones POST y PUT con cuerpo de datos.</p>
                  </div>
                  <button
                    onClick={() => handleCopy("Content-Type: application/json", "head-3")}
                    className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs flex items-center gap-1 font-bold"
                  >
                    {copiedText === "head-3" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copiedText === "head-3" ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Códigos de Respuesta HTTP */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Convención de Códigos de Estado HTTP
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                  <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">200 OK</span>
                  <p className="text-[11px] text-muted-foreground">Petición procesada exitosamente con retorno de datos.</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                  <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">201 Created</span>
                  <p className="text-[11px] text-muted-foreground">El recurso fue creado correctamente en la base de datos.</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                  <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">400 Bad Request</span>
                  <p className="text-[11px] text-muted-foreground">Faltan campos obligatorios o formato JSON inválido.</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                  <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">401 Unauthorized</span>
                  <p className="text-[11px] text-muted-foreground">API Key faltante, expirada o no autorizada.</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                  <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">404 Not Found</span>
                  <p className="text-[11px] text-muted-foreground">El endpoint o recurso solicitado no existe.</p>
                </div>
                <div className="p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-1">
                  <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">500 Server Error</span>
                  <p className="text-[11px] text-muted-foreground">Error interno del servidor al procesar la transacción.</p>
                </div>
              </div>
            </div>

            {/* Endpoints Principales Disponibles */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Boxes size={18} className="text-primary" />
                  Endpoints REST Disponibles
                </h3>
                <Link
                  href="/dashboard/settings?tab=apiKeys"
                  className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                >
                  <span>Generador de Código en Vivo</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              <div className="space-y-2">
                {[
                  { method: "GET / POST", path: "/api/v1/products", desc: "Consultar catálogo completo y registrar nuevos productos con stock." },
                  { method: "GET / POST", path: "/api/v1/purchases", desc: "Consultar historial de compras y registrar nuevas compras a proveedores." },
                  { method: "GET / POST", path: "/api/v1/sales", desc: "Listar ventas realizadas y generar nuevas facturas de venta." },
                  { method: "GET / POST", path: "/api/v1/suppliers", desc: "Gestión y directorio de proveedores comerciales." },
                  { method: "GET / POST", path: "/api/v1/categories", desc: "Consulta y alta de categorías de inventario." },
                  { method: "GET / POST", path: "/api/v1/groups", desc: "Grupos y agrupadores de productos." },
                  { method: "GET / POST", path: "/api/v1/expenses", desc: "Egresos y gastos operativos del negocio." },
                  { method: "GET", path: "/api/v1/users", desc: "Listado de usuarios de la organización (Solo lectura)." },
                ].map((ep, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-muted/25 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono text-[10px] font-black">
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">{ep.path}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: MÓDULO DE INTELIGENCIA ARTIFICIAL (IA) */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "ai-module" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-bold">
                <Sparkles size={14} className="animate-pulse" />
                <span>Modelo BYOK (Bring Your Own Key)</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Inteligencia Artificial Potenciada por tu Propia API Key</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El sistema integra Inteligencia Artificial directamente en los procesos comerciales y operativos de tu empresa sin cobros adicionales de suscripción: tú proporcionas tu propia llave de API de <strong>Google Gemini</strong> (gratuita), <strong>OpenAI ChatGPT</strong> o <strong>Anthropic Claude</strong>.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/settings?tab=ai"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-black px-4 py-2.5 rounded-xl shadow hover:opacity-95 transition"
                >
                  <Bot size={14} />
                  <span>Ir a Configurar mi API Key de IA</span>
                </Link>
              </div>
            </div>

            {/* 5 Casos de Uso Reales */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Lightbulb size={18} className="text-primary" />
                Casos de Uso de IA Implementados en el Sistema
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Package size={16} />
                    <span>1. Generador de Fichas Comerciales & SEO</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Al crear o editar un producto, la IA puede redactar descripciones persuasivas para venta física o e-commerce, generar viñetas de características clave y sugerir palabras clave para búsqueda.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-500 font-bold text-xs">
                    <TrendingUp size={16} />
                    <span>2. Predicción de Demanda & Sugerencia de Compras</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Analiza la velocidad de ventas histórica frente a los días de stock restantes, emite alertas predictivas de quiebre de stock y redacta borradores de órdenes de compra para proveedores.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                    <Receipt size={16} />
                    <span>3. Clasificación Automática de Gastos</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Al registrar un egreso o factura de proveedor, la IA identifica la categoría contable correspondiente (Servicios, Nómina, Logística, Insumos) y detecta posibles cobros duplicados.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                    <Briefcase size={16} />
                    <span>4. Asistente de Gestión Humana (RRHH)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Redacta perfiles de puesto, actas de acuerdos laborales, recomendaciones de retroalimentación de desempeño y certificados laborales formales para el personal.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                    <Bot size={16} />
                    <span>5. Chatbot Asistente Virtual del Negocio</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Responde preguntas en lenguaje natural sobre las finanzas del negocio (e.g., <em>"¿Cuáles fueron los 3 productos más vendidos este mes?"</em>, <em>"¿Qué productos tienen stock crítico en la Bodega Principal?"</em>).
                  </p>
                </div>
              </div>
            </div>

            {/* Guía Paso a Paso para Obtener la API Key */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Key size={18} className="text-primary" />
                Guía Paso a Paso: Cómo Obtener tu API Key Gratis
              </h3>

              {/* Acordeón Google Gemini */}
              <div className="border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleAccordion("ai-gemini-guide")}
                  className="w-full p-4 bg-muted/30 flex items-center justify-between text-left font-extrabold text-xs text-foreground cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles size={16} />
                    <span>Opción 1: Google Gemini (Recomendado - Nivel Gratuito Amplio)</span>
                  </div>
                  {openAccordions["ai-gemini-guide"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {(openAccordions["ai-gemini-guide"] ?? true) && (
                  <div className="p-5 space-y-3 text-xs text-muted-foreground bg-card">
                    <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                      <li>Ingresa a la consola oficial de Google AI Studio: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline inline-flex items-center gap-0.5">aistudio.google.com/app/apikey <ExternalLink size={11} /></a>.</li>
                      <li>Inicia sesión con tu cuenta de Google.</li>
                      <li>Haz clic en el botón azul <strong>"Create API Key"</strong> (Crear clave de API).</li>
                      <li>Selecciona un proyecto existente o crea uno nuevo en 1 clic.</li>
                      <li>Copia la clave generada (empieza por <code>AIzaSy...</code>).</li>
                      <li>Ve a <Link href="/dashboard/settings?tab=ai" className="text-primary font-bold underline">Configuración &gt; Inteligencia Artificial</Link> en este ERP, pega la clave, haz clic en <strong>Probar Conexión</strong> y luego en <strong>Guardar</strong>.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Acordeón OpenAI ChatGPT */}
              <div className="border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleAccordion("ai-openai-guide")}
                  className="w-full p-4 bg-muted/30 flex items-center justify-between text-left font-extrabold text-xs text-foreground cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Bot size={16} />
                    <span>Opción 2: OpenAI (ChatGPT GPT-4o / GPT-4o Mini)</span>
                  </div>
                  {openAccordions["ai-openai-guide"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["ai-openai-guide"] && (
                  <div className="p-5 space-y-3 text-xs text-muted-foreground bg-card">
                    <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                      <li>Ingresa a la plataforma de desarrolladores de OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline inline-flex items-center gap-0.5">platform.openai.com/api-keys <ExternalLink size={11} /></a>.</li>
                      <li>Inicia sesión o regístrate.</li>
                      <li>Haz clic en <strong>"Create new secret key"</strong>.</li>
                      <li>Asigna un nombre (e.g., "ERP Inventario") y copia la clave generada (inicia por <code>sk-...</code>).</li>
                      <li>En Configuración del ERP, selecciona proveedor <strong>OpenAI</strong>, pega tu clave y guarda los cambios.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: PRODUCTOS & CONTROL DE STOCK */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "products" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Package size={14} />
                <span>Módulo de Productos & Catálogo</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Gestión de Productos, Stock & Vencimientos</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El catálogo centraliza todos los artículos comercializados o consumidos por la empresa, permitiendo seguimiento de costos, margen de utilidad, códigos de barra, lotes y alertas de caducidad.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Check size={18} className="text-primary" />
                Paso a Paso: Cómo Registrar un Producto
              </h3>
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                <li>Dirígete a <Link href="/dashboard/products" className="text-primary font-bold underline">Productos</Link> desde el menú lateral.</li>
                <li>Haz clic en el botón <strong>"+ Nuevo Producto"</strong> en la esquina superior derecha.</li>
                <li>Completa los datos obligatorios: <strong>Nombre</strong>, <strong>Código / SKU</strong> (puedes autogenerarlo), <strong>Precio Costo</strong> y <strong>Precio Venta</strong>.</li>
                <li>Asigna la <strong>Categoría</strong> y el <strong>Grupo</strong> correspondiente para clasificar el inventario.</li>
                <li>Establece el <strong>Stock Mínimo</strong> y <strong>Stock Máximo</strong> para activar las alertas de reposición oportuna.</li>
                <li>Si manejas productos perecederos, activa la casilla <strong>"Controlar Vencimiento"</strong> e indica la fecha de expiración y el número de lote.</li>
                <li>Presiona <strong>"Guardar Producto"</strong>. El stock quedará disponible de inmediato en la bodega seleccionada.</li>
              </ol>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-amber-700 dark:text-amber-400">Política de Stock Negativo</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Puedes permitir o bloquear ventas sin existencias desde <strong>Configuración &gt; Inventario & Ventas &gt; Permitir Stock Negativo</strong>. Si está bloqueado, el punto de venta impedirá transacciones cuando el inventario llegue a 0.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: CATEGORÍAS & GRUPOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "categories" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Layers size={14} />
                <span>Estructura de Inventario</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Categorías & Grupos de Artículos</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Organiza el catálogo en dos niveles jerárquicos para facilitar la búsqueda en el Punto de Venta y segmentar los reportes de ventas y márgenes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                  <Layers size={16} className="text-primary" />
                  Grupos de Artículos
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Representan los departamentos o macro-áreas de tu negocio (e.g., <em>"Bebidas"</em>, <em>"Ferretería"</em>, <em>"Cuidado Personal"</em>).
                </p>
                <Link href="/dashboard/groups" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                  <span>Ir a Grupos</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-extrabold text-foreground flex items-center gap-2">
                  <Boxes size={16} className="text-primary" />
                  Categorías Específicas
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Subdivisiones dentro de cada grupo para clasificar productos similares (e.g., <em>"Gaseosas"</em>, <em>"Cervezas"</em>, <em>"Jugos Naturales"</em>).
                </p>
                <Link href="/dashboard/categories" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                  <span>Ir a Categorías</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: BODEGAS & WMS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "warehouses" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Building2 size={14} />
                <span>Gestión WMS Multibodega</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Control Multibodega, Ubicaciones & Traslados</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permite administrar múltiples almacenes físicos, salas de ventas y centros de distribución con asignación precisa de pasillos, estantes y niveles (ubicaciones WMS).
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-foreground">Operaciones Principales de Bodega</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Creación de Bodegas:</strong> Registra almacenes asignando responsable, dirección y tipo (Principal, Sucursal, Cuarentena).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Ubicaciones WMS:</strong> Codifica estanterías (e.g., <em>Pasillo A - Estante 03 - Nivel 2</em>) para optimizar el picking.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Traslados entre Bodegas:</strong> Transfiere mercancía entre sucursales manteniendo la trazabilidad y auditoría de quién autorizó el movimiento.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: COMPRAS & PROVEEDORES */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "purchases" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Truck size={14} />
                <span>Cadena de Suministro</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Compras a Proveedores & Entrada de Mercancía</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registra compras de inventario con incremento automático de existencias físicas y actualización del costo promedio ponderado de cada artículo.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground">Flujo de Registro de una Compra</h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                <li>Ve a <Link href="/dashboard/purchases" className="text-primary font-bold underline">Compras</Link> y selecciona <strong>"+ Nueva Compra"</strong>.</li>
                <li>Selecciona el <strong>Proveedor</strong> emisor e ingresa el número de factura física o soporte.</li>
                <li>Agrega los ítems comprados indicando cantidad recibida y costo unitario pactado.</li>
                <li>Indica la <strong>Bodega de Destino</strong> donde ingresarán las unidades físicas.</li>
                <li>Haz clic en <strong>"Procesar Compra"</strong>. El stock se sumará automáticamente y se generará el registro contable en Cuentas por Pagar.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: VENTAS & PUNTO DE VENTA (POS) */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "sales" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <ShoppingCart size={14} />
                <span>Terminal Punto de Venta</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Ventas Rápidas, Caja & Facturación</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El módulo de ventas está optimizado para agilidad en caja con lector de código de barras, selección táctil de productos, múltiples métodos de pago (Efectivo, Tarjeta, Transferencia) y cálculo automático de cambio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <h4 className="font-extrabold text-xs text-foreground">⚡ Cobro en Caja Rápida</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Escanea el código de barras o busca por nombre. Usa atajos de teclado para cerrar ventas en segundos e imprimir tickets térmicos en 58mm o 80mm.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <h4 className="font-extrabold text-xs text-foreground">💳 Pagos Mixtos & Crédito</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Permite dividir el pago entre diferentes medios (e.g. 50% Efectivo, 50% Transferencia) o registrar ventas a crédito vinculadas a la ficha del cliente en el CRM.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: RECURSOS HUMANOS & NÓMINA */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "rrhh" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Briefcase size={14} />
                <span>Gestión de Talento Humano</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Directorio de Empleados, Cuentas Bancarias & Nómina</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Administra expedientes de colaboradores, salarios, cargos, tipos de contrato y datos bancarios protegidos con visor de seguridad.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground">Características Principales de RRHH</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Visor Seguro de Cuentas Bancarias:</strong> Los números de cuenta de nómina se muestran ofuscados (<code>••••1234</code>) en la tabla principal con un botón de ojito interactivo para revelar la información solo bajo autorización visual.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Historial de Contratos:</strong> Registra fechas de ingreso, terminación y tipo de vinculación laboral (Término Fijo, Indefinido, Prestación de Servicios).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Asistente IA de RRHH:</strong> Genera borradores de acuerdos, recomendaciones para evaluaciones de desempeño y cartas laborales estandarizadas.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: FINANZAS & GASTOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "finance" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <DollarSign size={14} />
                <span>Control Financiero</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Flujo de Caja, Egresos & Cuentas por Cobrar/Pagar</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monitorea en tiempo real los ingresos por ventas frente a los costos de mercancía y gastos fijos operacionales para conocer el margen neto real del negocio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-1.5">
                <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">Ingresos Operacionales</h4>
                <p className="text-[11px] text-muted-foreground">Ventas de mostrador, pedidos corporativos y cobro de cartera.</p>
              </div>
              <div className="p-4 rounded-2xl border border-border bg-card space-y-1.5">
                <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400">Egresos & Gastos</h4>
                <p className="text-[11px] text-muted-foreground">Arriendos, nómina, servicios públicos, fletes y mantenimiento.</p>
              </div>
              <div className="p-4 rounded-2xl border border-border bg-card space-y-1.5">
                <h4 className="font-extrabold text-xs text-primary">Flujo Neto Diario</h4>
                <p className="text-[11px] text-muted-foreground">Saldo disponible real consolidado de todas las cajas y cuentas.</p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: AUDITORÍA & SEGURIDAD */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <BarChart3 size={14} />
                <span>Inteligencia de Negocio & Seguridad</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Analíticas, Bitácora de Auditoría & Trazabilidad</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada acción realizada en el sistema queda registrada de manera inmutable en la bitácora de auditoría (quién modificó un precio, quién eliminó un registro, inicios de sesión y exportaciones de datos).
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <ShieldAlert size={18} className="text-primary" />
                Seguridad & Control de Sesiones
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Monitor de Sesiones Activas:</strong> En <em>Configuración &gt; Sesiones Activas</em> puedes ver todos los dispositivos conectados y cerrar sesiones sospechosas de forma remota.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">•</span>
                  <span><strong>Autenticación de Dos Factores (2FA):</strong> Compatible con Google Authenticator para proteger cuentas de administradores.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: CONFIGURACIÓN GENERAL & RESPALDOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {(selectedSection === "settings" || selectedSection === "invoicing" || selectedSection === "crm") && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Settings size={14} />
                <span>Administración del Sistema</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Configuración, Respaldos SQL & Personalización</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ajusta los parámetros operativos de tu empresa, configura los formatos de impresión de facturas, activa copias de seguridad automáticas y gestiona tus integraciones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <h4 className="font-extrabold text-xs text-foreground">💾 Respaldos de Base de Datos</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Genera volcados SQL manuales o programa respaldos automáticos diarios a la hora configurada.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <h4 className="font-extrabold text-xs text-foreground">🎨 Personalización Visual & Wallpaper</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Sube la imagen de fondo corporativa adaptable (Cover Responsive) y personaliza los colores del modo oscuro.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-black px-5 py-2.5 rounded-2xl shadow hover:opacity-95 transition"
              >
                <Settings size={14} />
                <span>Abrir Panel de Configuración General</span>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

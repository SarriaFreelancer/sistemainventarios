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
  Building,
  Building2,
  Shield,
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
  ChevronUp,
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
  Monitor,
  SlidersHorizontal,
  Upload,
  Server,
  ArrowRightLeft,
  KeyRound,
  Bell,
  ListFilter,
  CheckCircle2,
  PackageCheck,
  Eye,
  CreditCard,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Calendar,
  Clock,
  Printer,
  FileCheck2,
  Share2,
  PieChart
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    "intro-1": true,
    "ai-gemini-guide": true,
    "ai-openai-guide": false,
    "api-headers": true,
    "api-curl-products": true,
    "api-curl-sales": false,
    "settings-company": true,
    "settings-inventory": true,
    "settings-invoicing": true,
    "settings-security": true,
    "settings-backups": true,
    "settings-demo": true,
    "settings-ai": true,
    "settings-imports": true,
    "products-step": true,
    "purchases-step": true,
    "crm-step": true,
    "rrhh-step": true,
    "finance-step": true,
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const keysList = Array.isArray(apiKeys) ? apiKeys : ((apiKeys as any)?.keys || []);
  const activeApiKey = keysList.find((k: any) => k?.active || k?.isActive)?.key || "sk_live_vuestra_llave_de_api_aqui";

  const navigationSections = [
    { id: "intro", title: "Visión General & Primeros Pasos", icon: BookOpen, badge: "Inicio" },
    { id: "settings", title: "Configuración & Submódulos", icon: Settings, badge: "Ajustes" },
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
    { id: "ai-module", title: "Módulo de IA (BYOK)", icon: Sparkles, badge: "IA" },
    { id: "api-global", title: "APIs REST & Integraciones", icon: Code2, badge: "REST" },
  ];

  const filteredSections = searchQuery.trim() === ""
    ? navigationSections
    : navigationSections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const currentSectionMeta = navigationSections.find(s => s.id === selectedSection) || navigationSections[0];
  const CurrentIcon = currentSectionMeta.icon;

  return (
    <div className="space-y-6">
      {/* ── Barra Superior Móvil: Desplegable de Secciones ── */}
      <div className="lg:hidden bg-card border border-border rounded-2xl p-3 shadow-sm">
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="w-full flex items-center justify-between gap-3 text-left font-bold text-xs text-foreground cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CurrentIcon size={16} />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Capítulo Activo:</span>
              <span className="text-xs font-black truncate">{currentSectionMeta.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-bold shrink-0">
            <span>{isMobileNavOpen ? "Ocultar Menú" : "Cambiar Capítulo"}</span>
            {isMobileNavOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isMobileNavOpen && (
          <div className="mt-3 pt-3 border-t border-border space-y-1 max-h-72 overflow-y-auto">
            {navigationSections.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedSection(item.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={15} className="shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-muted text-foreground">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Barra Horizontal Rápida (Pills) en móvil y escritorio ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {navigationSections.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedSection(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* ── Contenedor Principal: Sidebar en Desktop + Contenido ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* ── Barra Lateral Desktop ── */}
        <div className="hidden lg:block lg:col-span-1 space-y-4 sticky top-20">
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
              Capítulos del Manual
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

          {/* Estado de IA */}
          <div className="bg-gradient-to-br from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20 rounded-3xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-xs">
              <Sparkles size={14} className="animate-pulse" />
              <span>Inteligencia Artificial BYOK</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Estado actual:{" "}
              <span className="font-bold text-foreground">
                {companyAiConfig?.enabled ? "🟢 Conectado" : "⚪ Sin configurar"}
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

        {/* ── Contenido Detallado de la Sección Seleccionada ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: VISIÓN GENERAL & PRIMEROS PASOS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "intro" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <BookOpen size={14} />
                  <span>Manual Oficial de Operaciones</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Bienvenido a GNS - Gestión de Negocios SarriaTech ERP</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  GNS SarriaTech ERP es un sistema integral de gestión empresarial multi-empresa y multi-bodega (WMS), diseñado para automatizar las operaciones diarias de comercios, distribuidores, almacenes y empresas de servicios. Cubre desde el control de inventario y facturación hasta nómina, analíticas financieras e Inteligencia Artificial conectable con tu propia clave.
                </p>
              </div>

              {/* Arquitectura de 4 Pasos para la Puesta en Marcha */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Guía de Puesta en Marcha en 4 Pasos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">1</span>
                      <h4 className="font-extrabold text-xs text-foreground">Configuración de Empresa</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Dirígete a <strong>Configuración &gt; Datos de Empresa</strong> para registrar NIT/RUT, Razón Social, teléfono, moneda y subir el logotipo oficial que aparecerá en tus facturas y cotizaciones.
                    </p>
                  </div>

                  <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">2</span>
                      <h4 className="font-extrabold text-xs text-foreground">Estructura de Catálogo & Bodegas</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Crea tus <strong>Grupos</strong> y <strong>Categorías</strong> para clasificar tu catálogo. Luego define tus bodegas físicas en <strong>Bodegas</strong> antes de ingresar el inventario inicial.
                    </p>
                  </div>

                  <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">3</span>
                      <h4 className="font-extrabold text-xs text-foreground">Carga de Productos & Proveedores</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Ingresa tus artículos manualmente desde <strong>Productos</strong> o utiliza la <strong>Importación Masiva en Excel/CSV</strong> para cargar cientos de productos y proveedores en segundos.
                    </p>
                  </div>

                  <div className="bg-muted/30 border border-border/70 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">4</span>
                      <h4 className="font-extrabold text-xs text-foreground">Facturación, POS & Finanzas</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Configura el consecutivo de facturación y comienza a vender en el <strong>Punto de Venta (POS)</strong>. Revisa en tiempo real el flujo de caja en <strong>Finanzas</strong> y la trazabilidad en <strong>Auditoría</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enlaces Rápidos a Secciones Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedSection("settings")}
                  className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 text-left transition space-y-2 shadow-sm group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition">
                    <Settings size={16} />
                  </div>
                  <h4 className="font-extrabold text-xs text-foreground">Guía de Configuración</h4>
                  <p className="text-[11px] text-muted-foreground">Explicación detallada de cada submódulo y ajuste del sistema.</p>
                </button>

                <button
                  onClick={() => setSelectedSection("sales")}
                  className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 text-left transition space-y-2 shadow-sm group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                    <ShoppingCart size={16} />
                  </div>
                  <h4 className="font-extrabold text-xs text-foreground">Punto de Venta (POS)</h4>
                  <p className="text-[11px] text-muted-foreground">Operación rápida en mostrador, lectores de código y tickets.</p>
                </button>

                <button
                  onClick={() => setSelectedSection("ai-module")}
                  className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/50 text-left transition space-y-2 shadow-sm group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                    <Sparkles size={16} />
                  </div>
                  <h4 className="font-extrabold text-xs text-foreground">Inteligencia Artificial</h4>
                  <p className="text-[11px] text-muted-foreground">Cómo conectar tu API Key gratis de Google Gemini o ChatGPT.</p>
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: CONFIGURACIÓN & TODOS SUS SUBMÓDULOS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "settings" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Settings size={14} />
                  <span>Manual de Parametrización</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Módulo de Configuración: Guía de Submódulos</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El módulo de Configuración es el cerebro operativo del ERP. A continuación se detallan cada uno de sus 11 submódulos con su propósito, opciones configurables y ejemplos prácticos.
                </p>
              </div>

              {/* Submódulo 1: Empresa */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-company")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-primary">
                    <Building size={18} />
                    <span>1. Submódulo: Datos de Empresa & Fiscales</span>
                  </div>
                  {openAccordions["settings-company"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-company"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Permite registrar la identidad jurídica y comercial de tu empresa. Esta información se inyecta automáticamente en los encabezados de facturas de venta, recibos de caja, cotizaciones en PDF y reportes oficiales.
                    </p>
                    <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
                      <h4 className="font-extrabold text-foreground text-xs">Paso a paso para configurar:</h4>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                        <li>Ingresa a <strong>Configuración &gt; Empresa</strong>.</li>
                        <li>Completa <strong>Razón Social</strong>, <strong>NIT / RUT / Cédula Jurídica</strong> y <strong>Dígito de Verificación</strong>.</li>
                        <li>Ingresa dirección física, ciudad, teléfono de contacto y correo electrónico de facturación.</li>
                        <li>Define la <strong>Moneda Principal</strong> (COP $, USD $, EUR €, etc.) y el porcentaje de impuesto por defecto (ej. IVA 19%, IVA 0%).</li>
                        <li>Sube el archivo de tu <strong>Logotipo Empresarial</strong> (formato PNG o JPG recomendado).</li>
                        <li>Haz clic en <strong>Guardar Cambios</strong>.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Submódulo 2: Inventario & Ventas */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-inventory")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                    <SlidersHorizontal size={18} />
                    <span>2. Submódulo: Inventario & Reglas de Venta</span>
                  </div>
                  {openAccordions["settings-inventory"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-inventory"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Controla cómo responde el sistema ante faltantes de mercancía, reglas de costeo y políticas de stock en el punto de venta.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-1">
                        <span className="font-extrabold text-foreground text-xs">Permitir Stock Negativo</span>
                        <p className="text-[11px]">
                          <strong>Desactivado (Recomendado):</strong> El POS bloquea la venta si no hay existencias físicas en la bodega seleccionada.<br />
                          <strong>Activado:</strong> Permite facturar mercancía que aún no ha sido registrada en compras (el inventario mostrará números negativos).
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-1">
                        <span className="font-extrabold text-foreground text-xs">Alertas de Stock Mínimo</span>
                        <p className="text-[11px]">
                          Notifica automáticamente en el panel principal y en los reportes cuando un producto alcanza el nivel crítico de reorden establecido.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submódulo 3: Facturación & Consecutivos */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-invoicing")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                    <Receipt size={18} />
                    <span>3. Submódulo: Facturación, Consecutivos & Tickets</span>
                  </div>
                  {openAccordions["settings-invoicing"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-invoicing"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Parametriza la resolución oficial de facturación (DIAN o autoridad fiscal), prefijos de facturación, rangos autorizados y el diseño de los recibos impresos.
                    </p>
                    <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
                      <h4 className="font-extrabold text-foreground text-xs">Opciones de Formato de Impresión:</h4>
                      <ul className="space-y-1 text-[11px]">
                        <li>• <strong>Ticket Térmico 58mm:</strong> Diseñado para impresoras portátiles POS pequeñas.</li>
                        <li>• <strong>Ticket Térmico 80mm:</strong> Estándar de la industria para cajas registradoras de mostrador.</li>
                        <li>• <strong>Formato Carta / A4 (PDF):</strong> Documento formal con tabla completa, ideal para pedidos mayoristas y clientes B2B.</li>
                        <li>• <strong>Pie de Página Legal:</strong> Puedes ingresar la leyenda de retenciones, cuenta bancaria para transferencias o políticas de garantía y devoluciones.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Submódulo 4: Seguridad & Control de Usuarios */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-security")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                    <Shield size={18} />
                    <span>4. Submódulo: Seguridad, Roles & Permisos</span>
                  </div>
                  {openAccordions["settings-security"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-security"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Gestiona qué usuarios pueden ingresar al sistema y a qué módulos tienen acceso según su rol corporativo:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                      <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <span className="font-black text-foreground block">SUPERADMIN</span>
                        <p>Acceso total ilimitado a todas las empresas, base de datos, auditoría, eliminación y parametrización.</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <span className="font-black text-primary block">ADMIN</span>
                        <p>Control total sobre su propia empresa (crear usuarios, configurar precios, ver costos y finanzas).</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1">
                        <span className="font-black text-muted-foreground block">USER / CAJERO</span>
                        <p>Acceso restringido únicamente a los módulos autorizados (ej. solo Punto de Venta e Inventario).</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submódulo 5: Respaldos SQL */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-backups")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                    <Database size={18} />
                    <span>5. Submódulo: Respaldos de Base de Datos SQL</span>
                  </div>
                  {openAccordions["settings-backups"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-backups"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Protege la información de tu negocio generando copias de seguridad de toda la base de datos (PostgreSQL/Supabase).
                    </p>
                    <ul className="space-y-2 text-[11px]">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">•</span>
                        <span><strong>Respaldo Manual Inmediato:</strong> Haz clic en <em>"Generar Respaldo Ahora"</em> para descargar un archivo <code>.sql</code> comprimido con todas las tablas y transacciones.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-primary">•</span>
                        <span><strong>Respaldos Automáticos Programados:</strong> Activa el interruptor y define la hora de ejecución diaria (ej. 23:00) para salvaguardar tu data sin intervención humana.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Submódulo 6: Datos de Prueba / Demo */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-demo")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                    <PackageCheck size={18} />
                    <span>6. Submódulo: Datos de Prueba & Limpieza Segura con Contraseña</span>
                  </div>
                  {openAccordions["settings-demo"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-demo"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Permite sembrar datos de prueba iniciales (productos, categorías, bodegas, compras y ventas) para probar el sistema en segundos.
                    </p>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-2">
                      <h4 className="font-extrabold text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1.5">
                        <Lock size={14} />
                        Seguridad y Protección Contra Eliminaciones Accidentales
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        • <strong>Identificador de lote por debajo del sistema:</strong> Los datos de prueba se marcan internamente con etiquetas de auditoría. Si creaste productos o proveedores reales manualmente desde los módulos, esos <strong>NO</strong> se borrarán al limpiar los datos de prueba.<br />
                        • <strong>Opciones de eliminación:</strong> Puedes elegir entre <em>"Eliminar solo datos de prueba"</em> o <em>"Eliminar todo el catálogo y transacciones"</em>.<br />
                        • <strong>Verificación obligatoria de contraseña:</strong> Se exige la contraseña del Administrador o SuperAdmin para ejecutar la limpieza final.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submódulo 7: Inteligencia Artificial BYOK */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-ai")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400">
                    <Sparkles size={18} />
                    <span>7. Submódulo: Inteligencia Artificial (BYOK)</span>
                  </div>
                  {openAccordions["settings-ai"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-ai"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Conecta tus propios modelos de IA (Google Gemini, OpenAI GPT, DeepSeek u Ollama local) sin suscripciones adicionales mediante tu clave de API privada.
                    </p>
                    <div className="p-3 bg-muted/40 rounded-2xl flex items-center justify-between">
                      <span className="text-xs font-semibold">¿Quieres ver la guía paso a paso para obtener tu clave de API gratis?</span>
                      <button
                        onClick={() => setSelectedSection("ai-module")}
                        className="text-xs font-black text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver Guía de IA</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submódulo 8: Importación Masiva */}
              <div className="border border-border rounded-3xl bg-card overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleAccordion("settings-imports")}
                  className="w-full p-5 bg-muted/20 flex items-center justify-between text-left font-black text-xs text-foreground cursor-pointer hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-2.5 text-teal-600 dark:text-teal-400">
                    <Upload size={18} />
                    <span>8. Submódulo: Importación & Exportación Masiva (Excel/CSV)</span>
                  </div>
                  {openAccordions["settings-imports"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {openAccordions["settings-imports"] && (
                  <div className="p-6 space-y-4 text-xs text-muted-foreground leading-relaxed border-t border-border">
                    <p>
                      Importa tu catálogo existente desde tu software anterior o planillas de Excel en minutos.
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-[11px]">
                      <li>Descarga la plantilla oficial en formato CSV/Excel desde <strong>Configuración &gt; Importación Masiva</strong>.</li>
                      <li>Completa las columnas: <code>SKU</code>, <code>Nombre</code>, <code>Costo</code>, <code>PrecioVenta</code>, <code>StockInicial</code>, <code>Categoria</code>, <code>Bodega</code>.</li>
                      <li>Arrastra el archivo completado al panel y presiona <strong>"Validar & Procesar Importación"</strong>.</li>
                      <li>El sistema validará duplicados y creará los registros inmediatamente con trazabilidad en auditoría.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Botón hacia el módulo */}
              <div className="pt-2">
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-black px-5 py-2.5 rounded-2xl shadow hover:opacity-95 transition"
                >
                  <Settings size={15} />
                  <span>Abrir Panel de Configuración del ERP</span>
                </Link>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: PRODUCTOS, STOCK & VENCIMIENTOS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "products" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Package size={14} />
                  <span>Módulo de Catálogo & Existencias</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Gestión de Productos, Stock & Vencimientos</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El catálogo centraliza todos los artículos comercializados o consumidos por la empresa. Permite el seguimiento de costos, margen de utilidad, códigos de barra, números de serie, lotes y alertas de caducidad.
                </p>
              </div>

              {/* Guía Paso a Paso para Crear un Producto */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-primary" />
                  Paso a Paso: Cómo Registrar un Producto en el Sistema
                </h3>

                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                    <span className="font-extrabold text-foreground text-xs">Paso 1: Abrir el Formulario</span>
                    <p className="text-[11px]">Dirígete a <Link href="/dashboard/products" className="text-primary font-bold underline">Productos</Link> desde el menú lateral y haz clic en el botón <strong>"+ Nuevo Producto"</strong>.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                    <span className="font-extrabold text-foreground text-xs">Paso 2: Información Básica & Identificación</span>
                    <p className="text-[11px]">Ingresa el <strong>Nombre del Producto</strong> y el <strong>Código / SKU</strong>. Si cuentas con lector de código de barras físico, escanea directamente sobre el campo de código o presiona <em>"Autogenerar"</em>.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                    <span className="font-extrabold text-foreground text-xs">Paso 3: Precios & Margen de Ganancia</span>
                    <p className="text-[11px]">Define el <strong>Precio Costo</strong> (lo que te cuesta comprarlo o producirlo) y el <strong>Precio de Venta</strong> (al público antes de IVA). El sistema calculará automáticamente tu margen de utilidad porcentual.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                    <span className="font-extrabold text-foreground text-xs">Paso 4: Clasificación & Tipo de Producto</span>
                    <p className="text-[11px]">Asigna la <strong>Categoría</strong> y el <strong>Grupo</strong> correspondiente. Selecciona el tipo de producto:
                      <br />• <strong>Inventariable:</strong> Descuenta stock físico con cada venta (ej. abarrotes, repuestos, calzado).
                      <br />• <strong>Servicio:</strong> No descuenta unidades físicas (ej. asesorías, mano de obra, fletes).
                      <br />• <strong>Activo Fijo:</strong> Mobiliario y maquinaria de uso interno.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                    <span className="font-extrabold text-foreground text-xs">Paso 5: Control de Stock Mínimo & Vencimientos</span>
                    <p className="text-[11px]">Establece el <strong>Stock Mínimo</strong> (punto de reorden para alertas) y <strong>Stock Máximo</strong>. Si manejas perecederos o farmacéuticos, activa la casilla <strong>"Controlar Vencimiento"</strong> e indica fecha de expiración y lote.</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1">
                    <span className="font-extrabold text-foreground text-xs">Paso 6: Guardar & Disponibilidad Inmediata</span>
                    <p className="text-[11px]">Presiona <strong>"Guardar Producto"</strong>. El artículo quedará disponible inmediatamente para venderse en el Punto de Venta (POS) y ser recibido en Compras.</p>
                  </div>
                </div>
              </div>

              {/* Alerta de Stock Negativo */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-amber-700 dark:text-amber-400">Consejo de Control de Existencias</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Si deseas evitar discrepancias en inventario físico, mantén desactivada la opción <em>Permitir Stock Negativo</em> en <strong>Configuración &gt; Inventario</strong>. Esto garantizará que los cajeros solo puedan vender lo que físicamente ha sido recibido.
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
                  <span>Estructura & Clasificación</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Categorías & Grupos de Artículos</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El sistema utiliza una organización jerárquica de dos niveles para estructurar tu catálogo. Esto acelera la búsqueda en el Punto de Venta (POS) y permite generar reportes de rentabilidad por departamentos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-primary font-black text-sm">
                    <Layers size={18} />
                    <span>1. Grupos (Nivel Macro / Departamento)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Representan las grandes divisiones o áreas comerciales de tu negocio.
                  </p>
                  <div className="bg-muted/30 p-3 rounded-2xl text-[11px] space-y-1">
                    <strong className="text-foreground">Ejemplos de Grupos:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Bebidas & Licores</li>
                      <li>Ferretería & Construcción</li>
                      <li>Tecnología & Accesorios</li>
                    </ul>
                  </div>
                  <Link href="/dashboard/groups" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                    <span>Gestionar Grupos</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-primary font-black text-sm">
                    <Boxes size={18} />
                    <span>2. Categorías (Nivel Específico)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Subdivisiones que agrupan productos homogéneos dentro de un mismo grupo.
                  </p>
                  <div className="bg-muted/30 p-3 rounded-2xl text-[11px] space-y-1">
                    <strong className="text-foreground">Ejemplos de Categorías:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                      <li>Gaseosas, Cervezas, Vinos (Bajo el grupo Bebidas)</li>
                      <li>Tornillería, Pinturas, Herramientas (Bajo Ferretería)</li>
                      <li>Cables, Teclados, Auriculares (Bajo Tecnología)</li>
                    </ul>
                  </div>
                  <Link href="/dashboard/categories" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                    <span>Gestionar Categorías</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Paso a Paso */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-foreground">Paso a Paso: Cómo Crear Grupos y Categorías</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>Ve a <Link href="/dashboard/groups" className="text-primary font-bold underline">Grupos</Link> y crea primero los departamentos principales de tu empresa.</li>
                  <li>Luego dirígete a <Link href="/dashboard/categories" className="text-primary font-bold underline">Categorías</Link>, haz clic en <strong>"+ Nueva Categoría"</strong>, escribe el nombre y selecciona el Grupo padre al que pertenece.</li>
                  <li>Al registrar un producto, podrás asignarle su grupo y categoría con autocompletado inteligente.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: BODEGAS & ALMACÉN WMS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "warehouses" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Building2 size={14} />
                  <span>Logística Multibodega & WMS</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Bodegas Físicas, Ubicaciones WMS & Traslados</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Administra múltiples almacenes físicos, salas de ventas o bodegas satélite. Organiza el almacenamiento interno por pasillos, estanterías y niveles, y gestiona transferencias con control de mercancía en tránsito.
                </p>
              </div>

              {/* Operaciones de Bodega */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <h4 className="font-extrabold text-xs text-foreground">1. Creación de Bodegas</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Registra cada almacén indicando nombre, dirección física, sucursal y encargado responsable (ej. Bodega Principal, Sala de Ventas Norte, Bodega de Averías).
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <h4 className="font-extrabold text-xs text-foreground">2. Ubicaciones WMS</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Codifica estantes y casilleros (ej. <em>Pasillo A &gt; Estante 03 &gt; Nivel 2</em>) para acelerar el picking y preparación de despachos.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                  <h4 className="font-extrabold text-xs text-foreground">3. Traslados con Validación</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Mueve stock de una bodega a otra con estado intermedio <code>EN TRÁNSITO</code> hasta que el almacén receptor confirme físicamente la llegada.
                  </p>
                </div>
              </div>

              {/* Paso a paso de Traslados */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-foreground">Paso a Paso: Cómo Realizar un Traslado entre Bodegas</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>Ingresa a <Link href="/dashboard/warehouses" className="text-primary font-bold underline">Bodegas</Link> y selecciona la pestaña <strong>"Traslados"</strong>.</li>
                  <li>Haz clic en <strong>"+ Nuevo Traslado"</strong>.</li>
                  <li>Selecciona la <strong>Bodega de Origen</strong> (de donde saldrá la mercancía) y la <strong>Bodega de Destino</strong>.</li>
                  <li>Agrega los productos y las cantidades a mover. El sistema validará que la bodega de origen tenga stock suficiente.</li>
                  <li>Haz clic en <strong>"Despachar Traslado"</strong>. El stock saldrá de la bodega origen y quedará en estado de tránsito.</li>
                  <li>Cuando la mercancía llegue a la bodega destino, el encargado ingresa al traslado y presiona <strong>"Confirmar Recepción"</strong>.</li>
                </ol>
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
                  <span>Cadena de Suministro & Abastecimiento</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Gestión de Proveedores & Entrada de Mercancía</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Registra compras de inventario con incremento automático de existencias físicas en la bodega seleccionada y actualización del costo promedio ponderado de cada artículo.
                </p>
              </div>

              {/* Paso a Paso para Crear Proveedor */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  Paso a Paso: Cómo Registrar un Proveedor
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>Ve a <Link href="/dashboard/purchases" className="text-primary font-bold underline">Compras &gt; Proveedores</Link>.</li>
                  <li>Presiona <strong>"+ Nuevo Proveedor"</strong>.</li>
                  <li>Ingresa la <strong>Razón Social</strong> o Nombre Comercial, <strong>NIT / RUT</strong>, teléfono, correo de contacto y dirección.</li>
                  <li>Establece los términos comerciales habituales (días de crédito pactados: Contado, 15, 30 o 60 días).</li>
                  <li>Guarda el proveedor para tenerlo disponible en todas las compras futuras.</li>
                </ol>
              </div>

              {/* Paso a Paso para Registrar una Compra */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Truck size={16} className="text-primary" />
                  Paso a Paso: Cómo Registrar una Factura de Compra
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>En el módulo de <Link href="/dashboard/purchases" className="text-primary font-bold underline">Compras</Link>, presiona <strong>"+ Nueva Compra"</strong>.</li>
                  <li>Selecciona el <strong>Proveedor</strong> e ingresa el número de factura física emitida por el proveedor.</li>
                  <li>Selecciona la <strong>Bodega de Destino</strong> donde ingresarán físicamente las unidades.</li>
                  <li>Agrega los productos comprados indicando cantidad recibida y costo unitario pactado.</li>
                  <li>Indica la forma de pago (Contado con salida de caja o Crédito en Cuentas por Pagar).</li>
                  <li>Presiona <strong>"Procesar Compra"</strong>. El stock de los productos aumentará de inmediato y se recalculará el costo ponderado.</li>
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
                  <span>Terminal de Mostrador</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Ventas Rápidas, Terminal POS & Cobro</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El Punto de Venta (POS) está diseñado para máxima velocidad en caja. Admite pistolas lectoras de código de barras, selección táctil de productos, múltiples métodos de pago (Efectivo, Tarjeta, Transferencias, Crédito) y cálculo automático de cambio.
                </p>
              </div>

              {/* Guía Operativa de Caja */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" />
                  Flujo de Atención Rápida en Caja POS
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                    <span className="font-extrabold text-foreground block">1. Búsqueda & Escaneo de Artículos</span>
                    <p className="text-[11px]">
                      Pasa el código de barras por el lector o escribe las primeras letras del nombre en la barra de búsqueda. El producto se agregará al carrito instantáneamente.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                    <span className="font-extrabold text-foreground block">2. Selección de Cliente</span>
                    <p className="text-[11px]">
                      Por defecto se asigna a <em>"Cliente Mostrador / Consumidor Final"</em>. Si deseas facturar a un cliente corporativo, búscalo por cédula/NIT o regístralo en 1 clic.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                    <span className="font-extrabold text-foreground block">3. Cobro & Cambio Automático</span>
                    <p className="text-[11px]">
                      Presiona <strong>"Cobrar"</strong>. Elige el medio de pago: Efectivo (ingresa el monto recibido para ver el cambio), Tarjeta, Transferencia (Nequi, Daviplata) o Pagos Mixtos.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                    <span className="font-extrabold text-foreground block">4. Impresión de Ticket o PDF</span>
                    <p className="text-[11px]">
                      El ticket térmico de 58mm u 80mm se enviará a la impresora POS predeterminada y el stock se descontará de la bodega física en tiempo real.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de acceso directo al POS */}
              <div className="pt-2">
                <Link
                  href="/dashboard/sales"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-black px-5 py-2.5 rounded-2xl shadow hover:opacity-95 transition"
                >
                  <ShoppingCart size={15} />
                  <span>Abrir Punto de Venta (POS)</span>
                </Link>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: FACTURACIÓN & CONSECUTIVOS */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "invoicing" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Receipt size={14} />
                  <span>Documentos & Cumplimiento Fiscal</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Resolución de Facturación, Prefijos & Diseño</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configura tu resolución oficial de facturación (DIAN o equivalente tributario), los consecutivos iniciales, los prefijos (ej. <code>FAC-</code>, <code>POS-</code>) y el formato gráfico de las facturas impresas y en PDF.
                </p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-foreground">Paso a Paso: Configurar Consecutivos y Resolución</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>Ve a <strong>Configuración &gt; Facturación</strong>.</li>
                  <li>Ingresa el <strong>Número de Resolución</strong> y la fecha de vigencia autorizada por la entidad tributaria.</li>
                  <li>Define el <strong>Prefijo de Facturación</strong> (ej. <code>SETT-</code>, <code>FAC-</code>).</li>
                  <li>Establece el <strong>Rango Autorizado</strong> (desde el número inicial hasta el final) y el <strong>Consecutivo Actual</strong>.</li>
                  <li>Personaliza el pie de página legal con tu texto de exoneraciones, cuenta bancaria para consignaciones o leyendas tributarias.</li>
                  <li>Guarda los cambios. Todas las ventas emitidas a partir de ese momento adoptarán la nueva numeración.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: CRM & CLIENTES */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "crm" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Users size={14} />
                  <span>Gestión Comercial</span>
                </div>
                <h2 className="text-xl font-black text-foreground">CRM, Prospectos, Clientes & Cotizaciones</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Centraliza el directorio de tus clientes y prospectos comerciales. Realiza seguimiento al embudo de ventas, asigna límites de crédito y genera cotizaciones profesionales en PDF listas para enviar por WhatsApp o correo electrónico.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    Paso a Paso: Registrar un Cliente
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-muted-foreground">
                    <li>Ingresa a <Link href="/dashboard/crm" className="text-primary font-bold underline">CRM / Clientes</Link>.</li>
                    <li>Presiona <strong>"+ Nuevo Cliente"</strong>.</li>
                    <li>Completa Razón Social / Nombre, Documento de Identidad (Cédula o NIT), Teléfono, Correo y Dirección.</li>
                    <li>Si aplica, define un <strong>Límite de Crédito</strong> y días de plazo para compras a crédito en el POS.</li>
                    <li>Guarda el registro. El cliente quedará habilitado para facturación y estados de cuenta.</li>
                  </ol>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2">
                    <FileText size={16} className="text-primary" />
                    Paso a Paso: Emitir una Cotización
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-muted-foreground">
                    <li>En el módulo CRM, selecciona la pestaña <strong>"Cotizaciones"</strong>.</li>
                    <li>Presiona <strong>"+ Nueva Cotización"</strong> y selecciona el cliente.</li>
                    <li>Agrega los artículos cotizados con sus precios y descuentos comerciales pactados.</li>
                    <li>Define la fecha de validez de la oferta (ej. 15 o 30 días).</li>
                    <li>Haz clic en <strong>"Generar Cotización en PDF"</strong> para descargarla o compartirla al instante. Cuando el cliente apruebe, puedes convertir la cotización en Venta con 1 clic.</li>
                  </ol>
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
                  <span>Talento Humano & Nómina</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Directorio de Empleados, Cuentas Bancarias & Nómina</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Administra los expedientes de colaboradores, salarios base, contratos, novedades de nómina (bonos, horas extras, deducciones) y datos bancarios protegidos mediante visor de seguridad ofuscado.
                </p>
              </div>

              {/* Paso a paso de RRHH */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Briefcase size={18} className="text-primary" />
                  Paso a Paso: Cómo Registrar un Empleado en Nómina
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>Dirígete a <Link href="/dashboard/rrhh" className="text-primary font-bold underline">Recursos Humanos</Link>.</li>
                  <li>Haz clic en <strong>"+ Nuevo Empleado"</strong>.</li>
                  <li>Completa los datos personales: Nombre completo, Cédula / Documento, Teléfono, Correo y Dirección.</li>
                  <li>Indica la información laboral: <strong>Cargo</strong>, <strong>Departamento</strong>, <strong>Fecha de Ingreso</strong>, <strong>Tipo de Contrato</strong> (Término Fijo, Indefinido, Prestación de Servicios) y <strong>Salario Base</strong>.</li>
                  <li>Ingresa la <strong>Entidad Bancaria</strong>, <strong>Tipo de Cuenta</strong> (Ahorros / Corriente) y el <strong>Número de Cuenta</strong> para transferencias de nómina.</li>
                  <li>Presiona <strong>"Guardar Empleado"</strong>.</li>
                </ol>
              </div>

              {/* Visor de Cuentas Bancarias */}
              <div className="bg-muted/30 border border-border rounded-3xl p-5 space-y-2">
                <h4 className="font-extrabold text-xs text-foreground flex items-center gap-2">
                  <Eye size={16} className="text-primary" />
                  Visor Seguro de Cuentas Bancarias con Botón Ojito
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Por políticas de confidencialidad y protección de datos, todos los números de cuenta se muestran ofuscados en la tabla general (ej. <code>••••1234</code>). El usuario autorizado puede hacer clic en el botón de ojito interactivo para desocultar temporalmente el número completo al momento de realizar la dispersión de pagos.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: FINANZAS & FLUJO DE CAJA */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "finance" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <DollarSign size={14} />
                  <span>Control Financiero & Tesorería</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Flujo de Caja, Egresos, Gastos & Balance Neto</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitorea en tiempo real los ingresos operacionales generados por ventas frente a los costos de mercancía y gastos administrativos o fijos (arriendos, nómina, servicios) para conocer el balance neto real del negocio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl border border-border bg-card space-y-1.5 shadow-sm">
                  <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">Ingresos Operacionales</h4>
                  <p className="text-[11px] text-muted-foreground">Ventas en efectivo, pagos con tarjeta, transferencias bancarias y cobro de cartera de clientes.</p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card space-y-1.5 shadow-sm">
                  <h4 className="font-extrabold text-xs text-rose-600 dark:text-rose-400">Egresos & Gastos</h4>
                  <p className="text-[11px] text-muted-foreground">Arriendos de locales, nómina de empleados, servicios públicos, mantenimiento y fletes.</p>
                </div>
                <div className="p-4 rounded-2xl border border-border bg-card space-y-1.5 shadow-sm">
                  <h4 className="font-extrabold text-xs text-primary">Flujo Neto Consolidado</h4>
                  <p className="text-[11px] text-muted-foreground">Dinero disponible real consolidado tras deducir todos los gastos del período analizado.</p>
                </div>
              </div>

              {/* Paso a Paso para Registrar un Gasto */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-foreground">Paso a Paso: Cómo Registrar un Gasto Operacional</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
                  <li>Ingresa a <Link href="/dashboard/finance" className="text-primary font-bold underline">Finanzas</Link>.</li>
                  <li>Haz clic en el botón <strong>"+ Registrar Gasto / Egreso"</strong>.</li>
                  <li>Selecciona la <strong>Categoría de Gasto</strong> (Arriendo, Servicios Públicos, Nómina, Publicidad, Transporte, etc.).</li>
                  <li>Ingresa el <strong>Monto</strong> pagado, el método de desembolso (Caja menor, Cuenta bancaria) y adjunta una breve descripción o número de recibo.</li>
                  <li>Presiona <strong>"Guardar Gasto"</strong>. El monto se restará inmediatamente del flujo de caja diario.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: REPORTES, ANALÍTICAS & AUDITORÍA */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <BarChart3 size={14} />
                  <span>Inteligencia de Negocio & Seguridad</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Reportes Estadísticos, Kardex & Auditoría Inmutable</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toma decisiones basadas en datos con analíticas de ventas por período, rotación de productos, rentabilidad neta y bitácora de auditoría inmutable que registra cada evento ocurrido en la plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-primary" />
                    Reportes Exportables en Excel y PDF
                  </h3>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                    <li>• <strong>Ventas por Fechas:</strong> Detalle de transacciones agrupadas por día, semana o mes.</li>
                    <li>• <strong>Kardex de Inventario Valorizado:</strong> Movimientos de entrada, salida y saldo valorizado al costo promedio.</li>
                    <li>• <strong>Ranking de Productos Más Vendidos:</strong> Identifica tus productos estrella y los de baja rotación.</li>
                    <li>• <strong>Rentabilidad por Categoría:</strong> Utilidad bruta y márgenes porcentuales por departamento.</li>
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2">
                    <ShieldAlert size={16} className="text-primary" />
                    Bitácora Inmutable de Auditoría
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Cada acción en el sistema queda sellada con fecha, hora exacta, dirección IP, usuario ejecutor y detalle técnico del cambio (ej. modificación de precios, anulación de facturas, creación de usuarios o eliminación de registros).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: MÓDULO DE IA (BYOK) */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "ai-module" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                  <Sparkles size={14} />
                  <span>Inteligencia Artificial BYOK (Bring Your Own Key)</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Asistente Inteligente con tu Propia Clave de IA</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El ERP cuenta con integración nativa BYOK (Trae tu propia clave). Esto significa que tu información permanece 100% privada bajo tu propio proyecto y no pagas mensualidades adicionales por el uso de IA.
                </p>
              </div>

              {/* Guía Paso a Paso para Google Gemini */}
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
                      <span>Opción 1: Google Gemini (Recomendado - Nivel Gratuito de Alto Rendimiento)</span>
                    </div>
                    {openAccordions["ai-gemini-guide"] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {openAccordions["ai-gemini-guide"] && (
                    <div className="p-5 space-y-3 text-xs text-muted-foreground bg-card">
                      <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                        <li>Ingresa a la consola oficial de Google AI Studio: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline inline-flex items-center gap-0.5">aistudio.google.com/app/apikey <ExternalLink size={11} /></a>.</li>
                        <li>Inicia sesión con tu cuenta habitual de Google / Gmail.</li>
                        <li>Haz clic en el botón azul <strong>"Create API Key"</strong> (Crear clave de API).</li>
                        <li>Selecciona un proyecto existente o crea uno nuevo en 1 clic.</li>
                        <li>Copia la clave generada (inicia por <code>AIzaSy...</code>).</li>
                        <li>Ve a <Link href="/dashboard/settings?tab=ai" className="text-primary font-bold underline">Configuración &gt; Inteligencia Artificial</Link> en este ERP, pega la clave, haz clic en <strong>"Probar Conexión"</strong> y luego en <strong>"Guardar Configuración"</strong>.</li>
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
                        <li>Ingresa al portal de desarrolladores de OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary font-bold underline inline-flex items-center gap-0.5">platform.openai.com/api-keys <ExternalLink size={11} /></a>.</li>
                        <li>Inicia sesión o crea una cuenta.</li>
                        <li>Haz clic en <strong>"Create new secret key"</strong>.</li>
                        <li>Asigna un nombre (ej. "GNS SarriaTech ERP") y copia la clave generada (inicia por <code>sk-...</code>).</li>
                        <li>En Configuración del ERP, selecciona proveedor <strong>OpenAI</strong>, pega tu clave y guarda los cambios.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN: APIS REST & INTEGRACIONES */}
          {/* ══════════════════════════════════════════════════════════ */}
          {selectedSection === "api-global" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <Code2 size={14} />
                  <span>Especificación de Integraciones REST v1 & v2</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Autenticación, Cabeceras & Endpoints REST</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Conecta tu tienda online (Shopify, WooCommerce, MercadoLibre) o software externo con las APIs REST del sistema utilizando cabeceras Bearer Token autorizadas.
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
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold hover:bg-muted transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedText === "head-1" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedText === "head-1" ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>

                  <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-mono text-xs font-black text-primary">x-api-key: &lt;TU_API_KEY&gt;</span>
                      <p className="text-[11px] text-muted-foreground">Cabecera alternativa directa para microservicios y webhooks.</p>
                    </div>
                    <button
                      onClick={() => handleCopy(`x-api-key: ${activeApiKey}`, "head-2")}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold hover:bg-muted transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedText === "head-2" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedText === "head-2" ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ejemplo cURL Productos */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-2">
                    <Code2 size={16} className="text-primary" />
                    Ejemplo: Consultar Catálogo de Productos (GET /api/v2/products)
                  </h3>
                  <button
                    onClick={() => handleCopy(`curl -X GET "https://tudominio.com/api/v2/products" \\\n  -H "Authorization: Bearer ${activeApiKey}" \\\n  -H "Content-Type: application/json"`, "curl-prod")}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText === "curl-prod" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>{copiedText === "curl-prod" ? "Copiado" : "Copiar cURL"}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                  <p className="text-slate-400 mb-1"># Petición cURL:</p>
                  <code>curl -X GET &quot;https://tudominio.com/api/v2/products&quot; \<br />
                  &nbsp;&nbsp;-H &quot;Authorization: Bearer {activeApiKey}&quot; \<br />
                  &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot;</code>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

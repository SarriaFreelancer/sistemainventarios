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
  PackageCheck
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
    "ai-1": true,
    "ai-2": true,
    "api-headers": true,
    "settings-company": true,
    "settings-inventory": true,
    "settings-security": true,
    "settings-backups": true,
    "settings-demo": true,
    "settings-infra": true
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
    { id: "settings", title: "Configuración & Todos sus Submódulos", icon: Settings, badge: "Ajustes" },
    { id: "products", title: "Productos, Stock & Vencimientos", icon: Package },
    { id: "categories", title: "Categorías & Grupos de Artículos", icon: Layers },
    { id: "warehouses", title: "Bodegas & Almacén WMS", icon: Building2 },
    { id: "purchases", title: "Compras & Proveedores", icon: Truck },
    { id: "sales", title: "Ventas & Punto de Venta (POS)", icon: ShoppingCart },
    { id: "invoicing", title: "Facturación & Consecutivos", icon: Receipt },
    { id: "crm", title: "CRM & Gestión Comercial", icon: Users },
    { id: "rrhh", title: "Recursos Humanos & Nómina", icon: Briefcase },
    { id: "finance", title: "Finanzas, Gastos & Flujo de Caja", icon: DollarSign },
    { id: "reports", title: "Reportes, Analíticas & Auditoría", icon: BarChart3 },
    { id: "ai-module", title: "Inteligencia Artificial (IA / BYOK)", icon: Sparkles, badge: "BYOK / IA" },
    { id: "api-global", title: "Autenticación & APIs REST v1/v2", icon: Code2, badge: "REST" },
  ];

  const filteredSections = searchQuery.trim() === ""
    ? navigationSections
    : navigationSections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const currentSectionObj = navigationSections.find(s => s.id === selectedSection) || navigationSections[0];
  const CurrentIcon = currentSectionObj.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

      {/* ── Submenú Adaptativo para Dispositivos Móviles (lg:hidden) ── */}
      <div className="lg:hidden w-full space-y-3">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                <CurrentIcon size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Capítulo del Manual
                </span>
                <p className="text-sm font-bold text-foreground truncate">
                  {currentSectionObj.title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-bold rounded-xl text-xs transition active:scale-95 shrink-0"
            >
              <ListFilter size={14} />
              <span>{isMobileNavOpen ? "Cerrar" : "Capítulos"}</span>
              {isMobileNavOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Desplegable móvil */}
          {isMobileNavOpen && (
            <div className="mt-4 pt-4 border-t border-border space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar temas..."
                  className="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredSections.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedSection(item.id);
                        setIsMobileNavOpen(false);
                      }}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon size={15} className="shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Carrusel Horizontal de Pastillas */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {navigationSections.map(item => {
            const Icon = item.icon;
            const isSelected = selectedSection === item.id;
            return (
              <button
                key={`pill-${item.id}`}
                type="button"
                onClick={() => {
                  setSelectedSection(item.id);
                  setIsMobileNavOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Barra Lateral de Navegación del Manual (Desktop) ── */}
      <div className="hidden lg:block lg:col-span-1 space-y-4 lg:sticky lg:top-0">
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
            Índice de Módulos
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
        {/* SECCIÓN 1: VISIÓN GENERAL & PRIMEROS PASOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "intro" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <BookOpen size={14} />
                <span>Manual Integral GNS SarriaTech</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Bienvenido al Centro de Documentación</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>GNS - Gestión de Negocios SarriaTech</strong> es una plataforma ERP integral diseñada para automatizar la gestión de inventario multibodega, terminal punto de venta (POS), compras a proveedores, finanzas, nómina electrónica, CRM comercial y trazabilidad de auditoría.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
                  <Package size={18} />
                </div>
                <h3 className="font-bold text-xs text-foreground">Inventario & Catálogo</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Controla existencias, precios de costo y venta, alertas de stock mínimo, fechas de vencimiento y tipos de artículo.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
                  <ShoppingCart size={18} />
                </div>
                <h3 className="font-bold text-xs text-foreground">Punto de Venta (POS)</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Terminal de caja ultrarrápido con lector de código de barras, cálculo de cambio, pagos mixtos e impresión de tickets térmicos.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl w-fit">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-bold text-xs text-foreground">Inteligencia Artificial</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Trae tu propia API Key (BYOK) para asistencia de compras, sugerencias de precios y resúmenes financieros automáticos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 2: CONFIGURACIÓN GENERAL & TODOS SUS SUBMÓDULOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Settings size={14} />
                <span>Panel de Administración Central</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Guía Paso a Paso de Todos los Submódulos de Configuración</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                El módulo de Configuración te permite personalizar la identidad visual de tu empresa, controlar políticas de stock, blindar la seguridad de contraseñas, programar respaldos de base de datos e integrar APIs y modelos de IA.
              </p>
            </div>

            {/* Submódulo 1: Datos de Empresa */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                <Building className="text-primary" size={18} />
                <h3>1. Submódulo: Datos de Empresa & Identidad Visual</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define el nombre comercial, NIT/Identificación Tributaria, logotipo corporativo y fondo de pantalla adaptable.
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Nombre y NIT:</strong> Aparecen automáticamente en el encabezado de las facturas impresas y reportes PDF.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Logotipo de la Empresa:</strong> Sube tu logo en formato PNG o JPG. Se mostrará en la barra superior y en todas las facturas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Fondo de Pantalla Personalizado (Cover Responsive):</strong> Carga una imagen de fondo panorámica que se adaptará con efecto blur transparente únicamente en el área de trabajo.</span>
                </li>
              </ul>
            </div>

            {/* Submódulo 2: Inventario & Ventas */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                <Boxes className="text-primary" size={18} />
                <h3>2. Submódulo: Inventario & Políticas Comerciales</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Regula las restricciones de ventas y el comportamiento del stock:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <p className="font-bold text-foreground">🚫 Permitir Stock Negativo</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Si se desactiva, el cajero no podrá vender productos con 0 existencias físicas en el inventario.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <p className="font-bold text-foreground">🔢 Códigos Automáticos</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Genera códigos SKU correlativos automáticos (ej. <code>PROD-001</code>) al crear nuevos productos.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <p className="font-bold text-foreground">📊 Costeo Directo como Gasto</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Registra el costo total de las compras directamente como egreso en el flujo de caja del mes.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                  <p className="font-bold text-foreground">🧾 IVA y Decimales por Defecto</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Configura el porcentaje de IVA estándar (ej. 19%) y la precisión de decimales para precios.</p>
                </div>
              </div>
            </div>

            {/* Submódulo 3: Seguridad de Accesos & Sesiones */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                <Shield className="text-primary" size={18} />
                <h3>3. Submódulo: Seguridad de Accesos & Monitoreo de Sesiones</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Establece la política de robustez de contraseñas y visualiza las sesiones activas en tiempo real:
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Requisitos de Contraseña:</strong> Configura longitud mínima (ej. 8 caracteres), mayúsculas, números y caracteres especiales.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Bloqueo por Intentos Fallidos:</strong> Tras 3 o 5 intentos fallidos, la cuenta entra en suspensión temporal de seguridad.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Sesiones Activas:</strong> En la pestaña <em>Sesiones Activas</em> puedes auditar IP, navegador y ubicación de cada usuario conectado y cerrar sesiones no deseadas remotamente.</span>
                </li>
              </ul>
            </div>

            {/* Submódulo 4: Respaldos & SMTP */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                <SlidersHorizontal className="text-primary" size={18} />
                <h3>4. Submódulo: Respaldos de Base de Datos & Servidor SMTP</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Protege tu información comercial con copias de seguridad de la base de datos y configura el envío de correos automatizados:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-foreground">💾 Copias de Seguridad SQL</p>
                  <p className="text-[11px] text-muted-foreground">Genera descargas inmediatas del volcado SQL de tu empresa o programa respaldos automáticos diarios a una hora determinada.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <p className="font-bold text-foreground">✉️ Servidor de Correo SMTP</p>
                  <p className="text-[11px] text-muted-foreground">Conecta tu servidor SMTP (Gmail, Outlook, Hostinger) para enviar facturas electrónicas y notificaciones de alerta a clientes.</p>
                </div>
              </div>
            </div>

            {/* Submódulo 5: Datos de Prueba & Onboarding */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                <PackageCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
                <h3>5. Submódulo: Datos de Prueba & Onboarding Seguro</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inyecta datos de muestra para explorar el sistema y elimínalos selectivamente sin perder tus registros reales:
              </p>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2 text-emerald-900 dark:text-emerald-200">
                <p className="font-bold">🛡️ Sistema de Trazabilidad y Eliminación Selectiva:</p>
                <ul className="space-y-1.5 list-disc list-inside text-emerald-800 dark:text-emerald-300">
                  <li><strong>Bloqueo de Duplicación:</strong> Si ya existen datos de prueba generados, el sistema bloquea una nueva inyección hasta que elimines los actuales.</li>
                  <li><strong>Eliminar solo datos de prueba:</strong> Borra únicamente los artículos, ventas y nóminas inyectados por el demo. <b>Tus productos, proveedores y clientes creados manualmente quedan 100% protegidos.</b></li>
                  <li><strong>Validación de Contraseña:</strong> Por seguridad, cualquier eliminación requiere ingresar la contraseña de Administrador o SuperAdmin antes de proceder.</li>
                </ul>
              </div>
            </div>

            {/* Submódulo 6: Infraestructura & Herramientas SuperAdmin */}
            {userRole === 'SUPERADMIN' && (
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 text-foreground font-bold text-sm">
                  <Server className="text-primary" size={18} />
                  <h3>6. Submódulo: Infraestructura, Servidores & Licencias (SuperAdmin)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                    <p className="font-bold text-foreground">🖥️ Servidores Dedicados</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Asigna conexiones MySQL independientes para empresas de alto volumen.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                    <p className="font-bold text-foreground">🔄 Migraciones de Datos</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Transfiere empresas entre bases de datos compartidas y dedicadas con un clic.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                    <p className="font-bold text-foreground">📢 Anuncios Globales</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Publica alertas y notificaciones a todas las empresas del sistema en tiempo real.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 3: PRODUCTOS, STOCK & VENCIMIENTOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "products" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Package size={14} />
                <span>Gestión de Inventario</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Catálogo de Productos, Tipos de Artículo & Vencimientos</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aprende a registrar y categorizar productos en el sistema con costos unitarios, margen de ganancia, código de barras y fechas de caducidad.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground">Tipos de Artículo Soportados:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="font-bold text-primary">VENTA (Mercancía)</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Productos estándar listos para venta en mostrador o POS.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">MATERIA PRIMA</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Ingredientes o insumos químicos para producción.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="font-bold text-blue-600 dark:text-blue-400">PRODUCTO TERMINADO</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Kits o artículos elaborados en planta de producción.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="font-bold text-amber-600 dark:text-amber-400">SUMINISTRO</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Empaques, cajas, frascos gotero y etiquetas térmicas.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="font-bold text-purple-600 dark:text-purple-400">SERVICIO</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Cursos, asesorías y sesiones de spa (no descuentan stock físico).</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="font-bold text-rose-600 dark:text-rose-400">ACTIVO FIJO</span>
                  <p className="text-[11px] text-muted-foreground mt-1">Maquinaria, mobiliario y equipos POS de la empresa.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 4: BODEGAS & ALMACÉN WMS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "warehouses" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Building2 size={14} />
                <span>Almacén WMS & Logística</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Gestión Multibodega, Ubicaciones & Traslados</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Administra múltiples almacenes o sucursales físicas, crea ubicaciones internas detalladas (Pasillo, Estante, Nivel) y realiza traslados con validación en tránsito.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 text-xs text-muted-foreground">
              <h3 className="text-sm font-bold text-foreground">Flujo de Traslado entre Bodegas:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Selecciona la <strong>Bodega de Origen</strong> y la <strong>Bodega de Destino</strong>.</li>
                <li>Agrega los productos y cantidades a transferir. El sistema verifica que la bodega de origen tenga existencias suficientes.</li>
                <li>Al enviar el traslado, el estado cambia a <code>EN TRÁNSITO</code>.</li>
                <li>El encargado de la bodega receptora presiona <strong>"Confirmar Recepción"</strong> para ingresar el stock físicamente.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 5: COMPRAS & PROVEEDORES */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "purchases" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Truck size={14} />
                <span>Gestión de Compras</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Compras a Proveedores & Entrada de Mercancía</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registra órdenes de compra, vincula facturas de proveedores e incrementa el stock de tus bodegas automáticamente con actualización de costo promedio.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 6: VENTAS & PUNTO DE VENTA (POS) */}
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
                El módulo de ventas está optimizado para agilidad en mostrador con soporte de lector de código de barras, selección táctil de productos, cálculo automático de cambio y pagos múltiples.
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
                  Permite dividir el pago entre diferentes medios (e.g. 50% Efectivo, 50% Transferencia) o registrar ventas a crédito vinculadas al CRM.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 7: FACTURACIÓN & CONSECUTIVOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "invoicing" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Receipt size={14} />
                <span>Facturación & DIAN</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Resolución de Facturación, Prefijos & Diseño de Ticket</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configura tu resolución oficial de facturación (DIAN o equivalente fiscal), los consecutivos iniciales y personaliza los colores y pie de página de las facturas.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 8: CRM & CLIENTES */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "crm" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Users size={14} />
                <span>CRM Comercial</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Ficha de Clientes, Prospectos & Oportunidades</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Centraliza la información de tus clientes, registra prospectos (leads), haz seguimiento a oportunidades comerciales por etapas de venta y genera cotizaciones en PDF.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 9: RECURSOS HUMANOS & NÓMINA */}
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
                Administra expedientes de colaboradores, salarios, cargos, novedades (bonos y deducciones) y datos bancarios protegidos con visor de seguridad ofuscado.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 10: FINANZAS & GASTOS */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "finance" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <DollarSign size={14} />
                <span>Control Financiero</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Flujo de Caja, Egresos & Balance Neto</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Monitorea en tiempo real los ingresos operacionales por ventas frente a los costos de mercancía y gastos fijos para conocer el margen neto real del negocio.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 11: REPORTES & AUDITORÍA */}
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
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 12: MÓDULO DE IA (BYOK) */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "ai-module" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                <Sparkles size={14} />
                <span>Inteligencia Artificial BYOK</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Asistente Inteligente & Modelos Soportados</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Integra tu propia API Key de Google Gemini, OpenAI, DeepSeek u Ollama para activar el asistente de chat flotante, resúmenes automáticos y sugerencias comerciales.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SECCIÓN 13: APIS REST */}
        {/* ══════════════════════════════════════════════════════════ */}
        {selectedSection === "api-global" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Code2 size={14} />
                <span>APIs REST v1 & v2</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Autenticación Bearer & Endpoints REST</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Conecta tu tienda online, eCommerce o software externo mediante las APIs REST del sistema utilizando cabeceras Bearer Token autorizadas.
              </p>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
              <p className="text-slate-400 mb-1"># Ejemplo de consulta cURL de productos:</p>
              <code>curl -X GET &quot;https://tudominio.com/api/v2/products&quot; \<br />
              &nbsp;&nbsp;-H &quot;Authorization: Bearer {activeApiKey}&quot; \<br />
              &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot;</code>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

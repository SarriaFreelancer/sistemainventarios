"use client";

import React, { useState, useRef } from "react";
import { Building, Boxes, ShieldAlert, SlidersHorizontal, Receipt, Upload, Sparkles, Server, ArrowRightLeft, Database, KeyRound, DownloadCloud, Bell, Mail, Loader2, Save, Image as ImageIcon, Trash2, Clock, LayoutTemplate, Monitor, Shield } from "lucide-react";
import { updateCompanySettings, uploadCompanyLogo, uploadCompanyBackgroundImage } from "@/app/actions/settings-actions";
import { generateDemoData, clearDemoData } from "@/app/actions/demo-actions";
import { successAlert, errorAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const ServersManager = dynamic(() => import("./servers-manager").then(m => m.ServersManager), { ssr: false });
const MigrationsManager = dynamic(() => import("./migrations-manager").then(m => m.MigrationsManager), { ssr: false });
const DatabasesManager = dynamic(() => import("./databases-manager").then(m => m.DatabasesManager), { ssr: false });
const LicensesManager = dynamic(() => import("./licenses-manager").then(m => m.LicensesManager), { ssr: false });
const ImportsManager = dynamic(() => import("./imports-manager").then(m => m.ImportsManager), { ssr: false });
const OnboardingManager = dynamic(() => import("./onboarding-manager").then(m => m.OnboardingManager), { ssr: false });
const ActiveSessionsManager = dynamic(() => import("@/components/sessions/active-sessions-manager"), { ssr: false });
const AnnouncementsManager = dynamic(() => import("./announcements-manager").then(m => m.AnnouncementsManager), { ssr: false });
interface CompanySetting {
  id: number;
  companyId: number;
  nit: string | null;
  phone: string | null;
  website: string | null;
  socialMedia: any;
  currency: string;
  timezone: string;
  dateFormat: string;
  currencyFormat: string;
  allowNegativeStock: boolean;
  registerInventoryCostAsExpense: boolean;
  automaticCode: boolean;
  decimals: number;
  defaultIva: number;
  invoicePrefix: string;
  invoiceConsecutive: number;
  purchasePrefix: string;
  purchaseConsecutive: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  enable2FA: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  backupFrequency: string;
  backupTime?: string | null;
  backupDay?: number | null;
  backupPath?: string | null;
  enableNotifications: boolean;
  updatedAt: string;
}

interface SettingsClientProps {
  initialSettings: CompanySetting;
  role?: string;
  initialServers?: any[];
  dedicatedCompanies?: { id: number; name: string }[];
  canManageServers?: boolean;
  userId: string;
  planSettings?: any;
  allModules?: any[];
}

export function SettingsClient({ initialSettings, role, initialServers = [], dedicatedCompanies = [], canManageServers = false, userId, planSettings, allModules }: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"company" | "inventory" | "security" | "integrations" | "invoice" | "imports" | "servers" | "databases" | "migrations" | "licenses" | "onboarding" | "sessions" | "announcements">("company");
  const [saving, setSaving] = useState(false);
  const isSuperAdmin = role === "SUPERADMIN";

  // Estados locales para los campos
  const [nit, setNit] = useState(initialSettings.nit || "");
  const [phone, setPhone] = useState(initialSettings.phone || "");
  const [website, setWebsite] = useState(initialSettings.website || "");
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [timezone, setTimezone] = useState(initialSettings.timezone);
  const [dateFormat, setDateFormat] = useState(initialSettings.dateFormat);
  const [currencyFormat, setCurrencyFormat] = useState(initialSettings.currencyFormat);

  // Fondo de Pantalla Personalizado
  const [bgImage, setBgImage] = useState<string>((initialSettings as any).bgImage || "");

  // Inventario & Ventas
  const [allowNegativeStock, setAllowNegativeStock] = useState(initialSettings.allowNegativeStock);
  const [registerInventoryCostAsExpense, setRegisterInventoryCostAsExpense] = useState(initialSettings.registerInventoryCostAsExpense ?? false);
  const [automaticCode, setAutomaticCode] = useState(initialSettings.automaticCode);
  const [decimals, setDecimals] = useState(initialSettings.decimals);
  const [defaultIva, setDefaultIva] = useState(initialSettings.defaultIva);
  const [invoicePrefix, setInvoicePrefix] = useState(initialSettings.invoicePrefix);
  const [invoiceConsecutive, setInvoiceConsecutive] = useState(initialSettings.invoiceConsecutive);
  const [purchasePrefix, setPurchasePrefix] = useState(initialSettings.purchasePrefix);
  const [purchaseConsecutive, setPurchaseConsecutive] = useState(initialSettings.purchaseConsecutive);

  // Seguridad
  const [passwordMinLength, setPasswordMinLength] = useState(initialSettings.passwordMinLength);
  const [passwordMaxLength, setPasswordMaxLength] = useState(initialSettings.passwordMaxLength ?? 128);
  const [passwordRequireUppercase, setPasswordRequireUppercase] = useState(initialSettings.passwordRequireUppercase ?? false);
  const [passwordRequireLowercase, setPasswordRequireLowercase] = useState(initialSettings.passwordRequireLowercase ?? false);
  const [passwordRequireNumbers, setPasswordRequireNumbers] = useState(initialSettings.passwordRequireNumbers ?? false);
  const [passwordRequireSymbols, setPasswordRequireSymbols] = useState(initialSettings.passwordRequireSymbols ?? false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(initialSettings.maxLoginAttempts);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(initialSettings.sessionTimeoutMinutes);
  const [enable2FA, setEnable2FA] = useState(initialSettings.enable2FA);

  // Integraciones & SMTP
  const [smtpHost, setSmtpHost] = useState(initialSettings.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(initialSettings.smtpPort || "");
  const [smtpUser, setSmtpUser] = useState(initialSettings?.smtpUser || "");
  const [smtpPass, setSmtpPass] = useState(initialSettings?.smtpPass || "");
  const [backupFrequency, setBackupFrequency] = useState(initialSettings?.backupFrequency || "DAILY");
  const [backupTime, setBackupTime] = useState(initialSettings?.backupTime || "02:00");
  const [backupDay, setBackupDay] = useState(initialSettings?.backupDay || 1);
  const [backupPath, setBackupPath] = useState(initialSettings?.backupPath || "");
  const [backupType, setBackupType] = useState<"shared" | "dedicated">("shared");
  const [backupCompanyId, setBackupCompanyId] = useState<string>("");
  const [enableNotifications, setEnableNotifications] = useState((initialSettings as any).enableNotifications ?? true);

  // Gestión de Vencimientos
  const [trackExpirationDates, setTrackExpirationDates] = useState((initialSettings as any).trackExpirationDates ?? false);
  const [expirationAlertDays, setExpirationAlertDays] = useState((initialSettings as any).expirationAlertDays ?? 30);
  const [blockExpiredSales, setBlockExpiredSales] = useState((initialSettings as any).blockExpiredSales ?? false);
  const [expirationAlertFrequency, setExpirationAlertFrequency] = useState((initialSettings as any).expirationAlertFrequency ?? "DAILY");
  const [enableBatchWriteOff, setEnableBatchWriteOff] = useState((initialSettings as any).enableBatchWriteOff ?? true);
  const [enableBatchDelete, setEnableBatchDelete] = useState((initialSettings as any).enableBatchDelete ?? false);
  const [autoExpenseOnWriteOff, setAutoExpenseOnWriteOff] = useState((initialSettings as any).autoExpenseOnWriteOff ?? true);

  // Facturación Personalizada
  const initialInvoiceConfig = (initialSettings as any).invoiceConfig || {};
  const [invoiceCompanyName, setInvoiceCompanyName] = useState(initialInvoiceConfig.companyName || "");
  const [invoiceAddress, setInvoiceAddress] = useState(initialInvoiceConfig.address || "");
  const [invoiceEmail, setInvoiceEmail] = useState(initialInvoiceConfig.email || "");
  const [invoicePhone, setInvoicePhone] = useState(initialInvoiceConfig.phone || "");
  const [invoiceNit, setInvoiceNit] = useState(initialInvoiceConfig.nit || "");
  const [invoiceWebsite, setInvoiceWebsite] = useState(initialInvoiceConfig.website || "");
  const [invoicePrimaryColor, setInvoicePrimaryColor] = useState(initialInvoiceConfig.primaryColor || "#b91c1c");
  const [invoiceSecondaryColor, setInvoiceSecondaryColor] = useState(initialInvoiceConfig.secondaryColor || "#C5A059");
  const [invoiceLogo, setInvoiceLogo] = useState(initialInvoiceConfig.logo || "");
  const [invoiceResolutionText, setInvoiceResolutionText] = useState(initialInvoiceConfig.resolutionText || "");
  const [invoiceFooterText, setInvoiceFooterText] = useState(initialInvoiceConfig.footerText || "Documento equivalente de venta generado de forma electrónica.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const result = await updateCompanySettings({
      nit,
      phone,
      website,
      currency,
      timezone,
      dateFormat,
      currencyFormat,
      allowNegativeStock,
      registerInventoryCostAsExpense,
      automaticCode,
      decimals,
      defaultIva,
      invoicePrefix,
      invoiceConsecutive,
      purchasePrefix,
      purchaseConsecutive,
      passwordMinLength,
      passwordMaxLength,
      passwordRequireUppercase,
      passwordRequireLowercase,
      passwordRequireNumbers,
      passwordRequireSymbols,
      maxLoginAttempts,
      sessionTimeoutMinutes,
      enable2FA,
      smtpHost,
      smtpPort: smtpPort ? Number(smtpPort) : null,
      smtpUser,
      smtpPass,
      backupFrequency,
      backupTime,
      backupDay,
      backupPath,
      enableNotifications,
      trackExpirationDates,
      expirationAlertDays,
      blockExpiredSales,
      expirationAlertFrequency,
      enableBatchWriteOff,
      enableBatchDelete,
      autoExpenseOnWriteOff,
      bgImage,
      invoiceConfig: {
        companyName: invoiceCompanyName,
        address: invoiceAddress,
        email: invoiceEmail,
        phone: invoicePhone,
        nit: invoiceNit,
        website: invoiceWebsite,
        primaryColor: invoicePrimaryColor,
        secondaryColor: invoiceSecondaryColor,
        logo: invoiceLogo,
        resolutionText: invoiceResolutionText,
        footerText: invoiceFooterText
      }
    });

    setSaving(false);

    if (result.success) {
      await successAlert("Ajustes guardados", "Los parámetros del sistema fueron actualizados con éxito.");
      router.refresh();
    } else {
      errorAlert("Error", result.error || "No se pudieron guardar los ajustes.");
    }
  };


  const triggerManualBackup = async () => {
    try {
      showToast("Iniciando generación de respaldo...", "info");
      
      let url = "/api/backup?type=auto";
      if (role === "SUPERADMIN") {
        if (backupType === "dedicated") {
          if (!backupCompanyId) {
            errorAlert("Atención", "Debes seleccionar una empresa para respaldar su base dedicada.");
            return;
          }
          url = `/api/backup?type=dedicated&companyId=${backupCompanyId}`;
        } else {
          url = `/api/backup?type=shared`;
        }
      }
      
      // Trigger download
      window.location.href = url;
      
      successAlert("Respaldo iniciado", "El archivo de respaldo SQL comenzará a descargarse en unos momentos.");
    } catch (e) {
      errorAlert("Error de respaldo", "No se pudo invocar el respaldo de la base de datos.");
    }
  };

  const showToast = (title: string, icon: "success" | "error" | "info" | "warning") => {
    // Alerta simple
    successAlert("Procesando", title);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* ── Menú Lateral de Pestañas (Tabs) ── */}
      <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-4 shadow-sm space-y-1">
        <button
          onClick={() => setActiveTab("company")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "company" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Building size={16} />
          Datos de Empresa
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "inventory" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Boxes size={16} />
          Inventario & Ventas
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "security" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Shield size={16} />
          Seguridad de Accesos
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "sessions" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Monitor size={16} />
          Sesiones Activas
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "integrations" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <SlidersHorizontal size={16} />
          Respaldos & SMTP
        </button>
        <button
          onClick={() => setActiveTab("invoice")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "invoice" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Receipt size={16} />
          Facturación Personalizada
        </button>
        <button
          onClick={() => setActiveTab("imports")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "imports" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Upload size={16} />
          Importación Masiva
        </button>
        <button
          onClick={() => setActiveTab("onboarding")}
          className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === "onboarding" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
          }`}
        >
          <Sparkles size={16} />
          Datos de Prueba
        </button>

        {isSuperAdmin && (
          <div className="pt-4 pb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">Gestión de Infraestructura</span>
          </div>
        )}

        {canManageServers && !isSuperAdmin && (
          <div className="pt-4 pb-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">Recursos Propios</span>
          </div>
        )}

        {canManageServers && (
          <>
            <button
              onClick={() => setActiveTab("servers")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "servers" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              <Server size={16} />
              {isSuperAdmin ? "Servidores (Tenants)" : "Servidores Propios"}
            </button>
            <button
              onClick={() => setActiveTab("migrations")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "migrations" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              <ArrowRightLeft size={16} />
              Migraciones
            </button>
          </>
        )}

        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab("databases")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "databases" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              <Database size={16} />
              Bases de Datos
            </button>
            <button
              onClick={() => setActiveTab("licenses")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "licenses" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              <KeyRound size={16} />
              Licencias y Suscripciones
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === "announcements" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              <Bell size={16} />
              Anuncios Globales
            </button>
          </>
        )}
      </div>

      {/* ── Contenedor del Formulario ── */}
      <div className="lg:col-span-3">
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <ActiveSessionsManager role={role || "USER"} />
          </div>
        )}

        {activeTab === "servers" && canManageServers && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <ServersManager servers={initialServers} />
          </div>
        )}

        {activeTab === "databases" && isSuperAdmin && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-in fade-in zoom-in-95">
            <DatabasesManager allCompanies={dedicatedCompanies} servers={initialServers} />
          </div>
        )}

        {activeTab === "migrations" && canManageServers && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <MigrationsManager servers={initialServers} />
          </div>
        )}

        {activeTab === "licenses" && isSuperAdmin && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <LicensesManager companies={dedicatedCompanies as any} planSettings={planSettings} allModules={allModules} />
          </div>
        )}

        {/* PESTAÑA: ANUNCIOS GLOBALES (SUPERADMIN) */}
        {activeTab === "announcements" && isSuperAdmin && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-in fade-in zoom-in-95">
            <AnnouncementsManager />
          </div>
        )}

        {/* PESTAÑA: ONBOARDING */}
        {activeTab === "onboarding" && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-in fade-in zoom-in-95">
            <OnboardingManager userId={userId} role={role} companies={dedicatedCompanies} />
          </div>
        )}

      {/* Renderizamos el form solo para tabs no-infraestructura */}
      {["company", "inventory", "security", "integrations", "invoice", "imports"].includes(activeTab) && (
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        
        {/* PESTAÑA: DATOS DE EMPRESA */}
        {activeTab === "company" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building size={18} className="text-primary" />
              Parámetros de la Organización
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Código o NIT de Empresa</label>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  placeholder="e.g. 900.222.111-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  placeholder="e.g. +57 312 444 5566"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Sitio Web Corporativo</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                placeholder="https://tudominio.com"
              />
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between">
                <span>Logotipo Oficial de la Empresa</span>
                <span className="text-[10px] text-primary lowercase font-normal">se mostrará en el encabezado de la app</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="text"
                  value={invoiceLogo}
                  onChange={(e) => setInvoiceLogo(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  placeholder="Ej. https://miempresa.com/logo.png o sube un archivo"
                />
                <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shrink-0">
                  <Upload size={14} />
                  Subir Archivo
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async () => {
                          const res = await uploadCompanyLogo(reader.result as string);
                          if (res.success && res.url) {
                            setInvoiceLogo(res.url);
                            successAlert("Logo cargado", "La imagen del logo ha sido guardada.");
                          } else {
                            errorAlert("Error", res.error || "No se pudo subir el logo");
                          }
                        };
                      } catch (err) {
                        errorAlert("Error", "No se pudo procesar el archivo seleccionado");
                      }
                    }}
                  />
                </label>
                {invoiceLogo && (
                  <div className="h-10 w-10 rounded-xl overflow-hidden border border-border bg-background flex items-center justify-center shrink-0 shadow-sm relative">
                    <img src={invoiceLogo} alt="Previsualización" className="h-full w-full object-cover scale-125 transition-transform" />
                  </div>
                )}
              </div>
            </div>

            {/* Imagen de Fondo de Pantalla Adaptable */}
            <div className="space-y-3 border-t border-border/60 pt-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-primary" />
                  Imagen de Fondo de Pantalla del Sistema (Wallpaper)
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Se ajusta automáticamente en escritorios, tablets y teléfonos (Cover Responsive). Si no agregas ninguna, el sistema continuará con su diseño plano estándar.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="text"
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  placeholder="Ej. https://miempresa.com/fondo.jpg o sube un archivo local"
                />
                
                <label className="cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shrink-0">
                  <Upload size={14} />
                  Subir Fondo
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async () => {
                          const res = await uploadCompanyBackgroundImage(reader.result as string);
                          if (res.success && res.url) {
                            setBgImage(res.url);
                            successAlert("Imagen de fondo cargada", "El fondo de pantalla fue subido con éxito.");
                          } else {
                            errorAlert("Error", res.error || "No se pudo subir la imagen de fondo");
                          }
                        };
                      } catch (err) {
                        errorAlert("Error", "No se pudo procesar la imagen seleccionada");
                      }
                    }}
                  />
                </label>

                {bgImage && (
                  <button
                    type="button"
                    onClick={() => setBgImage("")}
                    className="px-3.5 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    title="Eliminar imagen de fondo"
                  >
                    <Trash2 size={14} />
                    Quitar Fondo
                  </button>
                )}
              </div>

              {bgImage && (
                <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-border bg-muted/50 shadow-inner group">
                  <img src={bgImage} alt="Previsualización de Fondo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="text-xs font-black text-white bg-black/70 px-4 py-1.5 rounded-full border border-white/20 shadow-md">
                      Previsualización de Fondo Adaptable (Cover Responsive)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Moneda del Sistema</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none font-semibold"
                >
                  <option value="COP">Pesos Colombianos (COP)</option>
                  <option value="USD">Dólares Estadounidenses (USD)</option>
                  <option value="EUR">Euros (EUR)</option>
                  <option value="MXN">Pesos Mexicanos (MXN)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Zona Horaria (Timezone)</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none font-semibold"
                >
                  <option value="America/Bogota">America/Bogota (GMT-5)</option>
                  <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                  <option value="Europe/Madrid">Europe/Madrid (GMT+1)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: INVENTARIO & VENTAS */}
        {activeTab === "inventory" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Boxes size={18} className="text-primary" />
              Lógica Comercial & Control de Stock
            </h3>

            {/* Toggles de Stock Negativo y Código Automático */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Permitir Stock Negativo</p>
                  <p className="text-xs text-muted-foreground">Vende productos sin existencias en catálogo.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={(e) => setAllowNegativeStock(e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Costo Inventario a Gastos</p>
                  <p className="text-xs text-muted-foreground">Sugerir descontar costos de mercancía de las ganancias.</p>
                </div>
                <input
                  type="checkbox"
                  checked={registerInventoryCostAsExpense}
                  onChange={(e) => setRegisterInventoryCostAsExpense(e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Códigos de Producto Automáticos</p>
                  <p className="text-xs text-muted-foreground">El sistema genera códigos SKU correlativos.</p>
                </div>
                <input
                  type="checkbox"
                  checked={automaticCode}
                  onChange={(e) => setAutomaticCode(e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Decimales de redondeo</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Impuesto IVA por defecto (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultIva}
                  onChange={(e) => setDefaultIva(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Consecutivos y Prefijos de Facturación */}
            <div className="border-t border-border/60 pt-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase">Consecutivos de Documentos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Prefijo Ventas</label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Consecutivo Venta</label>
                    <input
                      type="number"
                      value={invoiceConsecutive}
                      onChange={(e) => setInvoiceConsecutive(Number(e.target.value))}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Prefijo Compras</label>
                    <input
                      type="text"
                      value={purchasePrefix}
                      onChange={(e) => setPurchasePrefix(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Consecutivo Compra</label>
                    <input
                      type="number"
                      value={purchaseConsecutive}
                      onChange={(e) => setPurchaseConsecutive(Number(e.target.value))}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSECCIÓN DENTRO DE INVENTORY: Control de Vencimientos */}
        {activeTab === "inventory" && (
          <div className="space-y-4 border-t border-border/60 pt-6 mt-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Control de Vencimientos
              {!(planSettings || isSuperAdmin) && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Plan Intermedio+</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground -mt-2">Gestiona fechas de vencimiento por lotes para productos perecederos (alimentos, farmacia, cosméticos).</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Habilitar Vencimientos</p>
                  <p className="text-xs text-muted-foreground">Activa el control de fechas de vencimiento por lotes en productos.</p>
                </div>
                <input
                  type="checkbox"
                  checked={trackExpirationDates}
                  onChange={(e) => setTrackExpirationDates(e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Bloquear Ventas Vencidas</p>
                  <p className="text-xs text-muted-foreground">Impide vender productos con lotes expirados.</p>
                </div>
                <input
                  type="checkbox"
                  checked={blockExpiredSales}
                  onChange={(e) => setBlockExpiredSales(e.target.checked)}
                  disabled={!trackExpirationDates}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Permitir Bajas por Vencimiento</p>
                  <p className="text-xs text-muted-foreground">Habilita el botón para retirar y dar de baja unidades de lotes vencidos.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableBatchWriteOff}
                  onChange={(e) => setEnableBatchWriteOff(e.target.checked)}
                  disabled={!trackExpirationDates}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Permitir Eliminación Directa de Lotes</p>
                  <p className="text-xs text-muted-foreground">Habilita el botón para eliminar permanentemente lotes y descontar su stock del inventario.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableBatchDelete}
                  onChange={(e) => setEnableBatchDelete(e.target.checked)}
                  disabled={!trackExpirationDates}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary disabled:opacity-40"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Contabilizar Bajas como Gasto (Mermas)</p>
                  <p className="text-xs text-muted-foreground">Registra automáticamente el costo de los productos dados de baja en Finanzas.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoExpenseOnWriteOff}
                  onChange={(e) => setAutoExpenseOnWriteOff(e.target.checked)}
                  disabled={!trackExpirationDates || !enableBatchWriteOff}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary disabled:opacity-40"
                />
              </div>
            </div>

            {trackExpirationDates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Días de anticipación para alertas</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={expirationAlertDays}
                    onChange={(e) => setExpirationAlertDays(Number(e.target.value))}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <p className="text-[11px] text-muted-foreground">Se notificará cuando un lote esté a {expirationAlertDays} días de vencer.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Frecuencia de revisión</label>
                  <select
                    value={expirationAlertFrequency}
                    onChange={(e) => setExpirationAlertFrequency(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="DAILY">Diaria</option>
                    <option value="WEEKLY">Semanal</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: SEGURIDAD & SESIÓN */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldAlert size={18} className="text-primary" />
              Políticas de Acceso y Contraseñas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Longitud Contraseña Mínima</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={passwordMinLength}
                  onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Longitud Contraseña Máxima</label>
                <input
                  type="number"
                  min="6"
                  max="128"
                  value={passwordMaxLength}
                  onChange={(e) => setPasswordMaxLength(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Intentos fallidos límite</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Expiración Sesión (min)</label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-border/80 bg-muted/10 rounded-2xl border-t border-border/60 pt-4">
              <div>
                <p className="text-sm font-bold text-foreground">Forzar Doble Factor (2FA)</p>
                <p className="text-xs text-muted-foreground">Exige autenticación extra a través de correo electrónico o Google Authenticator.</p>
              </div>
              <input
                type="checkbox"
                checked={enable2FA}
                onChange={(e) => setEnable2FA(e.target.checked)}
                className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
              />
            </div>

            <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">Requisitos de Contraseña</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={passwordRequireUppercase}
                  onChange={(e) => setPasswordRequireUppercase(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
                />
                Exigir Mayúsculas
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={passwordRequireLowercase}
                  onChange={(e) => setPasswordRequireLowercase(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
                />
                Exigir Minúsculas
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={passwordRequireNumbers}
                  onChange={(e) => setPasswordRequireNumbers(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
                />
                Exigir Números
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border">
                <input
                  type="checkbox"
                  checked={passwordRequireSymbols}
                  onChange={(e) => setPasswordRequireSymbols(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
                />
                Exigir Símbolos
              </label>
            </div>
          </div>
        )}

        {/* PESTAÑA: RESPALDOS & SMTP */}
        {activeTab === "integrations" && (
          <div className="space-y-4">
            
            {/* Sección de Backups */}
            <div className="space-y-3 pb-4 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Database size={18} className="text-primary" />
                Respaldo de Base de Datos
              </h3>
              <p className="text-xs text-muted-foreground">Genera copias completas en archivo SQL para salvaguardar tu inventario.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="space-y-1.5 flex-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Frecuencia Respaldo Automático</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold"
                  >
                    <option value="MANUAL">Solo Manual</option>
                    <option value="DAILY">Diario (Automático)</option>
                    <option value="WEEKLY">Semanal (Automático)</option>
                  </select>
                </div>
              </div>

              {/* Extra Backup Options based on Frequency */}
              {(backupFrequency === "DAILY" || backupFrequency === "WEEKLY") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 animate-in fade-in zoom-in-95">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Hora del Respaldo</label>
                    <input
                      type="time"
                      value={backupTime}
                      onChange={(e) => setBackupTime(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold"
                    />
                  </div>
                  
                  {backupFrequency === "WEEKLY" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Día de la Semana</label>
                      <select
                        value={backupDay}
                        onChange={(e) => setBackupDay(Number(e.target.value))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none font-bold"
                      >
                        <option value={1}>Lunes</option>
                        <option value={2}>Martes</option>
                        <option value={3}>Miércoles</option>
                        <option value={4}>Jueves</option>
                        <option value={5}>Viernes</option>
                        <option value={6}>Sábado</option>
                        <option value={7}>Domingo</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5 lg:col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Ruta de Guardado (Local/Servidor)</label>
                    <input
                      type="text"
                      value={backupPath}
                      onChange={(e) => setBackupPath(e.target.value)}
                      placeholder="/var/backups o C:\backups"
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {role === 'SUPERADMIN' && (
                  <div className="flex flex-col gap-2 bg-muted/20 p-3 rounded-xl border border-border mt-2 sm:mt-0 col-span-2 sm:col-span-1 text-xs">
                    <p className="font-bold text-foreground">Selección de Base de Datos</p>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="backupType" 
                        value="shared" 
                        checked={backupType === 'shared'} 
                        onChange={() => setBackupType('shared')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground font-medium">Base Compartida (Todos los inquilinos)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="backupType" 
                        value="dedicated" 
                        checked={backupType === 'dedicated'} 
                        onChange={() => setBackupType('dedicated')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-muted-foreground font-medium">Base Dedicada (Específica)</span>
                    </label>
                    {backupType === 'dedicated' && (
                      <select
                        value={backupCompanyId}
                        onChange={(e) => setBackupCompanyId(e.target.value)}
                        className="w-full bg-card border border-border rounded-md px-2 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="">-- Seleccionar Empresa --</option>
                        {dedicatedCompanies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="flex justify-end self-end col-span-2 sm:col-span-1 mt-3 sm:mt-0">
                  <button
                    type="button"
                    onClick={triggerManualBackup}
                    className="bg-secondary/15 hover:bg-secondary/25 border border-border font-bold text-foreground px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 h-[42px] transition active:scale-95 shadow-sm whitespace-nowrap"
                  >
                    <DownloadCloud size={16} />
                    Generar Respaldo Ahora
                  </button>
                </div>
              </div>
            </div>

            {/* Configuración de Notificaciones Internas */}
            <div className="space-y-3 pb-4 border-b border-border/60">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                Centro de Notificaciones
              </h3>
              <div className="flex items-center justify-between p-4 border border-border/80 bg-muted/10 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-foreground">Habilitar notificaciones del sistema</p>
                  <p className="text-xs text-muted-foreground">Muestra alertas sobre ventas, compras, y estado de los respaldos para los administradores.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableNotifications}
                  onChange={(e) => setEnableNotifications(e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted rounded border-border focus:ring-primary"
                />
              </div>
            </div>

            {/* Configuración SMTP */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Mail size={18} className="text-primary" />
                Servidor de Correo Saliente (SMTP)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Host SMTP</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="smtp.mailgun.org o smtp.gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Puerto</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="e.g. 587 o 465"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Usuario SMTP</label>
                  <input
                    type="text"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="tu-correo@servidor.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Contraseña SMTP</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: FACTURACIÓN PERSONALIZADA */}
        {activeTab === "invoice" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Receipt size={18} className="text-primary" />
                Personalización de Facturas
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Define la apariencia visual y la información legal que se reflejará en tus facturas en PDF e imágenes.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={invoiceCompanyName}
                    onChange={(e) => setInvoiceCompanyName(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. GNS SarriaTech S.A.S."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">NIT de la Empresa</label>
                  <input
                    type="text"
                    value={invoiceNit}
                    onChange={(e) => setInvoiceNit(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. 900.123.456-7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Dirección física</label>
                  <input
                    type="text"
                    value={invoiceAddress}
                    onChange={(e) => setInvoiceAddress(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. Calle 95 #14-60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Teléfono de contacto</label>
                  <input
                    type="text"
                    value={invoicePhone}
                    onChange={(e) => setInvoicePhone(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. +57 312 444 5566"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Correo electrónico</label>
                  <input
                    type="email"
                    value={invoiceEmail}
                    onChange={(e) => setInvoiceEmail(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. contacto@empresa.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Sitio Web (Página web)</label>
                  <input
                    type="url"
                    value={invoiceWebsite}
                    onChange={(e) => setInvoiceWebsite(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. https://empresa.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Resolución de Facturación (DIAN o Equivalente)</label>
                  <input
                    type="text"
                    value={invoiceResolutionText}
                    onChange={(e) => setInvoiceResolutionText(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. Resolución DIAN No. 123456789 de 2026/01/01 al 2027/01/01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/60 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Color Principal (Encabezados)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={invoicePrimaryColor}
                      onChange={(e) => setInvoicePrimaryColor(e.target.value)}
                      className="w-12 h-10 border border-border rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={invoicePrimaryColor}
                      onChange={(e) => setInvoicePrimaryColor(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Color Secundario (Detalles)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={invoiceSecondaryColor}
                      onChange={(e) => setInvoiceSecondaryColor(e.target.value)}
                      className="w-12 h-10 border border-border rounded-xl cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={invoiceSecondaryColor}
                      onChange={(e) => setInvoiceSecondaryColor(e.target.value)}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">URL del Logotipo (Imagen)</label>
                  <input
                    type="text"
                    value={invoiceLogo}
                    onChange={(e) => setInvoiceLogo(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                    placeholder="Ej. https://empresa.com/logo.png"
                  />
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border/60 pt-4">
                <label className="text-xs font-bold text-muted-foreground uppercase">Texto al Pie de la Factura</label>
                <textarea
                  value={invoiceFooterText}
                  onChange={(e) => setInvoiceFooterText(e.target.value)}
                  rows={3}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  placeholder="Ej. Gracias por elegirnos. Este documento es un soporte equivalente de venta."
                />
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: IMPORTACIÓN MASIVA */}
        {activeTab === "imports" && (
          <ImportsManager />
        )}


        {/* ── Botón Guardar Flotante en el Pie ── */}
        <div className="border-t border-border/60 pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 active:scale-95 transition flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
      )}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Star,
  Crown,
  Send,
  Check,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  X,
  Zap,
  Lock,
  CreditCard,
  Building2,
  Sparkles,
  Network,
  HelpCircle,
} from "lucide-react";
import { errorAlert, successAlert } from "@/lib/sweetalert";
import { signIn, getSession } from "next-auth/react";

export function InteractivePricing({
  planSettings = {},
  allModules = [],
}: {
  planSettings?: any;
  allModules?: any[];
}) {
  const boldContainerRef = useRef<HTMLDivElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [step, setStep] = useState<"SELECT_PLAN" | "REGISTER" | "CHECKOUT">("SELECT_PLAN");
  const [authMode, setAuthMode] = useState<"REGISTER" | "LOGIN">("REGISTER");

  // Ciclo de facturación: Mensual o Anual
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");

  // Categoría de planes: Estándar (1 Sede) vs Enterprise (Multi-Sedes)
  const [planCategory, setPlanCategory] = useState<"STANDARD" | "ENTERPRISE">("STANDARD");

  const [showComparison, setShowComparison] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  useEffect(() => {
    getSession().then(async (session) => {
      if (session?.user) {
        setUserSession(session.user);

        const isSuperAdmin = (session.user as any)?.role === "SUPERADMIN";
        const isSuspended = (session.user as any)?.companyStatus !== "ACTIVE";

        if (!isSuperAdmin && isSuspended) {
          const alreadyShown = sessionStorage.getItem("gns_welcome_plan_alert_shown");
          if (!alreadyShown) {
            sessionStorage.setItem("gns_welcome_plan_alert_shown", "true");
            const Swal = (await import("sweetalert2")).default;
            await Swal.fire({
              icon: "info",
              title: "¡Bienvenido a GNS SarriaTech!",
              text: "Tu registro se ha completado exitosamente. Para activar tu sistema e ingresar al Dashboard, por favor selecciona tu plan de licencia y completa el pago.",
              confirmButtonText: "Elegir mi Plan",
              confirmButtonColor: "#dc2626",
              allowOutsideClick: false,
            });
          }
        }
      }
    });
  }, []);

  // Planes Estándar (1 Sede)
  const standardPlans = [
    {
      id: "BASIC",
      name: "Plan Básico",
      badge: "Negocios Pequeños",
      monthlyPrice: Number(planSettings?.plan_basico_price) || 49000,
      annualPrice: Math.round((Number(planSettings?.plan_basico_price) || 49000) * 10), // 2 meses gratis
      subtitle: "Para emprendedores que inician su control",
      maxBranchesText: "1 Sede Principal",
      shortFeatures: [
        "Hasta 2 Usuarios concurrentes",
        "Catálogo hasta 300 Productos",
        "1 Sede Principal de Operación",
        "Gestión de Stock, Precios y Ventas",
        "Módulo de Clientes y Cobros",
        "Soporte Estándar por Correo",
      ],
      recommended: false,
    },
    {
      id: "INTERMEDIATE",
      name: "Plan Intermedio",
      badge: "MÁS POPULAR",
      monthlyPrice: Number(planSettings?.plan_intermedio_price) || 89000,
      annualPrice: Math.round((Number(planSettings?.plan_intermedio_price) || 89000) * 10), // 2 meses gratis
      subtitle: "Para negocios consolidados en crecimiento",
      maxBranchesText: "1 Sede Principal",
      shortFeatures: [
        "Hasta 5 Usuarios con control de roles",
        "Catálogo hasta 1.000 Productos",
        "1 Sede Principal de Operación",
        "Control WMS Multibodega & Traslados",
        "Módulo de Gastos, Compras y Proveedores",
        "Alertas Inteligentes de Vencimiento y Stock",
        "Soporte Prioritario",
      ],
      recommended: true,
    },
    {
      id: "PREMIUM",
      name: "Plan Premium",
      badge: "MÁXIMO CONTROL",
      monthlyPrice: Number(planSettings?.plan_premium_price) || 129000,
      annualPrice: Math.round((Number(planSettings?.plan_premium_price) || 129000) * 10), // 2 meses gratis
      subtitle: "Sin límites para empresas de alto rendimiento",
      maxBranchesText: "1 Sede Principal",
      shortFeatures: [
        "Usuarios y Colaboradores ILIMITADOS",
        "Productos e Inventario ILIMITADO",
        "1 Sede Principal de Operación",
        "Punto de Venta POS Rápido e Impresión",
        "Facturación Electrónica DIAN Integrada",
        "Módulos CRM, RRHH y Finanzas",
        "Asistente IA Groq & Métricas Avanzadas",
        "Soporte VIP 24/7",
      ],
      recommended: false,
    },
  ];

  // Planes Enterprise Multi-Sedes
  const enterprisePlans = [
    {
      id: "ENTERPRISE_2",
      name: "Enterprise (2 Sedes)",
      badge: "DUAL STORE",
      monthlyPrice: 299000,
      annualPrice: 2990000, // 2 meses gratis
      subtitle: "Para negocios con 2 puntos de venta o sucursales",
      maxBranchesText: "Hasta 2 Sedes Activas",
      shortFeatures: [
        "Hasta 2 Sedes / Sucursales Activas",
        "Usuarios y Empleados ILIMITADOS",
        "Inventario y Catálogo ILIMITADO",
        "Tablero Consolidado Multi-Sedes en Tiempo Real",
        "Aislamiento o Replicación de Productos",
        "Traslados directos entre sucursales",
        "Facturación independiente por sede",
      ],
      recommended: false,
    },
    {
      id: "ENTERPRISE_5",
      name: "Enterprise (5 Sedes)",
      badge: "RECOMENDADO MULTI-SEDES",
      monthlyPrice: 499000,
      annualPrice: 4990000, // 2 meses gratis
      subtitle: "Para redes comerciales y cadenas de sucursales",
      maxBranchesText: "Hasta 5 Sedes Activas",
      shortFeatures: [
        "Hasta 5 Sedes / Sucursales Activas",
        "Usuarios y Empleados ILIMITADOS",
        "Inventario y Catálogo ILIMITADO",
        "Ranking de Sedes Líderes en Ventas",
        "Comparativas gráficas de facturación",
        "Navegación fluida de sedes para Administradores",
        "Auditoría y trazabilidad por sucursal",
        "Soporte Enterprise VIP Prioritario",
      ],
      recommended: true,
    },
    {
      id: "ENTERPRISE_10",
      name: "Enterprise (10 Sedes)",
      badge: "ALTA ESCALA",
      monthlyPrice: 799000,
      annualPrice: 7990000, // 2 meses gratis
      subtitle: "Para empresas con amplia cobertura regional",
      maxBranchesText: "Hasta 10 Sedes Activas",
      shortFeatures: [
        "Hasta 10 Sedes / Sucursales Activas",
        "Usuarios y Empleados ILIMITADOS",
        "Inventario y Catálogo ILIMITADO",
        "Consolidado global SaaS + Vista Empresa",
        "Control WMS avanzado por bodega y sede",
        "Permisos jerárquicos por sede o globales",
        "Reportes contables y financieros por sucursal",
        "Gerente de Cuenta Asignado",
      ],
      recommended: false,
    },
    {
      id: "ENTERPRISE_UNLIMITED",
      name: "Enterprise Ilimitado",
      badge: "CORPORATIVO TOTAL",
      monthlyPrice: 1199000,
      annualPrice: 11990000, // 2 meses gratis
      subtitle: "Para grandes franquicias y cadenas a nivel nacional",
      maxBranchesText: "Sedes ILIMITADAS",
      shortFeatures: [
        "Sedes y Puntos de Venta ILIMITADOS",
        "Usuarios y Operaciones ILIMITADAS",
        "Inventario y Productos ILIMITADOS",
        "Arquitectura dedicada de alto rendimiento",
        "Conectores y API personalizada",
        "Capacitación empresarial a equipos",
        "SLA de disponibilidad 99.9% garantizado",
        "Soporte 24/7 con Ingeniero Dedicado",
      ],
      recommended: false,
    },
  ];

  const currentDisplayPlans = planCategory === "STANDARD" ? standardPlans : enterprisePlans;

  const startCheckoutProcess = async (plan: any, isPreLoggedIn = false) => {
    const finalPrice = billingCycle === "ANNUAL" ? plan.annualPrice : plan.monthlyPrice;
    const planWithSelectedPrice = {
      ...plan,
      price: finalPrice,
      billingCycle,
    };

    setSelectedPlan(planWithSelectedPrice);
    setLoading(true);

    const session = await getSession();
    const activeUser = session?.user || userSession;

    if (isPreLoggedIn || activeUser) {
      if (session?.user) setUserSession(session.user);
      setStep("CHECKOUT");
      await generateOrderAndShowBold(planWithSelectedPrice);
    } else {
      setStep("REGISTER");
    }
    setLoading(false);
  };

  const generateOrderAndShowBold = async (plan: any) => {
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
          billingCycle: plan.billingCycle || billingCycle,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        injectBoldScript(data.orderId, data.hash, data.amountStr, plan);
      } else {
        errorAlert("Error", data.message || "Error al crear la orden de pago");
        setStep("SELECT_PLAN");
      }
    } catch (e) {
      errorAlert("Error", "Error de conexión al generar la orden de pago");
      setStep("SELECT_PLAN");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setLoading(true);

    try {
      if (authMode === "REGISTER") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            planId: selectedPlan.id,
            amount: selectedPlan.price,
            billingCycle: selectedPlan.billingCycle || billingCycle,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          successAlert("Registro Exitoso", "Procediendo a la pasarela de pagos segura...");
          await signIn("credentials", {
            redirect: false,
            email: formData.email,
            password: formData.password,
          });
          setStep("CHECKOUT");
          injectBoldScript(data.orderId, data.hash, data.amountStr);
        } else {
          errorAlert("Error", data.message || "Error al registrar la cuenta");
        }
      } else {
        const result = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (result?.error) {
          errorAlert("Error", "Credenciales incorrectas");
        } else {
          successAlert("Sesión Iniciada", "Procediendo al pago seguro...");
          const session = await getSession();
          if (session?.user) {
            setUserSession(session.user);
            setStep("CHECKOUT");
            await generateOrderAndShowBold(selectedPlan);
          }
        }
      }
    } catch (error) {
      errorAlert("Error", "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const injectBoldScript = (orderId: string, hash: string, amountStr: string, planToPay?: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gns_checkout_origin", window.location.origin);
    }
    setTimeout(() => {
      if (!boldContainerRef.current) return;
      boldContainerRef.current.innerHTML = "";

      const script = document.createElement("script");
      script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
      script.setAttribute("data-bold-button", "");
      script.setAttribute(
        "data-api-key",
        process.env.NEXT_PUBLIC_BOLD_API_KEY || "nQW8_xd1GDkl2AjvVHUl_pWo6anZyRTMQ-OYy0TSDUU"
      );

      // Bold Payment Button valida estrictamente que data-redirection-url sea una URL válida con protocolo HTTPS y TLD público.
      // 'http://localhost:3000/...' es rechazado por el validador de Bold porque localhost no posee TLD y usa HTTP.
      let redirectUrl = process.env.NEXT_PUBLIC_BOLD_REDIRECT_URL;

      if (!redirectUrl) {
        const isLocalhost =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            !window.location.hostname.includes("."));

        if (isLocalhost) {
          // En entorno local (localhost), usamos la URL HTTPS pública con ?origin= para que el resultado devuelva al usuario a localhost.
          const publicBase = process.env.NEXT_PUBLIC_APP_URL || "https://gns.sarriatech.tech";
          redirectUrl = `${publicBase}/pagos/resultado?origin=${encodeURIComponent(window.location.origin)}`;
        } else {
          redirectUrl = `${window.location.origin}/pagos/resultado`;
        }
      }

      script.setAttribute("data-redirection-url", redirectUrl);
      script.setAttribute("data-render-mode", "embedded");
      script.setAttribute("data-amount", amountStr);
      script.setAttribute("data-currency", "COP");
      script.setAttribute("data-order-id", orderId);
      script.setAttribute("data-integrity-signature", hash);

      boldContainerRef.current.appendChild(script);
    }, 100);
  };

  return (
    <section id="planes" className="py-20 sm:py-28 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="max-w-[1320px] mx-auto">
        {step === "SELECT_PLAN" && (
          <>
            {/* Header del Título */}
            <div className="text-center mb-10 sm:mb-14 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
                <Sparkles size={14} />
                Planes Flexibles, Escalables y Transparentes
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Elige el plan ideal para tu negocio
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Desde pequeños comercios hasta cadenas y franquicias multi-sede. Sin contratos de permanencia ni costos ocultos.
              </p>
            </div>

            {/* Selector de Categoría (Estándar vs Enterprise Multi-Sedes) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              <div className="p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl border border-slate-300/80 dark:border-slate-700 flex items-center shadow-inner">
                <button
                  type="button"
                  onClick={() => setPlanCategory("STANDARD")}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                    planCategory === "STANDARD"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Building2 size={16} className={planCategory === "STANDARD" ? "text-blue-600" : ""} />
                  <span>Planes Estándar (1 Sede)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanCategory("ENTERPRISE")}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                    planCategory === "ENTERPRISE"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Network size={16} />
                  <span>Planes Enterprise (Multi-Sedes)</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/20 text-white hidden sm:inline">
                    NUEVO
                  </span>
                </button>
              </div>
            </div>

            {/* Selector de Ciclo de Facturación (Mensual vs Anual con 2 meses gratis) */}
            <div className="flex items-center justify-center gap-3 mb-10 sm:mb-12">
              <span className={`text-xs sm:text-sm font-bold ${billingCycle === "MONTHLY" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                Facturación Mensual
              </span>

              <button
                type="button"
                onClick={() => setBillingCycle((prev) => (prev === "MONTHLY" ? "ANNUAL" : "MONTHLY"))}
                className="relative w-14 h-8 bg-slate-300 dark:bg-slate-700 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="Alternar ciclo de facturación"
              >
                <div
                  className={`w-6 h-6 bg-blue-600 rounded-full shadow-md transform transition-transform duration-300 ${
                    billingCycle === "ANNUAL" ? "translate-x-6 bg-emerald-500" : "translate-x-0"
                  }`}
                />
              </button>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-bold ${billingCycle === "ANNUAL" ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  Facturación Anual
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse shadow-sm">
                  🎁 2 MESES GRATIS
                </span>
              </div>
            </div>

            {/* Grid de Tarjetas de Planes */}
            <div
              className={`grid gap-6 items-stretch mx-auto ${
                planCategory === "STANDARD"
                  ? "grid-cols-1 md:grid-cols-3 max-w-5xl"
                  : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4 max-w-7xl"
              }`}
            >
              {currentDisplayPlans.map((plan) => {
                const isAnnual = billingCycle === "ANNUAL";
                const displayMonthlyEquivalent = isAnnual
                  ? Math.round(plan.annualPrice / 12)
                  : plan.monthlyPrice;
                const savings = plan.monthlyPrice * 12 - plan.annualPrice;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-7 border transition-all duration-300 hover:shadow-xl ${
                      plan.recommended
                        ? "border-amber-500 dark:border-amber-500 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20 lg:-translate-y-2"
                        : "border-slate-200 dark:border-slate-800 shadow-sm"
                    }`}
                  >
                    {/* Badge Superior */}
                    {plan.recommended && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10.5px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                        {plan.badge}
                      </div>
                    )}

                    <div>
                      {/* Cabecera del Plan */}
                      <div className="flex items-center justify-between mb-3 pt-2">
                        <div>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {plan.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {plan.subtitle}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shrink-0">
                          {planCategory === "ENTERPRISE" ? (
                            <Network size={22} className="text-blue-500" />
                          ) : plan.name.includes("Premium") ? (
                            <Crown size={22} className="text-amber-500" />
                          ) : plan.recommended ? (
                            <Star size={22} className="text-amber-500 fill-amber-500" />
                          ) : (
                            <Send size={22} className="text-blue-500" />
                          )}
                        </div>
                      </div>

                      {/* Badge de Sedes */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-800 dark:text-slate-200 mb-5">
                        <Building2 size={13} className="text-primary" />
                        <span>{plan.maxBranchesText}</span>
                      </div>

                      {/* Precio */}
                      <div className="mb-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            ${displayMonthlyEquivalent.toLocaleString("es-CO")}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                            COP /mes
                          </span>
                        </div>

                        {isAnnual ? (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              Facturado anualmente: ${plan.annualPrice.toLocaleString("es-CO")} COP
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Ahorras ${savings.toLocaleString("es-CO")} COP al año
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Facturación mensual sin permanencia
                          </p>
                        )}
                      </div>

                      {/* Lista de Características */}
                      <ul className="space-y-2.5 mb-6 text-left">
                        {plan.shortFeatures.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} strokeWidth={3} />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botón de Selección */}
                    <button
                      type="button"
                      onClick={() => startCheckoutProcess(plan)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-md ${
                        plan.recommended
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-lg"
                          : planCategory === "ENTERPRISE"
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-lg"
                          : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>Comenzar con {plan.name}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── BANNER DESTACADO DE MÉTODOS DE PAGO CON PSE ── */}
            <div className="mt-14 sm:mt-16 p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center lg:text-left max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Pasarela 100% Segura y Certificada
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Paga fácil y rápido con PSE y todos los métodos de pago en Colombia
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Aceptamos transferencias directas con <strong>PSE</strong> (cualquier banco nacional), Tarjetas de Crédito, Débito, <strong>Nequi</strong>, <strong>Botón Bancolombia</strong> y efectivo mediante la pasarela líder <strong>Bold</strong>.
                  </p>
                </div>

                {/* Badges de Medios de Pago */}
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 shrink-0">
                  <div className="px-3.5 py-2 rounded-2xl bg-white text-slate-950 font-black text-xs sm:text-sm border border-slate-200 shadow-md flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>PSE</span>
                  </div>

                  <div className="px-3.5 py-2 rounded-2xl bg-white text-slate-950 font-black text-xs sm:text-sm border border-slate-200 shadow-md flex items-center gap-1.5">
                    <CreditCard size={14} className="text-blue-600" />
                    <span>Tarjetas Débito / Crédito</span>
                  </div>

                  <div className="px-3.5 py-2 rounded-2xl bg-white text-slate-950 font-black text-xs sm:text-sm border border-slate-200 shadow-md flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span>Nequi</span>
                  </div>

                  <div className="px-3.5 py-2 rounded-2xl bg-white text-slate-950 font-black text-xs sm:text-sm border border-slate-200 shadow-md flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Bancolombia</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Ver Comparativa Completa */}
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => setShowComparison(true)}
                className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm border-2 border-slate-900 dark:border-white py-3 px-8 rounded-full hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              >
                <span>Ver comparativa completa de todos los planes</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* Modal / Paso 2: Registro de Usuario y Empresa */}
        {step === "REGISTER" && selectedPlan && (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("SELECT_PLAN")}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 transition"
                  title="Volver a los planes"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {authMode === "REGISTER" ? `Crea tu cuenta (${selectedPlan.name})` : "Iniciar Sesión"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPlan.billingCycle === "ANNUAL" ? "Facturación Anual con 2 Meses Gratis" : "Facturación Mensual"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setAuthMode("REGISTER")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  authMode === "REGISTER"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                Nueva Empresa
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("LOGIN")}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  authMode === "LOGIN"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                Ya tengo cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === "REGISTER" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nombre de la Empresa o Negocio
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Distribuidora Central S.A.S."
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Nombre del Administrador
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@tuempresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres (letras, números y símbolos)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Resumen del Monto a Pagar */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Plan seleccionado:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base font-black pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white">Total a Pagar:</span>
                  <span className="text-blue-600 dark:text-blue-400">${selectedPlan.price.toLocaleString("es-CO")} COP</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Aceptamos PSE, Tarjetas Débito/Crédito y Nequi a través de Bold.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full p-4 mt-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm flex justify-center items-center gap-2 disabled:opacity-70 transition-all shadow-lg active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : authMode === "REGISTER" ? (
                  "Registrarse y Proceder al Pago Seguro"
                ) : (
                  "Iniciar Sesión y Pagar"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Paso 3: Checkout con Bold (Integración PSE, Tarjetas, Nequi) */}
        {step === "CHECKOUT" && (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-[480px] mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-inner">
                <ShieldCheck size={36} className="text-emerald-500" strokeWidth={2.5} />
              </div>
            </div>

            <h3 className="text-2xl font-black mb-1.5 text-slate-900 dark:text-white">
              {userSession ? "¡Sesión Verificada!" : "¡Registro Completado!"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 max-w-sm mx-auto">
              Realiza tu pago seguro a continuación para activar tu cuenta de inmediato.
            </p>

            {/* Resumen del Plan */}
            {selectedPlan && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 mb-5 text-left">
                <div>
                  <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider block">
                    Plan Seleccionado
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {selectedPlan.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {selectedPlan.billingCycle === "ANNUAL" ? "Facturación Anual (2 Meses Gratis)" : "Facturación Mensual"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                    ${selectedPlan.price.toLocaleString("es-CO")}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                    COP Total
                  </span>
                </div>
              </div>
            )}

            {/* Métodos de Pago Disponibles en Pasarela Bold */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 mb-5 text-center space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                <Lock size={12} className="text-emerald-500" />
                Medios Aceptados en Pasarela Bold:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-black text-slate-700 dark:text-slate-300">
                <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  PSE (Todos los Bancos)
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  Tarjetas Crédito/Débito
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  Nequi & Bancolombia
                </span>
              </div>
            </div>

            {/* Bold Payment Button Container */}
            <div className="w-full mb-4 flex justify-center min-h-[52px]">
              <div
                ref={boldContainerRef}
                className="w-full flex justify-center [&_iframe]:!w-full [&_button]:!w-full [&_button]:!max-w-none [&_button]:!h-[52px] [&_button]:!rounded-2xl [&_.bold-btn]:!w-full"
              ></div>
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep("SELECT_PLAN");
                if (boldContainerRef.current) boldContainerRef.current.innerHTML = "";
              }}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} />
              Volver y cambiar de plan
            </button>
          </div>
        )}

        {/* Modal Comparativa Completa */}
        {showComparison && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Comparativa Completa de Planes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Estándar (1 Sede) y Enterprise Multi-Sedes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComparison(false)}
                  className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-500 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-auto p-4 sm:p-6 space-y-6">
                {/* Tabla Estándar */}
                <div>
                  <h4 className="text-sm font-black uppercase text-primary mb-3">
                    Planes Estándar (1 Sede Principal)
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white">
                        <tr>
                          <th className="p-3">Característica</th>
                          <th className="p-3 text-center">Básico</th>
                          <th className="p-3 text-center text-amber-500">Intermedio ⭐</th>
                          <th className="p-3 text-center text-blue-500">Premium 👑</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <td className="p-3 font-bold">Límite Usuarios</td>
                          <td className="p-3 text-center">2 Usuarios</td>
                          <td className="p-3 text-center">5 Usuarios</td>
                          <td className="p-3 text-center font-bold text-emerald-500">Ilimitados</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Límite Productos</td>
                          <td className="p-3 text-center">300 Referencias</td>
                          <td className="p-3 text-center">1.000 Referencias</td>
                          <td className="p-3 text-center font-bold text-emerald-500">Ilimitados</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Sedes Permitidas</td>
                          <td className="p-3 text-center">1 Sede</td>
                          <td className="p-3 text-center">1 Sede</td>
                          <td className="p-3 text-center">1 Sede</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">WMS Multibodega</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">POS & Facturación DIAN</td>
                          <td className="p-3 text-center text-slate-400">Básico</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Avanzado</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Asistente IA Groq</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                          <td className="p-3 text-center text-slate-400">—</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Completo</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla Enterprise */}
                <div>
                  <h4 className="text-sm font-black uppercase text-blue-600 dark:text-blue-400 mb-3">
                    Planes Enterprise (Multi-Sedes Corporativo)
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white">
                        <tr>
                          <th className="p-3">Característica</th>
                          <th className="p-3 text-center">2 Sedes</th>
                          <th className="p-3 text-center text-blue-500">5 Sedes ⭐</th>
                          <th className="p-3 text-center">10 Sedes</th>
                          <th className="p-3 text-center text-indigo-500">Ilimitadas 👑</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        <tr>
                          <td className="p-3 font-bold">Sedes Incluidas</td>
                          <td className="p-3 text-center font-bold">2 Sedes</td>
                          <td className="p-3 text-center font-bold text-blue-500">5 Sedes</td>
                          <td className="p-3 text-center font-bold">10 Sedes</td>
                          <td className="p-3 text-center font-bold text-emerald-500">ILIMITADAS</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Usuarios & Productos</td>
                          <td className="p-3 text-center text-emerald-500 font-bold">Ilimitados</td>
                          <td className="p-3 text-center text-emerald-500 font-bold">Ilimitados</td>
                          <td className="p-3 text-center text-emerald-500 font-bold">Ilimitados</td>
                          <td className="p-3 text-center text-emerald-500 font-bold">Ilimitados</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Consolidado Multi-Sedes</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Navegación entre Sedes</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                          <td className="p-3 text-center font-bold text-emerald-500">✔ Sí</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">Soporte y Asesoría</td>
                          <td className="p-3 text-center">Prioritario</td>
                          <td className="p-3 text-center font-bold text-blue-500">VIP 24/7</td>
                          <td className="p-3 text-center font-bold">Gerente de Cuenta</td>
                          <td className="p-3 text-center font-bold text-emerald-500">Ingeniero Dedicado</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                <button
                  type="button"
                  onClick={() => setShowComparison(false)}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs sm:text-sm transition"
                >
                  Cerrar Comparativa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

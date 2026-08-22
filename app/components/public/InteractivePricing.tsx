"use client";

import React, { useState, useRef, useEffect } from "react";
import { Star, Crown, Send, Check, CheckCircle, ArrowRight, ArrowLeft, Loader2, ShieldCheck, X, Zap, Lock, CreditCard } from "lucide-react";
import { errorAlert, successAlert } from "@/lib/sweetalert";
import { signIn, getSession } from "next-auth/react";

export function InteractivePricing({ planSettings = {}, allModules = [] }: { planSettings?: any, allModules?: any[] }) {
  const boldContainerRef = useRef<HTMLDivElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [step, setStep] = useState<"SELECT_PLAN" | "REGISTER" | "CHECKOUT">("SELECT_PLAN");
  const [authMode, setAuthMode] = useState<"REGISTER" | "LOGIN">("REGISTER");

  // Dynamically build the plans based on the global settings
  const buildFeatures = (planId: string) => {
    const rawPlanId = planId.toLowerCase();
    const maxUsers = planSettings[`plan_${rawPlanId}_max_users`] || (rawPlanId === 'premium' ? '999' : rawPlanId === 'intermedio' ? '5' : '2');
    const maxProducts = planSettings[`plan_${rawPlanId}_max_products`] || (rawPlanId === 'premium' ? '999999' : rawPlanId === 'intermedio' ? '1000' : '100');
    const maxSales = planSettings[`plan_${rawPlanId}_max_sales_per_month`] || (rawPlanId === 'premium' ? '999999' : rawPlanId === 'intermedio' ? '999999' : '999999');

    let modulesList: string[] = [];
    if (planSettings[`plan_${rawPlanId}_modules`]) {
      try {
        const moduleIds: number[] = JSON.parse(planSettings[`plan_${rawPlanId}_modules`]);
        modulesList = allModules.filter(m => moduleIds.includes(m.id)).map(m => m.name);
      } catch (e) {
        modulesList = allModules.map(m => m.name);
      }
    } else {
      if (rawPlanId === 'basico') {
        modulesList = allModules.filter(m => ['Dashboard', 'Productos', 'Categorías', 'Grupos'].includes(m.name)).map(m => m.name);
      } else if (rawPlanId === 'intermedio') {
        modulesList = allModules.filter(m => !['CRM', 'RRHH', 'Auditoría', 'Reportes'].includes(m.name)).map(m => m.name);
      } else {
        modulesList = allModules.map(m => m.name);
      }
    }

    const limits = [
      `Hasta ${maxUsers} Usuarios`,
      `Hasta ${maxProducts} Productos`,
      maxSales === '999999' ? `Ventas ilimitadas` : `Hasta ${maxSales} Ventas por mes`
    ];

    return [...limits, ...modulesList];
  };

  const buildShortFeatures = (planId: string) => {
    const rawPlanId = planId.toLowerCase();
    const maxUsers = planSettings[`plan_${rawPlanId}_max_users`] || (rawPlanId === 'premium' ? '999' : rawPlanId === 'intermedio' ? '5' : '2');
    const maxProducts = planSettings[`plan_${rawPlanId}_max_products`] || (rawPlanId === 'premium' ? '999999' : rawPlanId === 'intermedio' ? '1000' : '100');
    const maxSales = planSettings[`plan_${rawPlanId}_max_sales_per_month`] || (rawPlanId === 'premium' ? '999999' : rawPlanId === 'intermedio' ? '999999' : '50');

    let base = [
      maxUsers === '999' ? "Usuarios Ilimitados" : `Hasta ${maxUsers} Usuarios`,
      maxProducts === '999999' ? "Inventario Ilimitado" : `Inventario (${maxProducts} productos)`,
      maxSales === '999999' ? "Ventas Ilimitadas" : `Ventas (${maxSales}/mes)`
    ];

    if (rawPlanId === 'basico') {
      base.push("Soporte por Email", "Actualizaciones estándar");
    } else if (rawPlanId === 'intermedio') {
      base.push("Control de Gastos y Compras", "Soporte Prioritario");
    } else if (rawPlanId === 'premium') {
      base.push("Facturación Electrónica DIAN", "Reportes Avanzados e IA", "Soporte VIP 24/7");
    }
    return base;
  };

  const dynamicPlans = [
    {
      id: "basico",
      name: "Plan Básico",
      price: Number(planSettings?.plan_basico_price) || 49999,
      shortFeatures: buildShortFeatures("basico"),
      features: buildFeatures("basico"),
      recommended: false
    },
    {
      id: "intermedio",
      name: "Plan Intermedio",
      price: Number(planSettings?.plan_intermedio_price) || 89999,
      shortFeatures: buildShortFeatures("intermedio"),
      features: buildFeatures("intermedio"),
      recommended: true
    },
    {
      id: "premium",
      name: "Plan Premium",
      price: Number(planSettings?.plan_premium_price) || 129999,
      shortFeatures: buildShortFeatures("premium"),
      features: buildFeatures("premium"),
      recommended: false
    }
  ];

  const [showComparison, setShowComparison] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  useEffect(() => {
    // Verificar si ya hay una sesión activa al cargar
    getSession().then(async session => {
      if (session?.user) {
        setUserSession(session.user);

        const isSuperAdmin = (session.user as any)?.role === 'SUPERADMIN';
        const isSuspended = (session.user as any)?.companyStatus !== 'ACTIVE';

        if (!isSuperAdmin && isSuspended) {
          const alreadyShown = sessionStorage.getItem('gns_welcome_plan_alert_shown');
          if (!alreadyShown) {
            sessionStorage.setItem('gns_welcome_plan_alert_shown', 'true');
            const Swal = (await import('sweetalert2')).default;
            await Swal.fire({
              icon: 'info',
              title: '¡Bienvenido a GNS SarriaTech!',
              text: 'Tu registro se ha completado exitosamente. Para activar tu sistema e ingresar al Dashboard, por favor selecciona tu plan de licencia y completa el pago.',
              confirmButtonText: 'Elegir mi Plan',
              confirmButtonColor: '#dc2626',
              allowOutsideClick: false
            });
          }
        }
      }
    });
  }, []);

  const startCheckoutProcess = async (plan: any, isPreLoggedIn = false) => {
    setSelectedPlan(plan);
    setLoading(true);

    // Obtener la sesión más reciente del usuario
    const session = await getSession();
    const activeUser = session?.user || userSession;

    // Si ya tiene sesión iniciada, pasar directo a la pasarela de pagos
    if (isPreLoggedIn || activeUser) {
      if (session?.user) setUserSession(session.user);
      setStep("CHECKOUT");
      await generateOrderAndShowBold(plan);
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
        body: JSON.stringify({ planId: plan.id, amount: plan.price })
      });
      const data = await res.json();
      if (res.ok) {
        injectBoldScript(data.orderId, data.hash, data.amountStr, plan);
      } else {
        errorAlert("Error", data.message || "Error al crear la orden");
        setStep("SELECT_PLAN");
      }
    } catch (e) {
      errorAlert("Error", "Error de red al generar la orden");
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
            amount: selectedPlan.price
          })
        });

        const data = await res.json();
        if (res.ok) {
          successAlert("Registro Exitoso", "Procediendo a la pasarela de pagos...");
          // Iniciar sesión silenciosamente para mantenerlo conectado tras pagar
          await signIn("credentials", { redirect: false, email: formData.email, password: formData.password });
          setStep("CHECKOUT");
          injectBoldScript(data.orderId, data.hash, data.amountStr);
        } else {
          errorAlert("Error", data.message || "Error al registrar");
        }
      } else {
        // Modo LOGIN
        const result = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password
        });

        if (result?.error) {
          errorAlert("Error", "Credenciales inválidas");
        } else {
          successAlert("Sesión Iniciada", "Procediendo al pago...");
          const session = await getSession();
          if (session?.user) {
            setUserSession(session.user);
            // El usuario ya existe, así que en lugar del endpoint de register, llamamos al nuevo create-order
            setStep("CHECKOUT");
            await generateOrderAndShowBold(selectedPlan);
          }
        }
      }
    } catch (error) {
      errorAlert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const injectBoldScript = (orderId: string, hash: string, amountStr: string, planToPay?: any) => {
    const currentPlan = planToPay || selectedPlan;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gns_checkout_origin', window.location.origin);
    }
    setTimeout(() => {
      if (!boldContainerRef.current) return;
      boldContainerRef.current.innerHTML = "";

      const script = document.createElement("script");
      script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
      script.setAttribute("data-bold-button", "");
      script.setAttribute("data-api-key", process.env.NEXT_PUBLIC_BOLD_API_KEY || "nQW8_xd1GDkl2AjvVHUl_pWo6anZyRTMQ-OYy0TSDUU");
      // Bold exige estrictamente que data-redirection-url sea HTTPS.
      // Si el navegador está en localhost (HTTP), usamos el túnel HTTPS de ngrok activo para que Bold acepte la transacción sin error.
      const isHttps = window.location.protocol === "https:";
      const redirectUrl = isHttps
        ? `${window.location.origin}/pagos/resultado`
        : `https://abroad-glancing-specked.ngrok-free.dev/pagos/resultado`;

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
    <section id="planes" className="py-[120px] px-6 bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-[1280px] mx-auto">

        {step === "SELECT_PLAN" && (
          <>
            <div className="text-center mb-[60px]">
              <span className="inline-block text-red-600 dark:text-red-500 text-[13px] font-extrabold tracking-[0.15em] uppercase mb-4">
                ELIGE EL PLAN PERFECTO PARA TU NEGOCIO
              </span>
              <h2 className="text-[36px] font-black text-slate-900 dark:text-white m-0 tracking-tight">
                Planes simples, poderosos y escalables
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start mx-auto max-w-md md:max-w-4xl xl:max-w-none">
              {dynamicPlans.map((plan) => (
                <div key={plan.id} className={`relative flex flex-col h-full bg-white dark:bg-slate-800 rounded-[20px] p-6 md:p-8 border ${plan.recommended ? 'border-amber-600 dark:border-amber-500 shadow-2xl scale-100 lg:scale-105' : 'border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                  {plan.recommended && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-600 dark:bg-amber-500 text-white text-[11px] font-extrabold py-1.5 text-center rounded-t-[18px] tracking-[0.1em]">
                      MÁS POPULAR
                    </div>
                  )}

                  <div className={`flex items-center gap-3 ${plan.recommended ? 'mt-6' : ''}`}>
                    {plan.recommended ? (
                      <Star size={24} className="text-amber-600 dark:text-amber-500 fill-amber-600 dark:fill-amber-500" />
                    ) : plan.name.includes("Premium") ? (
                      <Crown size={24} className="text-amber-600 dark:text-amber-500 fill-amber-600 dark:fill-amber-500" />
                    ) : (
                      <Send size={24} className="text-red-600 dark:text-red-500 fill-red-600 dark:fill-red-500" />
                    )}
                    <div>
                      <div className="text-[18px] font-black text-slate-900 dark:text-white uppercase">
                        {plan.name.replace('Plan ', '')}
                      </div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                        {plan.recommended ? 'Para negocios en crecimiento' : (plan.name.includes('Premium') ? 'Máximo control, sin límites' : 'Ideal para pequeños negocios')}
                      </div>
                    </div>
                  </div>

                  <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-700 flex items-end gap-1">
                    <span className="text-[36px] font-black text-slate-900 dark:text-white leading-none">
                      ${plan.price.toLocaleString("es-CO")}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-[14px] pb-1">/mes</span>
                  </div>

                  <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mb-6 text-center">
                    Facturado mensual
                  </div>

                  <ul className="m-0 p-0 list-none flex flex-col gap-3 mb-4">
                    {plan.shortFeatures.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-slate-900 dark:text-slate-200 text-[13px] font-semibold">
                        <div className="w-4 h-4 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-[2px]">
                          <Check size={10} className="text-amber-600 dark:text-amber-500" strokeWidth={3} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>



                  {(() => {
                    const isCurrentPlan = userSession?.companyPlan === plan.id;
                    const isSuspended = userSession?.companyStatus === 'SUSPENDED';
                    const currentPlanIndex = dynamicPlans.findIndex(p => p.id === userSession?.companyPlan);
                    const thisPlanIndex = dynamicPlans.findIndex(p => p.id === plan.id);

                    let btnLabel = `Comenzar Plan ${plan.name.replace('Plan ', '')}`;
                    let btnDisabled = false;
                    let isSuspendedAction = false;

                    if (userSession?.companyPlan) {
                      if (isCurrentPlan) {
                        if (isSuspended) {
                          btnLabel = "Pagar Plan";
                          btnDisabled = false;
                          isSuspendedAction = true;
                        } else {
                          btnLabel = "Plan Actual";
                          btnDisabled = true;
                        }
                      } else if (thisPlanIndex < currentPlanIndex) {
                        btnLabel = "Bajar a este plan";
                      } else {
                        btnLabel = "Mejorar a este plan";
                      }
                    }

                    return (
                      <button
                        onClick={() => startCheckoutProcess(plan)}
                        disabled={btnDisabled}
                        className={`w-full py-3.5 rounded-lg font-bold text-[13px] transition-all duration-200 flex items-center justify-center gap-2 ${
                          isCurrentPlan && !isSuspendedAction
                            ? 'bg-emerald-500 text-white border-none cursor-not-allowed opacity-90'
                            : plan.recommended || isSuspendedAction
                              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white border-none shadow-md hover:shadow-lg'
                              : 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                        } ${btnDisabled && !isCurrentPlan ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:scale-100 hover:shadow-none' : ''}`}
                      >
                        {isCurrentPlan && <CheckCircle size={16} />}
                        {btnLabel}
                      </button>
                    );
                  })()}
                </div>
              ))}

              {/* Promo Anual Card */}
              <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-[20px] p-6 md:p-8 border border-slate-200 dark:border-slate-700 justify-center items-center text-center">
                <h3 className="text-[20px] font-black text-amber-600 dark:text-amber-500 mb-6 leading-snug">
                  Ahorra más con<br/>nuestro plan anual
                </h3>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-full w-[120px] h-[120px] flex flex-col items-center justify-center text-amber-600 dark:text-amber-500 mb-6">
                  <span className="text-[40px] font-black leading-none">2</span>
                  <span className="text-[13px] font-extrabold tracking-wide">MESES</span>
                  <span className="text-[13px] font-extrabold tracking-wide">GRATIS</span>
                </div>
                <p className="text-[13px] text-slate-600 dark:text-slate-400 font-semibold mb-8">
                  Pago anual con<br/>descuento especial
                </p>
                <button className="w-full py-3.5 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-[13px] border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  Ver todos los planes anuales <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => setShowComparison(true)}
                className="bg-transparent text-slate-900 dark:text-white font-extrabold text-[15px] border-2 border-slate-900 dark:border-white py-3 px-8 rounded-full hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                Ver comparativa de planes <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === "REGISTER" && selectedPlan && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl mx-auto shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep("SELECT_PLAN")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent text-slate-500 dark:text-slate-400">
                  <ArrowLeft size={20} />
                </button>
                <h3 className="text-2xl font-bold m-0 text-slate-900 dark:text-white">
                  {authMode === "REGISTER" ? `Crea tu cuenta (${selectedPlan.name})` : "Iniciar Sesión"}
                </h3>
              </div>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
              <button
                onClick={() => setAuthMode("REGISTER")}
                className={`flex-1 py-2.5 rounded-lg border-none font-bold text-sm cursor-pointer transition-all ${authMode === "REGISTER" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                Nueva Empresa
              </button>
              <button
                onClick={() => setAuthMode("LOGIN")}
                className={`flex-1 py-2.5 rounded-lg border-none font-bold text-sm cursor-pointer transition-all ${authMode === "LOGIN" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                Ya tengo cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {authMode === "REGISTER" && (
                <>
                  <div>
                    <label className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Nombre de la Empresa</label>
                    <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/50" />
                  </div>
                  <div>
                    <label className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Tu Nombre</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/50" />
                  </div>
                </>
              )}

              <div>
                <label className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Correo Electrónico (Admin)</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/50" />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-700 dark:text-slate-300">Contraseña</label>
                <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/50" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                <div className="flex justify-between font-extrabold text-lg">
                  <span className="text-slate-900 dark:text-slate-200">Total a Pagar Hoy:</span>
                  <span className="text-red-600 dark:text-red-500">${selectedPlan.price.toLocaleString("es-CO")} COP</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full p-4 mt-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold border-none cursor-pointer flex justify-center items-center gap-2 disabled:opacity-70 transition-colors">
                {loading ? <Loader2 className="animate-spin" /> : (authMode === "REGISTER" ? "Registrarse y Proceder al Pago" : "Iniciar Sesión y Pagar")}
              </button>
            </form>
          </div>
        )}

        {step === "CHECKOUT" && (
          <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 md:p-8 border border-slate-100 dark:border-slate-800 shadow-[0_15px_45px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] w-full max-w-[460px] mx-auto text-center">

            {/* Header Icon Shield con destellos decorativos */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="relative flex items-center justify-center">
                {/* Círculo verde claro de fondo */}
                <div className="w-[68px] h-[68px] sm:w-[78px] sm:h-[78px] rounded-full bg-[#e8f7f0] dark:bg-emerald-950/40 flex items-center justify-center shadow-inner">
                  <ShieldCheck size={38} className="text-[#00c073] sm:w-11 sm:h-11" strokeWidth={2.2} />
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-[22px] sm:text-[26px] font-black mb-1 sm:mb-2 text-slate-900 dark:text-white tracking-tight">
              {userSession ? '¡Sesión Detectada!' : '¡Registro Completado!'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4 sm:mb-5 font-normal text-[12.5px] sm:text-[13.5px] leading-relaxed max-w-[380px] mx-auto">
              Por favor, completa tu pago de forma segura a continuación para{' '}
              <span className="text-[#00c073] font-bold">activar tu cuenta</span>{' '}
              inmediatamente.
            </p>

            {/* Selected Plan Details Banner */}
            {selectedPlan && (
              <div className="flex items-center justify-between bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 mb-4 sm:mb-5 text-left shadow-sm">
                <div>
                  <span className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Plan Elegido</span>
                  <span className="text-[15px] sm:text-[16px] font-black text-slate-900 dark:text-white">{selectedPlan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[16px] sm:text-[17px] font-black text-red-600 dark:text-red-500">${selectedPlan.price.toLocaleString("es-CO")}</span>
                  <span className="text-[10px] sm:text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 block">COP / mes</span>
                </div>
              </div>
            )}

            {/* Trust Badges Card Container */}
            <div className="bg-[#f6faf8] dark:bg-slate-800/40 border border-[#e1f0e9] dark:border-slate-700/60 rounded-[16px] sm:rounded-[18px] p-3 sm:p-4 mb-4 sm:mb-5">
              <div className="grid grid-cols-3 divide-x divide-slate-200/70 dark:divide-slate-700/60 text-center">

                {/* Badge 1 */}
                <div className="px-1 sm:px-2 flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d6f3e6] dark:bg-emerald-900/40 flex items-center justify-center mb-1.5">
                    <Zap size={14} className="text-[#00c073] fill-[#00c073] sm:w-[15px] sm:h-[15px]" />
                  </div>
                  <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Activación inmediata</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Accede a tu cuenta al instante</span>
                </div>

                {/* Badge 2 */}
                <div className="px-1 sm:px-2 flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d6f3e6] dark:bg-emerald-900/40 flex items-center justify-center mb-1.5">
                    <Lock size={14} className="text-[#00c073] sm:w-[15px] sm:h-[15px]" />
                  </div>
                  <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Pago 100% seguro</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Tus datos están protegidos</span>
                </div>

                {/* Badge 3 */}
                <div className="px-1 sm:px-2 flex flex-col items-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d6f3e6] dark:bg-emerald-900/40 flex items-center justify-center mb-1.5">
                    <CreditCard size={14} className="text-[#00c073] sm:w-[15px] sm:h-[15px]" />
                  </div>
                  <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-900 dark:text-slate-100 leading-tight">Respaldado por Bold</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Plataforma confiable</span>
                </div>

              </div>
            </div>

            {/* Bold Payment Button Container */}
            <div className="w-full mb-3 sm:mb-4 flex justify-center min-h-[50px]">
              <div
                ref={boldContainerRef}
                className="w-full flex justify-center [&_iframe]:!w-full [&_button]:!w-full [&_button]:!max-w-none [&_button]:!h-[48px] sm:[&_button]:!h-[52px] [&_button]:!rounded-xl sm:[&_button]:!rounded-2xl [&_.bold-btn]:!w-full"
              ></div>
            </div>

            {/* SSL Security Note */}
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#00c073] flex items-center justify-center shrink-0">
                <Check size={10} className="text-white sm:w-3 sm:h-3" strokeWidth={3} />
              </div>
              <div className="text-left leading-tight">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] sm:text-[11.5px]">Pago seguro y encriptado</span>
                <span className="block text-slate-500 dark:text-slate-400 text-[9.5px] sm:text-[10px]">Tus datos están protegidos con encriptación SSL</span>
              </div>
            </div>

            {/* Divider "O si lo prefieres" */}
            <div className="relative my-3 sm:my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80 dark:border-slate-700/80" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] sm:text-[11.5px] text-slate-500 font-medium">O si lo prefieres</span>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setStep("SELECT_PLAN");
                if (boldContainerRef.current) boldContainerRef.current.innerHTML = "";
              }}
              className="w-full max-w-[220px] mx-auto py-2 sm:py-2.5 px-4 bg-white dark:bg-slate-900 text-[#1d2b4f] dark:text-slate-300 border border-[#d8e0ed] dark:border-slate-700 rounded-xl font-bold text-[12px] sm:text-[12.5px] cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowLeft size={14} />
              Volver a los planes
            </button>
          </div>
        )}

        {showComparison && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Comparativa de Planes</h3>
                <button onClick={() => setShowComparison(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={24} className="text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <div className="overflow-auto p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 shadow-sm z-10">
                    <tr>
                      <th className="p-4 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 w-1/4">Característica</th>
                      {dynamicPlans.map(plan => (
                        <th key={plan.id} className={`p-4 font-black text-center border-b border-slate-200 dark:border-slate-700 w-1/4 ${plan.recommended ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                          {plan.name.replace('Plan ', '')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Límites */}
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <td colSpan={4} className="p-3 font-bold text-[13px] text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80">Límites y Capacidades</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">Máximo Usuarios</td>
                      {dynamicPlans.map(plan => {
                        const rawPlanId = plan.id.toLowerCase();
                        const val = planSettings[`plan_${rawPlanId}_max_users`] || (rawPlanId === 'premium' ? '999' : rawPlanId === 'intermedio' ? '5' : '2');
                        return <td key={plan.id} className="p-4 text-center font-medium text-slate-600 dark:text-slate-400">{val === '999' ? 'Ilimitados' : val}</td>;
                      })}
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">Límite Productos</td>
                      {dynamicPlans.map(plan => {
                        const rawPlanId = plan.id.toLowerCase();
                        const val = planSettings[`plan_${rawPlanId}_max_products`] || (rawPlanId === 'premium' ? '999999' : rawPlanId === 'intermedio' ? '1000' : '100');
                        return <td key={plan.id} className="p-4 text-center font-medium text-slate-600 dark:text-slate-400">{val === '999999' ? 'Ilimitados' : val}</td>;
                      })}
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">Ventas al mes</td>
                      {dynamicPlans.map(plan => {
                        const rawPlanId = plan.id.toLowerCase();
                        const val = planSettings[`plan_${rawPlanId}_max_sales_per_month`] || (rawPlanId === 'premium' ? '999999' : rawPlanId === 'intermedio' ? '999999' : '50');
                        return <td key={plan.id} className="p-4 text-center font-medium text-slate-600 dark:text-slate-400">{val === '999999' ? 'Ilimitadas' : val}</td>;
                      })}
                    </tr>

                    {/* Módulos */}
                    <tr className="bg-slate-50 dark:bg-slate-900/50">
                      <td colSpan={4} className="p-3 font-bold text-[13px] text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80">Módulos del Sistema</td>
                    </tr>
                    {allModules.map(mod => (
                      <tr key={mod.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{mod.name}</td>
                        {dynamicPlans.map(plan => {
                          const hasModule = plan.features.some((f: string) => f.includes(mod.name));
                          return (
                            <td key={plan.id} className="p-4 text-center">
                              {hasModule ? (
                                <CheckCircle size={20} className="mx-auto text-emerald-500" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 font-bold">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                <button onClick={() => setShowComparison(false)} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
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

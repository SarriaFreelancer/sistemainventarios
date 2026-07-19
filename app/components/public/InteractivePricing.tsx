"use client";

import React, { useState, useRef, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { errorAlert, successAlert } from "@/lib/sweetalert";
import { signIn, getSession } from "next-auth/react";

const PLANS = [
  {
    id: "basico",
    name: "Plan Básico",
    price: 49999,
    features: ['Dashboard de métricas', 'Catálogo de Productos', 'Gestión de Proveedores', 'Grupos y Categorías', 'Reportes de stock'],
    recommended: false
  },
  {
    id: "intermedio",
    name: "Plan Intermedio",
    price: 89999,
    features: ['Todo el Plan Básico', 'Facturación y Ventas', 'Gestión de Usuarios y Roles', 'Analítica de ingresos', 'Soporte por correo'],
    recommended: true
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: 129999,
    features: ['Todo el Plan Intermedio', 'Auditoría Inmutable', 'Módulo Financiero', 'Órdenes de Compra', 'CRM de clientes', 'Facturas Personalizadas', 'Soporte 24/7'],
    recommended: false
  }
];

export function InteractivePricing() {
  const boldContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [step, setStep] = useState<"SELECT_PLAN" | "REGISTER" | "CHECKOUT">("SELECT_PLAN");
  const [authMode, setAuthMode] = useState<"REGISTER" | "LOGIN">("REGISTER");
  
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
    getSession().then(session => {
      if (session?.user) {
        setUserSession(session.user);
      }
    });
  }, []);

  const startCheckoutProcess = async (plan: any, isPreLoggedIn = false) => {
    setSelectedPlan(plan);
    
    // Si ya está logueado (antes de darle clic o mediante session guardada), procedemos directo a generar orden
    if (isPreLoggedIn || userSession) {
      setStep("CHECKOUT");
      await generateOrderAndShowBold(plan);
    } else {
      setStep("REGISTER");
    }
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
        injectBoldScript(data.orderId, data.hash, data.amountStr);
      } else {
        errorAlert("Error", data.message || "Error al crear la orden");
        setStep("SELECT_PLAN");
      }
    } catch (e) {
      errorAlert("Error", "Error de red al generar la orden");
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

  const injectBoldScript = (orderId: string, hash: string, amountStr: string) => {
    setTimeout(() => {
      if (!boldContainerRef.current) return;
      boldContainerRef.current.innerHTML = "";
      
      const script = document.createElement("script");
      script.src = "https://checkout.bold.co/library/boldPaymentButton.js"; 
      script.setAttribute("data-bold-button", "");
      script.setAttribute("data-api-key", process.env.NEXT_PUBLIC_BOLD_API_KEY || "nQW8_xd1GDkl2AjvVHUl_pWo6anZyRTMQ-OYy0TSDUU"); 
      script.setAttribute("data-description", `Pago de ${selectedPlan?.name}`);
      // Si estamos en HTTPS (incluyendo localhost con certificados locales o ngrok), usamos la URL real.
      // Si estamos en HTTP, Bold puede fallar (BTN-001), por lo que usamos el mock de micomercio.
      const redirectUrl = window.location.protocol === "https:"
        ? `${window.location.origin}/pagos/resultado`
        : "https://micomercio.com/pagos/resultado";
      
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
              {userSession && (
                <div className="mt-6 inline-block bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 px-4 rounded-full font-bold text-[14px]">
                  Estás autenticado como {userSession.email}. Selecciona tu plan para pagar.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start mx-auto max-w-md md:max-w-4xl xl:max-w-none">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`relative flex flex-col h-full bg-white dark:bg-slate-800 rounded-[20px] p-6 md:p-8 border ${plan.recommended ? 'border-amber-600 dark:border-amber-500 shadow-2xl scale-100 lg:scale-105' : 'border-slate-100 dark:border-slate-700 shadow-sm'}`}>
                  {plan.recommended && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-600 dark:bg-amber-500 text-white text-[11px] font-extrabold py-1.5 text-center rounded-t-[18px] tracking-[0.1em]">
                      MÁS POPULAR
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-3 ${plan.recommended ? 'mt-6' : ''}`}>
                    {plan.recommended ? (
                      <LucideIcons.Star size={24} className="text-amber-600 dark:text-amber-500 fill-amber-600 dark:fill-amber-500" />
                    ) : plan.name.includes("Premium") ? (
                      <LucideIcons.Crown size={24} className="text-amber-600 dark:text-amber-500 fill-amber-600 dark:fill-amber-500" />
                    ) : (
                      <LucideIcons.Send size={24} className="text-red-600 dark:text-red-500 fill-red-600 dark:fill-red-500" />
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

                  <ul className="m-0 p-0 list-none flex flex-col gap-3 flex-1 mb-8">
                    {plan.features.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-900 dark:text-slate-200 text-[13px] font-semibold">
                        <div className="w-4 h-4 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-[2px]">
                          <LucideIcons.Check size={10} className="text-amber-600 dark:text-amber-500" strokeWidth={3} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>

                  {(() => {
                    const isCurrentPlan = userSession?.companyPlan === plan.id;
                    const isSuspended = userSession?.companyStatus === 'SUSPENDED';
                    const currentPlanIndex = PLANS.findIndex(p => p.id === userSession?.companyPlan);
                    const thisPlanIndex = PLANS.findIndex(p => p.id === plan.id);
                    
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
                        {isCurrentPlan && <LucideIcons.CheckCircle size={16} />}
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
                  Ver todos los planes anuales <LucideIcons.ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {step === "REGISTER" && selectedPlan && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl mx-auto shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep("SELECT_PLAN")} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer border-none bg-transparent text-slate-500 dark:text-slate-400">
                  <LucideIcons.ArrowLeft size={20} />
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
                {loading ? <LucideIcons.Loader2 className="animate-spin" /> : (authMode === "REGISTER" ? "Registrarse y Proceder al Pago" : "Iniciar Sesión y Pagar")}
              </button>
            </form>
          </div>
        )}

        {step === "CHECKOUT" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl mx-auto text-center shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
            <div className="flex justify-center mb-4">
              <LucideIcons.ShieldCheck size={64} className="text-emerald-500" />
            </div>
            <h3 className="text-[24px] font-black mb-2 text-slate-900 dark:text-white">
              {userSession ? '¡Sesión Detectada!' : '¡Registro Completado!'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">Por favor, completa tu pago de forma segura a continuación para activar tu cuenta inmediatamente.</p>
            
            <div className="min-h-[300px] border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 relative">
              <div ref={boldContainerRef} className="w-full flex justify-center relative z-10"></div>
            </div>

            <button 
              onClick={() => {
                setStep("SELECT_PLAN");
                if (boldContainerRef.current) boldContainerRef.current.innerHTML = "";
              }}
              className="mt-6 px-6 py-3 bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold cursor-pointer transition-all hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500"
            >
              Volver a los planes
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

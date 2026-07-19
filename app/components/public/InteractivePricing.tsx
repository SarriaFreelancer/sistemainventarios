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
    recommended: false
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: 129999,
    features: ['Todo el Plan Intermedio', 'Auditoría Inmutable', 'Módulo Financiero', 'Órdenes de Compra', 'CRM de clientes', 'Facturas Personalizadas', 'Soporte 24/7'],
    recommended: true
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
    <section id="planes" style={{ padding: '120px 24px', background: '#ffffff' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {step === "SELECT_PLAN" && (
          <>
            <style>{`
              .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; align-items: center; }
              @media (max-width: 1024px) {
                .pricing-grid { grid-template-columns: 1fr; max-width: 500px; margin: 0 auto; }
              }
            `}</style>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <span style={{ display: 'inline-block', color: '#dc2626', fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                Inversión Inteligente
              </span>
              <h2 style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Planes Escalables
              </h2>
              {userSession && (
                <div style={{ marginTop: 16, display: 'inline-block', background: '#fef2f2', color: '#dc2626', padding: '8px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14 }}>
                  Estás autenticado como {userSession.email}. Selecciona tu plan para pagar.
                </div>
              )}
            </div>

            <div className="pricing-grid">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`pricing-card ${plan.recommended ? 'pricing-premium' : ''}`} style={{ position: 'relative' }}>
                  {plan.recommended && (
                    <div style={{ position: 'absolute', top: 20, right: 20, background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 999 }}>
                      RECOMENDADO
                    </div>
                  )}
                  <div style={{ fontSize: 14, fontWeight: 800, color: plan.recommended ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {plan.name}
                  </div>
                  <div style={{ marginTop: 24, paddingBottom: 24, borderBottom: `1px solid ${plan.recommended ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` }}>
                    <span style={{ fontSize: 48, fontWeight: 900, color: plan.recommended ? '#ffffff' : '#0f172a' }}>
                      ${plan.price.toLocaleString("es-CO")}
                    </span>
                    <span style={{ color: plan.recommended ? '#94a3b8' : '#64748b', fontWeight: 600 }}>/mes</span>
                  </div>
                  <ul style={{ margin: '32px 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {plan.features.map((item, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: plan.recommended ? '#e2e8f0' : '#475569', fontSize: 15, fontWeight: 500 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: plan.recommended ? 'rgba(239, 68, 68, 0.2)' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LucideIcons.Check size={14} color={plan.recommended ? '#fca5a5' : '#16a34a'} />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {(() => {
                    const isCurrentPlan = userSession?.companyPlan === plan.id;
                    const currentPlanIndex = PLANS.findIndex(p => p.id === userSession?.companyPlan);
                    const thisPlanIndex = PLANS.findIndex(p => p.id === plan.id);
                    
                    let btnLabel = `Seleccionar ${plan.name.replace('Plan ', '')}`;
                    let btnDisabled = false;
                    
                    if (userSession?.companyPlan) {
                      if (isCurrentPlan) {
                        btnLabel = "Plan Actual";
                        btnDisabled = true;
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
                        style={{ 
                          width: '100%', padding: '16px', borderRadius: 14, 
                          background: isCurrentPlan ? '#10b981' : (plan.recommended ? '#dc2626' : '#f1f5f9'), 
                          color: isCurrentPlan ? '#ffffff' : (plan.recommended ? '#ffffff' : '#0f172a'), 
                          fontWeight: 700, border: 'none', 
                          cursor: btnDisabled ? 'not-allowed' : 'pointer', 
                          transition: 'background 0.2s',
                          opacity: btnDisabled ? 0.9 : 1
                        }}
                      >
                        {isCurrentPlan && <LucideIcons.CheckCircle size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: '-3px' }} />}
                        {btnLabel}
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          </>
        )}

        {step === "REGISTER" && selectedPlan && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-xl mx-auto" style={{ border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep("SELECT_PLAN")} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer border-none bg-transparent" style={{ cursor: 'pointer' }}>
                  <LucideIcons.ArrowLeft size={20} />
                </button>
                <h3 className="text-2xl font-bold m-0 text-slate-900">
                  {authMode === "REGISTER" ? `Crea tu cuenta (${selectedPlan.name})` : "Iniciar Sesión"}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
              <button 
                onClick={() => setAuthMode("REGISTER")} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: authMode === "REGISTER" ? '#fff' : 'transparent', fontWeight: 700, color: authMode === "REGISTER" ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: authMode === "REGISTER" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                Nueva Empresa
              </button>
              <button 
                onClick={() => setAuthMode("LOGIN")} 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: authMode === "LOGIN" ? '#fff' : 'transparent', fontWeight: 700, color: authMode === "LOGIN" ? '#0f172a' : '#64748b', cursor: 'pointer', boxShadow: authMode === "LOGIN" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                Ya tengo cuenta
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {authMode === "REGISTER" && (
                <>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Nombre de la Empresa</label>
                    <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} style={{ width: '100%', marginTop: '4px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Tu Nombre</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', marginTop: '4px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none' }} />
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Correo Electrónico (Admin)</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', marginTop: '4px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Contraseña</label>
                <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', marginTop: '4px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none' }} />
              </div>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px' }}>
                  <span style={{ color: '#0f172a' }}>Total a Pagar Hoy:</span>
                  <span style={{ color: '#dc2626' }}>${selectedPlan.price.toLocaleString("es-CO")} COP</span>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', marginTop: '16px', borderRadius: '12px', background: '#dc2626', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                {loading ? <LucideIcons.Loader2 className="animate-spin" /> : (authMode === "REGISTER" ? "Registrarse y Proceder al Pago" : "Iniciar Sesión y Pagar")}
              </button>
            </form>
          </div>
        )}

        {step === "CHECKOUT" && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-xl mx-auto text-center" style={{ border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <LucideIcons.ShieldCheck size={64} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: '#0f172a' }}>
              {userSession ? '¡Sesión Detectada!' : '¡Registro Completado!'}
            </h3>
            <p style={{ color: '#475569', marginBottom: '32px' }}>Por favor, completa tu pago de forma segura a continuación para activar tu cuenta inmediatamente.</p>
            
            <div style={{ minHeight: '300px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#f8fafc', padding: '16px', position: 'relative' }}>
              <div ref={boldContainerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10 }}></div>
            </div>

            <button 
              onClick={() => {
                setStep("SELECT_PLAN");
                if (boldContainerRef.current) boldContainerRef.current.innerHTML = "";
              }}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              Volver a los planes
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

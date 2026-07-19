"use client";

import React, { useState, useEffect, useRef } from "react";
import * as LucideIcons from "lucide-react";
import { errorAlert, successAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Plan Pro",
    price: 150000,
    features: ["Hasta 5 Usuarios", "Inventario Ilimitado", "Reportes Básicos"]
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: 300000,
    features: ["Usuarios Ilimitados", "Soporte 24/7", "Servidor Propio", "Migraciones Automáticas"]
  }
];

export function PricingCheckout() {
  const router = useRouter();
  const boldContainerRef = useRef<HTMLDivElement>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<"SELECT_PLAN" | "REGISTER" | "CHECKOUT">("SELECT_PLAN");
  
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setLoading(true);

    try {
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
        setStep("CHECKOUT");
        injectBoldScript(data.orderId, data.hash, data.amountStr);
      } else {
        errorAlert("Error", data.message || "Error al registrar");
      }
    } catch (error) {
      errorAlert("Error", "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const injectBoldScript = (orderId: string, hash: string, amountStr: string) => {
    if (!boldContainerRef.current) return;
    
    // Limpiar si ya había algo
    boldContainerRef.current.innerHTML = "";
    
    const script = document.createElement("script");
    script.src = "https://checkout.bold.co/library/boldPaymentButton.js"; // URL típica del script de Bold (Asegúrate de que es correcta)
    // Atributos base
    script.setAttribute("data-bold-button", "");
    script.setAttribute("data-api-key", "LLAVE_DE_IDENTIDAD"); // AQUÍ PONES LA LLAVE PÚBLICA
    script.setAttribute("data-description", `Pago de ${selectedPlan?.name}`);
    script.setAttribute("data-redirection-url", `${window.location.origin}/pagos/resultado`);
    script.setAttribute("data-render-mode", "embedded");
    
    // Atributos dinámicos
    script.setAttribute("data-amount", amountStr);
    script.setAttribute("data-currency", "COP");
    script.setAttribute("data-order-id", orderId);
    script.setAttribute("data-integrity-signature", hash);

    boldContainerRef.current.appendChild(script);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {step === "SELECT_PLAN" && (
        <div className="grid md:grid-cols-2 gap-8">
          {PLANS.map(plan => (
            <div key={plan.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer" onClick={() => { setSelectedPlan(plan); setStep("REGISTER"); }}>
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="text-4xl font-black text-primary mb-6">
                ${plan.price.toLocaleString("es-CO")} <span className="text-base font-normal text-muted-foreground">COP/mes</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-slate-600">
                    <LucideIcons.CheckCircle2 className="text-green-500" size={18} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-primary transition">
                Seleccionar Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {step === "REGISTER" && selectedPlan && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg max-w-xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep("SELECT_PLAN")} className="p-2 hover:bg-slate-100 rounded-full">
              <LucideIcons.ArrowLeft size={20} />
            </button>
            <h3 className="text-2xl font-bold">Crea tu cuenta ({selectedPlan.name})</h3>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700">Nombre de la Empresa</label>
              <input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full mt-1 px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Tu Nombre</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Correo Electrónico (Admin)</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full mt-1 px-4 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Contraseña</label>
              <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full mt-1 px-4 py-2 border rounded-xl" />
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-6">
              <div className="flex justify-between font-bold text-lg">
                <span>Total a Pagar Hoy:</span>
                <span className="text-primary">${selectedPlan.price.toLocaleString("es-CO")} COP</span>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 mt-6 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 flex justify-center items-center gap-2">
              {loading ? <LucideIcons.Loader2 className="animate-spin" /> : "Registrarse y Proceder al Pago"}
            </button>
          </form>
        </div>
      )}

      {step === "CHECKOUT" && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-xl mx-auto text-center">
          <LucideIcons.ShieldCheck size={48} className="text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">¡Registro Completado!</h3>
          <p className="text-slate-600 mb-8">Por favor, completa tu pago de forma segura a continuación para activar tu cuenta inmediatamente.</p>
          
          <div className="min-h-[300px] border border-slate-200 rounded-2xl bg-slate-50 p-4 relative" ref={boldContainerRef}>
            {/* El widget embebido de Bold se inyectará aquí */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <LucideIcons.Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

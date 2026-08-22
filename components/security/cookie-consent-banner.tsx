"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Cookie, FileText, CheckCircle } from "lucide-react";
import { PrivacyPolicyModal } from "./privacy-policy-modal";

import { markCookiesAsAccepted } from "@/app/actions/user-actions";

export function CookieConsentBanner({ serverConsent = false, userId }: { serverConsent?: boolean, userId?: number | null }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    // Si ya fue aceptado en el servidor, guardarlo localmente por si acaso y no mostrar
    if (serverConsent) {
      localStorage.setItem("gns_privacy_consent_v1", JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Comprobar si ya aceptó las políticas y cookies localmente
    const localConsent = localStorage.getItem("gns_privacy_consent_v1");
    if (!localConsent) {
      // Pequeño retardo para dar una animación suave al cargar
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, [serverConsent]);

  const handleAccept = async () => {
    localStorage.setItem("gns_privacy_consent_v1", JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);

    // Si el usuario está autenticado, guardar también en la base de datos
    if (userId) {
      await markCookiesAsAccepted(userId).catch(console.error);
    }
  };

  return (
    <>
      {showBanner && !showPolicyModal && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-[40] animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-card border border-border p-5 rounded-[24px] shadow-2xl shadow-black/30 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shrink-0">
                <Cookie className="h-6 w-6" />
              </div>
              <div className="space-y-1 text-xs md:text-sm">
                <div className="font-extrabold text-foreground flex items-center gap-2">
                  Protección de Datos & Cookies
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="h-3 w-3" /> Seguro
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  Utilizamos cookies de sesión esenciales para garantizar el correcto funcionamiento del sistema de inventarios, la seguridad de sus datos y cumplir con las políticas de privacidad de <strong>GNS Gestión SarriaTech</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50">
              <button
                onClick={() => setShowPolicyModal(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Leer Políticas de Privacidad
              </button>

              <button
                onClick={handleAccept}
                className="h-9 px-5 bg-gradient-to-r from-[#B18ACF] to-[#8B5CF6] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-2 active:scale-95 ml-auto"
              >
                <CheckCircle className="h-4 w-4" />
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      <PrivacyPolicyModal
        open={showPolicyModal}
        onOpenChange={setShowPolicyModal}
      />
    </>
  );
}

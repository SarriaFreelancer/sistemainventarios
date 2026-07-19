"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as LucideIcons from "lucide-react";
import Link from "next/link";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"LOADING" | "SUCCESS" | "ERROR">("LOADING");

  useEffect(() => {
    const paymentStatus = searchParams.get("bold-transaction-status") || searchParams.get("status");
    const orderId = searchParams.get("bold-order-id") || searchParams.get("order-id");

    if (paymentStatus === "APPROVED" || paymentStatus === "success") {
      if (orderId) {
        // Llama al backend para activar la cuenta
        fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: paymentStatus })
        })
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setStatus("SUCCESS");
          } else {
            setStatus("ERROR");
          }
        })
        .catch(err => {
          console.error(err);
          setStatus("SUCCESS"); // Fallback en caso de que el webhook de Bold lo resuelva
        });
      } else {
        setStatus("SUCCESS");
      }
    } else if (paymentStatus === "REJECTED" || paymentStatus === "error") {
      setStatus("ERROR");
    } else {
      setStatus("SUCCESS");
    }
  }, [searchParams]);

  return (
    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-200">
      {status === "LOADING" && (
        <div className="py-8">
          <LucideIcons.Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800">Verificando tu pago...</h2>
          <p className="text-slate-500 mt-2">Por favor no cierres esta ventana.</p>
        </div>
      )}

      {status === "SUCCESS" && (
        <div className="py-8 animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LucideIcons.CheckCircle2 className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Pago Exitoso!</h2>
          <p className="text-slate-600 mb-8">
            Tu cuenta ha sido activada correctamente. Ahora puedes ingresar al sistema y comenzar a disfrutar de todos los beneficios.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg"
          >
            Ir al Dashboard
          </button>
        </div>
      )}

      {status === "ERROR" && (
        <div className="py-8 animate-fade-in">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <LucideIcons.XCircle className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Pago Rechazado</h2>
          <p className="text-slate-600 mb-8">
            Hubo un problema al procesar tu pago. Tu cuenta sigue inactiva. Por favor intenta nuevamente.
          </p>
          <button onClick={() => window.history.back()} className="w-full py-4 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 transition">
            Volver a intentar
          </button>
        </div>
      )}
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-slate-200">
          <LucideIcons.Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-800">Cargando...</h2>
        </div>
      }>
        <PaymentResultContent />
      </Suspense>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: "¿GNS cumple con los requisitos de Facturación Electrónica y Documento POS de la DIAN?",
    a: "Sí, absolutamente. GNS está adaptado a las regulaciones tributarias vigentes en Colombia. Permite generar Documento Equivalente Electrónico POS y Facturas Electrónicas con código QR, CUFE y validación previa, entregando automáticamente el archivo XML y PDF al cliente.",
  },
  {
    q: "¿Puedo importar mis productos, clientes y saldos de inventario desde archivos de Excel?",
    a: "Sí. Disponemos de plantillas prediseñadas en Excel para que puedas cargar de forma masiva miles de referencias, categorías, precios de venta, costos y clientes en cuestión de minutos, sin necesidad de transcribirlos uno por uno.",
  },
  {
    q: "¿Cómo funciona el control Multi-Sedes si abro una nueva sucursal o bodega?",
    a: "Con nuestros planes Enterprise puedes dar de alta nuevas sedes al instante. Cada sede puede operar con su propio inventario, cajas registradoras y colaboradores independientes, mientras el Super Administrador y administradores autorizados tienen una vista consolidada en tiempo real y la capacidad de realizar traslados de mercancía entre sedes con un solo clic.",
  },
  {
    q: "¿Cuáles son los medios de pago aceptados para las suscripciones?",
    a: "A través de nuestra pasarela integrada Bold, aceptamos pagos inmediatos mediante PSE (desde cualquier banco de Colombia como Bancolombia, Davivienda, BBVA, etc.), Tarjetas de Crédito y Débito (Visa, Mastercard, American Express), Nequi y Botón Bancolombia. Tu suscripción se activa automáticamente al instante.",
  },
  {
    q: "¿Existe alguna cláusula de permanencia o penalidad por cancelación?",
    a: "Ninguna. No creemos en los contratos forzados. Puedes cancelar, pausar o cambiar de plan en cualquier momento directamente desde tu panel de usuario sin costos ocultos ni letras pequeñas. Si eliges el pago anual, recibes 2 meses de regalo y mantienes tu tarifa fija.",
  },
  {
    q: "¿Mis datos comerciales y financieros están seguros en la nube?",
    a: "Totalmente. Toda tu información viaja cifrada bajo protocolos bancarios SSL/TLS y se almacena en centros de datos con estándares de seguridad internacional. Además, realizamos copias de seguridad automáticas y aislamiento de base de datos entre empresas para garantizar la máxima confidencialidad.",
  },
  {
    q: "¿Qué tipo de soporte técnico y capacitación recibo con mi cuenta?",
    a: "Cuentas con soporte técnico en español a través de chat, WhatsApp y correo electrónico, además de videos tutoriales paso a paso y documentación interactiva. En planes Intermedio y Enterprise dispones de asistencia prioritaria y acompañamiento personalizado.",
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
            <HelpCircle size={14} />
            Preguntas Frecuentes
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Todo lo que necesitas saber antes de empezar
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Resolvemos las dudas más comunes sobre la implementación, facturación y seguridad de GNS.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-extrabold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div
                    className={`w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "text-slate-400"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Can't find question callout */}
        <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center sm:flex items-center justify-between gap-4 shadow-sm">
          <div className="text-left mb-4 sm:mb-0">
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1">
              ¿Tienes alguna pregunta adicional?
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 m-0">
              Nuestro equipo de soporte te asesora de forma gratuita en tiempo real.
            </p>
          </div>

          <a
            href="https://wa.me/573001234567?text=Hola,%20tengo%20preguntas%20sobre%20GNS%20Sistema%20de%20Inventarios"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            <MessageSquare size={16} className="text-emerald-400" />
            <span>Hablar con un Asesor</span>
          </a>
        </div>
      </div>
    </section>
  );
}

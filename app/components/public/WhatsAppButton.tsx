"use client";

import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const phoneNumber = "573106173888";
  
  // En WhatsApp, *texto* formatea el texto en negrita.
  // Usamos \n para asegurar que WhatsApp respete cada salto de línea de la lista.
  const rawMessage = `👋 ¡Hola! Estoy interesado en *GNS Gestión de Negocios* y quisiera recibir información.

📌 Me gustaría conocer:

1️⃣ 💻 *Funcionalidades del sistema*
2️⃣ 💰 *Planes y precios*
3️⃣ 📦 *Gestión de inventario*
4️⃣ 🛒 *Ventas y compras*
5️⃣ 📊 *Reportes y estadísticas*
6️⃣ 🚀 *Solicitar una demostración*

👉 Quisiera recibir más información, por favor.`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(rawMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp Business"
      className="fixed bottom-8 right-8 z-[9999] group flex items-center gap-3 no-underline focus:outline-none"
    >
      {/* Floating Tooltip Label */}
      <span className="hidden sm:inline-block px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-800/90 text-white text-xs font-extrabold shadow-2xl border border-slate-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 pointer-events-none">
        ¡Habla con un asesor! 👋
      </span>

      {/* Button Circle with WhatsApp #25D366 Styling & Glow */}
      <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25d366] hover:bg-[#20bd5a] text-white shadow-[0_8px_30px_rgba(37,211,102,0.5)] hover:shadow-[0_12px_35px_rgba(37,211,102,0.75)] transition-all duration-300 group-hover:scale-110 active:scale-95 border-2 border-white/20">
        {/* Pulse effect ring */}
        <span className="absolute inset-0 rounded-full bg-[#25d366] animate-ping opacity-30 pointer-events-none" />
        
        {/* WhatsApp Icon */}
        <MessageCircle size={28} className="fill-white text-[#25d366] transform group-hover:rotate-12 transition-transform duration-300" />
      </div>
    </a>
  );
}

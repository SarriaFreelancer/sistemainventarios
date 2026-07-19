"use client";

import React from 'react';
import { Package, ShoppingCart, ShoppingBag, BarChart2, Users, ShieldCheck } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export function LandingModules() {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
  });

  const modulesData = [
    {
      icon: Package,
      name: 'Inventario Inteligente',
      description: 'Control total de tus productos, stock, categorías y movimientos en tiempo real.',
    },
    {
      icon: ShoppingCart,
      name: 'Ventas y POS',
      description: 'Vende más rápido con nuestro sistema POS y controla tus ventas fácilmente.',
    },
    {
      icon: ShoppingBag,
      name: 'Compras y Proveedores',
      description: 'Gestiona compras, proveedores y mantiene tu cadena de suministro optimizada.',
    },
    {
      icon: BarChart2,
      name: 'Reportes y Analíticas',
      description: 'Toma decisiones inteligentes con reportes detallados y gráficas interactivas.',
    },
    {
      icon: Users,
      name: 'CRM y Clientes',
      description: 'Administra tus clientes, cotizaciones, comunicaciones y seguimiento comercial.',
    },
    {
      icon: ShieldCheck,
      name: 'Seguridad Avanzada',
      description: 'Tus datos están protegidos con encriptación, roles y permisos granulares.',
    },
  ];

  return (
    <div className="w-full">
      {/* Desktop Grid (hidden on mobile/tablet) */}
      <div className="hidden lg:grid grid-cols-3 xl:grid-cols-6 gap-4">
        {modulesData.map((m, idx) => {
          const Icon = m.icon;
          const isGold = idx % 2 !== 0;
          return (
            <div key={idx} className="module-card bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col items-center text-center">
              <div className="relative w-14 h-14 flex items-center justify-center mb-4 shrink-0">
                <div className="absolute inset-0 rounded-full" style={{
                  background: isGold ? 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(255,255,255,0) 70%)' : 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(255,255,255,0) 70%)',
                }} />
                <Icon size={26} className={`relative z-10 ${isGold ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'}`} />
              </div>
              <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-white mb-2.5 leading-snug">{m.name}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 font-medium">{m.description}</p>
            </div>
          );
        })}
      </div>

      {/* Mobile/Tablet Carousel (hidden on desktop) */}
      <div className="lg:hidden w-full overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          {modulesData.map((m, idx) => {
            const Icon = m.icon;
            const isGold = idx % 2 !== 0;
            return (
              <div key={idx} className="flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_40%] min-w-0 pl-4 py-4">
                <div className="module-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col items-center text-center h-full mx-1">
                  <div className="relative w-14 h-14 flex items-center justify-center mb-4 shrink-0">
                    <div className="absolute inset-0 rounded-full" style={{
                      background: isGold ? 'radial-gradient(circle, rgba(217,119,6,0.15) 0%, rgba(255,255,255,0) 70%)' : 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, rgba(255,255,255,0) 70%)',
                    }} />
                    <Icon size={26} className={`relative z-10 ${isGold ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'}`} />
                  </div>
                  <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white mb-2.5 leading-snug">{m.name}</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 font-medium">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

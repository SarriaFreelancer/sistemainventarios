"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Package, ShoppingCart, ShoppingBag, BarChart2, Users, ShieldCheck } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export function LandingModules() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
  });

  // Observador de intersección: activa la cascada suave al subir o bajar y entrar en la sección
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Permite que al salir de la sección y volver a pasar por ella, se reactive la cascada fluida
          setIsVisible(false);
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

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
    <div ref={containerRef} className="w-full">
      {/* Desktop Grid (hidden on mobile/tablet) */}
      <div className="hidden lg:grid grid-cols-3 xl:grid-cols-6 gap-4">
        {modulesData.map((m, idx) => {
          const Icon = m.icon;
          const isGold = idx % 2 !== 0;
          const staggerDelay = idx * 0.08; // Cascada fluida de 80ms entre tarjetas

          return (
            <div
              key={idx}
              className="w-full h-full transform-gpu"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? 'translateY(0px) scale(1)'
                  : 'translateY(28px) scale(0.96)',
                transition: isVisible
                  ? `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s`
                  : 'opacity 0.3s ease-out, transform 0.3s ease-out',
                pointerEvents: isVisible ? 'auto' : 'none',
              }}
            >
              <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.25)] hover:border-blue-500/40 dark:hover:border-blue-500/50 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center h-full overflow-hidden">
                {/* Resplandor sutil superior en hover */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Contenedor de Ícono con halo suave */}
                <div className="relative w-14 h-14 flex items-center justify-center mb-4 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: isGold
                        ? 'radial-gradient(circle, rgba(217,119,6,0.16) 0%, rgba(255,255,255,0) 70%)'
                        : 'radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(255,255,255,0) 70%)',
                    }}
                  />
                  <Icon
                    size={26}
                    className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                      isGold ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-500'
                    }`}
                  />
                </div>

                {/* Título */}
                <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-white mb-2.5 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {m.name}
                </h3>

                {/* Descripción */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 font-medium">
                  {m.description}
                </p>
              </div>
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
            const staggerDelay = idx * 0.06;

            return (
              <div
                key={idx}
                className="flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_40%] min-w-0 pl-4 py-3 transform-gpu"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateY(0px) scale(1)'
                    : 'translateY(20px) scale(0.97)',
                  transition: isVisible
                    ? `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s`
                    : 'opacity 0.25s ease-out, transform 0.25s ease-out',
                }}
              >
                <div className="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] flex flex-col items-center text-center h-full mx-1">
                  <div className="relative w-14 h-14 flex items-center justify-center mb-4 shrink-0">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isGold
                          ? 'radial-gradient(circle, rgba(217,119,6,0.16) 0%, rgba(255,255,255,0) 70%)'
                          : 'radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(255,255,255,0) 70%)',
                      }}
                    />
                    <Icon
                      size={26}
                      className={`relative z-10 ${
                        isGold ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-500'
                      }`}
                    />
                  </div>
                  <h3 className="text-[14px] font-extrabold text-slate-900 dark:text-white mb-2.5 leading-snug">
                    {m.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 font-medium">
                    {m.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

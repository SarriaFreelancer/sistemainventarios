"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Package, ShoppingCart, ShoppingBag, BarChart2, Users, ShieldCheck } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export function LandingModules() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);

  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
  });

  // Observador de intersección: detecta cuando el usuario entra o sale de la sección al subir o bajar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          // Al salir del campo de visión (subir o bajar), reinicia para volver a volar al pasar de nuevo
          setIsVisible(false);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  // Una vez que completan su vuelo y aterrizan en su posición exacta, activan su suave movimiento flotante
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVisible) {
      timer = setTimeout(() => {
        setHasLanded(true);
      }, 1200);
    } else {
      setHasLanded(false);
    }
    return () => clearTimeout(timer);
  }, [isVisible]);

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

  // Trayectorias tridimensionales de llegada "volando" para cada una de las 6 tarjetas
  const flyTrajectories = [
    { x: -35, y: 75, rotate: -7 },
    { x: -12, y: 85, rotate: -3 },
    { x: 18, y: 75, rotate: 5 },
    { x: -25, y: 90, rotate: -5 },
    { x: 12, y: 80, rotate: 3 },
    { x: 35, y: 85, rotate: 7 },
  ];

  return (
    <div ref={containerRef} className="w-full">
      <style>{`
        @keyframes gentleCardFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-card-floating {
          animation: gentleCardFloat ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {/* Desktop Grid (hidden on mobile/tablet) */}
      <div className="hidden lg:grid grid-cols-3 xl:grid-cols-6 gap-4">
        {modulesData.map((m, idx) => {
          const Icon = m.icon;
          const isGold = idx % 2 !== 0;
          const traj = flyTrajectories[idx] || { x: 0, y: 80, rotate: 0 };
          const staggerDelay = idx * 0.1; // Llegada escalonada una por una

          return (
            <div
              key={idx}
              className="w-full h-full"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? 'translate3d(0, 0, 0) scale(1) rotate(0deg)'
                  : `translate3d(${traj.x}px, ${traj.y}px, 0) scale(0.82) rotate(${traj.rotate}deg)`,
                filter: isVisible ? 'blur(0px)' : 'blur(8px)',
                transition: isVisible
                  ? `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s, transform 0.75s cubic-bezier(0.34, 1.45, 0.64, 1) ${staggerDelay}s, filter 0.55s ease-out ${staggerDelay}s`
                  : 'opacity 0.35s ease-in, transform 0.35s ease-in, filter 0.35s ease-in',
                pointerEvents: isVisible ? 'auto' : 'none',
              }}
            >
              <div
                className={`w-full h-full ${hasLanded ? 'animate-card-floating' : ''}`}
                style={{
                  animationDuration: `${3.6 + (idx % 3) * 0.5}s`,
                  animationDelay: `${idx * 0.32}s`,
                }}
              >
                <div className="module-card bg-white dark:bg-slate-900 rounded-2xl p-7 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col items-center text-center h-full transition-all duration-300">
                  <div className="relative w-14 h-14 flex items-center justify-center mb-4 shrink-0">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: isGold
                          ? 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(255,255,255,0) 70%)'
                          : 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(255,255,255,0) 70%)',
                      }}
                    />
                    <Icon
                      size={26}
                      className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${
                        isGold ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-500'
                      }`}
                    />
                  </div>
                  <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-white mb-2.5 leading-snug">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 font-medium">
                    {m.description}
                  </p>
                </div>
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
            const traj = flyTrajectories[idx] || { x: 0, y: 60, rotate: 0 };
            const staggerDelay = idx * 0.08;

            return (
              <div
                key={idx}
                className="flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_40%] min-w-0 pl-4 py-4"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translate3d(0, 0, 0) scale(1) rotate(0deg)'
                    : `translate3d(${traj.x * 0.6}px, ${traj.y * 0.6}px, 0) scale(0.85) rotate(${traj.rotate * 0.6}deg)`,
                  filter: isVisible ? 'blur(0px)' : 'blur(6px)',
                  transition: isVisible
                    ? `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay}s, transform 0.75s cubic-bezier(0.34, 1.45, 0.64, 1) ${staggerDelay}s, filter 0.55s ease-out ${staggerDelay}s`
                    : 'opacity 0.35s ease-in, transform 0.35s ease-in, filter 0.35s ease-in',
                }}
              >
                <div
                  className={`w-full h-full ${hasLanded ? 'animate-card-floating' : ''}`}
                  style={{
                    animationDuration: `${3.6 + (idx % 3) * 0.5}s`,
                    animationDelay: `${idx * 0.32}s`,
                  }}
                >
                  <div className="module-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] flex flex-col items-center text-center h-full mx-1">
                    <div className="relative w-14 h-14 flex items-center justify-center mb-4 shrink-0">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: isGold
                            ? 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(255,255,255,0) 70%)'
                            : 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(255,255,255,0) 70%)',
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

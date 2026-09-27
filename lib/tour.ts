"use client";

import "driver.js/dist/driver.css";

export async function startDashboardTour(allowedModules?: string[], userId?: string, onComplete?: () => void) {
  if (typeof window === "undefined") return;

  const { driver } = await import("driver.js");
  const tourKey = userId ? `gns_sarriatech_tour_completed_${userId}` : "gns_sarriatech_tour_completed";

  const isElementVisible = (selector: string): boolean => {
    if (typeof document === "undefined") return false;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const isMobile = window.innerWidth < 1024;
  const hasModule = (name: string) => allowedModules?.some(m => m.toLowerCase() === name.toLowerCase());

  const steps: any[] = [];

  // 1. Bienvenida en Header
  if (document.querySelector("header")) {
    steps.push({
      element: "header",
      popover: {
        title: "¡Bienvenido a tu ERP!",
        description: "Este es tu panel principal de administración. Desde aquí supervisas y controlas tu empresa en tiempo real.",
        side: "bottom",
        align: "start"
      }
    });
  }

  // 2. Si es Móvil, destacar el botón de menú para acceder a todos los módulos
  if (isMobile && isElementVisible("#tour-mobile-menu-btn")) {
    steps.push({
      element: "#tour-mobile-menu-btn",
      popover: {
        title: "Menú y Módulos",
        description: "Toca este botón para desplegar todos tus módulos: Inventario de Productos, Ventas POS, Compras, Finanzas, Reportes y Ajustes.",
        side: "bottom",
        align: "start"
      }
    });
  }

  // 3. Módulos individuales en Desktop (solo si el sidebar está visible)
  if (!isMobile) {
    if (hasModule("Productos") || hasModule("Inventario")) {
      if (isElementVisible("#tour-nav-productos")) {
        steps.push({
          element: "#tour-nav-productos",
          popover: {
            title: "Control de Inventario",
            description: "En esta sección podrás agregar productos, gestionar categorías, lotes, existencias y costos.",
            side: "right",
            align: "start"
          }
        });
      }
    }

    if (hasModule("Ventas")) {
      if (isElementVisible("#tour-nav-ventas")) {
        steps.push({
          element: "#tour-nav-ventas",
          popover: {
            title: "Módulo de Ventas POS",
            description: "Facturación rápida, punto de venta POS, cotizaciones y registro de salidas de inventario.",
            side: "right",
            align: "start"
          }
        });
      }
    }

    if (hasModule("Compras")) {
      if (isElementVisible("#tour-nav-compras")) {
        steps.push({
          element: "#tour-nav-compras",
          popover: {
            title: "Módulo de Compras",
            description: "Abastece tu stock, gestiona órdenes de compra, recepciones y cuentas por pagar a proveedores.",
            side: "right",
            align: "start"
          }
        });
      }
    }

    if (hasModule("Configuración")) {
      if (isElementVisible("#tour-nav-configuración")) {
        steps.push({
          element: "#tour-nav-configuración",
          popover: {
            title: "Configuración General",
            description: "Ajusta el NIT, teléfono, logo y datos de tu empresa, esto es clave para tus facturas y reportes.",
            side: "right",
            align: "start"
          }
        });
      }
    }
  }

  // 4. Métricas Rápidas KPI (con auto-scroll)
  if (document.querySelector("#tour-dashboard-kpi")) {
    steps.push({
      element: "#tour-dashboard-kpi",
      popover: {
        title: "Resumen y Métricas Clave",
        description: "Monitorea en tiempo real las ventas totales, conteo de catálogo, proveedores y alertas de stock crítico.",
        side: isMobile ? "bottom" : "bottom",
        align: "start"
      }
    });
  }

  // 5. Gráficas y Rendimiento
  if (document.querySelector("#tour-dashboard-stats")) {
    steps.push({
      element: "#tour-dashboard-stats",
      popover: {
        title: "Gráficas y Tendencias",
        description: "Visualiza de forma clara el comportamiento de tus ingresos, gastos, márgenes de ganancia y productos más vendidos.",
        side: isMobile ? "top" : "top",
        align: "start"
      }
    });
  }

  // 6. Modo Oscuro / Claro
  if (isElementVisible("#tour-theme-toggle")) {
    steps.push({
      element: "#tour-theme-toggle",
      popover: {
        title: "Modo Oscuro / Claro",
        description: "Alterna libremente entre modo oscuro y claro según tu preferencia visual.",
        side: "bottom",
        align: "end"
      }
    });
  }

  // 7. Perfil y Menú de Sesión
  if (isElementVisible("#tour-profile-menu")) {
    steps.push({
      element: "#tour-profile-menu",
      popover: {
        title: "Perfil y Sesión",
        description: "Accede a la seguridad de tu cuenta, perfil personal o cierra tu sesión de forma segura.",
        side: "bottom",
        align: "end"
      }
    });
  }

  // Si por alguna razón no hay pasos válidos, no iniciamos
  if (steps.length === 0) return;

  const tour = driver({
    showProgress: true,
    animate: true,
    smoothScroll: true,
    stagePadding: isMobile ? 4 : 8,
    stageRadius: 16,
    popoverOffset: 12,
    allowClose: true,
    nextBtnText: "Siguiente &rarr;",
    prevBtnText: "&larr; Atrás",
    doneBtnText: "Empezar a usar",
    onHighlightStarted: (element) => {
      if (element) {
        // Realizar scroll suave hacia el elemento para asegurar visibilidad en pantallas móviles o de escritorio
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest"
        });
      }
    },
    steps,
    onDestroyStarted: () => {
      localStorage.setItem(tourKey, "true");
      if (onComplete) onComplete();
      tour.destroy();
    }
  });

  tour.drive();
}

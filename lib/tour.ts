"use client";

import "driver.js/dist/driver.css";

export async function startDashboardTour(allowedModules?: string[], userId?: string) {
  const { driver } = await import("driver.js");
  const tourKey = userId ? `gns_sarriatech_tour_completed_${userId}` : "gns_sarriatech_tour_completed";

  const hasModule = (name: string) => allowedModules?.some(m => m.toLowerCase() === name.toLowerCase());

  const dynamicSteps: any[] = [];

  if (hasModule("Productos") || hasModule("Inventario")) {
    dynamicSteps.push({
      element: '#tour-nav-productos',
      popover: {
        title: 'Control de Inventario',
        description: 'En esta sección podrás agregar productos, gestionar categorías y verificar el stock disponible.',
        side: "right", align: 'start'
      }
    });
  }

  if (hasModule("Ventas")) {
    dynamicSteps.push({
      element: '#tour-nav-ventas',
      popover: {
        title: 'Módulo de Ventas',
        description: 'El corazón de tu negocio. Crea facturas, maneja clientes y registra salidas de inventario rápidamente.',
        side: "right", align: 'start'
      }
    });
  }

  if (hasModule("Compras")) {
    dynamicSteps.push({
      element: '#tour-nav-compras',
      popover: {
        title: 'Módulo de Compras',
        description: 'Abastece tu inventario registrando las compras y llevando control de tus proveedores.',
        side: "right", align: 'start'
      }
    });
  }

  if (hasModule("Configuración")) {
    dynamicSteps.push({
      element: '#tour-nav-configuración',
      popover: {
        title: '¡Paso Obligatorio!',
        description: 'Entra a Configuraciones para ajustar el NIT, Teléfono y nombre de tu empresa, esto es clave para tus facturas.',
        side: "right", align: 'start'
      }
    });
  }

  const tour = driver({
    showProgress: true,
    nextBtnText: 'Siguiente &rarr;',
    prevBtnText: '&larr; Atrás',
    doneBtnText: 'Empezar a usar',
    steps: [
      {
        element: 'header',
        popover: {
          title: '¡Bienvenido a tu ERP!',
          description: 'Este es el panel principal de control. Desde aquí tendrás acceso rápido a toda la plataforma.',
          side: "bottom", align: 'start'
        }
      },
      {
        element: '#tour-dashboard-kpi',
        popover: {
          title: 'Resumen Global',
          description: 'Aquí encontrarás métricas rápidas sobre las ventas del día, productos y alertas de inventario.',
          side: "bottom", align: 'start'
        }
      },
      {
        element: '#tour-dashboard-stats',
        popover: {
          title: 'Gráficas y Tendencias',
          description: 'Visualiza de forma clara cómo van tus ventas mes a mes y el margen de ganancia de tu negocio.',
          side: "top", align: 'start'
        }
      },
      ...dynamicSteps,
      {
        element: '#tour-theme-toggle', 
        popover: {
          title: 'Modo Oscuro / Claro',
          description: 'Puedes alternar entre modo oscuro y claro según tu preferencia visual con este botón.',
          side: "bottom", align: 'end'
        }
      },
      {
        element: '#tour-profile-menu', 
        popover: {
          title: 'Perfil y Sesión',
          description: 'Finalmente, desde aquí podrás cerrar tu sesión y acceder a los ajustes de tu cuenta.',
          side: "bottom", align: 'end'
        }
      }
    ],
    onDestroyStarted: () => {
      localStorage.setItem(tourKey, "true");
      tour.destroy();
    }
  });

  tour.drive();
}

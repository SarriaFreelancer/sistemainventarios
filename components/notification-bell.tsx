"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useNotificationSound } from "@/lib/use-notification-sound";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const notifiedIds = useRef<Set<number>>(new Set());
  const { playNotification } = useNotificationSound();

  // Polling usando API Route con control persistente de toasts mostrados
  const pollNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });

      if (res.status === 401) {
        // Si la sesión expiró (ej. cerró sesión en otra pestaña), redirigir al login
        window.location.href = '/auth/login';
        return;
      }

      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data as Notification[];

        // Recuperar IDs de toasts ya mostrados en esta sesión
        let shownIds: Set<number>;
        try {
          const raw = sessionStorage.getItem('gns_shown_toast_ids');
          shownIds = raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
          shownIds = notifiedIds.current;
        }

        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;

        // Identificar notificaciones no leídas que aún no se han mostrado como toast y son recientes
        const newNotifs = data.filter(n => {
          if (n.isRead || shownIds.has(n.id)) return false;
          const createdTime = new Date(n.createdAt).getTime();
          // Mostrar si se creó en los últimos 10 minutos o si no tiene fecha parseable
          return isNaN(createdTime) || createdTime >= tenMinutesAgo;
        });

        if (newNotifs.length > 0) {
          // Sonido de alerta
          playNotification(Math.min(newNotifs.length, 3));

          // Disparar toasts emergentes
          newNotifs.forEach(n => {
            shownIds.add(n.id);
            notifiedIds.current.add(n.id);

            const targetRoute = getNotificationRoute(n.title, n.message);
            const toastOpts: any = {
              description: n.message,
              duration: 7000,
            };

            if (targetRoute) {
              toastOpts.action = {
                label: "Ir al módulo",
                onClick: () => {
                  router.push(targetRoute);
                },
              };
            }

            if (n.type === 'ERROR') {
              toast.error(n.title, toastOpts);
            } else if (n.type === 'WARNING') {
              toast.warning(n.title, toastOpts);
            } else {
              toast.success(n.title, toastOpts);
            }
          });

          // Guardar IDs en sessionStorage para evitar repetir toasts al refrescar
          try {
            sessionStorage.setItem('gns_shown_toast_ids', JSON.stringify(Array.from(shownIds).slice(-100)));
          } catch {}
        }

        // Marcar todas las notificaciones actuales en memoria para consistencia
        data.forEach(n => notifiedIds.current.add(n.id));
        setNotifications(data);
      }
    } catch {
      // Silently ignore network errors during polling
    }
  }, [playNotification, router]);

  useEffect(() => {
    // Carga inicial
    pollNotifications();

    // Polling cada 10 segundos para detección de nuevos eventos y alertas emergentes
    const interval = setInterval(() => {
      pollNotifications();
    }, 10000);

    // Escuchar evento personalizado para refresco inmediato cuando se ejecutan acciones
    const handleManualRefresh = () => pollNotifications();
    window.addEventListener('gns_refresh_notifications', handleManualRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('gns_refresh_notifications', handleManualRefresh);
    };
  }, [pollNotifications]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    // Remoción optimista e inmediata de la interfaz
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[DELETE_NOTIF_ERROR]', err);
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setNotifications([]);
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
    } catch (err) {
      console.error('[CLEAR_ALL_NOTIFS_ERROR]', err);
    }
  };

  const getNotificationRoute = (title: string, message: string): string => {
    const text = `${title} ${message}`.toLowerCase();

    // 1. Ventas, Facturación de Venta y Cobros
    if (text.includes("venta") || text.includes("cobro") || text.includes("ticket") || text.includes("caja")) {
      return "/dashboard/sales";
    }

    // 2. Productos, Inventario, Lotes, Vencimientos y Stock
    if (text.includes("producto") || text.includes("stock") || text.includes("inventario") || text.includes("lote") || text.includes("venc") || text.includes("caduc") || text.includes("expir") || text.includes("reabastec")) {
      return "/dashboard/products";
    }

    // 3. Compras, Requisiciones, Recepciones, Facturas de Proveedores
    if (text.includes("compra") || text.includes("requisici") || text.includes("recepci") || text.includes("cuentas por pagar")) {
      return "/dashboard/compras";
    }
    if (text.includes("proveedor")) {
      return "/dashboard/suppliers";
    }

    // 4. CRM, Clientes, Oportunidades, Leads, Cotizaciones
    if (text.includes("crm") || text.includes("oportunidad") || text.includes("lead") || text.includes("prospecto") || text.includes("cotizaci") || text.includes("cliente")) {
      return "/dashboard/crm";
    }

    // 5. Finanzas, Gastos e Ingresos
    if (text.includes("gasto") || text.includes("ingreso") || text.includes("finanza") || text.includes("balance") || text.includes("egreso") || text.includes("flujo de caja")) {
      return "/dashboard/finanzas";
    }

    // 6. Recursos Humanos (RRHH), Empleados, Nómina
    if (text.includes("rrhh") || text.includes("empleado") || text.includes("nómina") || text.includes("nomina") || text.includes("novedad") || text.includes("cargo")) {
      return "/dashboard/rrhh";
    }

    // 7. Categorías y Grupos
    if (text.includes("categor")) {
      return "/dashboard/categories";
    }
    if (text.includes("grupo")) {
      return "/dashboard/groups";
    }

    // 8. Bodegas y Almacenes
    if (text.includes("bodega") || text.includes("almac") || text.includes("transferencia")) {
      return "/dashboard/warehouses";
    }

    // 9. Reportes y Analíticas
    if (text.includes("report") || text.includes("informe")) {
      return "/dashboard/reportes";
    }
    if (text.includes("analít") || text.includes("estadíst") || text.includes("kpi")) {
      return "/dashboard/analytics";
    }

    // 10. Auditoría y Seguridad
    if (text.includes("auditor") || text.includes("seguridad") || text.includes("log") || text.includes("bloqueo") || text.includes("intento")) {
      return "/dashboard/audit";
    }

    // 11. Usuarios y Roles
    if (text.includes("usuario") || text.includes("password") || text.includes("contraseña") || text.includes("perfil")) {
      return "/dashboard/users";
    }

    // 12. Notificaciones / Anuncios / Comunicados del Sistema
    if (text.includes("anuncio") || text.includes("comunicado") || text.includes("notificaci") || text.includes("aviso")) {
      return "/dashboard/settings?tab=announcements";
    }

    // 13. Sesiones Activas
    if (text.includes("sesi") || text.includes("conexi") || text.includes("dispositivo")) {
      return "/dashboard/settings?tab=sessions";
    }

    // 14. Licencias y Planes
    if (text.includes("licencia") || text.includes("suscrip") || text.includes("plan") || text.includes("prueba") || text.includes("trial")) {
      return "/dashboard/settings?tab=licenses";
    }

    // 15. Configuración General / Backup / Integraciones
    if (text.includes("configuración") || text.includes("configuracion") || text.includes("empresa") || text.includes("ajuste") || text.includes("backup") || text.includes("respaldo") || text.includes("api") || text.includes("webhook")) {
      return "/dashboard/settings";
    }

    // Fallback: Dashboard principal
    return "/dashboard";
  };

  const handleNotificationClick = (e: React.MouseEvent, notif: Notification) => {
    e.preventDefault();
    e.stopPropagation();

    const targetRoute = getNotificationRoute(notif.title, notif.message);
    setIsOpen(false);

    // Marcar como leída optimista
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    try {
      fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' });
    } catch {}

    if (targetRoute) {
      router.push(targetRoute);
    }
  };

  const getTypeStyles = (type: string) => {
    switch(type) {
      case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'ERROR': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'WARNING': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Notificaciones" variant="ghost" size="icon" className="relative rounded-full h-9 w-9 overflow-visible bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors group">
          <Bell className={`h-5 w-5 transition-all ${notifications.length > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground group-hover:text-primary'}`} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-destructive text-[9px] font-black text-white shadow-md">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-[480px] p-0 border-border/60 shadow-2xl rounded-2xl overflow-hidden">
        <DropdownMenuHeader className="p-4 border-b border-border/50 bg-muted/30 flex flex-row items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            <p className="text-xs text-muted-foreground">{notifications.length} recientes</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-8 text-xs text-muted-foreground hover:text-destructive px-2">
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpiar todo
            </Button>
          )}
        </DropdownMenuHeader>

        <div className="max-h-[60vh] overflow-y-auto p-1 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center">
              <Check className="h-8 w-8 text-muted-foreground/30 mb-2" />
              No tienes notificaciones nuevas
            </div>
          ) : (
            notifications.map((notif) => {
              const targetRoute = getNotificationRoute(notif.title, notif.message);
              return (
                <div
                  key={notif.id}
                  onClick={(e) => handleNotificationClick(e, notif)}
                  className={`relative group flex gap-3 px-3 py-2 rounded-xl transition-all border cursor-pointer hover:scale-[1.01] ${notif.isRead ? 'bg-transparent border-transparent' : 'bg-muted/30 border-border/50 shadow-sm'} hover:bg-muted/50`}
                >
                  <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-primary animate-pulse'}`} />
                  <div className={`flex-1 pr-8 rounded-md px-3 py-2 ${getTypeStyles(notif.type)}`}>
                    <p className="text-[12px] font-bold leading-tight">{notif.title}</p>
                    <p className="text-[11px] mt-1 opacity-90 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-current/10">
                      <p className="text-[10px] opacity-60">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                      </p>
                      {targetRoute && (
                        <button
                          type="button"
                          onClick={(e) => handleNotificationClick(e, notif)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold opacity-90 hover:opacity-100 hover:underline cursor-pointer bg-transparent border-none p-0 text-inherit transition-all"
                        >
                          Ir al módulo <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    aria-label="Eliminar notificación"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-full"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

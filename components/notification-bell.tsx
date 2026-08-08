"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

  // Polling usando API Route estable (no Server Action) para evitar errores de versión
  const pollNotifications = useCallback(async (showToasts = false) => {
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

        if (showToasts) {
          const newNotifs = data.filter(n => !n.isRead && !notifiedIds.current.has(n.id));
          newNotifs.forEach(n => {
            notifiedIds.current.add(n.id);
            if (n.type === 'ERROR') {
              toast.error(n.title, { description: n.message, duration: 5000 });
            } else if (n.type === 'WARNING') {
              toast.warning(n.title, { description: n.message, duration: 5000 });
            } else {
              toast.success(n.title, { description: n.message, duration: 5000 });
            }
          });
          setNotifications(data);
        } else {
          // Si no mostramos toasts (carga inicial), igual registramos los IDs para no mostrarlos luego
          data.forEach(n => notifiedIds.current.add(n.id));
          setNotifications(data);
        }
      }
    } catch {
      // Silently ignore network errors during polling
    }
  }, []);

  useEffect(() => {
    // Carga inicial usando API Route
    pollNotifications(false);
    
    // Polling rápido cada 5 segundos para actualización en tiempo real de notificaciones resueltas
    const interval = setInterval(() => {
      pollNotifications(true);
    }, 5000);

    return () => clearInterval(interval);
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

  const getNotificationRoute = (title: string, message: string) => {
    const text = `${title} ${message}`.toLowerCase();
    
    if (text.includes("venta") || text.includes("cobro")) {
      return "/dashboard/sales";
    }
    if (text.includes("producto") || text.includes("stock") || text.includes("inventario")) {
      return "/dashboard/products";
    }
    if (text.includes("compra") || text.includes("requisici") || text.includes("proveedor")) {
      return "/dashboard/compras";
    }
    if (text.includes("crm") || text.includes("oportunidad") || text.includes("cliente") || text.includes("cotizaci")) {
      return "/dashboard/crm";
    }
    if (text.includes("rrhh") || text.includes("empleado") || text.includes("nómina") || text.includes("nomina")) {
      return "/dashboard/rrhh";
    }
    if (text.includes("auditor") || text.includes("seguridad") || text.includes("log")) {
      return "/dashboard/audit";
    }
    if (text.includes("configuración") || text.includes("configuracion") || text.includes("empresa") || text.includes("ajuste")) {
      return "/dashboard/settings";
    }
    
    return null;
  };

  const handleNotificationClick = (notif: Notification) => {
    const targetRoute = getNotificationRoute(notif.title, notif.message);
    if (targetRoute) {
      setIsOpen(false);
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
        <Button aria-label="Notificaciones" variant="ghost" size="icon" className="relative rounded-full h-9 w-9 overflow-visible group">
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
                  onClick={() => handleNotificationClick(notif)}
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
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold opacity-90 group-hover:underline">
                          Ir al módulo <ExternalLink className="h-2.5 w-2.5" />
                        </span>
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

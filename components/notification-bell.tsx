"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserNotifications, markNotificationsAsRead, deleteNotification, clearAllNotifications } from "@/app/actions/notification-actions";
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = useCallback(async (showToasts = false) => {
    const res = await getUserNotifications();
    if (res.success && res.data) {
      const data = res.data as Notification[];
      
      if (showToasts) {
        setNotifications((prev) => {
          // Find new ones that weren't here before
          const newNotifs = data.filter(n => !n.isRead && !prev.find(old => old.id === n.id));
          newNotifs.forEach(n => {
            if (n.type === 'ERROR') {
              toast.error(n.title, { description: n.message, duration: 5000 });
            } else if (n.type === 'WARNING') {
              toast.warning(n.title, { description: n.message, duration: 5000 });
            } else {
              toast.success(n.title, { description: n.message, duration: 5000 });
            }
          });
          return data;
        });
      } else {
        setNotifications(data);
      }
      
      setUnreadCount(data.filter(n => !n.isRead).length);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(false);
    
    // Polling every 15 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      startTransition(async () => {
        await markNotificationsAsRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent closing dropdown
    const res = await deleteNotification(id);
    if (res.success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await clearAllNotifications();
    if (res.success) {
      setNotifications([]);
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
        <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 overflow-hidden group">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[480px] p-0 border-border/60 shadow-2xl rounded-2xl overflow-hidden">
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
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`relative group flex gap-3 px-3 py-2 rounded-xl transition-all border ${notif.isRead ? 'bg-transparent border-transparent' : 'bg-muted/30 border-border/50 shadow-sm'} hover:bg-muted/50`}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-primary animate-pulse'}`} />
                <div className={`flex-1 pr-8 rounded-md px-3 py-2 ${getTypeStyles(notif.type)}`}>
                  <p className="text-[12px] font-bold leading-tight">{notif.title}</p>
                  <p className="text-[11px] mt-1 opacity-90 leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] mt-1 opacity-60">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => handleDelete(e, notif.id)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

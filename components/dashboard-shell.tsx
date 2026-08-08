'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Folder,
  ShieldCheck,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Building2,
  Sun,
  Moon,
  ChevronDown,
  User,
  Key,
  X,
  LayoutDashboard,
  Boxes,
  Tags,
  Factory,
  ShoppingCart,
  Users,
  Truck,
  DollarSign,
  FileText,
  ShieldAlert,
  Settings,
  BarChart3,
  HelpCircle,
  Briefcase,
} from 'lucide-react';

const LucideIcons = {
  Folder,
  ShieldCheck,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Building2,
  Sun,
  Moon,
  ChevronDown,
  User,
  Key,
  X,
  LayoutDashboard,
  Boxes,
  Tags,
  Factory,
  ShoppingCart,
  Users,
  Truck,
  DollarSign,
  FileText,
  ShieldAlert,
  Settings,
  BarChart3,
  HelpCircle,
  Briefcase,
};
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notification-bell';
import { useTheme } from 'next-themes';

interface ModuleConfig {
  id: string;
  name: string;
  href: string | null;
  icon: string | null;
  description: string | null;
}

export function DashboardShell({ children, session, modules, themeConfig, companyName, companyLogo }: { 
  children: React.ReactNode; 
  session: { user?: { id?: string | number; name?: string | null; email?: string | null; role?: string; companyId?: string | null; image?: string | null } | null };
  modules?: ModuleConfig[];
  themeConfig?: { primaryColor?: string; mode?: string; bgImage?: string } | null;
  companyName?: string;
  companyLogo?: string | null;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const userId = session?.user?.id;
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {

    // Cargar preferencia de colapso de la barra lateral
    const storedCollapse = window.localStorage.getItem('gns_sidebar_collapsed');
    if (storedCollapse === 'true') {
      setIsCollapsed(true);
    }

    setMounted(true);
  }, []);

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      window.localStorage.setItem('gns_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogoutConfirm = async () => {
    const { confirmAction } = await import('@/lib/sweetalert');
    const confirmed = await confirmAction('¿Cerrar Sesión?', '¿Estás seguro que deseas salir del sistema?', 'Sí, salir', 'Cancelar');
    if (confirmed) {
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: '/auth/login' });
    }
  };

  // Prevent flash/hydration mismatch by rendering a skeleton or empty shell until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';
  const roleThemeClass = (isSuperAdmin && !themeConfig?.primaryColor) ? 'theme-superadmin' : '';
  const roleLabel = session?.user?.role === 'SUPERADMIN' ? 'Super Administrador' : session?.user?.role === 'ADMIN' ? 'Administrador' : 'Colaborador';

  const hasBgImage = !!(themeConfig?.bgImage);

  return (
    <div className={cn(
      "h-screen w-screen flex flex-col bg-background text-foreground transition-colors duration-500 font-sans overflow-hidden",
      roleThemeClass
    )}>

      {themeConfig?.primaryColor && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root, .dark, .theme-superadmin {
            --primary: ${themeConfig.primaryColor} !important;
            --ring: ${themeConfig.primaryColor} !important;
          }
        `}} />
      )}
      <div className="flex flex-1 overflow-hidden h-full relative z-10">
        
        {/* ── Sidebar (Desktop) ── */}
        {/* ── Sidebar (Desktop) ── */}
        {/* ── Sidebar (Desktop) ── */}
        {/* ── Sidebar (Desktop) ── */}
        {/* ── Sidebar (Desktop) ── */}
        <aside className={cn(
          "hidden flex-col border-r border-[#24242b]/80 bg-[#141417]/90 backdrop-blur-md text-[#f8fafc] shadow-2xl lg:flex transition-all duration-300 shrink-0 h-full overflow-hidden",
          isCollapsed ? "w-20 p-3 items-center" : "w-72 p-6"
        )}>
          {/* Logo Brand Principal GNS */}
          <div className={cn("mb-8 flex items-center gap-3 transition-all", isCollapsed ? "justify-center" : "w-full")}>
            <div 
              className="h-11 w-11 rounded-full overflow-hidden border-2 bg-black flex items-center justify-center shrink-0 shadow-lg shadow-primary/20"
              style={{ borderColor: themeConfig?.primaryColor || "#dc2626" }}
            >
              <img 
                src="/gns-logo.png" 
                alt="GNS SarriaTech" 
                className="h-full w-full object-cover rounded-full aspect-square" 
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight leading-none">
                  GNS SARRIATECH
                </span>
                <span 
                  className="text-[9px] font-extrabold uppercase tracking-wider mt-1 leading-none"
                  style={{ color: themeConfig?.primaryColor || "#ef4444" }}
                >
                  GESTIÓN DE NEGOCIOS
                </span>
              </div>
            )}
          </div>
          
          <nav className={cn("space-y-1.5 flex-1 w-full overflow-y-auto overflow-x-hidden dark-scrollbar pr-1", isCollapsed ? "px-1" : "px-2")}>
            {(modules || []).map((module) => {
                const IconComponent = module.icon && (LucideIcons as any)[module.icon] ? (LucideIcons as any)[module.icon] : LucideIcons.Folder;
                const itemHref = module.href || '#';
                const isActive = pathname === itemHref || (itemHref !== '/dashboard' && pathname.startsWith(itemHref));
                return (
                  <Link
                    key={module.id}
                    href={itemHref}
                    id={`tour-nav-${module.name.toLowerCase().replace(/\s+/g, '-')}`}
                    title={isCollapsed ? module.name : undefined}
                    style={isActive ? { backgroundColor: themeConfig?.primaryColor || "#dc2626" } : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl transition-all duration-300 font-semibold",
                      isCollapsed ? "p-3.5 justify-center" : "px-4 py-3 text-sm justify-start",
                      isActive
                        ? "text-white opacity-100 shadow-lg scale-[1.02]"
                        : "text-white/80 hover:bg-[#202028]/90 hover:text-white"
                    )}
                  >
                    <IconComponent size={20} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">{module.name}</span>}
                  </Link>
                );
              })}
          </nav>

          {/* User profile footer & Logout & Collapse Toggle */}
          <div className="mt-auto pt-4 border-t border-[#24242b]/80 w-full flex flex-col gap-3">
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between gap-2 w-full">
                  {/* Tarjeta de Usuario - Negro Gris al 90% */}
                  <div className="flex-1 flex items-center gap-3 bg-[#1a1a20]/90 border border-[#2a2a35]/80 p-2.5 rounded-2xl overflow-hidden shadow-sm min-w-0">
                    <div 
                      className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
                      style={{ borderColor: themeConfig?.primaryColor || "#dc2626" }}
                    >
                      <img 
                        src={session.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate leading-tight">
                        {session.user?.name ?? 'Usuario'}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] font-medium mt-0.5 truncate">
                        <LucideIcons.ShieldCheck size={12} className="shrink-0" style={{ color: themeConfig?.primaryColor || "#ef4444" }} />
                        <span className="truncate font-semibold" style={{ color: themeConfig?.primaryColor || "#ef4444" }}>{roleLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de Logout directo - 100% del color principal de la empresa */}
                  <button
                    type="button"
                    onClick={handleLogoutConfirm}
                    title="Cerrar Sesión"
                    style={{ backgroundColor: themeConfig?.primaryColor || "#dc2626" }}
                    className="h-12 w-12 rounded-2xl text-white opacity-100 hover:brightness-110 transition-all duration-300 flex items-center justify-center shrink-0 active:scale-95 shadow-md"
                  >
                    <LucideIcons.LogOut size={18} />
                  </button>
                </div>

                {/* Botón Colapsar << */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Colapsar Menú"
                  className="w-full py-2 rounded-xl text-white/50 hover:text-white hover:bg-[#202028]/90 transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <LucideIcons.ChevronsLeft size={18} />
                  <span>Colapsar Menú</span>
                </button>
              </>
            ) : (
              /* Modo Colapsado (Solo íconos) */
              <div className="flex flex-col items-center gap-3 w-full">
                <div 
                  className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 cursor-pointer" 
                  style={{ borderColor: themeConfig?.primaryColor || "#dc2626" }}
                  title={`${session.user?.name ?? 'Usuario'} (${roleLabel})`}
                >
                  <img 
                    src={session.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLogoutConfirm}
                  title="Cerrar Sesión"
                  style={{ backgroundColor: themeConfig?.primaryColor || "#dc2626" }}
                  className="h-10 w-10 rounded-xl text-white opacity-100 hover:brightness-110 transition-all flex items-center justify-center shrink-0 active:scale-95 shadow-md"
                >
                  <LucideIcons.LogOut size={16} />
                </button>

                {/* Botón Expandir >> */}
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Expandir Menú"
                  className="w-full py-2 rounded-xl text-white/50 hover:text-white hover:bg-[#202028]/90 transition flex items-center justify-center"
                >
                  <LucideIcons.ChevronsRight size={18} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {/* Imagen de fondo — solo ocupa el área de contenido, nunca el sidebar */}
          {hasBgImage && (
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: `url(${themeConfig!.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute inset-0 bg-background/40 dark:bg-[#09090b]/50 backdrop-blur-[1px]" />
            </div>
          )}
          
          {/* Header */}
          <header className={cn("flex items-center justify-between border-b border-border px-6 py-4 transition-colors duration-500 min-h-[73px] shrink-0 relative z-20", hasBgImage ? "bg-card/60 backdrop-blur-md" : "bg-card")}>
            <div className="flex items-center gap-3">
              <button
                aria-label="Menú principal"
                className="rounded-xl border border-border bg-card p-2.5 text-foreground hover:bg-muted transition lg:hidden"
                onClick={() => setIsMenuOpen(true)}
              >
                <LucideIcons.Menu size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl overflow-hidden border border-border/80 bg-muted/40 flex items-center justify-center shrink-0 shadow-sm relative">
                  {companyLogo ? (
                    <img 
                      src={companyLogo} 
                      alt={companyName || "Empresa"} 
                      className="h-full w-full object-cover scale-125 transition-transform" 
                    />
                  ) : (
                    <LucideIcons.Building2 size={20} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className={cn("text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1", hasBgImage ? "text-white drop-shadow-sm" : "text-foreground")}>
                    <span>EMPRESA:</span>
                    <span className="font-black">{companyName ? companyName.toUpperCase() : 'GLOBAL'}</span>
                  </p>
                  <h2 className={cn("text-sm sm:text-base font-black leading-tight", hasBgImage ? "text-white drop-shadow-sm" : "text-foreground")}>ERP Administrador</h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              {/* Theme Toggle Button */}
              <button
                id="tour-theme-toggle"
                className="rounded-xl border border-border bg-card p-2.5 text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
                onClick={handleToggleTheme}
                aria-label="Cambiar Tema"
              >
                {theme === 'dark' ? <LucideIcons.Sun size={16} className="text-primary" /> : <LucideIcons.Moon size={16} className="text-primary" />}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="tour-profile-menu"
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-card p-1.5 pr-3 text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
                    <img 
                      src={session.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-none text-foreground">{session.user?.name || "Usuario"}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">{session.user?.role || "Colaborador"}</span>
                  </div>
                  <LucideIcons.ChevronDown size={14} className={`text-muted-foreground transition duration-300 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileDropdownOpen && (
                  <>
                    {/* Backdrop para cerrar al hacer click fuera */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-11 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-card p-2.5 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="px-3.5 py-2 border-b border-border/60 mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Sesión activa</p>
                        <p className="text-xs font-semibold text-foreground truncate mt-0.5">{session.user?.email || ""}</p>
                      </div>
                      
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition"
                      >
                        <LucideIcons.User size={16} />
                        Mi Perfil
                      </Link>
                      
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition"
                      >
                        <LucideIcons.Key size={16} />
                        Seguridad
                      </Link>

                      <div className="border-t border-border/60 my-2" />

                      <button
                        onClick={async () => {
                          setIsProfileDropdownOpen(false);
                          const { confirmAction } = await import('@/lib/sweetalert');
                          const confirmed = await confirmAction('¿Cerrar Sesión?', '¿Estás seguro que deseas salir del sistema?', 'Sí, salir', 'Cancelar');
                          if (confirmed) {
                            const { signOut } = await import('next-auth/react');
                            await signOut({ callbackUrl: '/auth/login' });
                          }
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition"
                      >
                        <LucideIcons.LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Main page content wrapper */}
          <main className={cn("flex-1 overflow-y-auto p-6 transition-colors duration-500 relative", hasBgImage ? "bg-transparent has-bg-image" : "bg-background")}>
            {children}
          </main>
        </div>
      </div>

      {/* ── Sidebar (Mobile Drawer) ── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div
            className="h-full w-72 bg-[#141417]/90 backdrop-blur-md text-[#f8fafc] p-6 flex flex-col shadow-2xl border-r border-[#24242b]/80 animate-in slide-in-from-left duration-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-red-600 bg-black flex items-center justify-center shrink-0 shadow-md">
                  <img 
                    src="/gns-logo.png" 
                    alt="GNS SarriaTech" 
                    className="h-full w-full object-cover rounded-full aspect-square" 
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight leading-none">
                    GNS SARRIATECH
                  </span>
                  <span className="text-[9px] font-extrabold text-red-500 uppercase tracking-wider mt-1 leading-none">
                    GESTIÓN DE NEGOCIOS
                  </span>
                </div>
              </div>
              <button
                className="rounded-lg border border-[#2a2a35]/80 bg-[#1a1a20]/90 p-1.5 text-slate-300 hover:text-white transition"
                onClick={() => setIsMenuOpen(false)}
              >
                <LucideIcons.X size={18} />
              </button>
            </div>
            
            <nav className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden dark-scrollbar pr-1 px-2">
              {(modules || []).map((item) => {
                const IconComponent = item.icon && (LucideIcons as any)[item.icon] ? (LucideIcons as any)[item.icon] : LucideIcons.Folder;
                const itemHref = item.href || '#';
                const isActive = pathname === itemHref || (itemHref !== '/dashboard' && pathname.startsWith(itemHref));
                return (
                  <Link
                    key={item.id}
                    href={itemHref}
                    style={isActive ? { backgroundColor: themeConfig?.primaryColor || "#dc2626" } : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all text-white",
                      isActive
                        ? "opacity-100 shadow-md"
                        : "text-slate-300 hover:bg-[#202028]/90 hover:text-white"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <IconComponent size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border border-border/80 bg-muted/20 p-4 rounded-xl mt-auto">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usuario</p>
              <p className="text-sm font-bold text-foreground truncate">{session.user?.name ?? 'Usuario GNS'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

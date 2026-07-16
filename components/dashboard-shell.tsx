'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleConfig {
  id: string;
  name: string;
  href: string | null;
  icon: string | null;
  description: string | null;
}

export function DashboardShell({ children, session, modules, themeConfig, companyName }: { 
  children: React.ReactNode; 
  session: { user?: { id?: string | number; name?: string | null; email?: string | null; role?: string; companyId?: string | null; image?: string | null } | null };
  modules?: ModuleConfig[];
  themeConfig?: { primaryColor?: string; mode?: string } | null;
  companyName?: string;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = themeConfig?.mode ? (themeConfig.mode as 'dark' | 'light') : (stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // Prevent flash/hydration mismatch by rendering a skeleton or empty shell until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-[#17121F]" />;
  }

  const isSuperAdmin = session?.user?.role === 'SUPERADMIN';
  const roleThemeClass = isSuperAdmin ? 'theme-superadmin' : '';

  return (
    <div className={cn("h-screen w-screen flex flex-col bg-background text-foreground transition-colors duration-500 font-sans overflow-hidden", roleThemeClass)}>
      {themeConfig?.primaryColor && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${themeConfig.primaryColor};
            --ring: ${themeConfig.primaryColor};
          }
          .dark {
            --primary: ${themeConfig.primaryColor};
            --ring: ${themeConfig.primaryColor};
            --background: #09090b;
            --card: #141417;
          }
        `}} />
      )}
      <div className="flex flex-1 overflow-hidden h-full">
        
        {/* ── Sidebar (Desktop) ── */}
        <aside className="hidden w-72 flex-col border-r border-border/60 bg-card p-6 shadow-xl lg:flex transition-colors duration-500 shrink-0 h-full overflow-y-auto">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LucideIcons.Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.25em] uppercase text-foreground">GNS SARRIA</p>
              <p className="text-[10px] font-bold tracking-wider text-primary uppercase">Gestión de Negocios</p>
            </div>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            {(modules || []).map((item) => {
                const IconComponent = item.icon && (LucideIcons as any)[item.icon] ? (LucideIcons as any)[item.icon] : LucideIcons.Folder;
                const itemHref = item.href || '#';
                const isActive = pathname === itemHref || (itemHref !== '/dashboard' && pathname.startsWith(itemHref));
                return (
                  <Link
                    key={item.id}
                    href={itemHref}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    )}
                  >
                    <IconComponent size={18} />
                    {item.name}
                  </Link>
                );
              })}
          </nav>

          {/* User profile footer info */}
          <div className="mt-auto border border-border/80 bg-muted/20 p-4 rounded-2xl flex flex-col gap-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sesión Activa</p>
            <p className="text-sm font-bold text-foreground truncate">{session.user?.name ?? 'Usuario GNS'}</p>
            <p className="text-xs text-muted-foreground truncate">{session.user?.email ?? ''}</p>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* Header */}
          <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 transition-colors duration-500 min-h-[73px] shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-border bg-card p-2.5 text-foreground hover:bg-muted transition lg:hidden"
                onClick={() => setIsMenuOpen(true)}
              >
                <LucideIcons.Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {companyName ? `Empresa: ${companyName}` : 'Panel de Control'}
                </p>
                <h2 className="text-base font-bold text-foreground">ERP Administrador</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                className="rounded-xl border border-border bg-card p-2.5 text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Cambiar Tema"
              >
                {theme === 'dark' ? <LucideIcons.Sun size={16} className="text-primary" /> : <LucideIcons.Moon size={16} className="text-primary" />}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-1.5 pr-3 text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
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
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileDropdownOpen(false)} />
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-11 z-20 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-card p-2.5 shadow-xl animate-in fade-in slide-in-from-top-3 duration-200">
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
          <main className="flex-1 overflow-y-auto p-6 bg-background transition-colors duration-500">
            {children}
          </main>
        </div>
      </div>

      {/* ── Sidebar (Mobile Drawer) ── */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black" onClick={() => setIsMenuOpen(false)}>
          <div
            className="h-full w-72 bg-card p-6 flex flex-col shadow-2xl border-r border-border animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <LucideIcons.Sparkles size={16} />
                </div>
                <span className="font-display-lg text-sm tracking-[0.2em] font-semibold text-foreground">
                  GNS SARRIA
                </span>
              </div>
              <button
                className="rounded-lg border border-border p-1.5 text-foreground hover:bg-muted transition"
                onClick={() => setIsMenuOpen(false)}
              >
                <LucideIcons.X size={18} />
              </button>
            </div>
            
            <nav className="space-y-1.5 flex-1">
              {(modules || []).map((item) => {
                const IconComponent = item.icon && (LucideIcons as any)[item.icon] ? (LucideIcons as any)[item.icon] : LucideIcons.Folder;
                const itemHref = item.href || '#';
                const isActive = pathname === itemHref || (itemHref !== '/dashboard' && pathname.startsWith(itemHref));
                return (
                  <Link
                    key={item.id}
                    href={itemHref}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
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

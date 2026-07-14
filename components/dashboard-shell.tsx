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

export function DashboardShell({ children, session, modules, themeConfig }: { 
  children: React.ReactNode; 
  session: { user?: { name?: string | null; email?: string | null; role?: string; companyId?: string | null } | null };
  modules?: ModuleConfig[];
  themeConfig?: { primaryColor?: string; mode?: string } | null;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground transition-colors duration-500 font-sans overflow-hidden">
      {themeConfig?.primaryColor && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${themeConfig.primaryColor};
            --ring: ${themeConfig.primaryColor};
          }
          .dark {
            --primary: ${themeConfig.primaryColor};
            --ring: ${themeConfig.primaryColor};
            --background: color-mix(in srgb, ${themeConfig.primaryColor} 6%, #09090b);
            --card: color-mix(in srgb, ${themeConfig.primaryColor} 12%, #141417);
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
              <p className="text-sm font-bold tracking-[0.25em] uppercase text-foreground">Dulche Dorelle</p>
              <p className="text-[10px] font-bold tracking-wider text-primary uppercase">Maison Business</p>
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
            <p className="text-sm font-bold text-foreground truncate">{session.user?.name ?? 'Usuario Dulche'}</p>
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
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Panel de Control</p>
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

              {/* Logout Button */}
              <button
                onClick={async () => {
                  const { confirmAction } = await import('@/lib/sweetalert');
                  const confirmed = await confirmAction('¿Cerrar Sesión?', '¿Estás seguro que deseas salir del sistema?', 'Sí, salir', 'Cancelar');
                  if (confirmed) {
                    const { signOut } = await import('next-auth/react');
                    await signOut({ callbackUrl: '/auth/login' });
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 shadow-sm"
              >
                <LucideIcons.LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
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
                  DULCHE
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
              <p className="text-sm font-bold text-foreground truncate">{session.user?.name ?? 'Usuario Dulche'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

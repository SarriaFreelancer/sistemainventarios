'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Boxes, Factory, LayoutDashboard, LogOut, Moon, Sun, Tags, Menu, X, ShoppingCart, Sparkles, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

const menu = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Productos', href: '/dashboard/products', icon: Boxes },
  { label: 'Grupos', href: '/dashboard/groups', icon: Folder },
  { label: 'Categorías', href: '/dashboard/categories', icon: Tags },
  { label: 'Proveedores', href: '/dashboard/suppliers', icon: Factory },
  { label: 'Ventas', href: '/dashboard/sales', icon: ShoppingCart },
];

export function DashboardShell({ children, session }: { children: React.ReactNode; session: { user?: { name?: string | null; email?: string | null } | null } }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
      <div className="flex flex-1 overflow-hidden h-full">
        
        {/* ── Sidebar (Desktop) ── */}
        <aside className="hidden w-72 flex-col border-r border-border/60 bg-card p-6 shadow-xl lg:flex transition-colors duration-500 shrink-0 h-full overflow-y-auto">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#B18ACF] to-[#8B5CF6] text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.25em] uppercase text-foreground">Dulche Dorelle</p>
              <p className="text-[10px] font-bold tracking-wider text-primary uppercase">Maison Business</p>
            </div>
          </div>
          
          <nav className="space-y-1.5 flex-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-[#B18ACF] to-[#8B5CF6] text-white shadow-lg shadow-violet-500/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
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
          <header className="flex items-center justify-between border-b border-border/60 bg-card/65 px-6 py-4 backdrop-blur-xl transition-colors duration-500 min-h-[73px] shrink-0">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-border bg-card p-2.5 text-foreground hover:bg-muted transition lg:hidden"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Panel de Control</p>
                <h2 className="text-base font-bold text-foreground">ERP Administrador</h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle Button */}
              <button
                className="rounded-xl border border-border/80 bg-card p-2.5 text-foreground hover:bg-muted transition-all active:scale-95 shadow-sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Cambiar Tema"
              >
                {theme === 'dark' ? <Sun size={16} className="text-[#D8C1EC]" /> : <Moon size={16} className="text-[#8B5CF6]" />}
              </button>

              {/* Logout Button */}
              <a
                href="/api/auth/signout?callbackUrl=/auth/login"
                className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-all active:scale-95 shadow-sm"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </a>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden" onClick={() => setIsMenuOpen(false)}>
          <div
            className="h-full w-72 bg-card p-6 flex flex-col shadow-2xl border-r border-border animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-[#B18ACF] to-[#8B5CF6] text-white">
                  <Sparkles size={16} />
                </div>
                <span className="font-display-lg text-sm tracking-[0.2em] font-semibold text-foreground">
                  DULCHE
                </span>
              </div>
              <button
                className="rounded-lg border border-border p-1.5 text-foreground hover:bg-muted transition"
                onClick={() => setIsMenuOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            
            <nav className="space-y-1.5 flex-1">
              {menu.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-gradient-to-r from-[#B18ACF] to-[#8B5CF6] text-white shadow-md"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon size={18} />
                    {item.label}
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

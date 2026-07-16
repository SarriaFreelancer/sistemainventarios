import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(155,77,255,0.12),_transparent_45%),linear-gradient(135deg,_#ffffff_0%,_#f5f0ff_100%)] px-6 py-20">
      <div className="w-full max-w-5xl rounded-[32px] border border-brand-100 bg-white p-10 shadow-2xl">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
              <Sparkles size={16} />
              Belleza que inspira, confianza que transforma.
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              GNS Gestión de Negocios SarriaTech
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              Gestiona categorías, proveedores, productos y ventas con una experiencia elegante, rápida y preparada para crecer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
              >
                Ingresar al sistema
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted hover:text-foreground"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Dashboard</p>
            <p className="mt-3 text-3xl font-semibold">Control total</p>
            <p className="mt-3 text-sm text-slate-300">Inventario, ventas y operaciones centralizadas desde una sola plataforma.</p>
            <div className="mt-6 flex items-center gap-2 text-sm text-brand-200">
              Explorar <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

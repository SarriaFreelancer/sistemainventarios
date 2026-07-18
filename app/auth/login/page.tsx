"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Sparkles, Mail, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { successAlert, errorAlert, brandAlert } from '@/lib/sweetalert';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false
    }
  });

  useEffect(() => {
    async function loadCsrf() {
      const response = await fetch('/api/auth/csrf');
      const data = await response.json();
      setCsrfToken(data.csrfToken ?? '');
    }

    loadCsrf();
  }, []);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (!csrfToken) {
      errorAlert('Error de Autenticación', 'No se pudo obtener el token de seguridad. Recarga la página e intenta de nuevo.');
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        csrfToken,
        callbackUrl: '/dashboard',
        remember: values.rememberMe,
      });

      if (result?.ok) {
        successAlert('Acceso Autorizado', 'Bienvenido al panel de control de GNS');
        router.push('/dashboard');
        return;
      }

      errorAlert('Error de Autenticación', result?.error ? 'Credenciales incorrectas. Inténtalo de nuevo.' : 'No fue posible iniciar sesión.');
    } catch (err) {
      errorAlert('Error de Conexión', 'Ocurrió un problema al comunicarse con el servidor.');
    }
  };

  const handleRecoverPassword = async () => {
    const { value: email } = await brandAlert.fire({
      title: 'Recuperar Contraseña',
      text: 'Introduce tu dirección de correo electrónico y te enviaremos las instrucciones.',
      input: 'email',
      inputPlaceholder: 'tu-correo@sarriatech.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar instrucciones',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-3xl border border-border bg-card text-foreground font-sans shadow-2xl p-6',
        input: 'flex h-12 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition mt-4 mb-2',
        confirmButton: 'bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold text-sm hover:opacity-95 transition mr-2',
        cancelButton: 'bg-secondary/10 hover:bg-secondary/20 border border-border text-foreground rounded-xl px-6 py-3 font-semibold text-sm transition ml-2',
      },
      buttonsStyling: false,
    });

    if (email) {
      successAlert('Enlace Enviado', `Hemos enviado las instrucciones a ${email}`);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(185,28,28,0.08),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(197,160,89,0.08),_transparent_45%),linear-gradient(135deg,_var(--background)_0%,_var(--background)_100%)] px-6 py-10 transition-colors duration-500">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[40px] border border-border bg-card shadow-2xl lg:grid-cols-[1.05fr_0.95fr] transition-colors duration-500">
        
        {/* Panel Izquierdo: Branding & Visuals */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#1c1112] to-[#0a0506] p-12 text-white">
          {/* Abstract Satin Glow Shapes */}
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#b91c1c]/10 blur-[100px]" />
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#C5A059]/10 blur-[100px]" />
          
          {/* Floating gold sparkle sparkles */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-[#C5A059] shadow-md shadow-red-900/30 text-white">
              <Sparkles size={20} className="text-amber-100" />
            </div>
            <span className="font-display-lg text-xl tracking-[0.2em] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#C5A059]">
              GNS SARRIATECH
            </span>
          </div>

          <div className="relative z-10 my-auto space-y-6">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#C5A059]">Gestión de Negocios</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#C5A059]">
              Control total e inteligente para su organización
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Bienvenido al sistema ERP corporativo de GNS SarriaTech. Supervise existencias, administre canales de facturación y analice tendencias comerciales desde una única plataforma unificada.
            </p>

            {/* Simulación visual de dashboard sutil en el branding panel */}
            <div className="border border-white/10 rounded-2xl bg-white/5 p-4.5 space-y-3.5 backdrop-blur-sm max-w-sm mt-4">
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Desempeño Mensual</span>
                <span className="text-emerald-400 font-bold">+24.5%</span>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
                <div className="w-full bg-white/10 h-8 rounded" />
                <div className="w-full bg-white/10 h-10 rounded" />
                <div className="w-full bg-white/10 h-14 rounded" />
                <div className="w-full bg-gradient-to-t from-primary to-[#C5A059] h-16 rounded shadow-md shadow-red-500/20" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-500">
            <span>© 2026 GNS SarriaTech</span>
            <span>Premium Business System</span>
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="flex flex-col justify-center p-8 sm:p-12 md:p-16">
          <div className="mb-8">
            {/* Small mobile branding header */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-primary to-[#C5A059] text-white">
                <Sparkles size={16} />
              </div>
              <span className="font-display-lg text-sm tracking-[0.2em] font-semibold text-foreground">
                GNS SARRIATECH
              </span>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Introduce tus credenciales corporativas para acceder al panel.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Campo Correo */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Correo Electrónico
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 h-5 w-5 text-muted-foreground/45" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  {...register('email')}
                  className="pl-12 border-border/80 bg-card/40 focus:bg-card focus:border-primary"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                  Contraseña
                </Label>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 h-5 w-5 text-muted-foreground/45" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className="pl-12 pr-12 border-border/80 bg-card/40 focus:bg-card focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Recordarme y Recuperar Contraseña */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...register('rememberMe')}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded-lg border border-border bg-card/40 transition peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center" />
                  <Check className="absolute h-3 w-3 text-white dark:text-slate-900 opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span>Recordarme</span>
              </label>
              
              <button
                type="button"
                onClick={handleRecoverPassword}
                className="font-medium text-primary hover:underline transition"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de Ingreso */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-[#C5A059] text-white hover:opacity-95 transition shadow-lg shadow-red-500/10 active:scale-[0.98]"
            >
              {isSubmitting ? 'Verificando...' : 'Acceder al Sistema'}
            </Button>
          </form>

          {/* Footer Móvil / Registro Link */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta corporativa?{' '}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline transition">
              Regístrate ahora
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}

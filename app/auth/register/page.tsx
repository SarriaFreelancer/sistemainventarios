"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { successAlert, errorAlert } from '@/lib/sweetalert';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre completo es obligatorio (mínimo 2 letras)'),
  email: z.string().email('Ingresa un correo electrónico corporativo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: values.name, email: values.email, password: values.password })
      });
      
      if (response.ok) {
        successAlert('Registro Exitoso', 'Tu cuenta corporativa ha sido creada. Por favor, inicia sesión.');
        router.push('/auth/login');
        return;
      }
      
      const data = await response.json();
      errorAlert('Error en Registro', data.message || 'No fue posible crear la cuenta.');
    } catch (err) {
      errorAlert('Error de Conexión', 'Ocurrió un problema al comunicarse con el servidor.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(216,193,236,0.3),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(177,138,207,0.25),_transparent_45%),linear-gradient(135deg,_var(--background)_0%,_var(--background)_100%)] px-6 py-10 transition-colors duration-500">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[40px] border border-border/40 bg-card/65 shadow-[0_30px_100px_rgba(139,92,246,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] transition-colors duration-500">
        
        {/* Panel Izquierdo: Branding */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#1E152A] to-[#120D1A] p-12 text-white">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-[100px]" />
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#E5A9B4]/15 blur-[100px]" />
          
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#B18ACF] to-[#E5A9B4] text-white">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <span className="font-display-lg text-xl tracking-[0.2em] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#D8C1EC]">
              DULCHE DORELLE
            </span>
          </div>

          <div className="relative z-10 my-auto space-y-6">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#E5A9B4]">Maison de Beauté</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#F5C2C9] to-[#D8C1EC]">
              Únete a nuestra exclusiva red de administración
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              Crea tu perfil corporativo de Dulche Dorelle y accede a la suite integrada de administración de inventarios, facturación rápida, y reportes de rentabilidad.
            </p>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
            <span>© 2026 Dulche Dorelle S.A.</span>
            <span>Premium Business System</span>
          </div>
        </div>

        {/* Panel Derecho: Formulario */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Registra tus datos para darte de alta en la plataforma corporativa.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Campo Nombre */}
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Nombre Completo
              </Label>
              <div className="relative flex items-center">
                <User className="absolute left-4 h-5 w-5 text-muted-foreground/45" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  {...register('name')}
                  className="pl-12 border-border/80 bg-card/40 focus:bg-card focus:border-primary"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Campo Correo */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Correo Electrónico
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 h-5 w-5 text-muted-foreground/45" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@dulchedorelle.com"
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
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Contraseña
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 h-5 w-5 text-muted-foreground/45" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
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

            {/* Confirmar Contraseña */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                Confirmar Contraseña
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 h-5 w-5 text-muted-foreground/45" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('confirmPassword')}
                  className="pl-12 pr-12 border-border/80 bg-card/40 focus:bg-card focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-500 font-semibold mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Botón de Registro */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#B18ACF] to-[#8B5CF6] text-white hover:opacity-95 transition shadow-lg shadow-violet-500/20 active:scale-[0.98]"
            >
              {isSubmitting ? 'Registrando...' : 'Crear mi Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya eres miembro?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline transition">
              Inicia sesión
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}

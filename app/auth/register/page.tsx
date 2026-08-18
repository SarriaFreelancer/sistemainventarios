"use client";

import Link from 'next/link';
import Image from 'next/image';
import gnsLogo from '@/public/gns-logo.png';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { 
  Sparkles, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  Rocket, 
  ArrowRight, 
  BarChart3, 
  ShieldCheck, 
  Cloud,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { successAlert, errorAlert } from '@/lib/sweetalert';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre completo es obligatorio (mínimo 2 letras)'),
  companyName: z.string().min(2, 'El nombre de la empresa es obligatorio (mínimo 2 letras)'),
  email: z.string().email('Ingresa un correo electrónico corporativo válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export default function RegisterPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema)
  });

  const passwordValue = watch('password', '');

  // Cálculo de fuerza de contraseña
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: values.name, 
          companyName: values.companyName, 
          email: values.email, 
          password: values.password 
        })
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
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-[#070b14] py-3 px-3 sm:px-4 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
      {/* Contenedor Principal Tarjeta Bipartita Alineada con la Imagen */}
      <div className="w-full max-w-[880px] grid grid-cols-1 lg:grid-cols-[1fr_1fr] bg-white dark:bg-[#0b1329] rounded-[24px] overflow-hidden shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] border border-slate-200 dark:border-slate-800/80 transition-colors duration-300">
        
        {/* ── PANEL IZQUIERDO: BRANDING CORPORATIVO OSCURO ── */}
        <div className="relative hidden lg:flex flex-col justify-between bg-[#040919] p-6 lg:p-7 text-white overflow-hidden border-r border-slate-800/60">
          
          {/* Destellos y efectos de luz de fondo */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Header Marca */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-full overflow-hidden border-2 border-blue-500 bg-black flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Image 
                src={gnsLogo} 
                alt="GNS SarriaTech" 
                className="h-full w-full object-cover rounded-full aspect-square" 
                priority
              />
            </div>
            <span className="text-sm font-black tracking-wider uppercase text-white">
              GNS <span className="text-blue-400">SARRIATECH</span>
            </span>
          </div>

          {/* Cuerpo Central */}
          <div className="relative z-10 my-auto space-y-3 max-w-sm">
            <div className="inline-block px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="text-[9px] font-extrabold tracking-widest text-blue-400 uppercase">
                GESTIÓN DE NEGOCIOS
              </span>
            </div>

            <h1 className="text-xl lg:text-2xl font-extrabold leading-[1.2] text-white tracking-tight">
              Inicie la digitalización de sus <span className="text-blue-400">operaciones</span> hoy
            </h1>

            <p className="text-[11px] text-slate-300 leading-snug">
              Cree su perfil corporativo en GNS y acceda a una suite integrada para el control de inventario, ventas, compras, facturación y analíticas en tiempo real.
            </p>

            {/* Badges horizontales de características */}
            <div className="grid grid-cols-3 gap-1 pt-1">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0a1329] border border-blue-500/20 text-slate-200">
                <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 shrink-0">
                  <BarChart3 className="w-3 h-3" />
                </div>
                <span className="text-[8.5px] font-bold leading-tight">Analíticas tiempo real</span>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0a1329] border border-blue-500/20 text-slate-200">
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <span className="text-[8.5px] font-bold leading-tight">Seguridad empresarial</span>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0a1329] border border-blue-500/20 text-slate-200">
                <div className="p-1 rounded-md bg-purple-500/20 text-purple-400 shrink-0">
                  <Cloud className="w-3 h-3" />
                </div>
                <span className="text-[8.5px] font-bold leading-tight">Acceso en todo lugar</span>
              </div>
            </div>

            {/* Ilustración Mockup de Dashboard */}
            <div className="relative mt-2 rounded-lg overflow-hidden border border-blue-500/30 bg-gradient-to-b from-[#0c1838] to-[#060c1e] p-2 shadow-lg group">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="text-[7.5px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded-full">gns-app.com</div>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5">
                <div className="col-span-2 space-y-1">
                  <div className="h-2 w-16 bg-blue-500/30 rounded" />
                  <div className="h-10 w-full rounded-md bg-blue-500/10 border border-blue-500/20 p-1 flex flex-col justify-between">
                    <div className="flex justify-between text-[7.5px] text-blue-300 font-bold">
                      <span>Ventas del Mes</span>
                      <span className="text-emerald-400">+28.5%</span>
                    </div>
                    <svg className="w-full h-4 text-blue-400" viewBox="0 0 100 30" fill="none" stroke="currentColor">
                      <path d="M0 25 Q 20 10, 40 18 T 80 5 T 100 12" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="col-span-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 p-1 flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mb-0.5" />
                  <span className="text-[7.5px] font-extrabold text-slate-200">Suite Integrada</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Izquierdo */}
          <div className="relative z-10 flex items-center justify-between text-[9.5px] text-slate-500 font-medium pt-2 border-t border-slate-800/80">
            <span>© 2026 GNS SarriaTech</span>
            <span className="text-blue-400/80">Premium Business System</span>
          </div>
        </div>

        {/* ── PANEL DERECHO: FORMULARIO DE REGISTRO ── */}
        <div className="relative flex flex-col justify-center p-5 sm:p-6 lg:p-7 bg-white dark:bg-[#0b1329]">
          
          {/* Botón Flotante para Alternar Tema (Sol / Luna) */}
          {mounted && (
            <button 
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-amber-400 transition-all border border-slate-200 dark:border-slate-700/60 shadow-sm z-20 cursor-pointer active:scale-95"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {/* Header Mobile Brand (Solo en pantallas pequeñas) */}
          <div className="lg:hidden flex items-center gap-2 mb-2.5">
            <div className="h-7 w-7 rounded-full overflow-hidden border-2 border-blue-500 bg-black flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Image 
                src={gnsLogo} 
                alt="GNS SarriaTech" 
                className="h-full w-full object-cover rounded-full aspect-square" 
              />
            </div>
            <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
              GNS <span className="text-blue-600 dark:text-blue-400">SARRIATECH</span>
            </span>
          </div>

          {/* Encabezado del Formulario (Centrado) */}
          <div className="mb-3 text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Crear Cuenta
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Registra tus datos para darte de alta en la plataforma corporativa.
            </p>
          </div>

          <form className="space-y-2.5" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Campo NOMBRE COMPLETO */}
            <div className="space-y-0.5">
              <Label htmlFor="name" className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                Nombre Completo
              </Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  {...register('name')}
                  className="pl-9 h-9 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>
              {errors.name && (
                <p className="text-[9.5px] text-rose-500 font-semibold mt-0.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Campo NOMBRE DE LA EMPRESA */}
            <div className="space-y-0.5">
              <Label htmlFor="companyName" className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                Nombre de la Empresa
              </Label>
              <div className="relative flex items-center">
                <Building2 className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Tu empresa"
                  {...register('companyName')}
                  className="pl-9 h-9 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>
              {errors.companyName && (
                <p className="text-[9.5px] text-rose-500 font-semibold mt-0.5">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Campo CORREO ELECTRÓNICO */}
            <div className="space-y-0.5">
              <Label htmlFor="email" className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                Correo Electrónico
              </Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  {...register('email')}
                  className="pl-9 h-9 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>
              {errors.email && (
                <p className="text-[9.5px] text-rose-500 font-semibold mt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo CONTRASEÑA */}
            <div className="space-y-0.5">
              <Label htmlFor="password" className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                Contraseña
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crea una contraseña segura"
                  {...register('password')}
                  className="pl-9 pr-9 h-9 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Barra Indicadora de Fuerza de Contraseña */}
              <div className="pt-0.5 space-y-0.5">
                <div className="grid grid-cols-4 gap-1 h-1">
                  <div className={`rounded-full transition-all duration-300 ${strength >= 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`rounded-full transition-all duration-300 ${strength >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`rounded-full transition-all duration-300 ${strength >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  <div className={`rounded-full transition-all duration-300 ${strength >= 4 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                </div>
                <p className="text-[9px] text-slate-400 font-medium leading-tight">
                  Usa al menos 8 caracteres con mayúsculas, números y símbolos.
                </p>
              </div>

              {errors.password && (
                <p className="text-[9.5px] text-rose-500 font-semibold mt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Campo CONFIRMAR CONTRASEÑA */}
            <div className="space-y-0.5">
              <Label htmlFor="confirmPassword" className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                Confirmar Contraseña
              </Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  {...register('confirmPassword')}
                  className="pl-9 pr-9 h-9 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[9.5px] text-rose-500 font-semibold mt-0.5">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Botón Submit: Crear mi Cuenta */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2.5 h-10 text-xs font-extrabold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registrando...' : 'Crear mi Cuenta'}</span>
            </Button>

            {/* Divisor "o continúa con" */}
            <div className="relative my-2.5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative bg-white dark:bg-[#0b1329] px-2.5 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                o continúa con
              </span>
            </div>

            {/* Botón Continuar con Google */}
            <div className="pt-0.5 pb-0.5">
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-extrabold flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
            </div>
          </form>

          {/* Link Iniciar Sesión */}
          <div className="mt-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            ¿Ya eres miembro?{' '}
            <Link 
              href="/auth/login" 
              className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 transition"
            >
              Inicia sesión <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}

"use client";

import Link from 'next/link';
import Image from 'next/image';
import gnsLogo from '@/public/gns-logo.png';
import { useEffect, useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Headphones,
  LogIn,
  ChevronRight,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { successAlert, brandAlert } from '@/lib/sweetalert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico corporativo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const reason = urlParams.get('reason');
      if (reason === 'inactivity') {
        setAuthStatus({
          type: 'error',
          message: 'Tu sesión ha finalizado automáticamente tras 30 minutos de inactividad por seguridad.',
        });
      } else if (reason === 'admin_disconnect') {
        setAuthStatus({
          type: 'error',
          message: 'Tu sesión ha sido finalizada por un administrador del sistema.',
        });
      } else if (reason === 'deleted') {
        setAuthStatus({
          type: 'error',
          message: 'Tu cuenta o empresa no existe o fue eliminada. Por favor regístrate nuevamente y activa un plan.',
        });
      } else if (reason === 'suspended') {
        setAuthStatus({
          type: 'error',
          message: 'La empresa se encuentra inactiva o con licencia suspendida. Comunícate con el administrador.',
        });
      }
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setAuthStatus({ type: null, message: '' });
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl: '/dashboard',
        remember: values.rememberMe,
      });

      if (result?.ok) {
        const session = await getSession();
        const user = session?.user;

        // Si no es SuperAdmin y la empresa no está activa, alertar y enviar a planes
        if (user && user.role !== 'SUPERADMIN' && user.companyStatus !== 'ACTIVE') {
          const Swal = (await import('sweetalert2')).default;
          await Swal.fire({
            icon: 'info',
            title: 'Licencia Pendiente de Activación',
            text: 'Tu cuenta corporativa no tiene una licencia activa. Por favor, selecciona y adquiere un plan para activar tu sistema.',
            confirmButtonText: 'Ver Planes de Licencia',
            confirmButtonColor: '#dc2626',
            allowOutsideClick: false,
            allowEscapeKey: false
          });
          router.replace('/#planes');
          return;
        }

        setAuthStatus({
          type: 'success',
          message: '¡Acceso autorizado correctamente! Ingresando al sistema...',
        });
        router.replace('/dashboard');
        return;
      }

      let errorMessage = 'Correo electrónico o contraseña incorrectos. Verifica tus credenciales.';
      if (result?.error && result.error !== 'CredentialsSignin') {
        errorMessage = result.error;
      }

      setAuthStatus({
        type: 'error',
        message: errorMessage,
      });
    } catch (err) {
      setAuthStatus({
        type: 'error',
        message: 'Error de conexión con el servidor. Inténtalo más tarde.',
      });
    }
  };

  const handleRecoverPassword = async () => {
    const { value: email } = await brandAlert.fire({
      title: 'Recuperar Contraseña',
      text: 'Introduce tu correo y te enviaremos instrucciones.',
      input: 'email',
      inputPlaceholder: 'tu-correo@empresa.com',
      showCancelButton: true,
      confirmButtonText: 'Enviar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl border border-gray-100 shadow-2xl p-6 bg-white',
        input: 'flex h-11 w-full rounded-xl border border-gray-200 px-4 py-2 mt-4 text-xs font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition',
        confirmButton: 'bg-blue-600 text-white rounded-xl px-6 py-2.5 font-bold text-xs transition cursor-pointer',
        cancelButton: 'bg-gray-100 text-gray-600 rounded-xl px-6 py-2.5 font-bold text-xs transition ml-2 cursor-pointer',
      },
      buttonsStyling: false,
    });
    if (email) {
      successAlert('Enlace Enviado', `Instrucciones enviadas a ${email}`);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-[#070b14] p-3 sm:p-4 lg:p-6 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-300">
      {/* Contenedor Principal Tarjeta Bipartita Compacta */}
      <div className="w-full max-w-[940px] grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] bg-white dark:bg-[#0b1329] rounded-[24px] lg:rounded-[30px] overflow-hidden shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-slate-200 dark:border-slate-800/80 transition-colors duration-300">

        {/* ── PANEL IZQUIERDO: BRANDING CORPORATIVO OSCURO ── */}
        <div className="relative hidden lg:flex flex-col justify-between bg-[#040919] p-7 lg:p-8 text-white overflow-hidden border-r border-slate-800/60">

          {/* Destellos y efectos de luz de fondo (Blue & Indigo glow) */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none" />

          {/* Header Marca */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-blue-500 bg-black flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Image
                src={gnsLogo}
                alt="GNS SarriaTech"
                className="h-full w-full object-cover rounded-full aspect-square"
                priority
              />
            </div>
            <div>
              <span className="text-base font-black tracking-wider uppercase text-white block leading-none">
                GNS <span className="text-blue-400">SARRIATECH</span>
              </span>
              <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mt-0.5 block">
                Gestión de Negocios
              </span>
            </div>
          </div>

          {/* Cuerpo Central */}
          <div className="relative z-10 my-auto space-y-4 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-extrabold tracking-widest text-blue-400 uppercase">
                PLATAFORMA INTELIGENTE
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold leading-[1.2] text-white tracking-tight">
              Lleva el control total de <span className="text-blue-400">tu empresa</span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Administra inventarios, ventas, compras, clientes y finanzas desde un solo lugar.
            </p>

            {/* Badges horizontales de características */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0a1329] border border-blue-500/20 text-slate-200 text-center">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 mb-1">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold leading-tight">Inventario en tiempo real</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0a1329] border border-purple-500/20 text-slate-200 text-center">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 mb-1">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold leading-tight">Ventas y Compras</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0a1329] border border-emerald-500/20 text-slate-200 text-center">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mb-1">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold leading-tight">Reportes inteligentes</span>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0a1329] border border-amber-500/20 text-slate-200 text-center">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mb-1">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold leading-tight">Seguro y confiable</span>
              </div>
            </div>

            {/* Ilustración Mockup de Dashboard */}
            <div className="relative mt-3 rounded-xl overflow-hidden border border-blue-500/30 bg-gradient-to-b from-[#0c1838] to-[#060c1e] p-3 shadow-xl group">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-black text-slate-300">GNS</span>
                </div>
                <div className="text-[8px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded-full">Resumen general</div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-2">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[7.5px] text-slate-400 font-bold">Ventas hoy</div>
                  <div className="text-[9px] font-black text-white">$24,580,000</div>
                  <div className="text-[7px] text-emerald-400 font-bold">↑ 12.5%</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[7.5px] text-slate-400 font-bold">Pedidos</div>
                  <div className="text-[9px] font-black text-white">156</div>
                  <div className="text-[7px] text-emerald-400 font-bold">↑ 8.2%</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[7.5px] text-slate-400 font-bold">Productos</div>
                  <div className="text-[9px] font-black text-white">2,450</div>
                  <div className="text-[7px] text-emerald-400 font-bold">↑ 5.7%</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="text-[7.5px] text-slate-400 font-bold">Clientes</div>
                  <div className="text-[9px] font-black text-white">1,250</div>
                  <div className="text-[7px] text-emerald-400 font-bold">↑ 3.1%</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between text-[7.5px] text-slate-300 font-bold mb-1">
                    <span>Ventas - Últimos 6 meses</span>
                    <span className="text-slate-500">2026 ▾</span>
                  </div>
                  <svg className="w-full h-7 text-blue-400" viewBox="0 0 100 30" fill="none" stroke="currentColor">
                    <path d="M0 25 Q 20 15, 40 22 T 70 8 T 100 15" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="col-span-1 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="text-[7.5px] text-slate-300 font-bold mb-1">Categorías</div>
                  <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-blue-500 border-r-indigo-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Izquierdo */}
          <div className="relative z-10 grid grid-cols-3 gap-1 text-[9.5px] text-slate-400 font-medium pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-400 shrink-0" />
              <span>Tecnología que impulsa tu negocio</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400 shrink-0" />
              <span>Acceso 24/7 desde cualquier lugar</span>
            </div>
            <div className="flex items-center gap-1">
              <Headphones className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Soporte especializado cuando lo necesites</span>
            </div>
          </div>
        </div>

        {/* ── PANEL DERECHO: FORMULARIO DE LOGIN CLARO / OSCURO ── */}
        <div className="relative flex flex-col justify-center p-6 sm:p-7 lg:p-8 bg-white dark:bg-[#0b1329]">

          {/* Botón Flotante para Alternar Tema (Sol / Luna) */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Alternar Tema Claro / Oscuro"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-amber-400 transition-all border border-slate-200 dark:border-slate-700/60 shadow-sm z-20 cursor-pointer active:scale-95"
          >
            <Sun size={18} className="hidden dark:block text-amber-400" />
            <Moon size={18} className="block dark:hidden text-slate-700" />
          </button>

          {/* Header Mobile Brand (Solo en pantallas pequeñas) */}
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-blue-500 bg-black flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <Image
                src={gnsLogo}
                alt="GNS SarriaTech"
                className="h-full w-full object-cover rounded-full aspect-square"
              />
            </div>
            <span className="text-sm font-black uppercase text-slate-900 dark:text-white">
              GNS <span className="text-blue-600 dark:text-blue-400">SARRIATECH</span>
            </span>
          </div>

          {/* Icono de Candado Superior */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-2.5 shadow-lg shadow-blue-500/25 flex items-center justify-center text-white mb-2.5">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bienvenido
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ingresa a tu panel corporativo
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>

            {/* Banner de Estado de Autenticación */}
            {authStatus.type && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 ${
                  authStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm shadow-emerald-500/10'
                    : 'bg-red-500/10 border-red-500/30 text-red-600 shadow-sm shadow-red-500/10'
                }`}
              >
                {authStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <p className="leading-snug text-[11px]">{authStatus.message}</p>
              </div>
            )}

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
                  placeholder="tu-correo@empresa.com"
                  {...register('email')}
                  className="pl-9 h-9.5 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo CONTRASEÑA */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 tracking-wider uppercase">
                  Contraseña
                </Label>
                <button
                  type="button"
                  onClick={handleRecoverPassword}
                  className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  {...register('password')}
                  className="pl-9 pr-9 h-9.5 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-900 dark:text-white text-xs rounded-xl focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Checkbox Mantener sesión iniciada */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                {...register('rememberMe')}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Botón Submit: Acceder a la plataforma */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 h-12 min-h-[48px] py-3.5 px-6 text-xs sm:text-sm font-extrabold rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Accediendo...' : 'Acceder a la plataforma'}</span>
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Button>

            {/* Divisor "o continúa con" */}
            <div className="relative my-4 sm:my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <span className="relative bg-white dark:bg-[#0b1329] px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                o continúa con
              </span>
            </div>

            {/* Botón Continuar con Google */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-12 min-h-[48px] py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-3 shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continuar con Google</span>
              </button>
            </div>
          </form>

          {/* Link Regístrate aquí */}
          <div className="mt-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            ¿No tienes una cuenta?{' '}
            <Link
              href="/auth/register"
              className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 transition"
            >
              Regístrate aquí <ArrowRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </Link>
          </div>

          {/* Card Seguridad Cifrado AES-256 */}
          <div className="mt-4 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-blue-900 dark:text-blue-200 leading-tight">
                Conexión segura y encriptada
              </div>
              <div className="text-[9px] text-blue-600 dark:text-blue-400 font-medium">
                Tu información está protegida con cifrado AES-256
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}

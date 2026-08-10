"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Sparkles, Mail, Lock, Check, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { successAlert, brandAlert } from '@/lib/sweetalert';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

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
          message: 'Tu sesión ha finalizado automáticamente tras 30 minutos de inactividad por motivos de seguridad.',
        });
      } else if (reason === 'admin_disconnect') {
        setAuthStatus({
          type: 'error',
          message: 'Tu sesión ha sido finalizada por un administrador del sistema.',
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
        setAuthStatus({
          type: 'success',
          message: '¡Acceso autorizado correctamente! Ingresando al sistema...',
        });
        // Use the Next.js router for navigation; this respects the current host (ngrok or localhost)
        setTimeout(() => {
          router.replace('/dashboard');
        }, 500);
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
        input: 'flex h-12 w-full rounded-xl border border-gray-200 px-4 py-2 mt-4 text-sm focus:ring-4 focus:ring-red-100 focus:border-red-500 transition',
        confirmButton: 'bg-red-600 text-white rounded-xl px-6 py-2.5 font-bold text-sm transition',
        cancelButton: 'bg-gray-100 text-gray-600 rounded-xl px-6 py-2.5 font-bold text-sm transition ml-2',
      },
      buttonsStyling: false,
    });
    if (email) {
      successAlert('Enlace Enviado', `Instrucciones enviadas a ${email}`);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center relative overflow-hidden bg-slate-50">
      
      {/* ─── ESTILOS Y ANIMACIONES ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatBlob {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        
        .anim-up { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 40px 80px -20px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
        }

        .input-premium {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          color: #0f172a;
          transition: all 0.3s ease;
        }
        .input-premium:focus {
          background: #ffffff;
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
          outline: none;
        }

        .btn-premium {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 10px 25px rgba(220,38,38,0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(220,38,38,0.45);
        }
        .btn-premium:active { transform: translateY(0); }

        .custom-checkbox {
          appearance: none;
          width: 18px; height: 18px;
          border: 2px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-checkbox:checked {
          background: #dc2626; border-color: #dc2626;
        }
        .custom-checkbox:checked::after {
          content: ''; position: absolute;
          left: 5px; top: 2px;
          width: 5px; height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      `}} />

      {/* ─── FONDOS MODERNOS ─── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 60%)', borderRadius: '50%', animation: 'floatBlob 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(15, 23, 42, 0.06) 0%, transparent 60%)', borderRadius: '50%', animation: 'floatBlob 15s ease-in-out infinite reverse' }} />
        {/* Grid pattern sutil */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.8 }} />
      </div>

      <Link href="/" className="absolute top-8 left-8 z-20 flex items-center gap-2 group anim-up">
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
          <Sparkles size={18} className="text-red-600" />
        </div>
        <div>
          <div className="font-black text-sm text-slate-800 tracking-wider">GNS <span className="text-red-600">SARRIATECH</span></div>
          <div className="text-[9px] font-bold text-slate-400 tracking-[0.1em] uppercase">Volver al inicio</div>
        </div>
      </Link>

      {/* ─── TARJETA DE LOGIN CENTRADA ─── */}
      <div className="z-10 w-full max-w-[440px] px-6">
        <div className="glass-card rounded-[32px] p-10 anim-up delay-1 relative">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white shadow-xl mb-6 shadow-slate-900/20 ring-4 ring-white">
              <Lock size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenido</h1>
            <p className="text-sm text-slate-500 font-medium mt-2">Ingrese a su panel corporativo</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* ─── BANNER DE NOTIFICACIÓN INLINE DE ESTADO ─── */}
            {authStatus.type && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all duration-300 ${
                  authStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 shadow-sm shadow-emerald-500/10'
                    : 'bg-red-500/10 border-red-500/30 text-red-600 shadow-sm shadow-red-500/10'
                }`}
              >
                {authStatus.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <p className="leading-snug">{authStatus.message}</p>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5 anim-up delay-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  {...register('email')}
                  className="input-premium w-full h-12 rounded-xl pl-11 pr-4 text-sm font-medium"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-1.5 anim-up delay-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Contraseña</label>
                <button
                  type="button"
                  onClick={handleRecoverPassword}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  {...register('password')}
                  className="input-premium w-full h-12 rounded-xl pl-11 pr-12 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-bold ml-1 flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 pt-2 anim-up delay-3">
              <input type="checkbox" id="remember" {...register('rememberMe')} className="custom-checkbox" />
              <label htmlFor="remember" className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Submit */}
            <div className="pt-4 anim-up delay-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-premium w-full h-14 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Acceder a la plataforma'
                )}
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm font-medium text-slate-500 anim-up delay-3">
            ¿No tienes una cuenta?{' '}
            <Link href="/auth/register" className="text-red-600 hover:text-red-700 font-bold transition-colors">
              Regístrate aquí
            </Link>
          </div>

          {/* Footer Card */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 anim-up delay-3">
            <ShieldCheck size={14} className="text-green-500" />
            Conexión encriptada AES-256
          </div>

        </div>
      </div>
    </main>
  );
}

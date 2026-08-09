import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import {
  ArrowRight, Sparkles, Check, ShieldCheck, TrendingUp,
  BarChart3, Zap, Globe, Lock, Award, Play
} from 'lucide-react';
import { platformDb } from '@/lib/db-manager';
import { InteractivePricing } from '@/app/components/public/InteractivePricing';

import { getAuthSession } from '@/auth';
import { getPlanSettings } from '@/app/actions/license-actions';
import { LandingAuthNav } from '@/app/components/public/LandingAuthNav';
import { LandingModules } from '@/app/components/public/LandingModules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getAuthSession();
  
  let planSettings: any = {};
  let allModulesList: any[] = [];
  const ps = await getPlanSettings();
  if (ps.success) {
    planSettings = ps.data;
    allModulesList = ps.allModules || [];
  }
  
  const dbModules = await platformDb.module.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });

  const modules = dbModules.map((mod) => {
    const IconComp =
      mod.icon && (LucideIcons as Record<string, any>)[mod.icon]
        ? (LucideIcons as Record<string, any>)[mod.icon]
        : LucideIcons.Folder;
    return {
      name: mod.name,
      icon: IconComp,
      description: mod.description || 'Módulo empresarial activo en la plataforma.',
    };
  });

  const benefits = [
    { icon: BarChart3, title: 'Control de Inventario', desc: 'Precisión absoluta en existencias con alertas inteligentes de reabastecimiento.' },
    { icon: ShieldCheck, title: 'Máxima Seguridad', desc: 'Cifrado AES-256, 2FA y protección avanzada de datos corporativos.' },
    { icon: TrendingUp, title: 'Trazabilidad y Auditoría', desc: 'Registro detallado e inmutable de cada acción en el sistema.' },
    { icon: BarChart3, title: 'Reportes Detallados', desc: 'Información analítica estructurada para la toma de decisiones.' },
    { icon: Globe, title: 'Entorno Multiusuario', desc: 'Colaboración en tiempo real con control de roles jerárquicos.' },
    { icon: Zap, title: 'Escalabilidad SaaS', desc: 'Arquitectura diseñada para crecer al ritmo de su organización.' },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime garantizado' },
    { value: '+500', label: 'Empresas activas' },
    { value: '24/7', label: 'Soporte técnico' },
    { value: '<1s', label: 'Tiempo de respuesta' },
  ];

  /* Paleta Corporativa Moderna: Slate Navy Blue + Vibrant Red + White + Múltiples Colores Vivos */
  const moduleColors = [
    { bg: '#eff6ff', icon: '#2563eb', border: '#bfdbfe' }, // Blue
    { bg: '#fff1f2', icon: '#e11d48', border: '#fecdd3' }, // Red
    { bg: '#f0fdf4', icon: '#16a34a', border: '#bbf7d0' }, // Green
    { bg: '#f5f3ff', icon: '#7c3aed', border: '#ddd6fe' }, // Violet
    { bg: '#fff7ed', icon: '#ea580c', border: '#fed7aa' }, // Orange
    { bg: '#f0f9ff', icon: '#0ea5e9', border: '#bae6fd' }, // Sky
    { bg: '#fdf4ff', icon: '#c026d3', border: '#f5d0fe' }, // Fuchsia
    { bg: '#ecfdf5', icon: '#059669', border: '#a7f3d0' }, // Emerald
    { bg: '#fef2f2', icon: '#dc2626', border: '#fecaca' }, // Crimson
    { bg: '#fffbeb', icon: '#d97706', border: '#fde68a' }, // Amber
    { bg: '#faf5ff', icon: '#9333ea', border: '#e9d5ff' }, // Purple
    { bg: '#f0fdfa', icon: '#0d9488', border: '#ccfbf1' }, // Teal
    { bg: '#f8fafc', icon: '#475569', border: '#e2e8f0' }, // Slate
    { bg: '#fdf2f8', icon: '#db2777', border: '#fbcfe8' }, // Pink
    { bg: '#eff6ff', icon: '#3b82f6', border: '#dbeafe' }, // Bright Blue
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans">
      {/* ─── KEYFRAME ANIMATIONS ─── */}
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-smooth {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-1deg); }
        }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }

        .animate-fade-in { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; will-change: transform, opacity; }
        .animate-fade-in-1 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; will-change: transform, opacity; }
        .animate-fade-in-2 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; will-change: transform, opacity; }
        .animate-fade-in-3 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; will-change: transform, opacity; }
        
        .animate-float { animation: float-smooth 6s ease-in-out infinite; will-change: transform; }
        .animate-float-delay { animation: float-reverse 7s ease-in-out infinite 1s; will-change: transform; }
        
        .pulse-btn { animation: pulse-glow 2s infinite; }
        
        /* ─── RESPONSIVE GRIDS ─── */
        .hero-grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 40px; align-items: center; position: relative; z-index: 1; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
        .modules-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
        .footer-grid { display: grid; grid-template-columns: 2.5fr 1fr 1fr 1fr 1fr 2.5fr; gap: 30px; margin-bottom: 60px; }
        .hero-stats { display: flex; gap: 16px; margin-bottom: 20px; }

        @media (max-width: 1200px) {
          .modules-grid { grid-template-columns: repeat(3, 1fr); }
          .footer-grid { grid-template-columns: repeat(3, 1fr); gap: 40px; }
        }
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
          .hero-grid > div:first-child { display: flex; flex-direction: column; align-items: center; }
          .hero-grid p { margin: 0 auto !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .modules-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-stats { flex-direction: column; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
          .modules-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; text-align: center; }
          .hero-grid h1 { font-size: 42px !important; }
        }

        /* Tarjetas de Módulos (Glassmorphism + Hover) */
        .module-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          padding: 32px 24px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 40px -10px rgba(15, 23, 42, 0.05);
          position: relative;
          overflow: hidden;
        }
        .module-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .module-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.1);
          border-color: rgba(220, 38, 38, 0.3);
        }

        /* Mockup Responsive */
        .mockup-container {
          background: #ffffff;
          border-radius: 32px;
          padding: 24px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.08), 0 0 0 1px #e2e8f0;
          display: flex;
          gap: 24px;
          width: 100%;
          overflow: hidden;
        }
        .mockup-sidebar {
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-right: 1px solid #f1f5f9;
          padding-right: 24px;
        }
        .mockup-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .mockup-grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        


        .module-card:hover::before { opacity: 1; }

        /* Precios */
        .pricing-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 40px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);
        }
        .pricing-card:hover {
          transform: translateY(-12px);
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.08);
          border-color: #cbd5e1;
        }
        
        .pricing-premium {
          background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
          color: white;
          border: none;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
          transform: scale(1.05);
        }
        .pricing-premium:hover {
          transform: scale(1.05) translateY(-12px);
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.35);
        }

        /* Nav links */
        .nav-link {
          color: #cbd5e1;
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
          padding: 8px 12px;
          border-radius: 8px;
        }
        .nav-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.1);
        }

        /* Botones primarios */
        .btn-red {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.35);
        }
        .btn-red:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(220, 38, 38, 0.45);
        }
      `}</style>

      {/* ══════════════════════════════════════════
          NAVBAR — SLATE NAVY PURO
      ══════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-[9999] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between h-[68px] md:h-[76px]">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div
              className="pulse-btn w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(220,38,38,0.4)]"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-[15px] md:text-lg tracking-wider text-slate-900 dark:text-white leading-none md:leading-tight">
                GNS <span className="text-red-500 hidden sm:inline">GESTIÓN DE NEGOCIOS</span>
              </div>
              <div className="text-[8px] md:text-[10px] font-black text-slate-900 dark:text-slate-300 tracking-[0.2em] uppercase mt-1 md:mt-0">
                SARRIA
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#inicio" className="text-slate-900 dark:text-white font-semibold text-sm no-underline transition-colors hover:text-red-600 dark:hover:text-red-500">Inicio</a>
            <a href="#modulos" className="text-slate-500 dark:text-slate-400 font-semibold text-sm no-underline transition-colors hover:text-red-600 dark:hover:text-red-500">Funciones</a>
            <a href="#planes" className="text-slate-500 dark:text-slate-400 font-semibold text-sm no-underline transition-colors hover:text-red-600 dark:hover:text-red-500">Precios</a>
            <a href="#nosotros" className="text-slate-500 dark:text-slate-400 font-semibold text-sm no-underline transition-colors hover:text-red-600 dark:hover:text-red-500">Sobre Nosotros</a>
            <a href="#contacto" className="text-slate-500 dark:text-slate-400 font-semibold text-sm no-underline transition-colors hover:text-red-600 dark:hover:text-red-500">Contacto</a>
          </nav>

          {/* CTA */}
          <LandingAuthNav user={session?.user?.id ? session.user : null} />
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO — BLANCO CON ACENTOS ROJOS Y SLATE
      ══════════════════════════════════════════ */}
      <main>
      <section className="pt-[100px] md:pt-[140px] pb-[60px] md:pb-[100px] relative overflow-hidden bg-white dark:bg-slate-900">
        {/* Background Gradients */}
        <div className="absolute -top-[10%] -right-[5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(220,38,38,0.04)_0%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(circle,rgba(220,38,38,0.1)_0%,rgba(15,23,42,0)_70%)]" />
        <div className="absolute -bottom-[10%] -left-[5%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(15,23,42,0.03)_0%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,rgba(15,23,42,0)_70%)]" />
        
        <div className="hero-grid max-w-[1280px] mx-auto px-4 md:px-6">
          {/* Hero Content */}
          <div className="flex flex-col gap-5 md:gap-6 text-center lg:text-left items-center lg:items-start">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-1.5 md:gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-500 text-[10px] md:text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 md:px-3.5 md:py-1.5 rounded-full">
                <LucideIcons.Star size={12} className="fill-amber-600 dark:fill-amber-500 text-amber-600 dark:text-amber-500" />
                SOFTWARE EMPRESARIAL INTELIGENTE
              </span>
            </div>

            <h1 className="animate-fade-in-1 text-[32px] sm:text-[40px] lg:text-[46px] xl:text-[52px] font-black leading-[1.15] md:leading-[1.1] m-0 text-slate-900 dark:text-white tracking-tight">
              Gestiona tu empresa<br className="hidden md:block"/> con Inteligencia y <br className="hidden md:block"/>
              <span className="text-red-600 dark:text-red-500 uppercase block md:inline mt-2 md:mt-0">CONTROL TOTAL</span>
            </h1>

            <p className="animate-fade-in-2 text-[14px] sm:text-[15px] lg:text-[16px] text-slate-600 dark:text-slate-300 leading-relaxed m-0 max-w-[500px] font-medium mx-auto lg:mx-0">
              El sistema todo en uno para administrar inventarios, ventas, compras, finanzas y mucho más. Seguro, eficiente y diseñado para hacer crecer tu negocio.
            </p>

            <div className="animate-fade-in-3 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center mt-4 sm:mt-2 w-full sm:w-auto">
              {session?.user ? (
                <Link href={session.user.companyStatus === 'SUSPENDED' ? "/#planes" : "/dashboard"} className="w-full sm:w-auto no-underline">
                  <button className="btn-red w-full sm:w-auto justify-center px-5 py-3.5 sm:px-7 sm:py-3.5 text-[14px] sm:text-[15px]">
                    <LucideIcons.Rocket size={18} className="shrink-0" />
                    {session.user.companyStatus === 'SUSPENDED' ? 'Completar Pago' : 'Ir al Dashboard'}
                  </button>
                </Link>
              ) : (
                <Link href="/auth/login" className="w-full sm:w-auto no-underline">
                  <button className="btn-red w-full sm:w-auto justify-center px-5 py-3 sm:px-7 sm:py-3.5 text-[14px] sm:text-[15px]">
                    <LucideIcons.Rocket size={18} className="shrink-0" />
                    <div className="text-left">
                      <div className="leading-none font-bold">Comenzar Ahora</div>
                      <div className="text-[10px] sm:text-[11px] font-medium opacity-80 mt-1">Prueba 14 días gratis</div>
                    </div>
                  </button>
                </Link>
              )}
              <Link href="#modulos" className="w-full sm:w-auto no-underline">
                <button className="w-full sm:w-auto justify-center px-5 py-3 sm:px-6 sm:py-2.5 text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0">
                    <Play size={14} className="fill-slate-900 dark:fill-white text-slate-900 dark:text-white" />
                  </div>
                  <div className="text-left">
                    <div className="leading-none">Ver Demo</div>
                    <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Conoce el sistema</div>
                  </div>
                </button>
              </Link>
            </div>
            
            <div className="animate-fade-in-3 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 items-center mt-6">
              {['Sin tarjeta de crédito', 'Cancelas cuando quieras', 'Soporte 24/7'].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] text-slate-600 dark:text-slate-400 font-semibold">
                  <LucideIcons.CheckCircle2 size={14} className="text-amber-600 dark:text-amber-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image / Mockup */}
          <div className="animate-float relative w-full mt-6 md:mt-0 h-[300px] sm:h-[450px] md:h-auto md:min-h-[500px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0 origin-top transform scale-[0.30] min-[400px]:scale-[0.38] sm:scale-[0.55] md:scale-100 transition-transform">
              <div className="mockup-container flex gap-4 md:gap-6 bg-white dark:bg-slate-950 p-6 !shadow-none !border-none rounded-2xl md:rounded-[32px] w-[1000px]">
              
              {/* Sidebar Mockup */}
              <div className="mockup-sidebar border-r border-slate-100 dark:border-slate-800" style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 24 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#dc2626', marginBottom: 8 }}>GNS</div>
                {[
                  { n: 'Dashboard', i: LucideIcons.LayoutDashboard, active: true },
                  { n: 'Productos', i: LucideIcons.Package },
                  { n: 'Ventas', i: LucideIcons.ShoppingCart },
                  { n: 'Compras', i: LucideIcons.ShoppingBag },
                  { n: 'Inventario', i: LucideIcons.Archive },
                  { n: 'Clientes', i: LucideIcons.Users },
                  { n: 'Proveedores', i: LucideIcons.Truck },
                  { n: 'Reportes', i: LucideIcons.BarChart3 },
                  { n: 'Usuarios', i: LucideIcons.UserCog },
                  { n: 'Configuración', i: LucideIcons.Settings },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[11px] font-semibold px-2 py-1.5 rounded-md ${item.active ? 'text-red-600 bg-red-50 dark:bg-red-950/50' : 'text-slate-500 dark:text-slate-400 bg-transparent'}`}>
                    <item.i size={14} />
                    {item.n}
                  </div>
                ))}
              </div>

              {/* Main Content Mockup */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header Mockup */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-extrabold text-slate-900 dark:text-white">Dashboard</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ position: 'relative' }}>
                      <LucideIcons.Bell size={16} className="text-slate-500 dark:text-slate-400" />
                      <div className="absolute -top-[2px] -right-[2px] w-1.5 h-1.5 rounded-full bg-red-600 border border-white dark:border-slate-900" />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <LucideIcons.Inbox size={16} className="text-slate-500 dark:text-slate-400" />
                      <div className="absolute -top-[2px] -right-[2px] w-1.5 h-1.5 rounded-full bg-red-600 border border-white dark:border-slate-900" />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#dc2626' }} />
                      <div className="text-[10px] font-bold text-slate-900 dark:text-white">Admin Sarria</div>
                      <LucideIcons.ChevronDown size={12} className="text-slate-500 dark:text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* KPI Cards Mockup */}
                <div className="mockup-grid-4">
                  {[
                    { l: 'Ventas Hoy', v: '$24,580,000', p: '+ 12.5% vs ayer', c: 'text-green-600 dark:text-green-500' },
                    { l: 'Pedidos', v: '156', p: '+ 8.2% vs ayer', c: 'text-green-600 dark:text-green-500' },
                    { l: 'Productos', v: '2,450', p: '+ 5.7% vs ayer', c: 'text-green-600 dark:text-green-500' },
                    { l: 'Clientes', v: '1,250', p: '+ 3.1% vs ayer', c: 'text-green-600 dark:text-green-500' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-none">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{kpi.l}</div>
                      <div className="text-[15px] font-extrabold text-slate-900 dark:text-white my-1">{kpi.v}</div>
                      <div className={`text-[9px] font-bold ${kpi.c}`}>{kpi.p}</div>
                    </div>
                  ))}
                </div>

                {/* Charts Row Mockup */}
                <div className="mockup-grid-2-1">
                  {/* Line Chart */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-none">
                    <div className="flex justify-between mb-3">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">Ventas - Últimos 6 meses</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center">2024 <LucideIcons.ChevronDown size={10} className="ml-1"/></div>
                    </div>
                    <div style={{ position: 'relative', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                      {/* Fake Line Chart using SVG */}
                      <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                        <path d="M0,30 L16,25 L32,35 L48,15 L64,25 L80,5 L100,20" fill="none" stroke="#dc2626" strokeWidth="2" />
                        <path d="M0,30 L16,25 L32,35 L48,15 L64,25 L80,5 L100,20 L100,40 L0,40 Z" fill="rgba(220,38,38,0.1)" stroke="none" />
                        <circle cx="0" cy="30" r="2" fill="#dc2626" />
                        <circle cx="16" cy="25" r="2" fill="#dc2626" />
                        <circle cx="32" cy="35" r="2" fill="#dc2626" />
                        <circle cx="48" cy="15" r="2" fill="#dc2626" />
                        <circle cx="64" cy="25" r="2" fill="#dc2626" />
                        <circle cx="80" cy="5" r="2" fill="#dc2626" />
                        <circle cx="100" cy="20" r="2" fill="#dc2626" />
                      </svg>
                      {/* Grid lines */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: -1 }}>
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 w-full text-[8px] text-slate-400 dark:text-slate-500">40M</div>
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 w-full text-[8px] text-slate-400 dark:text-slate-500">20M</div>
                        <div className="border-t border-dashed border-slate-200 dark:border-slate-700 w-full text-[8px] text-slate-400 dark:text-slate-500">0</div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] text-slate-400 dark:text-slate-500 font-semibold">
                      <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                    </div>
                  </div>

                  {/* Doughnut Chart */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-none flex flex-col">
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white mb-3">Ventas por categoría</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'conic-gradient(#dc2626 0% 45%, #f59e0b 45% 70%, #10b981 70% 85%, #64748b 85% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-900 dark:text-white"><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }}/> Electrónicos <span className="text-slate-500 dark:text-slate-400">45%</span></div>
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-900 dark:text-white"><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}/> Hogar <span className="text-slate-500 dark:text-slate-400">25%</span></div>
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-900 dark:text-white"><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}/> Ropa <span className="text-slate-500 dark:text-slate-400">15%</span></div>
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-900 dark:text-white"><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }}/> Otros <span className="text-slate-500 dark:text-slate-400">15%</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom KPIs Mockup */}
                <div className="mockup-grid-4">
                  {[
                    { l: 'Ingresos Totales', v: '$142,580,000', p: '+ 15.3%', c: 'text-green-600 dark:text-green-500' },
                    { l: 'Utilidad Neta', v: '$34,250,000', p: '+ 18.1%', c: 'text-green-600 dark:text-green-500' },
                    { l: 'Cuentas por Cobrar', v: '$18,450,000', p: '+ 7.2%', c: 'text-green-600 dark:text-green-500' },
                    { l: 'Inventario Total', v: '$89,750,000', p: '+ 11.2%', c: 'text-green-600 dark:text-green-500' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-none">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{kpi.l}</div>
                      <div className="text-[13px] font-extrabold text-slate-900 dark:text-white my-1">{kpi.v}</div>
                      <div className={`text-[9px] font-bold ${kpi.c}`}>{kpi.p}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
            
            {/* Flotante 1 */}
            <div className="animate-float-delay hidden lg:flex absolute top-10 -right-10 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-none items-center gap-4 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center">
                <LucideIcons.Check size={24} className="text-red-600 dark:text-red-500" />
              </div>
              <div>
                <div className="text-[14px] font-extrabold text-slate-900 dark:text-white">Sistema Operativo</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400">En tiempo real</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MÓDULOS — DISEÑO FUNCIONES
      ══════════════════════════════════════════ */}
      <section id="modulos" className="relative py-[80px] px-6 bg-slate-50 dark:bg-slate-950" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <div className="max-w-[1280px] mx-auto relative z-10">
          <div className="text-center mb-14">
            <span className="inline-block text-amber-600 dark:text-amber-500 text-[12px] font-extrabold tracking-[0.15em] uppercase mb-3.5">
              TODO LO QUE TU NEGOCIO NECESITA
            </span>
            <h2 className="text-[40px] font-black text-slate-900 dark:text-white m-0 tracking-tight">
              Funciones <span className="text-red-600 dark:text-red-500">poderosas</span>, resultados reales
            </h2>
          </div>

          <LandingModules />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ARQUITECTURA MULTI-TENANT
      ══════════════════════════════════════════ */}
      <section className="py-[100px] px-6 bg-white dark:bg-slate-900 overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-10 items-center">
          
          {/* Left Column - Text */}
          <div className="flex-[1_1_300px] flex flex-col gap-6">
            <span className="inline-block text-amber-600 dark:text-amber-500 text-[12px] font-extrabold tracking-[0.15em] uppercase">
              ARQUITECTURA MULTI-TENANT
            </span>
            <h2 className="text-[36px] font-black text-slate-900 dark:text-white leading-[1.1] m-0 tracking-tight">
              Una plataforma, <br/><span className="text-amber-600 dark:text-amber-500">Múltiples Empresas</span>
            </h2>
            <p className="text-[15px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-[400px] m-0">
              Controla diferentes sucursales, razones sociales o franquicias desde un único panel centralizado con total independencia de datos.
            </p>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-3">
                <LucideIcons.Database className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold">Cada empresa con sus propios datos y configuraciones.</span>
              </div>
              <div className="flex items-start gap-3">
                <LucideIcons.Lock className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold">Aislamiento total de información entre empresas.</span>
              </div>
              <div className="flex items-start gap-3">
                <LucideIcons.UserCog className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                <span className="text-[14px] text-slate-700 dark:text-slate-300 font-semibold">Roles y permisos granulares para cada usuario.</span>
              </div>
            </div>
          </div>
          
          {/* Right Column - Architecture Diagram */}
          <div className="flex-[1_1_400px] relative flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0 mt-8 md:mt-0 max-w-full p-4 overflow-x-auto">
            {/* Box 1: Super Admin */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-10 flex flex-col items-center gap-6 w-[180px] shrink-0">
              <div className="text-[11px] font-black text-red-600 dark:text-red-500 tracking-widest">SUPER ADMIN</div>
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 border-2 border-red-100 dark:border-red-900 flex items-center justify-center">
                 <LucideIcons.UserCog size={32} className="text-red-600 dark:text-red-500" />
              </div>
              <div className="flex flex-col gap-3 items-center text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <div>Panel Central</div>
                <div>Gestión de Empresas</div>
                <div>Planes y Suscripciones</div>
                <div>Reportes Globales</div>
              </div>
            </div>
            
            {/* Dotted Arrow 1 */}
            <div className="h-[30px] w-0 lg:h-0 lg:w-[30px] border-l-2 lg:border-l-0 lg:border-t-2 border-dashed border-amber-400 dark:border-amber-600 relative z-0">
              <LucideIcons.ChevronDown size={16} className="text-amber-400 dark:text-amber-600 absolute -bottom-2.5 -left-[9px] lg:hidden" />
              <LucideIcons.ChevronRight size={16} className="text-amber-400 dark:text-amber-600 absolute -right-2.5 -top-2.5 hidden lg:block" />
            </div>

            {/* Box 2: Empresas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-10 flex flex-col items-center gap-6 w-[180px] shrink-0">
              <div className="text-[11px] font-black text-slate-900 dark:text-white tracking-widest">EMPRESAS</div>
              <LucideIcons.Building2 size={48} className="text-slate-600 dark:text-slate-400" strokeWidth={1} />
              <div className="flex flex-col gap-4 w-full pl-5">
                <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-red-500" /> Empresa A
                </div>
                <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-amber-600" /> Empresa B
                </div>
                <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-amber-400" /> Empresa C
                </div>
                <div className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" /> Empresa D
                </div>
              </div>
            </div>

            {/* Dotted Arrow 2 */}
            <div className="h-[30px] w-0 lg:h-0 lg:w-[30px] border-l-2 lg:border-l-0 lg:border-t-2 border-dashed border-amber-400 dark:border-amber-600 relative z-0">
              <LucideIcons.ChevronDown size={16} className="text-amber-400 dark:text-amber-600 absolute -bottom-2.5 -left-[9px] lg:hidden" />
              <LucideIcons.ChevronRight size={16} className="text-amber-400 dark:text-amber-600 absolute -right-2.5 -top-2.5 hidden lg:block" />
            </div>

            {/* Box 3: Usuarios y Roles */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.2)] z-10 flex flex-col gap-6 w-[180px] shrink-0">
              <div className="text-[11px] font-black text-slate-900 dark:text-white tracking-widest text-center">USUARIOS Y ROLES</div>
              <div className="flex flex-col gap-4 pl-2.5">
                <div className="flex items-center gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <LucideIcons.User size={16} className="text-orange-500 fill-orange-500" strokeWidth={0} /> Administrador
                </div>
                <div className="flex items-center gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <LucideIcons.User size={16} className="text-emerald-500 fill-emerald-500" strokeWidth={0} /> Contador
                </div>
                <div className="flex items-center gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <LucideIcons.User size={16} className="text-blue-500 fill-blue-500" strokeWidth={0} /> Vendedor
                </div>
                <div className="flex items-center gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <LucideIcons.User size={16} className="text-fuchsia-500 fill-fuchsia-500" strokeWidth={0} /> Almacenista
                </div>
                <div className="flex items-center gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-400">
                  <LucideIcons.User size={16} className="text-orange-500 fill-orange-500" strokeWidth={0} /> Cliente
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Shield */}
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {/* Orbits */}
               <div style={{ position: 'absolute', inset: 10, border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '50%', transform: 'rotateX(65deg) rotateY(15deg)' }}>
                  <div style={{ position: 'absolute', top: 0, left: '50%', width: 4, height: 4, background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 8px 2px #fcd34d' }} />
               </div>
               <div style={{ position: 'absolute', inset: 25, border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '50%', transform: 'rotateX(65deg) rotateY(-15deg)' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: '20%', width: 3, height: 3, background: '#fbbf24', borderRadius: '50%', boxShadow: '0 0 6px 2px #fcd34d' }} />
               </div>
               <div style={{ position: 'absolute', inset: 40, border: '1px solid rgba(245, 158, 11, 0.5)', borderRadius: '50%', transform: 'rotateX(75deg)' }}>
                  <div style={{ position: 'absolute', top: '50%', right: -2, width: 4, height: 4, background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 8px 2px #fcd34d' }} />
               </div>
               
               {/* Outer Glow */}
               <div style={{ position: 'absolute', width: 120, height: 140, background: '#fcd34d', filter: 'blur(35px)', opacity: 0.4, zIndex: 0 }} />

               {/* Shield Background / Rim */}
               <div style={{ position: 'relative', width: 130, height: 156, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <svg width="130" height="156" viewBox="0 0 130 156" style={{ position: 'absolute', top: 0, left: 0, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}>
                     <defs>
                        <linearGradient id="shieldRim" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stopColor="#fde68a" />
                           <stop offset="50%" stopColor="#f59e0b" />
                           <stop offset="100%" stopColor="#92400e" />
                        </linearGradient>
                        <linearGradient id="shieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
                           <stop offset="0%" stopColor="#fef3c7" />
                           <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                     </defs>
                     {/* Outer Rim */}
                     <path d="M 65 0 L 130 22 C 130 85 100 140 65 156 C 30 140 0 85 0 22 Z" fill="url(#shieldRim)" />
                     {/* Inner Shield */}
                     <path d="M 65 8 L 120 28 C 120 82 95 132 65 146 C 35 132 10 82 10 28 Z" fill="url(#shieldInner)" />
                     {/* Specular Highlight (Left half) */}
                     <path d="M 65 8 L 10 28 C 10 82 35 132 65 146 Z" fill="rgba(255,255,255,0.25)" />
                  </svg>
                  
                  <div style={{ zIndex: 3, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))', marginTop: 10 }}>
                     <svg width="44" height="44" viewBox="0 0 24 24" fill="#78350f">
                        <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7 5.5a1.5 1.5 0 0 1-1-2.83V13h2v.67a1.5 1.5 0 0 1-1 2.83zM16 11V7a4 4 0 0 0-8 0v4h2V7a2 2 0 0 1 4 0v4h2z"/>
                     </svg>
                  </div>
               </div>
            </div>
            <div>
              <div className="text-[20px] font-extrabold mb-3 leading-snug">
                <span className="text-amber-600 dark:text-amber-500 block">Seguridad</span>
                <span className="text-slate-900 dark:text-white block mt-[-4px]">de Nivel Empresarial</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                 Encriptación <span className="text-slate-400 dark:text-slate-600 mx-1">•</span> Backups <span className="text-slate-400 dark:text-slate-600 mx-1">•</span> Auditoría<br/>
                 Cumplimiento <span className="text-slate-400 dark:text-slate-600 mx-1">•</span> Disponibilidad 99.9%
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PLANES RESTAURADOS A SU ORDEN Y CONTENIDO ORIGINAL
      ══════════════════════════════════════════ */}
      <InteractivePricing planSettings={planSettings} allModules={allModulesList} />

      {/* ══════════════════════════════════════════
          LOGOS DE EMPRESAS
      ══════════════════════════════════════════ */}
      <section className="py-[60px] px-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
        <div className="max-w-[1280px] mx-auto text-center">
          <div className="text-[11px] font-extrabold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase mb-8">
            EMPRESAS QUE CONFÍAN EN GNS
          </div>
          <div className="flex flex-wrap justify-center gap-x-[60px] gap-y-[40px] opacity-60 dark:opacity-40">
            {/* 1. TechGlobal */}
            <div className="flex items-center gap-2.5 grayscale">
              <LucideIcons.Component size={32} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="font-extrabold text-[16px] text-slate-600 dark:text-slate-300 leading-[1.1]">TechGlobal</span>
                <span className="font-semibold text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.05em]">SOLUCIONES</span>
              </div>
            </div>

            {/* 2. Comercializadora DEL VALLE */}
            <div className="flex items-center gap-2.5 grayscale">
              <LucideIcons.Pocket size={32} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.05em] leading-[1.1]">Comercializadora</span>
                <span className="font-extrabold text-[16px] text-slate-600 dark:text-slate-300">DEL VALLE</span>
              </div>
            </div>

            {/* 3. INVERSIONES M&H */}
            <div className="flex items-center gap-2.5 grayscale">
              <LucideIcons.Aperture size={32} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.05em] leading-[1.1]">INVERSIONES</span>
                <span className="font-extrabold text-[16px] text-slate-600 dark:text-slate-300">M&H</span>
              </div>
            </div>

            {/* 4. Distribuciones RODRÍGUEZ */}
            <div className="flex items-center gap-2.5 grayscale">
              <LucideIcons.Shield size={32} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.05em] leading-[1.1]">Distribuciones</span>
                <span className="font-extrabold text-[16px] text-slate-600 dark:text-slate-300">RODRÍGUEZ</span>
              </div>
            </div>

            {/* 5. Grupo SANTA MARÍA */}
            <div className="flex items-center gap-2.5 grayscale">
              <LucideIcons.Clover size={32} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.05em] leading-[1.1]">Grupo</span>
                <span className="font-extrabold text-[16px] text-slate-600 dark:text-slate-300">SANTA MARÍA</span>
              </div>
            </div>

            {/* 6. LOGISTI-K */}
            <div className="flex items-center gap-2.5 grayscale">
              <LucideIcons.Cog size={32} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="font-extrabold text-[16px] text-slate-600 dark:text-slate-300 leading-[1.1]">LOGISTI-K</span>
                <span className="font-semibold text-[10px] text-slate-400 dark:text-slate-500 tracking-[0.05em]">SOLUCIONES</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACTO
      ══════════════════════════════════════════ */}
      <section id="contacto" className="py-[80px] px-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto relative z-10 flex flex-wrap gap-16 items-center">
          
          <div className="flex-1 min-w-[300px]">
            <span className="inline-block text-red-600 dark:text-red-500 text-[12px] font-extrabold tracking-[0.15em] uppercase mb-4">
              ESTAMOS PARA AYUDARTE
            </span>
            <h2 className="text-[36px] font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
              ¿Tienes dudas?<br />Contáctanos hoy.
            </h2>
            <p className="text-[15px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 max-w-[400px]">
              Escríbenos a nuestro correo electrónico y un asesor experto se pondrá en contacto contigo en menos de 24 horas.
            </p>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                  <LucideIcons.Mail size={20} className="text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 font-bold mb-1">Correo Electrónico</div>
                  <div className="text-[15px] font-extrabold text-slate-900 dark:text-white">contacto@gnssarria.com</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <LucideIcons.Phone size={20} className="text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400 font-bold mb-1">Línea de Atención</div>
                  <div className="text-[15px] font-extrabold text-slate-900 dark:text-white">+57 (300) 123-4567</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-[1.2] min-w-[300px] max-w-[600px]">
            <form className="bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col gap-5">
              <div className="flex flex-wrap gap-5">
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="contact-name" className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre completo</label>
                  <input id="contact-name" type="text" placeholder="Tu nombre" className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[14px] outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="contact-company" className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2">Empresa</label>
                  <input id="contact-company" type="text" placeholder="Nombre de tu negocio" className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[14px] outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors" />
                </div>
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2">Correo electrónico</label>
                <input id="contact-email" type="email" placeholder="ejemplo@correo.com" className="w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[14px] outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors" />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-[12px] font-bold text-slate-700 dark:text-slate-300 mb-2">Mensaje</label>
                <textarea id="contact-message" placeholder="¿En qué podemos ayudarte?" rows={4} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-[14px] outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors resize-none"></textarea>
              </div>
              <button type="button" className="btn-red w-full h-12 mt-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] transition-colors">
                Enviar Mensaje
              </button>
            </form>
          </div>

        </div>
      </section>
      </main>

      <footer className="bg-white dark:bg-slate-950 pt-[60px] px-6 pb-10 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto">
          <div className="footer-grid items-start">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-1.5 mb-5">
                <span className="font-black text-[32px] text-amber-600 dark:text-amber-500 tracking-tight leading-none">G</span>
                <span className="font-black text-[32px] text-red-600 dark:text-red-500 tracking-tight leading-none">NS</span>
                <div className="flex flex-col ml-2">
                  <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 tracking-[0.05em] leading-[1.1]">
                    GESTIÓN DE NEGOCIOS
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] leading-[1.1] mt-1">
                    SARRIA
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-[220px] font-medium m-0 mb-6">
                El sistema de gestión empresarial más completo, seguro y confiable para hacer crecer tu negocio.
              </p>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><LucideIcons.Facebook size={16} className="text-slate-600 dark:text-slate-400 fill-current" strokeWidth={0} /></div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><LucideIcons.Instagram size={16} className="text-slate-600 dark:text-slate-400" strokeWidth={2} /></div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><LucideIcons.Linkedin size={16} className="text-slate-600 dark:text-slate-400 fill-current" strokeWidth={0} /></div>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><LucideIcons.Youtube size={16} className="text-slate-600 dark:text-slate-400 fill-current" strokeWidth={0} /></div>
              </div>
            </div>

            {/* PRODUCTO */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-5 tracking-[0.05em]">PRODUCTO</div>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Funciones</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Precios</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Seguridad</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Actualizaciones</a>
            </div>

            {/* EMPRESA */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-5 tracking-[0.05em]">EMPRESA</div>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Sobre Nosotros</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Blog</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Casos de Éxito</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Trabaja con nosotros</a>
            </div>

            {/* RECURSOS */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-5 tracking-[0.05em]">RECURSOS</div>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Documentación</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Centro de Ayuda</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Videos Tutoriales</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">API</a>
            </div>

            {/* LEGAL */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-5 tracking-[0.05em]">LEGAL</div>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Términos y Condiciones</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Política de Privacidad</a>
              <a href="#" className="block text-slate-500 dark:text-slate-400 mb-3 no-underline text-[13px] font-medium hover:text-red-600 dark:hover:text-red-500 transition-colors">Política de Cookies</a>
            </div>

            {/* SOPORTE */}
            <div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:shadow-none">
                <div className="text-[13px] font-extrabold text-slate-900 dark:text-white mb-1">¿Necesitas ayuda?</div>
                <div className="text-[13px] text-slate-600 dark:text-slate-400 mb-4 font-semibold">Estamos aquí para ti</div>
                <button className="btn-red w-full py-3 text-[13px] font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer flex justify-center mb-4 transition-colors">
                  Contactar Soporte
                </button>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Soporte 24/7
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-[60px] pt-8 border-t border-slate-100 dark:border-slate-800 text-[12px] text-slate-400 dark:text-slate-500 font-medium">
            © {new Date().getFullYear()} Gestión de Negocios Sarria (GNS). Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}



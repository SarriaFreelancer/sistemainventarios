import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import {
  ArrowRight, Sparkles, Check, ShieldCheck, TrendingUp,
  BarChart3, Zap, Globe, Lock, Award, Play
} from 'lucide-react';
import { platformDb } from '@/lib/db-manager';
import { InteractivePricing } from '@/app/components/public/InteractivePricing';

import { getAuthSession } from '@/auth';
import { LandingAuthNav } from '@/app/components/public/LandingAuthNav';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const session = await getAuthSession();
  
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
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">

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

        .animate-fade-in { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-1 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; }
        .animate-fade-in-2 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; }
        .animate-fade-in-3 { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }
        
        .animate-float { animation: float-smooth 6s ease-in-out infinite; }
        .animate-float-delay { animation: float-reverse 7s ease-in-out infinite 1s; }
        
        .pulse-btn { animation: pulse-glow 2s infinite; }
        
        /* ─── RESPONSIVE GRIDS ─── */
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; position: relative; z-index: 1; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
        .modules-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 24px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 60px; }
        .hero-stats { display: flex; gap: 16px; margin-bottom: 20px; }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
          .hero-grid > div:first-child { display: flex; flex-direction: column; align-items: center; }
          .hero-grid p { margin: 0 auto !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .modules-grid { grid-template-columns: repeat(3, 1fr); }
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
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
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 76 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="pulse-btn"
              style={{
                width: 44, height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
              }}
            >
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '0.05em', color: '#ffffff' }}>
                GNS <span style={{ color: '#ef4444' }}>SARRIATECH</span>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Enterprise ERP
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="hidden md:flex">
            <a href="#modulos" className="nav-link">Módulos</a>
            <a href="#beneficios" className="nav-link">Beneficios</a>
            <a href="#planes" className="nav-link">Planes</a>
          </nav>

          {/* CTA */}
          <LandingAuthNav user={session?.user || null} />
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO — BLANCO CON ACENTOS ROJOS Y SLATE
      ══════════════════════════════════════════ */}
      <section style={{ paddingTop: 140, paddingBottom: 100, position: 'relative', overflow: 'hidden', background: '#ffffff' }}>
        {/* Background Gradients */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(220,38,38,0.04) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(15,23,42,0.03) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div className="hero-grid" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          {/* Hero Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div className="animate-fade-in">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 999 }}>
                <span style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} className="pulse-btn" />
                La evolución de su negocio
              </span>
            </div>

            <h1 className="animate-fade-in-1" style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, margin: 0, color: '#0f172a', letterSpacing: '-0.03em' }}>
              El <span style={{ color: '#dc2626' }}>Motor Operativo</span><br />
              de su Empresa.
            </h1>

            <p className="animate-fade-in-2" style={{ fontSize: 18, color: '#475569', lineHeight: 1.6, margin: 0, maxWidth: 500 }}>
              Integre ventas, inventarios y CRM en una sola plataforma en la nube diseñada específicamente para empresas de alto rendimiento.
            </p>

            <div className="animate-fade-in-3" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {session?.user ? (
                <Link href={session.user.companyStatus === 'SUSPENDED' ? "/#planes" : "/dashboard"} style={{ textDecoration: 'none' }}>
                  <button className="btn-red" style={{ padding: '16px 36px', fontSize: 16 }}>
                    {session.user.companyStatus === 'SUSPENDED' ? 'Completar Pago' : 'Ir al Dashboard'}
                    <ArrowRight size={18} />
                  </button>
                </Link>
              ) : (
                <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                  <button className="btn-red" style={{ padding: '16px 36px', fontSize: 16 }}>
                    Comenzar Ahora
                    <ArrowRight size={18} />
                  </button>
                </Link>
              )}
              <Link href="#modulos" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '16px 36px', fontSize: 16, fontWeight: 700, color: '#0f172a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={16} fill="#0f172a" />
                  </div>
                  Ver Funciones
                </button>
              </Link>
            </div>
          </div>

          {/* Hero Image / Mockup */}
          <div className="animate-float" style={{ position: 'relative' }}>
            <div style={{ background: '#0f172a', borderRadius: 32, padding: 8, boxShadow: '0 30px 60px rgba(15,23,42,0.2)' }}>
              <div style={{ background: '#ffffff', borderRadius: 24, overflow: 'hidden' }}>
                {/* Browser bar */}
                <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                </div>
                {/* App Content */}
                <div style={{ padding: 24, height: 'auto', minHeight: 400, background: '#f8fafc' }}>
                  <div className="hero-stats">
                    <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Ventas del Día</div>
                      <div style={{ fontSize: 28, color: '#0f172a', fontWeight: 900, marginTop: 4 }}>$ 42M</div>
                      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 8 }}>+12.5% vs ayer</div>
                    </div>
                    <div style={{ flex: 1, background: '#dc2626', padding: 20, borderRadius: 16, color: '#fff', boxShadow: '0 10px 20px rgba(220,38,38,0.2)' }}>
                      <div style={{ fontSize: 12, color: '#fecdd3', fontWeight: 600 }}>Órdenes Pendientes</div>
                      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>124</div>
                      <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 600, marginTop: 8 }}>Requieren atención</div>
                    </div>
                  </div>
                  
                  <div className="hidden md:flex" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, height: 200, alignItems: 'flex-end', gap: 12 }}>
                    {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                      <div key={i} style={{ flex: 1, background: i === 5 ? '#dc2626' : '#e2e8f0', height: `${h}%`, borderRadius: 8, transition: 'height 1s ease' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Flotante 1 */}
            <div className="animate-float-delay hidden lg:flex" style={{ position: 'absolute', top: 40, left: -40, background: '#fff', padding: 16, borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', alignItems: 'center', gap: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 48, height: 48, background: '#fef2f2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={24} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Inventario Sincronizado</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Hace 2 min</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS — BANNER AZUL OSCURO
      ══════════════════════════════════════════ */}
      <section style={{ background: '#0f172a', padding: '60px 24px' }}>
        <div className="stats-grid" style={{ maxWidth: 1280, margin: '0 auto' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MÓDULOS — DISEÑO LLAMATIVO
      ══════════════════════════════════════════ */}
      <section id="modulos" style={{ padding: '120px 24px', background: '#f8fafc', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', background: 'linear-gradient(to bottom, #ffffff, #f8fafc)' }} />
        
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span style={{ display: 'inline-block', color: '#dc2626', fontSize: 14, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              Arquitectura Modular
            </span>
            <h2 style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Todo lo que necesita.<br />Nada que le sobre.
            </h2>
          </div>

          <div className="modules-grid">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              const col = moduleColors[idx % moduleColors.length];
              return (
                <div key={idx} className="module-card">
                  <div style={{
                    width: 56, height: 56,
                    borderRadius: 16,
                    background: col.bg,
                    border: `1px solid ${col.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 24,
                  }}>
                    <Icon size={24} color={col.icon} />
                  </div>

                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{m.name}</h3>
                  <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0 }}>{m.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PLANES RESTAURADOS A SU ORDEN Y CONTENIDO ORIGINAL
      ══════════════════════════════════════════ */}
      <InteractivePricing />

      {/* ══════════════════════════════════════════
          FOOTER AZUL OSCURO
      ══════════════════════════════════════════ */}
      <footer id="contacto" style={{ background: '#020617', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, background: '#ef4444', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#ffffff" />
                </div>
                <span style={{ fontWeight: 900, fontSize: 18, color: '#ffffff' }}>GNS <span style={{ color: '#ef4444' }}>SARRIATECH</span></span>
              </div>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, maxWidth: 300 }}>
                La plataforma ERP de última generación que escala junto con su empresa.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Contacto</div>
              <a href="#" style={{ display: 'block', color: '#94a3b8', marginBottom: 12, textDecoration: 'none' }}>ventas@sarriatech.com</a>
              <a href="#" style={{ display: 'block', color: '#94a3b8', marginBottom: 12, textDecoration: 'none' }}>+57 300 000 0000</a>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Sistema</div>
              {['Módulos', 'Integraciones', 'Planes', 'Actualizaciones'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#94a3b8', marginBottom: 12, textDecoration: 'none' }}>{t}</a>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Legal</div>
              {['Términos de servicio', 'Política de privacidad', 'SLA'].map((t) => (
                <a key={t} href="#" style={{ display: 'block', color: '#94a3b8', marginBottom: 12, textDecoration: 'none' }}>{t}</a>
              ))}
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 32, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            © {new Date().getFullYear()} GNS Gestión de Negocios SarriaTech. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

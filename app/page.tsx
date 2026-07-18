import Link from 'next/link';
import { 
  ArrowRight, Sparkles, ShieldCheck, Settings, BarChart3, 
  Boxes, Folder, Tags, Factory, ShoppingCart, Users, 
  Building, Truck, DollarSign, FileText, Check, Star 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const modules = [
    { name: 'Dashboard', icon: BarChart3, description: 'Resumen en tiempo real del estado comercial y métricas clave.' },
    { name: 'Productos', icon: Boxes, description: 'Catálogo unificado, control de stock y alertas de reabastecimiento.' },
    { name: 'Categorías', icon: Tags, description: 'Clasificación estructurada de artículos del catálogo.' },
    { name: 'Grupos', icon: Folder, description: 'Agrupaciones estratégicas de productos por colecciones.' },
    { name: 'Proveedores', icon: Factory, description: 'Directorio de aliados comerciales e historial de compras.' },
    { name: 'Ventas', icon: ShoppingCart, description: 'Facturación rápida, arqueo de caja y formas de pago.' },
    { name: 'Compras', icon: Truck, description: 'Órdenes de suministro y reposición de existencias.' },
    { name: 'Usuarios', icon: Users, description: 'Asignación de roles, permisos detallados y bitácoras.' },
    { name: 'CRM', icon: Building, description: 'Gestión integral de clientes, prospectos y oportunidades.' },
    { name: 'Finanzas', icon: DollarSign, description: 'Monitoreo de ingresos, egresos y control de márgenes.' },
    { name: 'Reportes', icon: FileText, description: 'Informes detallados y descargables para toma de decisiones.' },
    { name: 'Auditoría', icon: ShieldCheck, description: 'Historial completo de acciones y trazabilidad de datos.' },
    { name: 'Configuración', icon: Settings, description: 'Ajustes generales, facturación y localización.' },
    { name: 'Analítica', icon: Star, description: 'Modelos de rendimiento y previsión de demanda.' },
  ];

  const benefits = [
    { title: 'Control de Inventario', desc: 'Precisión absoluta en existencias con alertas inteligentes.' },
    { title: 'Máxima Seguridad', desc: 'Protocolos de cifrado, 2FA y protección de datos corporativos.' },
    { title: 'Trazabilidad y Auditoría', desc: 'Registro detallado e inmutable de cada acción en el sistema.' },
    { title: 'Reportes Detallados', desc: 'Información analítica estructurada para la toma de decisiones.' },
    { title: 'Entorno Multiusuario', desc: 'Colaboración en tiempo real con control de roles jerárquicos.' },
    { title: 'Escalabilidad SaaS', desc: 'Arquitectura diseñada para crecer al ritmo de su organización.' },
    { title: 'Gestión Empresarial', desc: 'Unificación de compras, ventas y CRM en una sola herramienta.' },
    { title: 'Analítica de Negocios', desc: 'Gráficos interactivos de tendencias comerciales e ingresos.' },
    { title: 'Control Financiero', desc: 'Seguimiento exacto de egresos, ingresos y márgenes de ganancia.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#C5A059] selection:text-slate-950 relative overflow-hidden">
      
      {/* Estilos Inline para Animaciones Premium */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradientBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatEffect {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.05); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientBg 12s ease infinite;
        }
        .animate-float {
          animation: floatEffect 7s ease-in-out infinite;
        }
        .animate-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .border-glow {
          box-shadow: 0 0 15px rgba(197, 160, 89, 0.15);
        }
        .border-glow-hover:hover {
          box-shadow: 0 0 25px rgba(185, 28, 28, 0.3);
          border-color: rgba(185, 28, 28, 0.4);
        }
      `}} />

      {/* Capa de fondo con luces y partículas */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#7f1d1d]/20 via-transparent to-transparent -z-10" />
      <div className="absolute top-1/4 left-1/10 w-96 h-96 rounded-full bg-[#b91c1c]/10 blur-[120px] animate-glow" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-[120px] animate-glow" style={{ animationDelay: '2s' }} />

      {/* ─── HEADER / NAVIGATION ─── */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#b91c1c] to-[#C5A059] text-white shadow-lg border border-white/10">
            <Sparkles size={20} className="animate-pulse text-amber-100" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-[#C5A059]">
              GNS SARRIATECH
            </span>
            <p className="text-[9px] font-bold text-[#C5A059] tracking-[0.25em] uppercase">Gestión de Negocios</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-sm font-semibold text-slate-300 hover:text-white transition">
            Iniciar Sesión
          </Link>
          <Link href="/auth/login?demo=true">
            <Button className="bg-gradient-to-r from-[#b91c1c] to-[#C5A059] text-white font-bold border-0 hover:opacity-90 px-5 rounded-xl transition shadow-md shadow-red-950/40">
              Solicitar Demo
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/5 px-4.5 py-1.5 text-xs font-semibold text-[#C5A059] uppercase tracking-wider mb-6 animate-float">
          <Star size={12} className="fill-[#C5A059]" />
          ERP DE ALTO NIVEL PARA EMPRESAS
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
          Control Total y Gestión Inteligente para su Negocio
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Optimice sus inventarios, ventas, compras and CRM con la plataforma corporativa de <span className="font-bold text-white">GNS SarriaTech</span>. Diseñado para ofrecer máxima seguridad y rendimiento.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/auth/login">
            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-[#b91c1c] to-[#C5A059] text-white font-bold border-0 rounded-2xl hover:opacity-95 shadow-xl shadow-red-950/40 text-base transition-all">
              Ingresar al Sistema
              <ArrowRight size={18} className="ml-1.5" />
            </Button>
          </Link>
          <Link href="/auth/login?demo=true">
            <button className="h-14 px-8 border border-slate-700 bg-slate-900/60 hover:bg-slate-900 font-bold text-slate-200 rounded-2xl transition hover:border-slate-500 text-base flex items-center">
              Solicitar Demo Gratuita
            </button>
          </Link>
        </div>

        {/* Simulador de interfaz de Dashboard */}
        <div className="mt-20 w-full max-w-5xl rounded-[32px] border border-white/10 bg-slate-900/50 p-4 md:p-6 shadow-2xl relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#b91c1c]/10 to-[#C5A059]/10 rounded-[32px] blur-[30px] -z-10 opacity-60 group-hover:opacity-90 transition-opacity" />
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
            <span className="text-xs text-slate-500 font-mono ml-3 truncate">gns-dashboard.sarriatech.com</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/5 bg-slate-950 p-6 flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4 text-left">
              <div className="h-6 w-32 bg-[#b91c1c]/15 rounded-lg border border-[#b91c1c]/25 flex items-center justify-center text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                PANEL GERENCIAL
              </div>
              <h3 className="text-2xl font-black text-white">Analíticas Multitienda en Tiempo Real</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Visualice las ventas diarias, controle los márgenes comerciales de sus líneas y reciba notificaciones automáticas cuando el catálogo requiera reaprovisionarse de existencias.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ventas</p>
                  <p className="text-sm font-extrabold text-emerald-400 mt-1">+24.8%</p>
                </div>
                <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Margen</p>
                  <p className="text-sm font-extrabold text-[#C5A059] mt-1">42.5%</p>
                </div>
                <div className="p-3 bg-slate-900 border border-white/5 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Agotados</p>
                  <p className="text-sm font-extrabold text-red-400 mt-1">0 u.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-48 md:h-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas de los Últimos Meses</span>
                <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/25 px-2 py-0.5 rounded font-bold">ANUAL</span>
              </div>
              <div className="flex items-end justify-between h-28 gap-2 pt-4">
                <div className="w-full bg-slate-800 rounded-t-lg h-[40%] hover:bg-[#b91c1c]/50 transition-colors" />
                <div className="w-full bg-slate-800 rounded-t-lg h-[65%] hover:bg-[#b91c1c]/60 transition-colors" />
                <div className="w-full bg-slate-800 rounded-t-lg h-[50%] hover:bg-[#b91c1c]/50 transition-colors" />
                <div className="w-full bg-[#b91c1c] rounded-t-lg h-[85%] relative shadow-[0_0_15px_rgba(185,28,28,0.3)]" />
                <div className="w-full bg-slate-800 rounded-t-lg h-[70%] hover:bg-[#b91c1c]/60 transition-colors" />
                <div className="w-full bg-[#C5A059] rounded-t-lg h-[95%] relative shadow-[0_0_15px_rgba(197,160,89,0.3)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOBRE NOSOTROS ─── */}
      <section className="bg-slate-900/40 border-y border-white/5 py-24 relative">
        <div className="max-w-7xl mx-auto px-6 grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-left">
            <div className="h-6 w-36 bg-[#b91c1c]/10 rounded-full border border-[#b91c1c]/20 flex items-center justify-center text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
              NUESTRA PROPUESTA
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">¿Qué es Gestión de Negocios SarriaTech?</h2>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              Es un ecosistema de planificación de recursos empresariales (ERP) concebido para digitalizar y unificar los procesos comerciales de pequeñas y medianas empresas con altos estándares de control operativo.
            </p>
            <p className="text-slate-400 leading-relaxed text-sm md:text-base">
              GNS centraliza el inventario físico, gestiona canales de ventas y compras, organiza las carteras de clientes a través del módulo de CRM y provee una bitácora detallada de auditoría para asegurar la completa transparencia y el cumplimiento normativo.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
                <h4 className="font-extrabold text-white text-base">Operación Integrada</h4>
                <p className="text-xs text-slate-500 mt-1">Conectividad completa entre compras, almacén y ventas.</p>
              </div>
              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl">
                <h4 className="font-extrabold text-white text-base">Seguridad Activa</h4>
                <p className="text-xs text-slate-500 mt-1">Logs de auditoría inmutables para el control interno.</p>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center items-center lg:pl-10">
            <div className="w-80 h-80 rounded-[40px] border border-white/10 bg-gradient-to-tr from-slate-950 to-slate-900 p-8 shadow-2xl relative overflow-hidden animate-float">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-[#b91c1c]/15 blur-2xl" />
              <ShieldCheck size={48} className="text-[#C5A059] mb-6" />
              <h3 className="text-xl font-bold text-white mb-3">La Mayor Garantía</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevenga la pérdida de inventario, identifique discrepancias y mitigue el fraude con el registro transaccional en tiempo real y el control de accesos por roles restringidos.
              </p>
              <div className="mt-8 border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>ESTÁNDAR MILITAR DE SEGURIDAD</span>
                <span>GNS v2.6</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MÓDULOS DEL SISTEMA ─── */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Módulos Corporativos</h2>
        <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
          Una estructura modular completa de herramientas sofisticadas que cooperan en armonía. Active únicamente lo que su empresa necesita.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 text-left">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div 
                key={idx} 
                className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 hover:border-red-600/30 hover:bg-slate-900/60 transition-all duration-300 group border-glow-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon size={18} className="text-[#C5A059] group-hover:text-[#b91c1c] transition-colors" />
                </div>
                <h3 className="font-extrabold text-white text-base mt-4">{m.name}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{m.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── BENEFICIOS ─── */}
      <section className="bg-slate-900/40 border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Ventajas Competitivas para su Negocio</h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            GNS SarriaTech le provee una base robusta para asegurar la rentabilidad de sus operaciones comerciales.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex gap-4 p-5 rounded-2xl hover:bg-slate-900/25 transition">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#b91c1c]/10 flex items-center justify-center border border-[#b91c1c]/20">
                  <Check size={16} className="text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base">{b.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLANES DE PRECIOS ─── */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Planes Flexibles y Escalables</h2>
        <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
          Seleccione el nivel de herramientas óptimo para la escala de sus operaciones comerciales actuales. Ahorre hasta un 20% en facturación anual.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 items-stretch">
          
          {/* Plan Básico */}
          <div className="p-8 rounded-[32px] bg-slate-900/20 border border-white/5 text-left flex flex-col justify-between hover:bg-slate-900/40 transition duration-300">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">PLAN COMERCIAL BÁSICO</span>
              <h3 className="text-2xl font-black text-white mt-2">Básico</h3>
              <p className="text-xs text-slate-400 mt-2">Para negocios locales que inician en el control de stock.</p>
              
              <div className="my-6 border-y border-white/5 py-5">
                <p className="text-3xl font-black text-white">$99,000 <span className="text-xs text-slate-500 font-semibold">/ mes</span></p>
                <p className="text-xs text-[#C5A059] mt-1.5 font-bold">O $950,000 / año (Ahorro del 20%)</p>
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Dashboard de métricas generales</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Catálogo de Productos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Gestión de Proveedores</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Grupos de Productos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Categorías de Productos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Generador de Reportes de stock</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link href="/auth/login">
                <button className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 font-bold text-white rounded-xl text-xs transition">
                  Iniciar Plan Básico
                </button>
              </Link>
            </div>
          </div>

          {/* Plan Intermedio */}
          <div className="p-8 rounded-[32px] bg-slate-900/20 border border-white/5 text-left flex flex-col justify-between hover:bg-slate-900/40 transition duration-300">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">PLAN CRECIMIENTO EMPRESARIAL</span>
              <h3 className="text-2xl font-black text-white mt-2">Intermedio</h3>
              <p className="text-xs text-slate-400 mt-2">Ideal para puntos de venta con múltiples vendedores.</p>
              
              <div className="my-6 border-y border-white/5 py-5">
                <p className="text-3xl font-black text-white">$179,000 <span className="text-xs text-slate-500 font-semibold">/ mes</span></p>
                <p className="text-xs text-[#C5A059] mt-1.5 font-bold">O $1,718,000 / año (Ahorro del 20%)</p>
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-center gap-3 text-xs text-[#C5A059] font-bold"><Check size={14} className="text-[#C5A059]" /> Todo lo del Plan Básico</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Facturación y Registro de Ventas</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Gestión de Usuarios y roles</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Analítica de facturación e ingresos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Soporte estándar por correo electrónico</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link href="/auth/login">
                <button className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 font-bold text-white rounded-xl text-xs transition">
                  Iniciar Plan Intermedio
                </button>
              </Link>
            </div>
          </div>

          {/* Plan Premium (Highlighted) */}
          <div className="p-8 rounded-[32px] bg-slate-900 border-2 border-[#C5A059] text-left flex flex-col justify-between relative shadow-2xl shadow-red-950/20 hover:scale-[1.01] transition duration-300">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#b91c1c] to-[#C5A059] text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
              MÁS POPULAR
            </div>
            <div>
              <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest">SISTEMA INTEGRAL DE CONTROL</span>
              <h3 className="text-2xl font-black text-white mt-2">Premium</h3>
              <p className="text-xs text-slate-400 mt-2">Solución ERP avanzada para control transaccional riguroso.</p>
              
              <div className="my-6 border-y border-white/10 py-5">
                <p className="text-3xl font-black text-white">$299,000 <span className="text-xs text-slate-500 font-semibold">/ mes</span></p>
                <p className="text-xs text-[#C5A059] mt-1.5 font-bold">O $2,870,000 / año (Ahorro del 20%)</p>
              </div>

              <ul className="space-y-3.5">
                <li className="flex items-center gap-3 text-xs text-[#C5A059] font-bold"><Check size={14} className="text-[#C5A059]" /> Todo lo del Plan Intermedio</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Bitácora de Auditoría de datos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Módulo Financiero e Ingresos/Gastos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Órdenes de Compra y Suministro</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> CRM integral de clientes y prospectos</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Configuración de Facturas Personalizada</li>
                <li className="flex items-center gap-3 text-xs text-slate-300"><Check size={14} className="text-[#C5A059]" /> Soporte prioritario 24/7 vía chat</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link href="/auth/login">
                <button className="w-full py-3.5 bg-gradient-to-r from-[#b91c1c] to-[#C5A059] hover:opacity-95 font-bold text-white rounded-xl text-xs transition shadow-md shadow-red-950/40">
                  Iniciar Plan Premium
                </button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 border-t border-white/5 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#C5A059] h-5 w-5" />
              <span className="font-extrabold text-sm tracking-[0.25em] text-white">GNS SARRIATECH</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Plataforma de alta ingeniería para la planificación y optimización del control comercial de inventarios, ventas y CRM.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Contacto</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>Soporte: info@sarriatech.com</li>
              <li>Comercial: ventas@sarriatech.com</li>
              <li>Teléfono: +57 (601) 455-8899</li>
              <li>Bogotá, Colombia</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Módulos Principales</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>Control de Almacén</li>
              <li>Facturación Electrónica</li>
              <li>Fidelización CRM</li>
              <li>Finanzas & Bitácora</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Seguridad</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>Doble factor (2FA)</li>
              <li>Auditoría inmutable</li>
              <li>Respaldos automáticos</li>
              <li>Políticas de acceso</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-600 gap-4">
          <p>© {new Date().getFullYear()} GNS Gestión de Negocios SarriaTech. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition">Términos de servicio</a>
            <a href="#" className="hover:text-slate-400 transition">Políticas de Privacidad</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

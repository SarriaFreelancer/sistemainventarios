'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import {
  Sparkles,
  Bot,
  User,
  Send,
  Boxes,
  DollarSign,
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Cpu,
  Zap,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessMetrics, runAiDiagnostic, sendAiChatMessage } from '@/app/actions/ai-actions';
import { successAlert, errorAlert } from '@/lib/sweetalert';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isDiagnostic?: boolean;
}

const SUGGESTED_PROMPTS = [
  {
    icon: AlertTriangle,
    title: 'Productos en Riesgo',
    prompt: '¿Cuáles son mis productos con stock crítico o agotados y qué prioridad debo darles para reabastecer?',
  },
  {
    icon: DollarSign,
    title: 'Márgenes de Ganancia',
    prompt: '¿Qué productos tienen un margen de ganancia inferior al 20% y a qué precio sugerirías ajustarlos?',
  },
  {
    icon: Layers,
    title: 'Ideas de Nuevos Kits',
    prompt: 'Analiza mis productos con mayor inventario y proponme 3 ideas de Kits comerciales para aumentar el ticket de venta.',
  },
  {
    icon: TrendingUp,
    title: 'Estrategia de Ventas',
    prompt: '¿Qué estrategias comerciales y de rotación de inventario me recomiendas aplicar este mes para mejorar mi liquidez?',
  },
];

export function IaClient({
  initialMetrics,
  companyName,
}: {
  initialMetrics: BusinessMetrics | null;
  companyName: string;
}) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(initialMetrics);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! Soy **GNS AI Advisor**, tu consultor inteligente de inventarios y negocios impulsado por **Groq LPU (Llama 3.3 70B)**.

Tengo acceso seguro y en tiempo real a las métricas de **${companyName || 'tu empresa'}** (catálogo, existencias, costos, ventas recientes y kits comerciales).

Puedes pulsar cualquiera de las **auditorías rápidas** de arriba o preguntarme cualquier duda sobre tus inventarios, márgenes y estrategias de venta. ¿En qué te puedo asesorar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [activeDiagnostic, setActiveDiagnostic] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPending]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');

    startTransition(async () => {
      // Filtrar mensajes para el payload de la API
      const apiMessages = newHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await sendAiChatMessage(apiMessages, true);

      if (res.success && res.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.message!,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        errorAlert('Error de IA', res.error || 'No se pudo conectar con el motor Groq.');
      }
    });
  };

  const handleRunDiagnostic = (type: 'stock' | 'margins' | 'kits' | 'general') => {
    if (isPending) return;

    const titles: Record<string, string> = {
      stock: '🔍 Auditoría de Stock Crítico y Reabastecimiento',
      margins: '💰 Análisis de Costos, Precios y Márgenes',
      kits: '🎁 Propuesta de Nuevos Kits y Promociones',
      general: '📈 Diagnóstico Ejecutivo 360° del Negocio',
    };

    setActiveDiagnostic(type);

    const userMsg: ChatMessage = {
      id: `diag-user-${Date.now()}`,
      role: 'user',
      content: `Por favor ejecuta la auditoría: **${titles[type]}**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDiagnostic: true,
    };

    setMessages((prev) => [...prev, userMsg]);

    startTransition(async () => {
      const res = await runAiDiagnostic(type);
      setActiveDiagnostic(null);

      if (res.success && res.analysis) {
        setMessages((prev) => [
          ...prev,
          {
            id: `diag-resp-${Date.now()}`,
            role: 'assistant',
            content: res.analysis!,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isDiagnostic: true,
          },
        ]);
      } else {
        errorAlert('Error en Diagnóstico', res.error || 'No se pudo generar el análisis.');
      }
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Historial de conversación reiniciado. ¿Sobre qué tema de tu inventario o negocio deseas consultar ahora?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const fmtCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-7xl mx-auto space-y-4">
      {/* ── HEADER SUPERIOR: Motor Groq & Métricas Rápidas ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border/80 shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-l from-purple-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-foreground tracking-tight">
                Asistente IA de Negocios
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 fill-current" />
                GROQ LPU · LLAMA 3.3 70B
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Optimización de stock, auditoría de márgenes y consejos estratégicos con datos en vivo de <strong className="text-foreground">{companyName}</strong>.
            </p>
          </div>
        </div>

        {/* Resumen de KPIs rápidos */}
        {metrics && (
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto relative z-10">
            <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center gap-2 shrink-0">
              <Boxes className="h-3.5 w-3.5 text-blue-500" />
              <span><strong>{metrics.totalProducts}</strong> Prods ({metrics.totalUnits}u)</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center gap-2 shrink-0">
              <AlertTriangle className={`h-3.5 w-3.5 ${metrics.outOfStockCount > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
              <span><strong>{metrics.outOfStockCount}</strong> Agotados</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs flex items-center gap-2 shrink-0">
              <Layers className="h-3.5 w-3.5 text-purple-500" />
              <span><strong>{metrics.completeKits}</strong> Kits Armables</span>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTONES DE AUDITORÍA RÁPIDA (1 CLIC) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <button
          type="button"
          onClick={() => handleRunDiagnostic('stock')}
          disabled={isPending}
          className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-left flex flex-col justify-between group active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Auditoría</span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-amber-500 transition-colors">
              Stock Crítico & Faltantes
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              Detectar quiebres y plan de compras
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleRunDiagnostic('margins')}
          disabled={isPending}
          className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-left flex flex-col justify-between group active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Rentabilidad</span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-emerald-500 transition-colors">
              Costos y Márgenes Bajos
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              Precios sugeridos y rentabilidad
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleRunDiagnostic('kits')}
          disabled={isPending}
          className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left flex flex-col justify-between group active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <Layers className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Kits Comerciales</span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-purple-500 transition-colors">
              Sugerir Nuevos Kits
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              Combos para subir ticket promedio
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleRunDiagnostic('general')}
          disabled={isPending}
          className="p-3.5 rounded-2xl border border-border/80 bg-card hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left flex flex-col justify-between group active:scale-[0.98] disabled:opacity-50 shadow-sm"
        >
          <div className="flex items-center justify-between w-full">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Estrategia</span>
          </div>
          <div className="mt-2.5">
            <h4 className="text-xs font-bold text-foreground group-hover:text-blue-500 transition-colors">
              Diagnóstico 360° Negocio
            </h4>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
              Salud comercial, riesgos y plan
            </p>
          </div>
        </button>
      </div>

      {/* ── ÁREA PRINCIPAL: Chat Conversacional & Respuestas ── */}
      <div className="flex-1 min-h-0 flex flex-col rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
        {/* Barra superior del chat */}
        <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Bot className="h-4 w-4 text-purple-500" />
            <span>Consultor Ejecutivo en Línea</span>
            {isPending && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full animate-pulse">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                Analizando con Groq LPU...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearChat}
              title="Limpiar conversación"
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-muted transition"
            >
              <Trash2 className="h-3 w-3" />
              <span>Limpiar Chat</span>
            </button>
          </div>
        </div>

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`group relative max-w-3xl rounded-3xl px-5 py-4 text-xs sm:text-sm leading-relaxed transition-all shadow-sm ${
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-muted/40 dark:bg-[#121829] border border-border/80 text-foreground rounded-tl-none'
                  }`}
                >
                  {/* Botón copiar respuesta */}
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-card/80 hover:bg-card border border-border text-muted-foreground hover:text-foreground transition shadow-sm"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  )}

                  {/* Renderizado con formato */}
                  <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none space-y-2 whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  <div
                    className={`mt-2.5 text-[10px] font-mono flex items-center gap-1.5 ${
                      isUser ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isDiagnostic && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold">
                        DIAGNÓSTICO
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loader mientras genera respuesta */}
          {isPending && (
            <div className="flex gap-3.5 justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-muted/40 dark:bg-[#121829] border border-border/80 rounded-3xl rounded-tl-none px-5 py-4 text-xs flex items-center gap-2 text-muted-foreground shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Procesando análisis con Groq LPU...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preguntas sugeridas (Chips) */}
        <div className="px-4 py-2 border-t border-border/40 bg-muted/10 overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-amber-500" />
            Sugerencias:
          </span>
          {SUGGESTED_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(item.prompt)}
                disabled={isPending}
                className="px-3 py-1 rounded-xl bg-card border border-border/80 hover:border-purple-500/40 text-[11px] font-medium text-foreground/80 hover:text-foreground hover:bg-purple-500/5 transition whitespace-nowrap flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                <Icon className="h-3 w-3 text-purple-500" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Formulario de Entrada */}
        <div className="p-3 sm:p-4 border-t border-border/60 bg-card shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe tu consulta o pide un consejo sobre tu inventario, costos o kits... (Enter para enviar)"
                rows={1}
                disabled={isPending}
                className="w-full resize-none rounded-2xl border border-border bg-muted/20 px-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition disabled:opacity-50"
              />
            </div>

            <Button
              type="submit"
              disabled={!inputMessage.trim() || isPending}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Consultar</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

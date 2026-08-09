"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, CalendarIcon, RefreshCw, Check } from 'lucide-react';
import { useState, useEffect, useTransition } from 'react';

export function FinanzasFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetParam = searchParams.get('preset') || 'all';
  
  const [preset, setPreset] = useState(presetParam);
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPreset(presetParam);
    if (presetParam === 'custom') {
      setDateFrom(searchParams.get('from') || '');
      setDateTo(searchParams.get('to') || '');
    }
  }, [presetParam, searchParams]);

  const handleApply = (newPreset: string, fromStr?: string, toStr?: string) => {
    setPreset(newPreset);
    startTransition(() => {
      const params = new URLSearchParams();
      if (newPreset !== 'all') params.set('preset', newPreset);
      if (newPreset === 'custom') {
        if (fromStr) params.set('from', fromStr);
        if (toStr) params.set('to', toStr);
      }
      router.push(`/dashboard/finanzas?${params.toString()}`);
    });
  };

  const onSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (preset === 'custom') {
      handleApply('custom', dateFrom, dateTo);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative z-20 mb-6">
      <div className="flex flex-col gap-4">
        
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Filter size={14} className="text-primary" />
            Filtrar Finanzas por Fecha:
          </p>
          {isPending && (
            <span className="text-xs font-bold text-primary animate-pulse flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin" /> Actualizando...
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {[
            { id: 'all', label: 'Todo el Histórico' },
            { id: 'today', label: 'Hoy' },
            { id: 'yesterday', label: 'Ayer' },
            { id: '7days', label: 'Últimos 7 Días' },
            { id: '30days', label: 'Últimos 30 Días' },
            { id: 'custom', label: 'Rango / Fecha Específica' },
          ].map((item) => {
            const isSelected = preset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleApply(item.id)}
                disabled={isPending}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 border shadow-sm ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary scale-[1.03] shadow-md"
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }`}
              >
                {isSelected && <Check size={12} />}
                {item.label}
              </button>
            );
          })}
        </div>

        {preset === 'custom' && (
          <form onSubmit={onSubmitCustom} className="p-4 rounded-2xl bg-muted/40 border border-border/80 animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="space-y-1.5 flex-1 w-full">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <CalendarIcon size={12} className="text-primary" /> Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
              </div>
              <div className="space-y-1.5 flex-1 w-full">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <CalendarIcon size={12} className="text-primary" /> Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs transition-all hover:brightness-110 active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
                Aplicar Rango
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

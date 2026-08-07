"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Chrome, Globe, Compass, Laptop, Smartphone, Tablet, Monitor, Search, Loader2, SlidersHorizontal, ShieldAlert, ChevronLeft, ChevronRight, X } from "lucide-react";

interface AuditLog {
  id: number;
  companyId: number | null;
  company?: { name: string } | null;
  userId: number | null;
  user?: { name: string; email: string } | null;
  module: string;
  action: string;
  entity: string;
  entityId: number | null;
  description: string;
  oldValues: any;
  newValues: any;
  ip: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  country: string | null;
  city: string | null;
  createdAt: string;
}

interface AuditClientProps {
  initialLogs: AuditLog[];
  total: number;
  currentPage: number;
  totalPages: number;
  initialSearch: string;
  userRole: string;
}

export function AuditClient({
  initialLogs,
  total,
  currentPage,
  totalPages,
  initialSearch,
  userRole
}: AuditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (tableRef.current) {
      setContentWidth(tableRef.current.scrollWidth);
    }
  }, [initialLogs]);

  const handleTopScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Router Update for Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(`/dashboard/audit?page=1&search=${encodeURIComponent(search)}`);
    });
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    startTransition(() => {
      router.push(`/dashboard/audit?page=${page}&search=${encodeURIComponent(search)}`);
    });
  };

  // Helper para pintar badges de acción
  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
      case "VOID":
      case "ANULAR":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  // Helper para iconos de Navegador
  const getBrowserIcon = (browserName: string | null) => {
    const name = (browserName || "").toLowerCase();
    if (name.includes("chrome")) return <Chrome size={14} className="text-amber-500" />;
    if (name.includes("edge")) return <Globe size={14} className="text-blue-500" />;
    if (name.includes("firefox")) return <Globe size={14} className="text-orange-500" />;
    if (name.includes("safari")) return <Compass size={14} className="text-sky-500" />;
    return <Laptop size={14} className="text-muted-foreground" />;
  };

  // Helper para iconos de Dispositivo
  const getDeviceIcon = (device: string | null) => {
    const dev = (device || "").toLowerCase();
    if (dev.includes("móvil") || dev.includes("mobile")) return <Smartphone size={14} />;
    if (dev.includes("tablet")) return <Tablet size={14} />;
    return <Monitor size={14} />;
  };

  // Comparador de diferencias de campos
  const renderJSONDiff = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return <p className="text-sm text-muted-foreground">Sin detalles de valores.</p>;

    const keys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]));
    const diffs: { key: string; oldVal: any; newVal: any; isDifferent: boolean }[] = [];

    keys.forEach((key) => {
      // Ignorar campos de actualización interna redundantes
      if (key === "updatedAt" || key === "createdAt" || key === "id") return;
      const oldRaw = oldVal?.[key];
      const newRaw = newVal?.[key];

      const oldStr = typeof oldRaw === "object" ? JSON.stringify(oldRaw) : oldRaw;
      const newStr = typeof newRaw === "object" ? JSON.stringify(newRaw) : newRaw;

      diffs.push({
        key,
        oldVal: oldStr,
        newVal: newStr,
        isDifferent: oldStr !== newStr,
      });
    });

    const modifiedFields = diffs.filter((d) => d.isDifferent);

    if (modifiedFields.length === 0) {
      return (
        <div className="bg-muted/50 p-4 rounded-xl border border-border/80">
          <p className="text-sm text-muted-foreground">No se detectaron cambios en las propiedades.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4 border-b border-border/60 pb-2 text-xs font-bold text-muted-foreground">
          <div>CAMPO</div>
          <div>VALOR ANTERIOR</div>
          <div>VALOR NUEVO</div>
        </div>
        <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto pr-1">
          {modifiedFields.map((field) => (
            <div key={field.key} className="grid grid-cols-3 gap-4 py-2.5 text-sm items-center">
              <span className="font-semibold text-foreground/80 font-mono text-xs">{field.key}</span>
              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg border border-rose-500/15 break-all max-h-24 overflow-y-auto">
                {field.oldVal !== undefined ? String(field.oldVal) : "—"}
              </span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/15 break-all max-h-24 overflow-y-auto">
                {field.newVal !== undefined ? String(field.newVal) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* ── Barra de Búsqueda y Herramientas ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por módulo, acción, usuario o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition flex items-center gap-2 shadow-sm"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />}
            Filtrar
          </button>
        </form>

        <div className="text-xs font-semibold text-muted-foreground">
          Mostrando {initialLogs.length} de {total} registros de auditoría
        </div>
      </div>

      {/* ── Listado de Logs (Desktop & Mobile Responsive) ── */}
      {initialLogs.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <ShieldAlert size={24} />
          </div>
          <h3 className="font-semibold text-lg text-foreground">Sin registros de auditoría</h3>
          <p className="text-sm text-muted-foreground mt-1">No se encontraron registros de auditoría con los parámetros indicados.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-colors duration-500">
          {/* Barra de scroll superior sincronizada */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto border-b border-border/60 bg-muted/20 py-1"
          >
            <div style={{ width: contentWidth > 0 ? `${contentWidth}px` : '1200px', height: '1px' }} />
          </div>

          {/* Tabla con scroll inferior sincronizado */}
          <div className="overflow-x-auto" ref={bottomScrollRef} onScroll={handleBottomScroll}>
            <table ref={tableRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Fecha / Hora</th>
                  {userRole === "SUPERADMIN" && <th className="px-6 py-4">Empresa</th>}
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Módulo</th>
                  <th className="px-6 py-4">Acción</th>
                  <th className="px-6 py-4 min-w-[240px]">Descripción</th>
                  <th className="px-6 py-4">Origen / Dispositivo</th>
                  <th className="px-6 py-4 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {initialLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground/80">
                      <div>{new Date(log.createdAt).toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </td>
                    {userRole === "SUPERADMIN" && (
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-foreground">
                        {log.company?.name || "Global / GNS"}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-foreground">{log.user?.name || "Sistema / Seed"}</div>
                      <div className="text-xs text-muted-foreground">{log.user?.email || "system@gns.com"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-xs bg-muted border border-border/80 px-2.5 py-1 rounded-full text-foreground/80">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-normal min-w-[240px] max-w-sm text-foreground/90 font-medium leading-snug">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                        {getBrowserIcon(log.browser)}
                        {log.browser} ({log.operatingSystem})
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        {getDeviceIcon(log.device)}
                        IP: {log.ip} • {log.city}, {log.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {(log.oldValues || log.newValues) ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-bold text-primary hover:underline bg-primary/5 hover:bg-primary/10 border border-primary/10 px-3 py-1.5 rounded-xl transition"
                        >
                          Ver Cambios
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-muted/20">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                className="flex items-center gap-1 px-4 py-2 border border-border rounded-xl text-sm font-semibold bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-card transition"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <span className="text-sm text-muted-foreground font-medium">
                Página <strong className="text-foreground font-bold">{currentPage}</strong> de <strong className="text-foreground font-bold">{totalPages}</strong>
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                className="flex items-center gap-1 px-4 py-2 border border-border rounded-xl text-sm font-semibold bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-card transition"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Detallado de Comparación JSON Diff ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-4xl rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-5 bg-muted/30">
              <div>
                <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-full mr-2 ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
                <span className="font-bold text-xs bg-muted border border-border px-2 py-0.5 rounded-md text-foreground/80 font-mono">
                  ID ENTIDAD: {selectedLog.entityId || "N/D"}
                </span>
                <h3 className="font-bold text-lg text-foreground mt-2">{selectedLog.description}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido del Modal (Comparación de Valores) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {renderJSONDiff(selectedLog.oldValues, selectedLog.newValues)}
            </div>

            {/* Pie del Modal */}
            <div className="border-t border-border/80 px-6 py-4 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground font-medium">
              <div className="flex gap-4">
                <span><strong>Dispositivo:</strong> {selectedLog.device} ({selectedLog.operatingSystem})</span>
                <span><strong>IP:</strong> {selectedLog.ip}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition shadow-sm"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

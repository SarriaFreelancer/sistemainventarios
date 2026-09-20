'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Monitor, Users, LogOut, RefreshCw, Building2, ChevronDown, ChevronRight, Wifi, WifiOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  ipAddress: string;
  browser: string;
  os: string;
  createdAt: string | Date;
  token: string;
}

interface CompanyData {
  companyId: string;
  companyName: string;
  plan: string;
  activeConnections: number;
  maxConnections: number;
  sessions: Session[];
}

interface ActiveSessionsManagerProps {
  role: string;
  currentSessionToken?: string;
}

export default function ActiveSessionsManager({ role, currentSessionToken }: ActiveSessionsManagerProps) {
  const [data, setData] = useState<CompanyData[] | CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Error fetching sessions');
      const result = await res.json();

      const formatSession = (s: any): Session => ({
        id: s.id,
        userId: s.userId,
        userName: s.user?.name || 'Usuario Desconocido',
        userEmail: s.user?.email || 'Sin correo',
        userImage: s.user?.image,
        ipAddress: s.ip || 'Desconocida',
        browser: s.browser || 'Desconocido',
        os: s.operatingSystem || 'Desconocido',
        createdAt: s.createdAt,
        token: s.token
      });

      if (role === 'SUPERADMIN' && result.companies) {
        setData(result.companies.map((c: any) => ({
          companyId: c.id,
          companyName: c.name,
          plan: c.planId || 'basico',
          activeConnections: c.sessions?.length || 0,
          maxConnections: c.maxUsers || Infinity,
          sessions: (c.sessions || []).map(formatSession)
        })));
      } else if (role === 'ADMIN' && result.company) {
        setData({
          companyId: result.company.id,
          companyName: result.company.name,
          plan: result.company.planId || 'basico',
          activeConnections: result.sessions?.length || 0,
          maxConnections: result.company.maxUsers || Infinity,
          sessions: (result.sessions || []).map(formatSession)
        });
      } else {
        setData(result);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las sesiones activas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDisconnect = async (sessionId?: string, companyId?: string, all: boolean = false) => {
    const Swal = (await import('sweetalert2')).default;

    let title = '¿Desconectar usuario?';
    let text = 'Se cerrará la sesión de este usuario.';

    if (all) {
      title = '¿Desconectar todos los usuarios?';
      text = companyId
        ? 'Se cerrarán todas las sesiones de esta empresa.'
        : 'Se cerrarán todas las sesiones del sistema.';
    }

    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, desconectar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const body = all ? { companyId, all: true } : { sessionId };
        const res = await fetch('/api/sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('Error desconectando sesión');

        toast.success(all ? 'Todas las sesiones fueron desconectadas' : 'Sesión desconectada correctamente');
        fetchData();
      } catch (error) {
        console.error(error);
        toast.error('Error al desconectar');
      }
    }
  };

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies(prev => ({
      ...prev,
      [companyId]: !prev[companyId]
    }));
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'basico': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'intermedio': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'premium': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default: return 'bg-muted text-foreground/80 border border-border';
    }
  };

  const renderUsageBar = (active: number, max: number) => {
    const percentage = Math.min((active / max) * 100, 100);
    const isWarning = active >= max;

    return (
      <div className="flex flex-col gap-1.5 min-w-[170px]">
        <div className="flex justify-between text-xs font-bold text-foreground">
          <span>{active} / {max === Infinity ? '∞' : max} conexiones</span>
          {isWarning && <span className="text-red-500 font-extrabold">Límite alcanzado</span>}
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/40">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isWarning ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderSessionTable = (sessions: Session[], companyId?: string) => {
    if (!sessions || sessions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <WifiOff className="h-10 w-10 mb-3 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No hay sesiones activas</p>
          <p className="text-xs text-muted-foreground">No se registran usuarios conectados en este momento.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-border">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Dispositivo</th>
              <th className="px-4 py-3">Conectado desde</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sessions.map((session) => {
              const isCurrentUser = session.token === currentSessionToken;

              return (
                <tr key={session.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-foreground flex items-center gap-3">
                    {session.userImage ? (
                      <img src={session.userImage} alt={session.userName} className="w-8 h-8 rounded-full border border-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xs">
                        {session.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{session.userName}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] font-black bg-primary/15 text-primary border border-primary/25 px-2 py-0.5 rounded-full">Tú</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-foreground/80">{session.userEmail}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-1 rounded-lg border border-border/60">
                      {session.ipAddress}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{session.browser}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">{session.os}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-foreground/80">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDisconnect(session.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-2 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
                        title="Desconectar usuario"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center p-12 bg-card rounded-2xl border border-border">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'ADMIN') {
    const companyData = data as CompanyData;
    if (!companyData) return null;

    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Gestión de Sesiones Activas
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-sm font-semibold text-muted-foreground">{companyData.companyName}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getPlanColor(companyData.plan)}`}>
                {companyData.plan}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {renderUsageBar(companyData.activeConnections, companyData.maxConnections)}
            <button
              onClick={() => handleDisconnect(undefined, undefined, true)}
              disabled={companyData.sessions?.length <= 1}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-500/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Desconectar Todos
            </button>
          </div>
        </div>
        {renderSessionTable(companyData.sessions)}
      </div>
    );
  }

  if (role === 'SUPERADMIN') {
    const companiesData = data as CompanyData[];
    if (!companiesData) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-card p-5 rounded-2xl border border-border shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary" />
              Control Global de Sesiones
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoreo y administración de accesos en tiempo real para todas las empresas.
            </p>
          </div>
          <button
            onClick={() => handleDisconnect(undefined, undefined, true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm shadow-red-500/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Desconectar Todas las Empresas
          </button>
        </div>

        {companiesData.length === 0 ? (
          <div className="bg-card p-10 rounded-2xl border border-border text-center text-muted-foreground">
            <p className="font-semibold text-foreground">No hay empresas con sesiones activas</p>
          </div>
        ) : (
          companiesData.map((company) => {
            const isExpanded = expandedCompanies[company.companyId];

            return (
              <div key={company.companyId} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleCompany(company.companyId)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        {company.companyName}
                      </h3>
                      <span className={`inline-block mt-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getPlanColor(company.plan)}`}>
                        {company.plan}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                    {renderUsageBar(company.activeConnections, company.maxConnections)}
                    <button
                      onClick={() => handleDisconnect(undefined, company.companyId, true)}
                      disabled={company.sessions?.length === 0}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-500/10 dark:text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border">
                    {renderSessionTable(company.sessions, company.companyId)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return null;
}

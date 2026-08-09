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
      setData(result);
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
      case 'basico': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'intermedio': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'premium': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const renderUsageBar = (active: number, max: number) => {
    const percentage = Math.min((active / max) * 100, 100);
    const isWarning = active >= max;

    return (
      <div className="flex flex-col gap-1 min-w-[150px]">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{active} / {max} conexiones</span>
          {isWarning && <span className="text-red-500 font-medium">Límite alcanzado</span>}
        </div>
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${isWarning ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderSessionTable = (sessions: Session[], companyId?: string) => {
    if (!sessions || sessions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
          <WifiOff className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
          <p>No hay sesiones activas</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-b dark:border-gray-700">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Dispositivo</th>
              <th className="px-4 py-3">Conectado desde</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const isCurrentUser = session.token === currentSessionToken;
              
              return (
                <tr key={session.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                    {session.userImage ? (
                      <img src={session.userImage} alt={session.userName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {session.userName?.charAt(0) || 'U'}
                      </div>
                    )}
                    {session.userName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">Tú</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{session.userEmail}</td>
                  <td className="px-4 py-3 font-mono text-xs">{session.ipAddress}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span>{session.browser}</span>
                      <span className="text-xs text-gray-400">{session.os}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDisconnect(session.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-md transition-colors"
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
      <div className="flex justify-center items-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'ADMIN') {
    const companyData = data as CompanyData;
    if (!companyData) return null;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Gestión de Sesiones Activas
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">{companyData.companyName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlanColor(companyData.plan)}`}>
                {companyData.plan}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {renderUsageBar(companyData.activeConnections, companyData.maxConnections)}
            <button
              onClick={() => handleDisconnect(undefined, undefined, true)}
              disabled={companyData.sessions?.length <= 1}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Control Global de Sesiones
          </h2>
          <button
            onClick={() => handleDisconnect(undefined, undefined, true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Desconectar Todas las Empresas
          </button>
        </div>

        {companiesData.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-800 text-center text-gray-500">
            No hay empresas con sesiones activas.
          </div>
        ) : (
          companiesData.map((company) => {
            const isExpanded = expandedCompanies[company.companyId];
            
            return (
              <div key={company.companyId} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div 
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleCompany(company.companyId)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {company.companyName}
                      </h3>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${getPlanColor(company.plan)}`}>
                        {company.plan}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                    {renderUsageBar(company.activeConnections, company.maxConnections)}
                    <button
                      onClick={() => handleDisconnect(undefined, company.companyId, true)}
                      disabled={company.sessions?.length === 0}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-800">
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

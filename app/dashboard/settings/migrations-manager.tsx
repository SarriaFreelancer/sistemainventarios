"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { getCompaniesForMigration, migrateCompany } from "@/app/actions/migration-actions";
import { successAlert, errorAlert, confirmAction } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

export function MigrationsManager({ servers }: { servers: any[] }) {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  // Form
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [databaseType, setDatabaseType] = useState<"SHARED" | "DEDICATED">("SHARED");
  const [customDbName, setCustomDbName] = useState("");

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await getCompaniesForMigration();
    setCompanies(data);
    setLoading(false);
  };

  const handleMigrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !selectedServer) {
      errorAlert("Error", "Seleccione una empresa y un servidor destino.");
      return;
    }

    const companyObj = companies.find((c) => c.id.toString() === selectedCompany.toString());
    const isReMigration = companyObj?.serverId != null;

    let confirmTitle = "Confirmar Migración";
    let confirmText = "¿Estás seguro de iniciar la migración? Este proceso copiará los datos del monolito al nuevo tenant y actualizará el enrutamiento de la empresa.";
    
    if (isReMigration) {
      confirmTitle = "⚠️ Confirmar RE-MIGRACIÓN";
      confirmText = `Esta empresa ya está migrada en la base de datos "${companyObj.databaseName}". Proceder copiará los datos de su base actual hacia el nuevo servidor destino. Los datos originales quedarán huérfanos. ¿Deseas continuar?`;
    }

    const confirmed = await confirmAction(
      confirmTitle,
      confirmText,
      isReMigration ? "Sí, Re-Migrar" : "Iniciar Migración",
      "Cancelar"
    );
    if (!confirmed) return;

    setMigrating(true);
    const result = await migrateCompany(selectedCompany, selectedServer, databaseType, databaseType === 'DEDICATED' ? customDbName : undefined);
    setMigrating(false);

    if (result.success) {
      successAlert("Éxito", "Migración completada correctamente.");
      setSelectedCompany("");
      setSelectedServer("");
      setCustomDbName("");
      loadCompanies();
      router.refresh();
    } else {
      errorAlert("Error", result.error || "Fallo en la migración.");
    }
  };

  const unmigratedCompanies = companies.filter(c => !c.serverId);
  const migratedCompanies = companies.filter(c => c.serverId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <ArrowRightLeft size={18} className="text-primary" />
          Motor de Migración
        </h3>
        <p className="text-sm text-muted-foreground">Mueve empresas de la base monolítica hacia los Tenants (Servidores Compartidos o Dedicados) sin tocar código.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario de Migración */}
        <div className="bg-muted/30 border border-border p-6 rounded-2xl space-y-4">
          <h4 className="font-bold text-sm">Nueva Migración</h4>
          
          <form onSubmit={handleMigrate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Empresa a Migrar / Re-migrar</label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)}
                required
                className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Seleccione una empresa...</option>
                <optgroup label="Pendientes de Migrar (En Monolito)">
                  {unmigratedCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Ya Migradas (Re-Migración)">
                  {migratedCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - ({c.databaseName})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Servidor de Destino</label>
              <select 
                value={selectedServer} 
                onChange={e => setSelectedServer(e.target.value)}
                required
                className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Seleccione servidor...</option>
                {servers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.host})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Tipo de Asignación</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={databaseType === 'SHARED'} onChange={() => setDatabaseType('SHARED')} /> Compartida (Shared)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={databaseType === 'DEDICATED'} onChange={() => setDatabaseType('DEDICATED')} /> Dedicada
                </label>
              </div>
            </div>

            {databaseType === 'DEDICATED' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Nombre de Base de Datos (Opcional)</label>
                <input 
                  type="text" 
                  value={customDbName} 
                  onChange={e => setCustomDbName(e.target.value)} 
                  placeholder="ej. empresa_xyz"
                  className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={migrating || !selectedCompany || !selectedServer}
              className="w-full mt-4 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition hover:bg-primary/90 disabled:opacity-50"
            >
              {migrating ? <Loader2 className="animate-spin" size={16} /> : <ArrowRightLeft size={16} />}
              {migrating ? 'Migrando y Configurando...' : 'Iniciar Migración'}
            </button>
          </form>
        </div>

        {/* Listado de Migradas */}
        <div className="space-y-4">
          <h4 className="font-bold text-sm">Estado de Empresas</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-bold">{unmigratedCompanies.length}</span>
              <span className="text-xs text-muted-foreground">Por Migrar (Monolito)</span>
            </div>
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col items-center">
              <span className="text-2xl font-bold text-primary">{migratedCompanies.length}</span>
              <span className="text-xs text-primary font-medium">Migradas (Tenants)</span>
            </div>
          </div>

          <div className="border border-border rounded-xl overflow-hidden mt-4">
            <div className="max-h-[300px] overflow-y-auto bg-card">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Empresa</th>
                    <th className="px-4 py-2">Tipo DB</th>
                    <th className="px-4 py-2">Servidor</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : migratedCompanies.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No hay empresas migradas</td></tr>
                  ) : (
                    migratedCompanies.map(c => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="px-4 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">{c.databaseType}</span></td>
                        <td className="px-4 py-3">{servers.find(s => s.id === c.serverId)?.name || c.serverId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

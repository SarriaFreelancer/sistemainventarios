"use client";

import React, { useState } from "react";
import { Server, ChevronDown, Database, Building, ChevronUp } from "lucide-react";

interface Company {
  id: number;
  name: string;
  databaseName: string | null;
  databaseType: "SHARED" | "DEDICATED" | null;
}

interface Server {
  id: string;
  name: string;
  engine: string;
  host: string;
  active: boolean;
  ownerId: number | null;
  companies: Company[];
}

export function DatabasesManager({ servers, allCompanies = [] }: { servers: Server[], allCompanies?: any[] }) {
  const [expandedServers, setExpandedServers] = useState({
    "monolith": true
  } as Record<string, boolean>);

  const monolithCompanies = allCompanies.filter(c => !c.serverId);


  const toggleServer = (id: string) => {
    setExpandedServers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Mapeo de Bases de Datos</h3>
        <p className="text-sm text-muted-foreground">Supervisión de Inquilinos y Servidores</p>
      </div>

      <div className="space-y-4">
        {/* Monolith Shared Database */}
        <div className="border border-border rounded-xl overflow-hidden bg-card border-blue-200">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition bg-blue-50/30"
            onClick={() => toggleServer("monolith")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Server size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  Servidor Principal (Monolítico)
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase font-bold">SHARED</span>
                </h4>
                <p className="text-xs text-muted-foreground">Localhost - inventario_produccion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold">{monolithCompanies.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Empresas</p>
              </div>
              <ChevronDown
                size={20}
                className={`text-muted-foreground transition-transform ${expandedServers["monolith"] ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {expandedServers["monolith"] && (
            <div className="p-4 border-t border-border bg-muted/5">
              <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold flex items-center gap-2">
                    <Database size={16} className="text-indigo-500" />
                    inventario_produccion
                  </h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {monolithCompanies.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Vacío.</span>
                  ) : (
                    monolithCompanies.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-xs font-semibold border border-border">
                        <Building size={12} className="text-muted-foreground" />
                        {c.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Servers */}
        {servers.length > 0 && (
          <div className="pt-4">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2">Servidores Adicionales (Inquilinos)</h4>
            <div className="space-y-4">
          {servers.map((server) => {
            const isExpanded = expandedServers[server.id];
            // Group companies by databaseName
            const databases: Record<string, Company[]> = {};
            
            server.companies?.forEach((company) => {
              if (company.databaseName) {
                if (!databases[company.databaseName]) {
                  databases[company.databaseName] = [];
                }
                databases[company.databaseName].push(company);
              }
            });

            return (
              <div key={server.id} className="border border-border rounded-xl overflow-hidden bg-card">
                {/* Cabecera del Servidor */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition"
                  onClick={() => toggleServer(server.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Server size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{server.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {server.engine} • {server.host} • {(server.companies || []).length} inquilinos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {server.ownerId ? (
                      <span className="px-2 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                        PROPIO (ADMIN)
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-full">
                        PLATAFORMA
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Lista de Bases de Datos */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-border bg-muted/10">
                    {Object.keys(databases).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No hay bases de datos mapeadas en este servidor.
                      </p>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {Object.entries(databases).map(([dbName, companies]) => {
                          const isShared = companies.some((c) => c.databaseType === "SHARED");
                          
                          return (
                            <div key={dbName} className="border border-border rounded-lg bg-background p-3 shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <Database size={16} className="text-muted-foreground" />
                                <span className="font-mono text-sm font-semibold">{dbName}</span>
                                <span
                                  className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                    isShared
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-orange-100 text-orange-700"
                                  }`}
                                >
                                  {isShared ? "SHARED" : "DEDICATED"}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {companies.map((company) => (
                                  <div key={company.id} className="flex items-center gap-2 p-2 text-sm border border-border/50 rounded-md bg-muted/30">
                                    <Building size={14} className="text-muted-foreground" />
                                    <span className="truncate">{company.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

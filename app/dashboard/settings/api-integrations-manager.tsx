"use client";

import React, { useState } from "react";
import { KeyRound, Plus, Copy, Check, Trash2, ShieldCheck, Lock, Globe, Code, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { createApiKey, toggleApiKeyStatus, updateApiKeyPermissions, deleteApiKey } from "@/app/actions/api-key-actions";
import { successAlert, errorAlert, confirmAction } from "@/lib/sweetalert";

const RESOURCES = [
  { id: "products", label: "Productos" },
  { id: "suppliers", label: "Proveedores" },
  { id: "categories", label: "Categorías" },
  { id: "groups", label: "Grupos de Productos" },
  { id: "users", label: "Usuarios" },
];

const DEFAULT_PERMISSIONS = {
  products: { read: true, create: true, update: true, delete: false },
  suppliers: { read: true, create: true, update: true, delete: false },
  categories: { read: true, create: true, update: true, delete: false },
  groups: { read: true, create: true, update: true, delete: false },
  users: { read: false, create: false, update: false, delete: false },
};

export function ApiIntegrationsManager({ 
  apiData = { isSuperAdmin: false, keys: [], hasActiveIntegrations: false },
  companies = []
}: { 
  apiData: { isSuperAdmin: boolean; keys: any[]; hasActiveIntegrations: boolean };
  companies?: { id: number; name: string }[];
}) {
  const isSuperAdmin = apiData.isSuperAdmin;
  const [keysList, setKeysList] = useState<any[]>(apiData.keys || []);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | string>(companies[0]?.id || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [permissions, setPermissions] = useState<any>(DEFAULT_PERMISSIONS);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Helper copia al portapapeles
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissions((prev: any) => ({
      ...prev,
      [resource]: {
        ...(prev[resource] || {}),
        [action]: checked
      }
    }));
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      errorAlert("Atención", "Por favor asigna un nombre para identificar la llave API.");
      return;
    }
    if (!selectedCompanyId) {
      errorAlert("Atención", "Debes seleccionar la empresa a la que se le asignará la llave API.");
      return;
    }

    setIsCreating(true);
    const res = await createApiKey({
      name: newKeyName,
      targetCompanyId: Number(selectedCompanyId),
      permissions
    });
    setIsCreating(false);

    if (res.success && res.apiKey) {
      setCreatedKey(res.apiKey.key);
      setKeysList([res.apiKey, ...keysList]);
      successAlert("¡Llave API Generada!", "Guarda tu token de acceso de forma segura.");
    } else {
      errorAlert("Error", res.error || "No se pudo generar la API Key");
    }
  };

  const handleToggleStatus = async (keyItem: any) => {
    const nextStatus = !keyItem.active;
    const res = await toggleApiKeyStatus(keyItem.id, nextStatus);
    if (res.success) {
      setKeysList(keysList.map(k => k.id === keyItem.id ? { ...k, active: nextStatus } : k));
    } else {
      errorAlert("Error", res.error || "No se pudo actualizar el estado de la llave");
    }
  };

  const handleDeleteKey = async (id: string) => {
    const confirmed = await confirmAction(
      "Revocar Llave API",
      "¿Estás seguro de revocar esta llave? Todas las aplicaciones externas conectadas perderán el acceso.",
      "Sí, Revocar Llave",
      "Cancelar"
    );
    if (!confirmed) return;

    const res = await deleteApiKey(id);
    if (res.success) {
      setKeysList(keysList.filter(k => k.id !== id));
      successAlert("Llave Revocada", "La API Key ha sido eliminada permanentemente.");
    } else {
      errorAlert("Error", res.error || "No se pudo eliminar la API Key");
    }
  };

  // VISTA PARA ADMINISTRADORES Y USUARIOS DE EMPRESA (Solo Indicador de Integraciones)
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-3xl border border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Code size={20} className="text-primary" />
              Estado de Integraciones API Externas
            </h3>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
              apiData.hasActiveIntegrations 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              {apiData.hasActiveIntegrations ? "Integraciones Activas" : "Sin Integraciones Activas"}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Las llaves de acceso e integraciones con sistemas externos (E-commerce, ERPs o aplicaciones móviles) son administradas y aprovisionadas directamente por el **Superadministrador del Sistema** por motivos de seguridad corporativa.
          </p>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-foreground mb-2">Conexiones Habilitadas para tu Empresa:</h4>
            {keysList.length === 0 ? (
              <div className="bg-card border border-border/60 p-4 rounded-2xl text-xs text-muted-foreground italic">
                Tu empresa no tiene llaves de integración configuradas en este momento. Solicita al Superadmin la generación de un token si requieres conectar un sistema externo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {keysList.map(k => (
                  <div key={k.id} className="bg-card border border-border/80 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${k.active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span className="font-extrabold text-foreground">{k.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Última actividad: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("es-CO") : "Sin uso reciente"}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      {k.active ? "Conectado" : "Inactivo"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA EXCLUSIVA DE SUPERADMIN (Gestión Global de API Keys)
  return (
    <div className="space-y-6">
      
      {/* Header de Superadmin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 rounded-3xl border border-primary/20">
        <div>
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            Control Global de Integraciones API (Superadmin)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Genera, asigna por empresa y revoca las Llaves API REST para integraciones externas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreatedKey(null);
            setNewKeyName("");
            setPermissions(DEFAULT_PERMISSIONS);
            if (companies.length > 0) setSelectedCompanyId(companies[0].id);
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:opacity-95 active:scale-95 transition shadow-md shrink-0 cursor-pointer"
        >
          <Plus size={16} /> Crear Llave API para Empresa
        </button>
      </div>

      {/* Tabla / Tarjetas de Llaves Registradas */}
      <div className="space-y-3">
        {keysList.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
              <Code size={26} />
            </div>
            <h4 className="font-bold text-sm text-foreground">No tienes Llaves API creadas</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Crea tu primera API Key para autorizar solicitudes REST HTTP externas de consulta (GET), creación (POST), edición (PUT) y eliminación (DELETE).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {keysList.map((k) => (
              <div key={k.id} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${k.active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                    <h4 className="font-extrabold text-sm text-foreground truncate">{k.name}</h4>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Empresa: {k.company?.name || `ID #${k.companyId}`}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                      k.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {k.active ? "Activa" : "Desactivada"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <code className="text-xs font-mono bg-muted/60 px-2.5 py-1 rounded-lg border border-border text-foreground truncate max-w-xs">
                      {k.key.substring(0, 16)}...****************
                    </code>
                    <button
                      onClick={() => copyToClipboard(k.key, k.id)}
                      className="text-xs text-muted-foreground hover:text-primary p-1 transition"
                      title="Copiar token completo"
                    >
                      {copiedId === k.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Último uso: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("es-CO") : "Nunca"} | Creada: {new Date(k.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </div>

                {/* Acciones de la Llave */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(k)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      k.active 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {k.active ? "Desactivar" : "Activar"}
                  </button>

                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                    title="Revocar / Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Documentación de Endpoints para la Empresa ── */}
      <div className="bg-muted/30 border border-border rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Globe size={16} className="text-primary" />
            Endpoints REST Públicos Disponibles
          </h4>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Soporta Versión v1 y v2 (/api/v1/... y /api/v2/...)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/products (o /api/v2/products)</span>
            <p className="text-[11px] text-muted-foreground">Soporta <code className="text-emerald-500 font-bold">GET</code> (Listar), <code className="text-blue-500 font-bold">POST</code> (Crear), <code className="text-amber-500 font-bold">PUT</code> (Editar) y <code className="text-rose-500 font-bold">DELETE</code> (Eliminar) productos.</p>
          </div>
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/suppliers</span>
            <p className="text-[11px] text-muted-foreground">CRUD completo para gestión remota de proveedores corporativos.</p>
          </div>
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/categories</span>
            <p className="text-[11px] text-muted-foreground">Creación y sincronización de categorías del catálogo.</p>
          </div>
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/groups</span>
            <p className="text-[11px] text-muted-foreground">Administración remota de grupos y líneas de productos.</p>
          </div>
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/sales</span>
            <p className="text-[11px] text-muted-foreground">Registro de ventas y consulta de historial por empresa con descuento de stock.</p>
          </div>
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/expenses</span>
            <p className="text-[11px] text-muted-foreground">Registro y consulta de movimientos financieros y egresos corporativos.</p>
          </div>
          <div className="bg-card border border-border/60 p-3 rounded-2xl space-y-1">
            <span className="font-extrabold text-primary block">/api/v1/users</span>
            <p className="text-[11px] text-muted-foreground">Gestión de usuarios y cuentas de colaboradores de la empresa.</p>
          </div>
        </div>
      </div>

      {/* ── Modal de Creación de API Key con Matriz de Permisos ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />
                {createdKey ? "¡Llave API Generada con Éxito!" : "Configurar Nueva Llave API"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle size={20} />
              </button>
            </div>

            {createdKey ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Copia este token de acceso ahora. Por razones de seguridad no volverá a mostrarse en texto plano:</p>
                  <div className="mt-3 flex items-center justify-between bg-muted p-3 rounded-2xl border border-border">
                    <code className="text-xs font-mono text-primary font-bold break-all select-all">{createdKey}</code>
                    <button
                      onClick={() => copyToClipboard(createdKey, "modal")}
                      className="ml-2 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === "modal" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === "modal" ? "Copiada" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition"
                >
                  Entendido y Guardado
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Empresa Destinataria</label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    required
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (ID #{c.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Identificador / Aplicación Externa</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ej. Integración E-commerce Shopify, Sistema ERP Externo, App Móvil"
                    required
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Matriz Granular de Permisos */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Matriz de Permisos de Edición, Eliminación y Creación
                  </label>

                  <div className="bg-muted/20 border border-border rounded-2xl p-3 divide-y divide-border/60">
                    {RESOURCES.map((r) => {
                      const perm = permissions[r.id] || {};
                      return (
                        <div key={r.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">{r.label}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.read}
                                onChange={(e) => handlePermissionChange(r.id, "read", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span>Consultar (GET)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.create}
                                onChange={(e) => handlePermissionChange(r.id, "create", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-emerald-500 font-semibold">Crear (POST)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.update}
                                onChange={(e) => handlePermissionChange(r.id, "update", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-amber-500 font-semibold">Editar (PUT)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.delete}
                                onChange={(e) => handlePermissionChange(r.id, "delete", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-rose-500 font-semibold">Eliminar (DELETE)</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-muted text-foreground font-bold rounded-xl text-xs hover:bg-muted/80 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition disabled:opacity-50 shadow-md"
                  >
                    {isCreating ? "Generando Token..." : "Generar API Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

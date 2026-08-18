"use client";

import React, { useState } from "react";
import { Server, Plus, Edit2, Trash2, X, Loader2, Wifi, CheckCircle2 } from "lucide-react";
import { createServer, updateServer, deleteServer, testServerConnection } from "@/app/actions/server-actions";
import { successAlert, errorAlert, confirmAction } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

export function ServersManager({ servers }: { servers: any[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [engine, setEngine] = useState("MYSQL");
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number | string>(3306);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(false);
  const [active, setActive] = useState(true);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  // Update default port based on engine
  const handleEngineChange = (selectedEngine: string) => {
    setEngine(selectedEngine);
    setConnectionTested(false);
    switch (selectedEngine) {
      case "MYSQL":
      case "AWS_SQL":
        setPort(3306);
        break;
      case "POSTGRESQL":
        setPort(5432);
        break;
      case "SQLSERVER":
      case "AZURE_SQL":
        setPort(1433);
        break;
      case "ORACLE":
        setPort(1521);
        break;
    }
  };
  const [isSaving, setIsSaving] = useState(false);

  const openModal = (server: any = null) => {
    setConnectionTested(false);
    if (server) {
      setEditingServer(server);
      setName(server.name);
      setEngine(server.engine);
      setHost(server.host);
      setPort(server.port.toString());
      setUsername(server.username);
      setPassword(""); // Don't show existing password
      setSsl(server.ssl);
      setActive(server.active);
    } else {
      setEditingServer(null);
      setName("");
      setEngine("MYSQL");
      setHost("");
      setPort("3306");
      setUsername("");
      setPassword("");
      setSsl(false);
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const handleTestConnection = async () => {
    if (!host || !port || !username) {
      errorAlert("Faltan Datos", "Por favor completa el Host, Puerto y Usuario de la base de datos.");
      return;
    }
    setIsTesting(true);
    const res = await testServerConnection({
      engine,
      host,
      port: Number(port),
      username,
      password,
      ssl
    });
    setIsTesting(false);

    if (res.success) {
      setConnectionTested(true);
      successAlert("Conexión Exitosa", res.message || "¡Conexión verificada correctamente con el servidor!");
    } else {
      setConnectionTested(false);
      errorAlert("Fallo de Conexión", res.error || "No se pudo conectar al servidor.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingServer && !password) {
      errorAlert("Error", "La contraseña es requerida para nuevos servidores");
      return;
    }

    setIsSaving(true);

    // Probar conexión previamente si es un servidor nuevo o si el usuario no ha hecho la prueba manual
    if (!editingServer && !connectionTested) {
      const connTest = await testServerConnection({
        engine,
        host,
        port: Number(port),
        username,
        password,
        ssl
      });

      if (!connTest.success) {
        setIsSaving(false);
        setConnectionTested(false);
        errorAlert("Prueba de Conexión Fallida", connTest.error || "Debe lograr una conexión exitosa con el servidor antes de crearlo.");
        return;
      }
    }
    
    const payload = {
      name, engine, host, port: Number(port), username, password, ssl, active
    };

    let result;
    if (editingServer) {
      result = await updateServer(editingServer.id, payload);
    } else {
      result = await createServer(payload);
    }

    setIsSaving(false);

    if (result.success) {
      setIsModalOpen(false);
      await successAlert("Éxito", `Servidor ${editingServer ? 'actualizado' : 'registrado'} correctamente.`);
      window.location.reload();
    } else {
      errorAlert("Error al Crear Servidor", result.error || "Ocurrió un error");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmAction(
      "Eliminar Servidor",
      "¿Estás seguro de que deseas eliminar este servidor? Esta acción no se puede deshacer.",
      "Sí, Eliminar",
      "Cancelar"
    );
    if (!confirmed) return;

    const result = await deleteServer(id);
    if (result.success) {
      await successAlert("Eliminado", "Servidor eliminado.");
      window.location.reload();
    } else {
      errorAlert("Error", result.error || "Ocurrió un error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Server size={18} className="text-primary" />
          Infraestructura de Servidores
        </h3>
        <button
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition"
        >
          <Plus size={16} /> Agregar Servidor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((s) => {
          const isOnline = s.isOnline && s.active;
          return (
            <div key={s.id} className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col gap-3 relative shadow-sm hover:border-primary/40 transition">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {/* Indicador con pulso de Encendido u Oscuro de Apagado */}
                    <span className="relative flex h-2.5 w-2.5">
                      {isOnline && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        !s.active 
                          ? 'bg-amber-500' 
                          : isOnline 
                            ? 'bg-emerald-500' 
                            : 'bg-rose-500'
                      }`}></span>
                    </span>
                    <h4 className="font-extrabold text-sm text-foreground tracking-tight">{s.name}</h4>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground">{s.host}:{s.port}</p>
                </div>

                <div className="flex gap-1.5 items-center">
                  {/* Badge de Estado del Servidor */}
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    !s.active
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : isOnline
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    {!s.active ? 'Inactivo' : isOnline ? 'Encendido / En línea' : 'Apagado / Desconectado'}
                  </span>

                  <button onClick={() => openModal(s)} className="text-muted-foreground hover:text-primary transition p-1 rounded-lg hover:bg-muted" title="Editar Servidor">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive transition p-1 rounded-lg hover:bg-muted" title="Eliminar Servidor">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-muted/40 border border-border/50 p-2 rounded-xl flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Motor DB</span>
                  <span className="font-extrabold text-foreground">{s.engine}</span>
                </div>
                <div className="bg-muted/40 border border-border/50 p-2 rounded-xl flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Conectividad</span>
                  <span className={`font-extrabold ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isOnline ? 'Conectado' : 'Sin respuesta'}
                  </span>
                </div>
                <div className="bg-muted/40 border border-border/50 p-2 rounded-xl flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Empresas</span>
                  <span className="font-extrabold text-foreground">{s._count?.companies || 0} alojadas</span>
                </div>
                <div className="bg-muted/40 border border-border/50 p-2 rounded-xl flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Cifrado SSL</span>
                  <span className="font-extrabold text-foreground">{s.ssl ? 'Activado' : 'Desactivado'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{editingServer ? 'Editar Servidor' : 'Nuevo Servidor'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Nombre / Identificador</label>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} required className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Motor de Base de Datos</label>
                  <select value={engine} onChange={e=>handleEngineChange(e.target.value)} className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="MYSQL">MySQL</option>
                    <option value="POSTGRESQL">PostgreSQL</option>
                    <option value="SQLSERVER">SQL Server</option>
                    <option value="ORACLE">Oracle SQL</option>
                    <option value="AZURE_SQL">Azure SQL</option>
                    <option value="AWS_SQL">AWS RDS/Aurora</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Puerto</label>
                  <input type="number" value={port} onChange={e=>setPort(e.target.value)} required className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    {engine === 'ORACLE' ? 'Host (IP / Dominio) o TNS/SID' : 'Host (IP o Dominio)'}
                  </label>
                  <input type="text" value={host} onChange={e=>setHost(e.target.value)} required placeholder={engine === 'ORACLE' ? 'Ej: localhost/ORCL' : 'Ej: 127.0.0.1'} className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Usuario DB</label>
                  <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Contraseña DB</label>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={editingServer ? '(Sin cambios)' : ''} className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="ssl" checked={ssl} onChange={e=>setSsl(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="ssl" className="text-xs font-bold text-muted-foreground">Usar SSL</label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="active" checked={active} onChange={e=>setActive(e.target.checked)} className="rounded border-gray-300 cursor-pointer" />
                  <label htmlFor="active" className="text-xs font-bold text-muted-foreground cursor-pointer">Activo</label>
                </div>
              </div>

              {/* Botón de Probar Conexión */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !host || !port || !username}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                    connectionTested
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isTesting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Probando conexión con el servidor...</span>
                    </>
                  ) : connectionTested ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Conexión probada con éxito (Click para volver a probar)</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={15} />
                      <span>Probar Conexión de Red / Servidor</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving || isTesting} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Validando y Guardando...</span>
                    </>
                  ) : (
                    editingServer ? "Actualizar Servidor" : "Probar y Crear Servidor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

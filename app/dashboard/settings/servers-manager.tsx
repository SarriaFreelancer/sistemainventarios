"use client";

import React, { useState } from "react";
import { Server, Plus, Edit2, Trash2, X } from "lucide-react";
import { createServer, updateServer, deleteServer } from "@/app/actions/server-actions";
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

  // Update default port based on engine
  const handleEngineChange = (selectedEngine: string) => {
    setEngine(selectedEngine);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payload = {
      name, engine, host, port: Number(port), username, password, ssl, active
    };

    let result;
    if (editingServer) {
      result = await updateServer(editingServer.id, payload);
    } else {
      if (!password) {
        errorAlert("Error", "La contraseña es requerida para nuevos servidores");
        setIsSaving(false);
        return;
      }
      result = await createServer(payload);
    }

    setIsSaving(false);

    if (result.success) {
      setIsModalOpen(false);
      await successAlert("Éxito", `Servidor ${editingServer ? 'actualizado' : 'registrado'} correctamente.`);
      window.location.reload();
    } else {
      errorAlert("Error", result.error || "Ocurrió un error");
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
        {servers.map((s) => (
          <div key={s.id} className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col gap-3 relative">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-foreground">{s.name}</h4>
                <p className="text-xs text-muted-foreground">{s.host}:{s.port}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(s)} className="text-muted-foreground hover:text-primary transition">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive transition">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-card border border-border p-2 rounded-lg flex flex-col">
                <span className="text-muted-foreground">Motor</span>
                <span className="font-semibold">{s.engine}</span>
              </div>
              <div className="bg-card border border-border p-2 rounded-lg flex flex-col">
                <span className="text-muted-foreground">Estado</span>
                <span className={`font-semibold ${s.active ? 'text-green-500' : 'text-red-500'}`}>
                  {s.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="bg-card border border-border p-2 rounded-lg flex flex-col">
                <span className="text-muted-foreground">Empresas</span>
                <span className="font-semibold">{s._count?.companies || 0} alojadas</span>
              </div>
              <div className="bg-card border border-border p-2 rounded-lg flex flex-col">
                <span className="text-muted-foreground">SSL</span>
                <span className="font-semibold">{s.ssl ? 'Activado' : 'Desactivado'}</span>
              </div>
            </div>
          </div>
        ))}
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
                  <input type="checkbox" id="active" checked={active} onChange={e=>setActive(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="active" className="text-xs font-bold text-muted-foreground">Activo</label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80 transition">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

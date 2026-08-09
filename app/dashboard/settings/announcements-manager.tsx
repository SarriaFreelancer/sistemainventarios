"use client";

import React, { useState, useEffect } from "react";
import { Bell, Megaphone, Trash2, Loader2, AlertTriangle, AlertCircle, Clock } from "lucide-react";
import { createAnnouncement, getAllAnnouncements, deactivateAnnouncement, deleteAnnouncement } from "@/app/actions/announcement-actions";
import { successAlert, errorAlert } from "@/lib/sweetalert";

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO",
    expiresInHours: 24,
    sendToBell: false
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    const res = await getAllAnnouncements();
    if (res.success && res.data) {
      setAnnouncements(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      return errorAlert("Atención", "Título y mensaje son obligatorios.");
    }
    
    setSubmitting(true);
    const res = await createAnnouncement(formData);
    setSubmitting(false);

    if (res.success) {
      successAlert("Publicado", "El anuncio ha sido publicado exitosamente.");
      setFormData({ title: "", message: "", type: "INFO", expiresInHours: 24, sendToBell: false });
      loadAnnouncements();
    } else {
      errorAlert("Error", res.error || "No se pudo publicar el anuncio. Verifica que hayas reiniciado el servidor (pnpm run dev).");
    }
  };

  const handleDeactivate = async (id: number) => {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: '¿Apagar anuncio?',
      text: "El anuncio dejará de aparecer inmediatamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, apagar'
    });

    if (result.isConfirmed) {
      const res = await deactivateAnnouncement(id);
      if (res.success) {
        successAlert("Apagado", "El anuncio fue apagado.");
        loadAnnouncements();
      } else {
        errorAlert("Error", "No se pudo apagar.");
      }
    }
  };

  const handleDelete = async (id: number) => {
    const Swal = (await import("sweetalert2")).default;
    const result = await Swal.fire({
      title: '¿Eliminar anuncio?',
      text: "El anuncio será borrado definitivamente de la base de datos.",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar'
    });

    if (result.isConfirmed) {
      const res = await deleteAnnouncement(id);
      if (res.success) {
        successAlert("Eliminado", "El anuncio fue borrado completamente.");
        loadAnnouncements();
      } else {
        errorAlert("Error", "No se pudo eliminar.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Megaphone className="text-primary" /> Anuncios Globales
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Publica mensajes importantes (actualizaciones, mantenimientos) que saltarán en la pantalla de todos los usuarios de todas las empresas.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Crear Nuevo Anuncio</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase">Título del Anuncio</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="Ej. Mantenimiento Programado"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase">Nivel de Importancia</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              >
                <option value="INFO">Informativo (Azul)</option>
                <option value="WARNING">Advertencia (Amarillo)</option>
                <option value="URGENT">Urgente (Rojo)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase">Mensaje (Usa \n para saltos de línea)</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              placeholder="Escribe el mensaje aquí..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase flex items-center gap-2">
                <Clock size={14} /> Duración de exposición
              </label>
              <select
                value={formData.expiresInHours}
                onChange={(e) => setFormData({ ...formData, expiresInHours: Number(e.target.value) })}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              >
                <option value={1}>1 Hora</option>
                <option value={4}>4 Horas</option>
                <option value={12}>12 Horas</option>
                <option value={24}>24 Horas (1 Día)</option>
                <option value={72}>72 Horas (3 Días)</option>
                <option value={168}>1 Semana</option>
              </select>
            </div>
            
            <div className="pt-5">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/20 border border-border rounded-xl hover:bg-muted/40 transition">
                <input
                  type="checkbox"
                  checked={formData.sendToBell}
                  onChange={(e) => setFormData({ ...formData, sendToBell: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold flex items-center gap-1">
                    <Bell size={14} /> Enviar a la campanita
                  </span>
                  <span className="text-xs text-muted-foreground">Genera una notificación persistente para todos los usuarios.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
              Publicar Anuncio Global
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Historial de Anuncios</h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Bell className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">No hay anuncios publicados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => {
              const isActive = ann.isActive && new Date(ann.expiresAt) > new Date();
              return (
                <div key={ann.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${isActive ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/20'} gap-4`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {ann.type === 'INFO' && <AlertCircle size={16} className="text-blue-500" />}
                      {ann.type === 'WARNING' && <AlertTriangle size={16} className="text-yellow-500" />}
                      {ann.type === 'URGENT' && <AlertTriangle size={16} className="text-red-500" />}
                      <h4 className="font-bold text-sm">{ann.title}</h4>
                      {isActive ? (
                        <span className="bg-emerald-500/10 text-emerald-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Activo</span>
                      ) : (
                        <span className="bg-muted text-muted-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Inactivo / Expirado</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ann.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Creado: {new Date(ann.createdAt).toLocaleString()} • Expira: {new Date(ann.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <button
                        onClick={() => handleDeactivate(ann.id)}
                        className="text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        Apagar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

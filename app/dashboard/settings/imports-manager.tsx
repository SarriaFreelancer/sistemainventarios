"use client";

import React, { useState } from "react";
import { Upload, Download, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
import { successAlert, errorAlert } from "@/lib/sweetalert";

const TEMPLATES = [
  { id: "groups", name: "Grupos de Productos", file: "plantilla_grupos.xlsx", desc: "Sube grupos principales de inventario." },
  { id: "categories", name: "Categorías", file: "plantilla_categorias.xlsx", desc: "Asocia categorías a grupos existentes por código." },
  { id: "suppliers", name: "Proveedores", file: "plantilla_proveedores.xlsx", desc: "Carga datos de empresas proveedoras." },
  { id: "products", name: "Productos", file: "plantilla_productos.xlsx", desc: "Carga inventario vinculando a grupo, categoría y proveedor por código." },
];

export function ImportsManager() {
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const handleDownloadTemplate = async (id: string, filename: string) => {
    setLoadingTemplate(id);
    try {
      const res = await fetch(`/api/imports/templates?type=${id}`);
      if (!res.ok) throw new Error("Error al descargar plantilla");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      errorAlert("Error", "No se pudo descargar la plantilla.");
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [id]: e.target.files[0] });
    }
  };

  const handleUpload = async (id: string) => {
    const file = files[id];
    if (!file) return;

    setUploading(id);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", id);

    try {
      const res = await fetch(`/api/imports/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar archivo");

      successAlert("Importación Exitosa", `Se importaron ${data.count} registros correctamente.`);
      setFiles({ ...files, [id]: null });
      // Clear input
      const input = document.getElementById(`upload-${id}`) as HTMLInputElement;
      if (input) input.value = "";
    } catch (error: any) {
      errorAlert("Error de importación", error.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Upload size={18} className="text-primary" />
          Importación Masiva de Datos
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Descarga las plantillas en formato Excel, llénalas con tus datos y súbelas al sistema.
          Respeta los nombres de las columnas y no dejes códigos únicos en blanco.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
        <div className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Orden Recomendado de Importación:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-0.5 ml-1">
            <li><strong>Grupos</strong> (Nivel más alto).</li>
            <li><strong>Categorías</strong> (Requieren código de Grupo).</li>
            <li><strong>Proveedores</strong>.</li>
            <li><strong>Productos</strong> (Requieren códigos de Grupo, Categoría y Proveedor).</li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="border border-border bg-card p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{t.desc}</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleDownloadTemplate(t.id, t.file)}
                disabled={loadingTemplate === t.id}
                className="w-full text-xs font-semibold flex items-center justify-center gap-2 py-2 border border-border rounded-lg bg-muted/40 hover:bg-muted transition"
              >
                {loadingTemplate === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descargar Plantilla
              </button>

              <div className="pt-2 border-t border-border flex items-center gap-2">
                <input
                  type="file"
                  id={`upload-${t.id}`}
                  accept=".xlsx, .xls"
                  onChange={(e) => handleFileChange(t.id, e)}
                  className="hidden"
                />
                <label
                  htmlFor={`upload-${t.id}`}
                  className="flex-1 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition truncate px-2"
                >
                  {files[t.id] ? files[t.id]?.name : "Elegir archivo Excel"}
                </label>
                <button
                  type="button"
                  onClick={() => handleUpload(t.id)}
                  disabled={!files[t.id] || uploading === t.id}
                  className="shrink-0 bg-primary text-primary-foreground p-2 rounded-lg disabled:opacity-50 transition"
                >
                  {uploading === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

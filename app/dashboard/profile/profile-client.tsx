"use client";

import React, { useState, useRef } from "react";
import { Calendar, LogIn, User, Upload, Loader2, Save, Key, ShieldAlert } from "lucide-react";
import { updateProfile, updatePassword, uploadProfileImage } from "@/app/actions/profile-actions";
import { successAlert, errorAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  image: string | null;
  position: string | null;
  role?: { name: string } | null;
  company?: { name: string } | null;
  preferences: any;
  createdAt: string;
  lastLogin: string | null;
}

interface ProfileClientProps {
  user: UserProfile;
}

// Avatares predefinidos premium elegantes
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80"
];

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [position, setPosition] = useState(user.position || "");
  const [image, setImage] = useState(user.image || PRESET_AVATARS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(user.image || PRESET_AVATARS[0]);
  const [theme, setTheme] = useState<"light" | "dark">(user.preferences?.theme || "light");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contraseñas
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      errorAlert("Falta información", "El nombre completo es obligatorio");
      return;
    }

    setSavingProfile(true);
    let finalImageUrl = image;

    if (selectedFile) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(selectedFile);
        });

        const uploadResult = await uploadProfileImage(base64Data);
        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
          setImage(finalImageUrl);
        } else {
          errorAlert("Error al subir foto", uploadResult.error || "Hubo un problema al subir tu foto");
          setSavingProfile(false);
          return;
        }
      } catch (err: any) {
        errorAlert("Error al procesar foto", err?.message || "No se pudo leer el archivo seleccionado.");
        setSavingProfile(false);
        return;
      }
    }

    const result = await updateProfile({
      name,
      position,
      image: finalImageUrl,
      preferences: { theme }
    });
    setSavingProfile(false);

    if (result.success) {
      setSelectedFile(null);
      successAlert("Perfil actualizado", "Tus datos han sido guardados correctamente.");
      window.location.reload();
    } else {
      errorAlert("Error", result.error || "Error al actualizar el perfil");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || !confirmPass) {
      errorAlert("Faltan datos", "Todos los campos de contraseña son obligatorios");
      return;
    }
    if (newPass !== confirmPass) {
      errorAlert("Error de coincidencia", "La nueva contraseña y su confirmación no coinciden");
      return;
    }
    if (newPass.length < 6) {
      errorAlert("Contraseña insegura", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSavingPass(true);
    const result = await updatePassword({ currentPass, newPass });
    setSavingPass(false);

    if (result.success) {
      successAlert("Contraseña actualizada", "Tu contraseña ha sido cambiada de forma segura.");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } else {
      errorAlert("Error", result.error || "La contraseña actual es incorrecta");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ── Tarjeta Lateral de Info del Usuario ── */}
      <div className="lg:col-span-1 bg-card rounded-3xl border border-border p-6 shadow-sm flex flex-col items-center justify-between text-center min-h-[500px]">
        
        {/* Avatar e Información Principal */}
        <div className="space-y-4 w-full flex flex-col items-center">
          <div className="relative group w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-md bg-muted">
            <img
              src={previewImage}
              alt="Avatar de perfil"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
              {user.position || "Colaborador"}
            </p>
          </div>

          <div className="w-full border-t border-border/60 pt-4 text-left space-y-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Correo de Acceso</p>
              <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Empresa / Inquilino</p>
              <p className="text-sm font-semibold text-foreground truncate">{user.company?.name || "Global / GNS"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Rol Administrativo</p>
              <span className="inline-block mt-0.5 text-xs font-bold bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full">
                {user.role?.name || "Usuario"}
              </span>
            </div>
          </div>
        </div>

        {/* Fechas de Registro / Último Ingreso */}
        <div className="w-full border-t border-border/60 pt-4 text-left text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1.5 font-medium">
            <Calendar size={14} />
            Miembro desde: {new Date(user.createdAt).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {user.lastLogin && (
            <p className="flex items-center gap-1.5 font-medium">
              <LogIn size={14} />
              Último acceso: {new Date(user.lastLogin).toLocaleDateString("es-ES", { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(user.lastLogin).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* ── Paneles de Edición de Perfil y Contraseña ── */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Formulario de Información Personal */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <User size={18} className="text-primary" />
            Información del Perfil
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Cargo o Puesto</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="e.g. Administrador, Cajero, Vendedor"
                />
              </div>
            </div>

            {/* Selector de Avatares Predeterminados */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase block">Seleccionar Avatar</label>
              <div className="flex flex-wrap gap-2.5">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setImage(url);
                      setPreviewImage(url);
                      setSelectedFile(null);
                    }}
                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition ${
                      image === url && !selectedFile ? "border-primary scale-110 shadow-md" : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Subir Foto Local */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Subir Foto Desde Tu Equipo</label>
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        errorAlert("Archivo muy grande", "La imagen no debe superar los 2MB.");
                        return;
                      }
                      setSelectedFile(file);
                      setPreviewImage(URL.createObjectURL(file));
                    }
                  }} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-secondary/10 hover:bg-secondary/20 border border-border text-foreground font-semibold px-4 py-2 rounded-xl text-sm transition flex items-center gap-2"
                >
                  <Upload size={16} />
                  Seleccionar Archivo
                </button>
                {selectedFile && (
                  <span className="text-xs text-primary font-medium truncate max-w-[150px]">
                    {selectedFile.name}
                  </span>
                )}
              </div>
            </div>

            {/* Enlace a Foto Externa */}
            <div className="space-y-1.5 pt-2 border-t border-border/40 mt-4">
              <label className="text-xs font-bold text-muted-foreground uppercase">O ingresa un enlace (URL)</label>
              <input
                type="text"
                value={!selectedFile ? image : ""}
                onChange={(e) => {
                  setImage(e.target.value);
                  setPreviewImage(e.target.value);
                  setSelectedFile(null);
                }}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-mono text-xs"
                placeholder="https://tudominio.com/tu-foto.jpg"
              />
            </div>

            <div className="border-t border-border/60 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

        {/* Formulario de Cambio de Contraseña */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Key size={18} className="text-primary" />
            Seguridad & Contraseña
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Contraseña Actual</label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingPass}
                className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-95 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {savingPass ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                Cambiar Contraseña
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

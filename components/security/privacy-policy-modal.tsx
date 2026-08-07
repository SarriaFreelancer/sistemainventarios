"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl rounded-[28px] border-border/80 bg-card p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <DialogHeader className="pb-4 border-b border-border/60 shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            Políticas de Privacidad y Tratamiento de Datos Personales
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm text-muted-foreground mt-1">
            GNS Gestión de Negocios SarriaTech — Cumplimiento Legal de Habeas Data y Seguridad Digital.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-2 text-sm leading-relaxed text-foreground/90 font-medium">
          {/* Introducción */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-primary" /> 1. Declaración de Compromiso y Responsable
            </h4>
            <p className="text-xs text-muted-foreground">
              En <strong>GNS Gestión de Negocios SarriaTech</strong>, nos tomamos con la máxima gravedad la confidencialidad, integridad y disponibilidad de la información de nuestros usuarios e inventarios empresariales. Dando cumplimiento a las leyes vigentes de protección de datos personales (Ley 1581 de 2012 de Colombia y normativas internacionales de protección de datos RGPD), este documento establece las políticas aplicadas para el tratamiento de su información.
            </p>
          </div>

          {/* Recolección de Datos */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" /> 2. Información que Recolectamos y Uso de Cookies
            </h4>
            <p className="text-xs text-muted-foreground">
              El sistema utiliza exclusivamente <strong>cookies estrictamente necesarias y funcionales</strong> con los siguientes propósitos:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><strong>Autenticación y Sesión:</strong> Mantener su sesión activa de forma cifrada mediante tokens JWT de alta seguridad.</li>
              <li><strong>Preferencias del Usuario:</strong> Almacenar sus configuraciones de tema (modo oscuro/claro) y colores de empresa.</li>
              <li><strong>Logs de Auditoría:</strong> Registrar direcciones IP y metadatos del navegador para prevenir accesos no autorizados y fraudes internos.</li>
            </ul>
          </div>

          {/* Protección de Código y Propiedad Intelectual */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> 3. Protección de Código Fuente y Propiedad Intelectual
            </h4>
            <p className="text-xs text-muted-foreground">
              Todo el software, código fuente, componentes visuales, algoritmos de cálculo de inventarios y arquitectura de base de datos pertenecen a <strong>SarriaTech / GNS</strong>. Queda estrictamente prohibida la ingeniería inversa, extracción, copia o descompilación del software mediante herramientas de inspección del navegador o cualquier otro medio cibernético.
            </p>
          </div>

          {/* Derechos Habeas Data */}
          <div className="space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" /> 4. Sus Derechos como Titular de Datos (Habeas Data)
            </h4>
            <p className="text-xs text-muted-foreground">
              Como usuario o empresa registrada en nuestra plataforma, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Conocer, actualizar y rectificar en cualquier momento sus datos personales registrados.</li>
              <li>Solicitar prueba de la autorización otorgada para el tratamiento de su información.</li>
              <li>Ser informado sobre el uso que se le ha dado a sus datos personales.</li>
              <li>Solicitar la revocación o eliminación de sus datos cuando finalice su relación contractual o suscripción SaaS.</li>
            </ul>
          </div>

          {/* Medidas de Ciberseguridad */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <h4 className="font-bold text-primary text-sm">
              🛡️ Medidas de Ciberseguridad Activas
            </h4>
            <p className="text-xs text-muted-foreground">
              Implementamos cifrado SSL/TLS de 256 bits en tránsito, hashing bcrypt para contraseñas, políticas HSTS, protección contra inyecciones SQL (Prisma ORM) y mitigación de ataques XSS / CSRF para proteger toda su operación comercial.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 shrink-0 flex justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:opacity-95 transition-all"
          >
            Entendido y Entendido
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gnsLogo from "@/public/gns-logo.png";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Network,
  ArrowRight,
  TrendingUp,
  Boxes,
  Layers,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const enterpriseLoginSchema = z.object({
  email: z.string().email("Ingresa un correo corporativo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  branchCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export default function EnterpriseLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [authStatus, setAuthStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof enterpriseLoginSchema>>({
    resolver: zodResolver(enterpriseLoginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: z.infer<typeof enterpriseLoginSchema>) => {
    setAuthStatus({ type: null, message: "" });
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      if (result?.error) {
        setAuthStatus({
          type: "error",
          message: result.error,
        });
      } else {
        setAuthStatus({
          type: "success",
          message: "Acceso Enterprise autorizado. Redirigiendo a tu panel maestro...",
        });
        setTimeout(() => {
          router.push("/dashboard/enterprise");
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setAuthStatus({
        type: "error",
        message: err.message || "Error al iniciar sesión Enterprise",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 shadow-lg shadow-blue-500/20">
            <Image
              src={gnsLogo}
              alt="GNS Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            GNS <span className="text-blue-400">Enterprise</span>
          </span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 text-blue-300 border border-blue-500/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
          <Network className="w-3.5 h-3.5 text-blue-400" />
          Portal Corporativo Multi-Sedes
        </div>

        <p className="text-sm text-slate-400">
          Acceso exclusivo para administradores y personal de sedes de empresas Enterprise
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          {authStatus.message && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm font-medium border ${
                authStatus.type === "error"
                  ? "bg-rose-950/40 border-rose-800/60 text-rose-300"
                  : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              }`}
            >
              {authStatus.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span>{authStatus.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Correo Corporativo
              </Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  placeholder="admin@empresa.com"
                  {...register("email")}
                  className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contraseña
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-10 pr-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            {/* Optional Branch Code */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Código de Sede (Opcional)</span>
                <span className="text-[11px] text-slate-500 lowercase">ej. SEDE-01</span>
              </Label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Dejar vacío para Sede Principal / Admin"
                  {...register("branchCode")}
                  className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Verificando credenciales...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ingresar al Portal Enterprise
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Switch to standard login */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              ¿Tu empresa tiene una sola sede estándar?{" "}
              <Link
                href="/auth/login"
                className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4"
              >
                Ingresar por Login Estándar
              </Link>
            </p>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <Boxes className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="font-medium text-slate-300">Stock Multi-Sedes</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <p className="font-medium text-slate-300">Dashboard Maestro</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <p className="font-medium text-slate-300">Aislamiento Seguro</p>
          </div>
        </div>
      </div>
    </div>
  );
}

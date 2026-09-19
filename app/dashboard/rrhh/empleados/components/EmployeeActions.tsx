"use client";

import { useState } from "react";
import { MoreVertical, UserCheck, UserX, UserMinus, FileX, Loader2 } from "lucide-react";
import { updateEmployeeStatus } from "@/app/actions/hr-actions";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmployeeActionsProps {
  employeeId: number;
  currentStatus: string;
}

export function EmployeeActions({ employeeId, currentStatus }: EmployeeActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TERMINATED") => {
    if (status === currentStatus) return;

    setLoading(true);
    const res = await updateEmployeeStatus(employeeId, status);
    if (!res.success) {
      alert("Error: " + res.error);
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          disabled={loading}
          aria-label="Opciones del empleado"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-xl border-border bg-popover z-50">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Cambiar Estado Laboral
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={loading || currentStatus === "ACTIVE"}
          onClick={() => handleStatusChange("ACTIVE")}
          className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            currentStatus === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold" : "hover:bg-muted"
          }`}
        >
          <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Marcar como Activo</span>
          {currentStatus === "ACTIVE" && <span className="ml-auto text-[10px] opacity-70">Actual</span>}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={loading || currentStatus === "INACTIVE"}
          onClick={() => handleStatusChange("INACTIVE")}
          className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            currentStatus === "INACTIVE" ? "bg-muted font-bold" : "hover:bg-muted"
          }`}
        >
          <UserX className="h-4 w-4 text-slate-500 shrink-0" />
          <span>Marcar como Inactivo</span>
          {currentStatus === "INACTIVE" && <span className="ml-auto text-[10px] opacity-70">Actual</span>}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={loading || currentStatus === "SUSPENDED"}
          onClick={() => handleStatusChange("SUSPENDED")}
          className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            currentStatus === "SUSPENDED" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold" : "hover:bg-muted"
          }`}
        >
          <UserMinus className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Suspender Empleado</span>
          {currentStatus === "SUSPENDED" && <span className="ml-auto text-[10px] opacity-70">Actual</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={loading || currentStatus === "TERMINATED"}
          onClick={() => handleStatusChange("TERMINATED")}
          className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 ${
            currentStatus === "TERMINATED" ? "bg-rose-500/10 font-bold" : ""
          }`}
        >
          <FileX className="h-4 w-4 text-rose-500 shrink-0" />
          <span>Liquidar / Terminar</span>
          {currentStatus === "TERMINATED" && <span className="ml-auto text-[10px] opacity-70">Actual</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { MoreVertical, UserCheck, UserX, UserMinus, FileX } from "lucide-react";
import { updateEmployeeStatus } from "@/app/actions/hr-actions";
import { useRouter } from "next/navigation";

interface EmployeeActionsProps {
  employeeId: number;
  currentStatus: string;
}

export function EmployeeActions({ employeeId, currentStatus }: EmployeeActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED') => {
    if (status === currentStatus) return;
    
    setLoading(true);
    setIsOpen(false);
    
    const res = await updateEmployeeStatus(employeeId, status);
    if (!res.success) {
      alert("Error: " + res.error);
    } else {
      router.refresh();
    }
    
    setLoading(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
      >
        {loading ? (
           <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-xl bg-card border border-border shadow-lg focus:outline-none overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className={`flex w-full items-center px-4 py-2 text-sm text-left hover:bg-muted ${currentStatus === 'ACTIVE' ? 'bg-muted/50 font-medium' : ''}`}
              >
                <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
                Marcar como Activo
              </button>
              <button
                onClick={() => handleStatusChange('INACTIVE')}
                className={`flex w-full items-center px-4 py-2 text-sm text-left hover:bg-muted ${currentStatus === 'INACTIVE' ? 'bg-muted/50 font-medium' : ''}`}
              >
                <UserX className="mr-2 h-4 w-4 text-gray-500" />
                Marcar como Inactivo
              </button>
              <button
                onClick={() => handleStatusChange('SUSPENDED')}
                className={`flex w-full items-center px-4 py-2 text-sm text-left hover:bg-muted ${currentStatus === 'SUSPENDED' ? 'bg-muted/50 font-medium' : ''}`}
              >
                <UserMinus className="mr-2 h-4 w-4 text-yellow-500" />
                Suspender Empleado
              </button>
              <button
                onClick={() => handleStatusChange('TERMINATED')}
                className={`flex w-full items-center px-4 py-2 text-sm text-left hover:bg-muted text-rose-600 hover:text-rose-700 ${currentStatus === 'TERMINATED' ? 'bg-muted/50 font-medium' : ''}`}
              >
                <FileX className="mr-2 h-4 w-4 text-rose-500" />
                Liquidar / Terminar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

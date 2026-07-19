"use client";

import React, { useState } from "react";
import * as LucideIcons from "lucide-react";
import { toggleCompanyAccess } from "@/app/actions/license-actions";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  planId: string | null;
  active: boolean;
}

export function LicensesManager({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleAccess = async (companyId: number, currentActive: boolean, companyName: string) => {
    const actionText = currentActive ? "SUSPENDER" : "REACTIVAR";
    const confirmed = await confirmAction(
      `¿${actionText} ACCESO?`,
      `¿Estás seguro de que deseas ${actionText.toLowerCase()} el acceso a ${companyName}? ${currentActive ? 'Los usuarios de esta empresa no podrán iniciar sesión.' : ''}`,
      `Sí, ${actionText.toLowerCase()}`,
      "Cancelar"
    );

    if (!confirmed) return;

    setTogglingId(companyId);
    const result = await toggleCompanyAccess(companyId, currentActive ? "ACTIVE" : "SUSPENDED");
    setTogglingId(null);

    if (result.success) {
      successAlert("Estado Actualizado", `El acceso de la empresa ha sido ${currentActive ? 'suspendido' : 'reactivado'}.`);
      router.refresh();
    } else {
      errorAlert("Error", result.error || "No se pudo cambiar el estado");
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Licencias y Suscripciones</h3>
          <p className="text-sm text-muted-foreground">Gestiona los planes y el estado de las empresas registradas.</p>
        </div>
        <div className="relative">
          <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-background"
          />
        </div>
      </div>

      <div className="border border-border rounded-2xl overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-bold">Empresa</th>
              <th className="px-6 py-4 font-bold">Plan Actual</th>
              <th className="px-6 py-4 font-bold">Estado de Acceso</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No se encontraron empresas.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-muted/20 transition">
                  <td className="px-6 py-4 font-semibold flex items-center gap-2">
                    <LucideIcons.Building size={16} className="text-muted-foreground" />
                    {company.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      company.planId === 'premium' ? 'bg-indigo-100 text-indigo-700' :
                      company.planId === 'pro' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {company.planId ? company.planId.toUpperCase() : 'BÁSICO'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 ${company.active ? 'text-green-600' : 'text-red-600'}`}>
                      {company.active ? <LucideIcons.CheckCircle2 size={16} /> : <LucideIcons.XCircle size={16} />}
                      <span className="font-semibold">{company.active ? 'ACTIVO' : 'SUSPENDIDO'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleAccess(company.id, company.active, company.name)}
                      disabled={togglingId === company.id}
                      title={company.active ? "Suspender Acceso" : "Reactivar Acceso"}
                      className={`p-2 transition rounded-lg ${
                        company.active 
                          ? "text-red-500 hover:bg-red-50" 
                          : "text-green-500 hover:bg-green-50"
                      } disabled:opacity-50`}
                    >
                      {togglingId === company.id ? (
                        <LucideIcons.Loader2 size={16} className="animate-spin" />
                      ) : company.active ? (
                        <LucideIcons.Ban size={16} />
                      ) : (
                        <LucideIcons.Power size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mt-4">
        <LucideIcons.Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Próxima Integración: Pasarela de Pagos (Bold)</p>
          <p>En el futuro, las licencias se actualizarán automáticamente mediante webhooks al recibir los pagos a través de Bold API. Por ahora, la suspensión de acceso se controla manualmente.</p>
        </div>
      </div>
    </div>
  );
}

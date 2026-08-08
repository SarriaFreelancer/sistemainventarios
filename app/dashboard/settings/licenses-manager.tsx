"use client";

import React, { useState } from "react";
import { Search, Building, CheckCircle2, XCircle, Loader2, Ban, Power, Info, Settings2, Save } from "lucide-react";
import { toggleCompanyAccess, savePlanSettings } from "@/app/actions/license-actions";
import { confirmAction, successAlert, errorAlert } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  planId: string | null;
  active: boolean;
}

interface LicensesManagerProps {
  companies: Company[];
  planSettings?: any;
  allModules?: any[];
}

export function LicensesManager({ companies, planSettings = {}, allModules = [] }: LicensesManagerProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [savingPlans, setSavingPlans] = useState(false);

  // States for Plan Settings
  const getModulesArray = (key: string) => {
    try {
      return planSettings[key] ? JSON.parse(planSettings[key]) : [];
    } catch {
      return [];
    }
  };

  const [basico, setBasico] = useState({
    maxUsers: planSettings["plan_basico_max_users"] || "2",
    maxProducts: planSettings["plan_basico_max_products"] || "100",
    maxSales: planSettings["plan_basico_max_sales_per_month"] || "50",
    modules: getModulesArray("plan_basico_modules")
  });

  const [intermedio, setIntermedio] = useState({
    maxUsers: planSettings["plan_intermedio_max_users"] || "5",
    maxProducts: planSettings["plan_intermedio_max_products"] || "1000",
    maxSales: planSettings["plan_intermedio_max_sales_per_month"] || "999999",
    modules: getModulesArray("plan_intermedio_modules")
  });

  const [premium, setPremium] = useState({
    maxUsers: planSettings["plan_premium_max_users"] || "999",
    maxProducts: planSettings["plan_premium_max_products"] || "999999",
    maxSales: planSettings["plan_premium_max_sales_per_month"] || "999999",
    modules: getModulesArray("plan_premium_modules")
  });

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
      await successAlert("Estado Actualizado", `El acceso de la empresa ha sido ${currentActive ? 'suspendido' : 'reactivado'}.`);
      window.location.reload();
    } else {
      errorAlert("Error", result.error || "No se pudo cambiar el estado");
    }
  };

  const handleSavePlans = async () => {
    setSavingPlans(true);
    const dataToSave = {
      "plan_basico_max_users": basico.maxUsers.toString(),
      "plan_basico_max_products": basico.maxProducts.toString(),
      "plan_basico_max_sales_per_month": basico.maxSales.toString(),
      "plan_basico_modules": JSON.stringify(basico.modules),
      "plan_intermedio_max_users": intermedio.maxUsers.toString(),
      "plan_intermedio_max_products": intermedio.maxProducts.toString(),
      "plan_intermedio_max_sales_per_month": intermedio.maxSales.toString(),
      "plan_intermedio_modules": JSON.stringify(intermedio.modules),
      "plan_premium_max_users": premium.maxUsers.toString(),
      "plan_premium_max_products": premium.maxProducts.toString(),
      "plan_premium_max_sales_per_month": premium.maxSales.toString(),
      "plan_premium_modules": JSON.stringify(premium.modules),
    };

    const result = await savePlanSettings(dataToSave);
    setSavingPlans(false);

    if (result.success) {
      successAlert("Planes Actualizados", "La configuración de los planes se guardó globalmente.");
    } else {
      errorAlert("Error", result.error || "No se pudo guardar la configuración.");
    }
  };

  const handleModuleToggle = (planState: any, setPlanState: any, moduleId: number) => {
    const current = planState.modules;
    const isSelected = current.includes(moduleId);
    setPlanState({
      ...planState,
      modules: isSelected ? current.filter((id: number) => id !== moduleId) : [...current, moduleId]
    });
  };

  const renderPlanConfig = (title: string, state: any, setState: any) => (
    <div className="border border-border rounded-xl p-4 bg-muted/5 space-y-4">
      <h4 className="font-bold text-md border-b border-border pb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase">Máx. Usuarios</label>
          <input 
            type="number" 
            value={state.maxUsers} 
            onChange={(e) => setState({...state, maxUsers: e.target.value})}
            className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase">Máx. Productos</label>
          <input 
            type="number" 
            value={state.maxProducts} 
            onChange={(e) => setState({...state, maxProducts: e.target.value})}
            className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Máx. Ventas/Mes (999999 = Sin límite)</label>
          <input 
            type="number" 
            value={state.maxSales} 
            onChange={(e) => setState({...state, maxSales: e.target.value})}
            className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Módulos Permitidos</label>
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-2">
          {allModules.map(m => (
            <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded transition">
              <input 
                type="checkbox" 
                checked={state.modules.includes(m.id)}
                onChange={() => handleModuleToggle(state, setState, m.id)}
                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="truncate">{m.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* ── SECCIÓN: CONFIGURACIÓN GLOBAL DE PLANES ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              Configuración de Planes Globales
            </h3>
            <p className="text-sm text-muted-foreground">Define los límites y módulos predeterminados que heredará cada nueva empresa al comprar un plan.</p>
          </div>
          <button 
            onClick={handleSavePlans}
            disabled={savingPlans}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-70"
          >
            {savingPlans ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Planes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderPlanConfig("Plan Básico", basico, setBasico)}
          {renderPlanConfig("Plan Intermedio", intermedio, setIntermedio)}
          {renderPlanConfig("Plan Premium", premium, setPremium)}
        </div>
      </div>

      <hr className="border-border/60" />

      {/* ── SECCIÓN: GESTIÓN DE EMPRESAS Y LICENCIAS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Empresas Registradas</h3>
            <p className="text-sm text-muted-foreground">Gestiona el estado de acceso de cada inquilino.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
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
                      <Building size={16} className="text-muted-foreground" />
                      {company.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        company.planId === 'premium' ? 'bg-indigo-100 text-indigo-700' :
                        company.planId === 'intermedio' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {company.planId ? company.planId.toUpperCase() : 'BÁSICO'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${company.active ? 'text-green-600' : 'text-red-600'}`}>
                        {company.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
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
                          <Loader2 size={16} className="animate-spin" />
                        ) : company.active ? (
                          <Ban size={16} />
                        ) : (
                          <Power size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mt-4">
        <Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Nota del Sistema</p>
          <p>Al editar la configuración global de los planes, los cambios solo aplicarán automáticamente para las NUEVAS empresas que se registren. Para las empresas existentes, debes ajustar sus topes manualmente si es necesario.</p>
        </div>
      </div>
    </div>
  );
}

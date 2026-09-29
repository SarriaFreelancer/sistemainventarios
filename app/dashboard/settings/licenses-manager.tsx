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
    price: planSettings["plan_basico_price"] || "49999",
    modules: getModulesArray("plan_basico_modules")
  });

  const [intermedio, setIntermedio] = useState({
    maxUsers: planSettings["plan_intermedio_max_users"] || "5",
    maxProducts: planSettings["plan_intermedio_max_products"] || "1000",
    maxSales: planSettings["plan_intermedio_max_sales_per_month"] || "999999",
    price: planSettings["plan_intermedio_price"] || "89999",
    modules: getModulesArray("plan_intermedio_modules")
  });

  const [premium, setPremium] = useState({
    maxUsers: planSettings["plan_premium_max_users"] || "999",
    maxProducts: planSettings["plan_premium_max_products"] || "999999",
    maxSales: planSettings["plan_premium_max_sales_per_month"] || "999999",
    price: planSettings["plan_premium_price"] || "129999",
    modules: getModulesArray("plan_premium_modules")
  });

  const [enterprise2, setEnterprise2] = useState({
    maxUsers: planSettings["plan_enterprise_2_sedes_max_users"] || "999",
    maxProducts: planSettings["plan_enterprise_2_sedes_max_products"] || "999999",
    maxBranches: planSettings["plan_enterprise_2_sedes_max_branches"] || "2",
    maxSales: planSettings["plan_enterprise_2_sedes_max_sales_per_month"] || "999999",
    price: planSettings["plan_enterprise_2_sedes_price"] || "299000",
    modules: getModulesArray("plan_enterprise_2_sedes_modules")
  });

  const [enterprise5, setEnterprise5] = useState({
    maxUsers: planSettings["plan_enterprise_5_sedes_max_users"] || "9999",
    maxProducts: planSettings["plan_enterprise_5_sedes_max_products"] || "999999",
    maxBranches: planSettings["plan_enterprise_5_sedes_max_branches"] || "5",
    maxSales: planSettings["plan_enterprise_5_sedes_max_sales_per_month"] || "999999",
    price: planSettings["plan_enterprise_5_sedes_price"] || "499000",
    modules: getModulesArray("plan_enterprise_5_sedes_modules")
  });

  const [enterprise10, setEnterprise10] = useState({
    maxUsers: planSettings["plan_enterprise_10_sedes_max_users"] || "9999",
    maxProducts: planSettings["plan_enterprise_10_sedes_max_products"] || "999999",
    maxBranches: planSettings["plan_enterprise_10_sedes_max_branches"] || "10",
    maxSales: planSettings["plan_enterprise_10_sedes_max_sales_per_month"] || "999999",
    price: planSettings["plan_enterprise_10_sedes_price"] || "799000",
    modules: getModulesArray("plan_enterprise_10_sedes_modules")
  });

  const [enterpriseUnlimited, setEnterpriseUnlimited] = useState({
    maxUsers: planSettings["plan_enterprise_unlimited_max_users"] || "9999",
    maxProducts: planSettings["plan_enterprise_unlimited_max_products"] || "999999",
    maxBranches: planSettings["plan_enterprise_unlimited_max_branches"] || "999",
    maxSales: planSettings["plan_enterprise_unlimited_max_sales_per_month"] || "999999",
    price: planSettings["plan_enterprise_unlimited_price"] || "1199000",
    modules: getModulesArray("plan_enterprise_unlimited_modules")
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
      "plan_basico_price": basico.price.toString(),
      "plan_basico_modules": JSON.stringify(basico.modules),
      "plan_intermedio_max_users": intermedio.maxUsers.toString(),
      "plan_intermedio_max_products": intermedio.maxProducts.toString(),
      "plan_intermedio_max_sales_per_month": intermedio.maxSales.toString(),
      "plan_intermedio_price": intermedio.price.toString(),
      "plan_intermedio_modules": JSON.stringify(intermedio.modules),
      "plan_premium_max_users": premium.maxUsers.toString(),
      "plan_premium_max_products": premium.maxProducts.toString(),
      "plan_premium_max_sales_per_month": premium.maxSales.toString(),
      "plan_premium_price": premium.price.toString(),
      "plan_premium_modules": JSON.stringify(premium.modules),
      // Enterprise Plans
      "plan_enterprise_2_sedes_max_users": enterprise2.maxUsers.toString(),
      "plan_enterprise_2_sedes_max_products": enterprise2.maxProducts.toString(),
      "plan_enterprise_2_sedes_max_branches": enterprise2.maxBranches.toString(),
      "plan_enterprise_2_sedes_max_sales_per_month": enterprise2.maxSales.toString(),
      "plan_enterprise_2_sedes_price": enterprise2.price.toString(),
      "plan_enterprise_2_sedes_modules": JSON.stringify(enterprise2.modules),
      "plan_enterprise_5_sedes_max_users": enterprise5.maxUsers.toString(),
      "plan_enterprise_5_sedes_max_products": enterprise5.maxProducts.toString(),
      "plan_enterprise_5_sedes_max_branches": enterprise5.maxBranches.toString(),
      "plan_enterprise_5_sedes_max_sales_per_month": enterprise5.maxSales.toString(),
      "plan_enterprise_5_sedes_price": enterprise5.price.toString(),
      "plan_enterprise_5_sedes_modules": JSON.stringify(enterprise5.modules),
      "plan_enterprise_10_sedes_max_users": enterprise10.maxUsers.toString(),
      "plan_enterprise_10_sedes_max_products": enterprise10.maxProducts.toString(),
      "plan_enterprise_10_sedes_max_branches": enterprise10.maxBranches.toString(),
      "plan_enterprise_10_sedes_max_sales_per_month": enterprise10.maxSales.toString(),
      "plan_enterprise_10_sedes_price": enterprise10.price.toString(),
      "plan_enterprise_10_sedes_modules": JSON.stringify(enterprise10.modules),
      "plan_enterprise_unlimited_max_users": enterpriseUnlimited.maxUsers.toString(),
      "plan_enterprise_unlimited_max_products": enterpriseUnlimited.maxProducts.toString(),
      "plan_enterprise_unlimited_max_branches": enterpriseUnlimited.maxBranches.toString(),
      "plan_enterprise_unlimited_max_sales_per_month": enterpriseUnlimited.maxSales.toString(),
      "plan_enterprise_unlimited_price": enterpriseUnlimited.price.toString(),
      "plan_enterprise_unlimited_modules": JSON.stringify(enterpriseUnlimited.modules),
    };

    const result = await savePlanSettings(dataToSave);
    setSavingPlans(false);

    if (result.success) {
      successAlert("Planes Actualizados", "La configuración de los planes unitarios y Enterprise se guardó globalmente.");
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

  const renderPlanConfig = (title: string, state: any, setState: any, isEnterprise = false) => (
    <div className={`border rounded-xl p-4 space-y-4 ${isEnterprise ? 'border-indigo-500/40 bg-indigo-950/10 dark:bg-indigo-950/20' : 'border-border bg-muted/5'}`}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h4 className="font-bold text-md text-foreground flex items-center gap-2">
          {isEnterprise && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-extrabold border border-indigo-500/30">Enterprise</span>}
          {title}
        </h4>
      </div>
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
        {isEnterprise && (
          <div className="col-span-2">
            <label className="text-xs font-bold text-indigo-400 uppercase">Límite de Sedes Permitidas</label>
            <input
              type="number"
              value={state.maxBranches}
              onChange={(e) => setState({...state, maxBranches: e.target.value})}
              className="w-full mt-1 bg-background border border-indigo-500/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        )}
        <div className="col-span-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Precio (COP)</label>
          <input
            type="number"
            value={state.price}
            onChange={(e) => setState({...state, price: e.target.value})}
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
        <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-2">
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              Configuración de Planes Globales y Licencias
            </h3>
            <p className="text-sm text-muted-foreground">Define los límites, cuota de sedes y módulos predeterminados para planes Unitarios y Enterprise Multi-Sedes.</p>
          </div>
          <button
            onClick={handleSavePlans}
            disabled={savingPlans}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 disabled:opacity-70 shadow-sm"
          >
            {savingPlans ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Todos los Planes
          </button>
        </div>

        {/* Planes Unitarios */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">1. Planes Unitarios (1 Sede)</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderPlanConfig("Plan Básico", basico, setBasico)}
            {renderPlanConfig("Plan Intermedio", intermedio, setIntermedio)}
            {renderPlanConfig("Plan Premium", premium, setPremium)}
          </div>
        </div>

        {/* Planes Enterprise por Sedes */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">2. Licencias Plan Enterprise (Por Número de Sedes)</h4>
          </div>
          <p className="text-xs text-muted-foreground">Opciones de licenciamiento multi-sucursal con acceso al módulo de consolidación centralizada, réplica de catálogo y traslados WMS.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderPlanConfig("Enterprise 2 Sedes", enterprise2, setEnterprise2, true)}
            {renderPlanConfig("Enterprise 5 Sedes", enterprise5, setEnterprise5, true)}
            {renderPlanConfig("Enterprise 10 Sedes", enterprise10, setEnterprise10, true)}
            {renderPlanConfig("Enterprise Ilimitado", enterpriseUnlimited, setEnterpriseUnlimited, true)}
          </div>
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

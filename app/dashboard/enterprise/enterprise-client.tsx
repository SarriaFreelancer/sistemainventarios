"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Filter,
  Plus,
  RefreshCw,
  Trophy,
  ArrowUpRight,
  Package,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Share2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import {
  getEnterpriseMasterDashboardData,
  createBranch,
  importProductsFromMain,
} from "@/app/actions/branch-actions";

interface EnterpriseClientProps {
  initialData: any;
  initialBranches: any[];
  sessionUser: any;
}

export function EnterpriseClient({
  initialData,
  initialBranches,
  sessionUser,
}: EnterpriseClientProps) {
  const [data, setData] = useState(initialData);
  const [branches, setBranches] = useState(initialBranches);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showImportProductsModal, setShowImportProductsModal] = useState(false);

  // Form states
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    phone: "",
  });

  const [importForm, setImportForm] = useState({
    targetBranchId: initialBranches[0]?.id || "",
    copyStock: false,
  });

  // Reload dashboard data
  const handleFilterChange = (
    branchId: string,
    period: "today" | "week" | "month" | "year" | "custom",
    customStart?: string,
    customEnd?: string
  ) => {
    setSelectedBranch(branchId);
    setSelectedPeriod(period);

    startTransition(async () => {
      const res = await getEnterpriseMasterDashboardData({
        branchId: branchId === "ALL" ? undefined : Number(branchId),
        period,
        startDate: customStart || startDate,
        endDate: customEnd || endDate,
      });

      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.error || "Error al actualizar datos");
      }
    });
  };

  // Submit Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toast.error("El nombre de la sede es obligatorio");
      return;
    }

    startTransition(async () => {
      const res = await createBranch({
        name: branchForm.name,
        code: branchForm.code || undefined,
        city: branchForm.city || undefined,
        address: branchForm.address || undefined,
        phone: branchForm.phone || undefined,
      });

      if (res.success && res.branch) {
        toast.success(`Sede "${res.branch.name}" creada exitosamente.`);
        setShowCreateBranchModal(false);
        setBranchForm({ name: "", code: "", city: "", address: "", phone: "" });

        // Recargar
        setBranches((prev) => [...prev, res.branch]);
        handleFilterChange(selectedBranch, selectedPeriod);
      } else {
        toast.error(res.error || "No se pudo crear la sede");
      }
    });
  };

  // Submit Import Products
  const handleImportProducts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.targetBranchId) {
      toast.error("Selecciona la sede destino");
      return;
    }

    startTransition(async () => {
      const res = await importProductsFromMain({
        targetBranchId: Number(importForm.targetBranchId),
        copyStock: importForm.copyStock,
      });

      if (res.success) {
        toast.success(res.message || "Productos importados con éxito");
        setShowImportProductsModal(false);
        handleFilterChange(selectedBranch, selectedPeriod);
      } else {
        toast.error(res.error || "Error al importar productos");
      }
    });
  };

  const kpis = data?.kpis || {
    totalRevenue: 0,
    totalSalesCount: 0,
    topSellingBranch: "N/A",
    topSellingBranchRevenue: 0,
    totalStockCount: 0,
    totalInventoryValue: 0,
    activeBranchesCount: branches.length || 0,
  };

  const branchRanking = data?.branchRanking || [];
  const branchInventory = data?.branchInventoryBreakdown || [];
  const timelineData = data?.timelineData || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Palette for multi-branch chart lines/bars
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Enterprise Branding & Actions */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              GNS Enterprise Multi-Sedes
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Dashboard Maestro Consolidado
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Monitoreo centralizado de inventario, ventas comparativas, ranking de rendimiento y sincronización de stock entre todas las sedes de tu negocio.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowImportProductsModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs sm:text-sm font-medium border border-slate-700 backdrop-blur-sm transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4 text-indigo-400" />
              Migrar Productos a Sede
            </button>

            <Link
              href="/dashboard/warehouses"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs sm:text-sm font-medium border border-slate-700 backdrop-blur-sm transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Traslados WMS
            </Link>

            <button
              onClick={() => setShowCreateBranchModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Nueva Sede
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Sede Selector & Temporal Range */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Branch Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-blue-500" />
            Sede:
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => handleFilterChange(e.target.value, selectedPeriod)}
            className="px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isPending}
          >
            <option value="ALL">🌐 Todas las Sedes (Consolidado Red)</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                📍 {b.name} {b.city ? `(${b.city})` : ""} {b.isMain ? "⭐ Principal" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Temporal Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            {[
              { id: "today", label: "Hoy" },
              { id: "week", label: "Esta Semana" },
              { id: "month", label: "Este Mes" },
              { id: "year", label: "Este Año" },
              { id: "custom", label: "Personalizado" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  handleFilterChange(
                    selectedBranch,
                    p.id as any,
                    p.id === "custom" ? startDate : undefined,
                    p.id === "custom" ? endDate : undefined
                  )
                }
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  selectedPeriod === p.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {selectedPeriod === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
              <span className="text-xs text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
              <button
                onClick={() => handleFilterChange(selectedBranch, "custom", startDate, endDate)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
              >
                Filtrar
              </button>
            </div>
          )}

          {isPending && (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin ml-2" />
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales KPI */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ventas Consolidadas
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(kpis.totalRevenue)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
              {kpis.totalSalesCount} transacciones completadas
            </p>
          </div>
        </div>

        {/* Top Performing Branch KPI */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sede Líder en Ventas
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
              {kpis.topSellingBranch}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {formatCurrency(kpis.topSellingBranchRevenue)} facturados
            </p>
          </div>
        </div>

        {/* Total Stock in Network */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stock Total en Red
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis.totalStockCount.toLocaleString()} unids
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              En {kpis.activeBranchesCount} sedes operativas
            </p>
          </div>
        </div>

        {/* Consolidated Inventory Value */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valorización Inventario
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(kpis.totalInventoryValue)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Costo acumulado de existencias
            </p>
          </div>
        </div>
      </div>

      {/* Comparative Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Branch Comparative Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                Ventas por Sede (Comparativo)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monto recaudado por cada sede en el período
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {branchRanking.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Building2 className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Sin ventas registradas en el período seleccionado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchRanking} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="branchName" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis
                    tickFormatter={(val) =>
                      val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val), "Ventas"]}
                    labelFormatter={(label) => `Sede: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Ventas ($ COP)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Timeline Trends Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Tendencia Temporal de Ventas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evolución diaria de ingresos en la red
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {timelineData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Sin datos temporales en este período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(val) =>
                      val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : `$${(val / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(val: any, name: any) => [formatCurrency(val), name]} />
                  <Legend />
                  {branches.map((b: any, idx: number) => (
                    <Area
                      key={b.id}
                      type="monotone"
                      dataKey={b.name}
                      stroke={colors[idx % colors.length]}
                      fillOpacity={0.2}
                      fill={colors[idx % colors.length]}
                      name={b.name}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Branch Performance Ranking Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ranking de Rendimiento por Sede
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ordenado de la sede con mayor facturación hasta la de menor volumen
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/30">
                <th className="py-3 px-4"># Rank</th>
                <th className="py-3 px-4">Sede / Ubicación</th>
                <th className="py-3 px-4">Total Ventas ($)</th>
                <th className="py-3 px-4">Facturas</th>
                <th className="py-3 px-4">% Red</th>
                <th className="py-3 px-4">Producto Más Vendido</th>
                <th className="py-3 px-4 text-right">Rendimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {branchRanking.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No hay sedes con actividad en este período.
                  </td>
                </tr>
              ) : (
                branchRanking.map((b: any, index: number) => {
                  const isTop1 = index === 0;
                  const isTop2 = index === 1;
                  const isTop3 = index === 2;

                  return (
                    <tr
                      key={b.branchId || index}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/40">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/30 text-slate-700 dark:text-slate-300 text-xs font-bold">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-500 text-xs font-bold">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium pl-2">{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {b.branchName}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {b.city || "Principal"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.revenue)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {b.salesCount} ventas
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min(b.marketShare, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {b.marketShare}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-medium text-xs truncate max-w-[180px]">
                          {b.topProduct}
                        </div>
                        {b.topProductQty > 0 && (
                          <div className="text-[11px] text-slate-400">
                            {b.topProductQty} unids vendidas ({formatCurrency(b.topProductRevenue)})
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.marketShare >= 30
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : b.marketShare >= 15
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {b.marketShare >= 30 ? "Alto Rendimiento" : b.marketShare >= 15 ? "Medio" : "Bajo"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Inventory Breakdown Cards */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-500" />
              Inventario & Existencias por Sede
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Desglose de artículos, unidades físicas y valor monetario por cada sede
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchInventory.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  {item.branchName}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                  {item.count} ítems
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Stock Físico:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {item.stock.toLocaleString()} unids
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Valorización:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {formatCurrency(item.valuation)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Crear Nueva Sede */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Registrar Nueva Sede
              </h3>
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sede Norte / Sucursal Poblado"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Código (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="SEDE-02"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Medellín / Cali / Bogotá"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Dirección Física
                </label>
                <input
                  type="text"
                  placeholder="Calle 10 # 40-20"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Teléfono / Contacto
                </label>
                <input
                  type="text"
                  placeholder="300 123 4567"
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Al crear esta sede, se creará automáticamente una <strong>Bodega dedicada</strong> vinculada para gestionar traslados de stock y ventas POS.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateBranchModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Crear Sede"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Importar / Migrar Productos desde Principal */}
      {showImportProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-500" />
                Migrar Catálogo a otra Sede
              </h3>
              <button
                onClick={() => setShowImportProductsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleImportProducts} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Sede Destino *
                </label>
                <select
                  value={importForm.targetBranchId}
                  onChange={(e) => setImportForm({ ...importForm, targetBranchId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecciona la sede...</option>
                  {branches
                    .filter((b: any) => !b.isMain)
                    .map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city || "Sin ciudad"})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="copyStockCheck"
                  checked={importForm.copyStock}
                  onChange={(e) => setImportForm({ ...importForm, copyStock: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <label htmlFor="copyStockCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Clonar cantidad de stock actual (si no se marca, inicia con stock en 0)
                </label>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  ¿Cómo funciona la migración de catálogo?
                </p>
                <p>
                  Replicará todos los productos de la <strong>Sede Principal</strong> en la sede destino con un código diferenciado (ej: <code>PROD-S2</code>) y los conectará a la bodega correspondiente para permitir ventas independientes o traslados.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowImportProductsModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
                >
                  {isPending ? "Migrando..." : "Iniciar Migración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

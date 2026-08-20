"use client";

import React, { useState } from "react";
import { 
  Building2, 
  MapPin, 
  ArrowRightLeft, 
  Clock, 
  Plus, 
  Truck, 
  CheckCircle2, 
  Package, 
  ShieldCheck, 
  Layers, 
  AlertTriangle,
  XCircle,
  Boxes,
  UserCheck,
  ClipboardCheck
} from "lucide-react";
import { createWarehouse, createWarehouseLocation, createWarehouseTransfer, confirmWarehouseTransferReceipt } from "@/app/actions/warehouse-actions";
import Swal from "sweetalert2";

interface WarehousesManagerClientProps {
  initialWarehouses: any[];
  initialTransfers: any[];
  initialStocks: any[];
  initialTimelines: any[];
  allProducts: any[];
}

export default function WarehousesManagerClient({
  initialWarehouses,
  initialTransfers,
  initialStocks,
  initialTimelines,
  allProducts
}: WarehousesManagerClientProps) {
  const [activeTab, setActiveTab] = useState<"warehouses" | "transfers" | "stocks" | "timeline">("warehouses");

  // Modales
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedWarehouseForLocation, setSelectedWarehouseForLocation] = useState<any>(null);

  // Forms State
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [newWarehouseCode, setNewWarehouseCode] = useState("");
  const [newWarehouseType, setNewWarehouseType] = useState("GENERAL");
  const [newWarehouseAddress, setNewWarehouseAddress] = useState("");
  const [newWarehouseCity, setNewWarehouseCity] = useState("");

  const [newLocationCode, setNewLocationCode] = useState("");
  const [newLocationZone, setNewLocationZone] = useState("");

  // Transfer Form State
  const [originWarehouseId, setOriginWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [transferQty, setTransferQty] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar creación de bodega
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await createWarehouse({
      name: newWarehouseName,
      code: newWarehouseCode,
      type: newWarehouseType,
      address: newWarehouseAddress,
      city: newWarehouseCity
    });

    setIsSubmitting(false);
    if (res.success) {
      Swal.fire("¡Bodega Creada!", "La bodega ha sido guardada con éxito.", "success");
      setIsWarehouseModalOpen(false);
      setNewWarehouseName("");
      setNewWarehouseCode("");
      window.location.reload();
    } else {
      Swal.fire("Error", res.error || "No se pudo crear la bodega", "error");
    }
  };

  // Manejar ubicación
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseForLocation) return;
    setIsSubmitting(true);

    const res = await createWarehouseLocation({
      warehouseId: selectedWarehouseForLocation.id,
      code: newLocationCode,
      zone: newLocationZone
    });

    setIsSubmitting(false);
    if (res.success) {
      Swal.fire("¡Ubicación Creada!", "Ubicación asignada a la bodega.", "success");
      setIsLocationModalOpen(false);
      setNewLocationCode("");
      setNewLocationZone("");
      window.location.reload();
    } else {
      Swal.fire("Error", res.error || "No se pudo crear la ubicación", "error");
    }
  };

  // Manejar traslado
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originWarehouseId || !destinationWarehouseId || !selectedProductId) {
      Swal.fire("Atención", "Selecciona origen, destino y al menos un producto", "warning");
      return;
    }

    const qty = Number(transferQty);
    if (isNaN(qty) || qty <= 0) {
      Swal.fire("Cantidad Inválida", "La cantidad a trasladar debe ser mayor a 0", "warning");
      return;
    }

    const targetProd = allProducts.find(p => String(p.id) === String(selectedProductId));
    if (targetProd && targetProd.quantityAvailable !== undefined && targetProd.quantityAvailable <= 0) {
      Swal.fire("Sin Existencias", `El producto '${targetProd.name}' tiene 0 unidades en inventario y no se puede trasladar.`, "error");
      return;
    }

    if (targetProd && targetProd.quantityAvailable !== undefined && qty > targetProd.quantityAvailable) {
      Swal.fire("Stock Insuficiente", `La cantidad a trasladar (${qty}) supera las existencias disponibles (${targetProd.quantityAvailable} unidades).`, "error");
      return;
    }

    setIsSubmitting(true);
    const res = await createWarehouseTransfer({
      originWarehouseId: Number(originWarehouseId),
      destinationWarehouseId: Number(destinationWarehouseId),
      notes: transferNotes,
      items: [{ productId: Number(selectedProductId), quantity: qty }]
    });

    setIsSubmitting(false);
    if (res.success) {
      Swal.fire("¡Traslado Creado!", "El traslado ha sido enviado y se encuentra En Tránsito.", "success");
      setIsTransferModalOpen(false);
      window.location.reload();
    } else {
      Swal.fire("Error", res.error || "No se pudo procesar el traslado", "error");
    }
  };

  // Confirmar Recepción
  const handleConfirmReceipt = async (transferId: number) => {
    const confirm = await Swal.fire({
      title: "¿Confirmar Recepción?",
      text: "El stock pasará automáticamente de 'En Tránsito' a 'Disponible' en la bodega destino.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, Confirmar Recepción",
      cancelButtonText: "Cancelar"
    });

    if (confirm.isConfirmed) {
      const res = await confirmWarehouseTransferReceipt(transferId);
      if (res.success) {
        Swal.fire("¡Recepción Exitosa!", res.message, "success");
        window.location.reload();
      } else {
        Swal.fire("Error", res.error || "Error al recepcionar mercancía", "error");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Encabezado Módulo WMS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Boxes size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Gestión Multibodega & WMS Almacenes</h2>
              <p className="text-xs text-muted-foreground">Control físico de existencias, pasillos/ubicaciones, traslados en tránsito y trazabilidad.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-muted hover:bg-muted/80 text-foreground font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer border border-border"
          >
            <ArrowRightLeft size={16} className="text-primary" />
            Nuevo Traslado
          </button>
          <button
            onClick={() => setIsWarehouseModalOpen(true)}
            className="bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:opacity-95 transition shadow-md cursor-pointer"
          >
            <Plus size={16} />
            Nueva Bodega
          </button>
        </div>
      </div>

      {/* Tabs Nomenclatura */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("warehouses")}
          className={`pb-3 text-xs font-black transition flex items-center gap-2 border-b-2 ${
            activeTab === "warehouses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 size={16} /> Bodegas & Ubicaciones ({initialWarehouses.length})
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`pb-3 text-xs font-black transition flex items-center gap-2 border-b-2 ${
            activeTab === "transfers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck size={16} /> Traslados en Tránsito ({initialTransfers.length})
        </button>
        <button
          onClick={() => setActiveTab("stocks")}
          className={`pb-3 text-xs font-black transition flex items-center gap-2 border-b-2 ${
            activeTab === "stocks"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers size={16} /> Existencias por Bodega ({initialStocks.length})
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`pb-3 text-xs font-black transition flex items-center gap-2 border-b-2 ${
            activeTab === "timeline"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock size={16} /> Línea de Tiempo / Auditoría ({initialTimelines.length})
        </button>
      </div>

      {/* CONTENIDO TAB 1: BODEGAS & UBICACIONES */}
      {activeTab === "warehouses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialWarehouses.map((w: any) => (
            <div key={w.id} className="bg-card border border-border/80 rounded-3xl p-5 space-y-4 hover:border-primary/40 transition shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-foreground">{w.name}</h3>
                    {w.isDefault && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Principal
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">Código: {w.code || `BOD-${w.id}`}</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {w.type}
                </span>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {w.address || "Sin dirección"} - {w.city || "Ciudad Principal"}</p>
                <p className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> Resp: {w.responsible || "Administrador"}</p>
              </div>

              {/* Ubicaciones registradas */}
              <div className="border-t border-border/60 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase text-muted-foreground">Ubicaciones ({w.locations?.length || 0})</span>
                  <button
                    onClick={() => {
                      setSelectedWarehouseForLocation(w);
                      setIsLocationModalOpen(true);
                    }}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Agregar Pasillo/Estante
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {w.locations?.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">Sin ubicaciones específicas (Pasillo A01, etc.)</span>
                  ) : (
                    w.locations?.map((loc: any) => (
                      <span key={loc.id} className="text-[10px] font-mono font-extrabold bg-muted px-2.5 py-1 rounded-lg border border-border text-foreground">
                        📍 {loc.code} {loc.zone ? `(${loc.zone})` : ""}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTENIDO TAB 2: TRASLADOS EN TRÁNSITO */}
      {activeTab === "transfers" && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-foreground">Historial de Traslados Inter-bodega</h3>
            <button onClick={() => setIsTransferModalOpen(true)} className="bg-primary text-primary-foreground font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm">
              <Plus size={14} /> Registrar Traslado
            </button>
          </div>

          <div className="space-y-3">
            {initialTransfers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No hay traslados registrados en el sistema.</p>
            ) : (
              initialTransfers.map((t: any) => (
                <div key={t.id} className="bg-muted/20 border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono text-primary">{t.transferNumber}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        t.status === "IN_TRANSIT" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}>
                        {t.status === "IN_TRANSIT" ? "🚚 EN TRÁNSITO" : "✓ RECEPCIONADO"}
                      </span>
                    </div>

                    <p className="text-xs text-foreground font-medium">
                      Origen: <strong className="text-primary">{t.originWarehouse?.name}</strong> ➔ Destino: <strong className="text-primary">{t.destinationWarehouse?.name}</strong>
                    </p>

                    <div className="text-[11px] text-muted-foreground">
                      Productos: {t.items?.map((i: any) => `${i.product?.name} (x${i.quantity})`).join(", ")}
                    </div>
                  </div>

                  {t.status === "IN_TRANSIT" && (
                    <button
                      onClick={() => handleConfirmReceipt(t.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      Confirmar Recepción
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: EXISTENCIAS POR BODEGA */}
      {activeTab === "stocks" && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm text-foreground">Desglose de Stock por Bodega y Estado</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-extrabold uppercase tracking-wider">
                  <th className="py-3 px-3">Producto</th>
                  <th className="py-3 px-3">Bodega</th>
                  <th className="py-3 px-3">Pasillo/Ubicación</th>
                  <th className="py-3 px-3 text-center">Físico</th>
                  <th className="py-3 px-3 text-center">En Tránsito</th>
                  <th className="py-3 px-3 text-center">Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {initialStocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">Sin existencias desglosadas por bodega.</td>
                  </tr>
                ) : (
                  initialStocks.map((s: any) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-3 font-bold text-foreground">{s.product?.name} <span className="text-[10px] font-mono text-muted-foreground">({s.product?.code})</span></td>
                      <td className="py-3 px-3 font-semibold text-primary">{s.warehouse?.name}</td>
                      <td className="py-3 px-3 font-mono">{s.location?.code ? `📍 ${s.location.code}` : "General"}</td>
                      <td className="py-3 px-3 text-center font-bold">{s.physical}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-500">{s.inTransit}</td>
                      <td className="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">{s.physical - s.reserved}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 4: LÍNEA DE TIEMPO / TIMELINE */}
      {activeTab === "timeline" && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm text-foreground">
          {/* Header de la tarjeta */}
          <div className="flex justify-between items-center border-b border-border/60 pb-4">
            <div>
              <h3 className="font-black text-base text-foreground flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Clock size={18} />
                </div>
                Línea de Tiempo & Trazabilidad WMS
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Eventos registrados con hora, usuario responsable y detalles de movimientos.</p>
            </div>
            <span className="text-xs font-bold bg-muted/60 border border-border text-foreground px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {initialTimelines.length} Registro(s)
            </span>
          </div>

          {initialTimelines.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-12">No hay eventos registrados en la línea de tiempo.</p>
          ) : (
            <div className="relative py-6 max-w-5xl mx-auto space-y-8">
              {/* Eje central vertical */}
              <div className="absolute top-0 bottom-0 left-1/2 -ml-[1px] w-[2px] bg-border" />

              {initialTimelines.map((tl: any, idx: number) => {
                const isLeft = idx % 2 === 0;
                const isSuccess = tl.status === "SUCCESS" || tl.title?.includes("Recepcionado");

                const dateObj = new Date(tl.createdAt);
                const timeStr = dateObj.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true });
                const dateStr = dateObj.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

                // Estilos 100% dinámicos según el color primario configurado en la Empresa
                const theme = isSuccess 
                  ? {
                      border: "border-emerald-500/40 dark:border-emerald-500/50",
                      glow: "shadow-sm hover:shadow-emerald-500/10",
                      badgeBorder: "border-emerald-500/40",
                      badgeText: "text-emerald-600 dark:text-emerald-400",
                      nodeBg: "bg-card border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md",
                      titleText: "text-emerald-600 dark:text-emerald-400",
                      bannerIcon: <ClipboardCheck size={26} className="text-emerald-600 dark:text-emerald-400" />,
                      bannerBg: "bg-emerald-500/10 border-emerald-500/20"
                    }
                  : {
                      border: "border-primary/40 dark:border-primary/50",
                      glow: "shadow-sm hover:shadow-primary/10",
                      badgeBorder: "border-primary/40",
                      badgeText: "text-primary",
                      nodeBg: "bg-card border-primary text-primary shadow-md",
                      titleText: "text-primary",
                      bannerIcon: <Truck size={26} className="text-primary" />,
                      bannerBg: "bg-primary/10 border-primary/20"
                    };

                return (
                  <div key={tl.id} className="relative flex items-center justify-between w-full my-6">

                    {/* LADO IZQUIERDO */}
                    <div className="w-[44%]">
                      {isLeft && (
                        <div className={`relative bg-card border ${theme.border} ${theme.glow} rounded-3xl p-5 text-left transition-all hover:scale-[1.01]`}>
                          {/* Flecha derecha */}
                          <div className={`absolute top-1/2 -right-3 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-card`} />

                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${theme.bannerBg}`}>
                              {theme.bannerIcon}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                📦 {tl.title}
                              </h4>
                              <p className={`font-black text-sm ${theme.titleText}`}>
                                {isSuccess ? "Recepcionado con Éxito 🎉" : "Iniciado (En Tránsito) 🚚"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                                {tl.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-4 text-[11px]">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                              <UserCheck size={14} /> Por: {tl.user?.name || "David Sarria"}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                              <Clock size={13} /> {timeStr} • {dateStr}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* NODO CENTRAL VERTICAL (Con fondo bg-card solido en la hora para TAPAR la linea central) */}
                    <div className="z-20 flex flex-col items-center justify-center shrink-0 relative">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${theme.nodeBg}`}>
                        {isSuccess ? <CheckCircle2 size={20} /> : <Truck size={18} />}
                      </div>
                      {/* bg-card solido y z-30 para ocultar la raya vertical detras del texto de la hora */}
                      <div className={`mt-2 px-3 py-0.5 rounded-full border text-[10px] font-extrabold font-mono shadow-sm bg-card z-30 ${theme.badgeBorder} ${theme.badgeText}`}>
                        {timeStr}
                      </div>
                    </div>

                    {/* LADO DERECHO */}
                    <div className="w-[44%]">
                      {!isLeft && (
                        <div className={`relative bg-card border ${theme.border} ${theme.glow} rounded-3xl p-5 text-left transition-all hover:scale-[1.01]`}>
                          {/* Flecha izquierda */}
                          <div className={`absolute top-1/2 -left-3 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-r-[12px] border-r-card`} />

                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${theme.bannerBg}`}>
                              {theme.bannerIcon}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                🚚 {tl.title}
                              </h4>
                              <p className={`font-black text-sm ${theme.titleText}`}>
                                {isSuccess ? "Recepcionado con Éxito 🎉" : "Iniciado (En Tránsito) 🚚"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-medium">
                                {tl.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-4 text-[11px]">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                              <UserCheck size={14} /> Por: {tl.user?.name || "David Sarria"}
                            </span>
                            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                              <Clock size={13} /> {timeStr} • {dateStr}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR BODEGA */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground">Crear Nueva Bodega / Sede</h3>
              <button onClick={() => setIsWarehouseModalOpen(false)}><XCircle size={20} className="text-muted-foreground" /></button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Nombre de Bodega</label>
                <input type="text" value={newWarehouseName} onChange={(e) => setNewWarehouseName(e.target.value)} required placeholder="Ej. Bodega Norte, Depósito Central" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Código</label>
                  <input type="text" value={newWarehouseCode} onChange={(e) => setNewWarehouseCode(e.target.value)} placeholder="Ej. BOD-02" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tipo</label>
                  <select value={newWarehouseType} onChange={(e) => setNewWarehouseType(e.target.value)} className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option value="GENERAL">General</option>
                    <option value="RAW_MATERIAL">Materia Prima</option>
                    <option value="FINISHED_GOODS">Producto Terminado</option>
                    <option value="RETURNS">Devoluciones</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Dirección</label>
                  <input type="text" value={newWarehouseAddress} onChange={(e) => setNewWarehouseAddress(e.target.value)} placeholder="Calle 100 #20-15" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ciudad</label>
                  <input type="text" value={newWarehouseCity} onChange={(e) => setNewWarehouseCity(e.target.value)} placeholder="Bogotá" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none" />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-md hover:opacity-90">
                {isSubmitting ? "Guardando..." : "Guardar Bodega"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR TRASLADO */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-primary" />
                Nuevo Traslado entre Bodegas
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)}><XCircle size={20} className="text-muted-foreground" /></button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Bodega Origen</label>
                  <select value={originWarehouseId} onChange={(e) => setOriginWarehouseId(e.target.value)} required className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none">
                    <option value="">Selecciona Origen</option>
                    {initialWarehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Bodega Destino</label>
                  <select value={destinationWarehouseId} onChange={(e) => setDestinationWarehouseId(e.target.value)} required className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none">
                    <option value="">Selecciona Destino</option>
                    {initialWarehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Buscar y Seleccionar Producto</label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setIsSearchDropdownOpen(true);
                      if (selectedProductId) setSelectedProductId("");
                    }}
                    placeholder="Escribe o selecciona producto por código/nombre..."
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-primary font-medium"
                  />
                  {isSearchDropdownOpen && !selectedProductId && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-52 overflow-y-auto bg-card border border-border rounded-2xl shadow-xl space-y-1 p-1.5 custom-scrollbar">
                      {allProducts
                        .filter(p => 
                          !productSearchQuery.trim() ||
                          p.name?.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
                          p.code?.toLowerCase().includes(productSearchQuery.toLowerCase())
                        )
                        .slice(0, 20)
                        .map(p => {
                          const stock = p.quantityAvailable ?? 0;
                          const hasStock = stock > 0;

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                if (!hasStock) {
                                  Swal.fire("Sin Existencias", `El producto '${p.name}' no tiene stock disponible (0 cantidades) para trasladar.`, "warning");
                                  return;
                                }
                                setSelectedProductId(String(p.id));
                                setProductSearchQuery(`${p.code ? `${p.code} - ` : ""}${p.name}`);
                                setIsSearchDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex justify-between items-center transition cursor-pointer ${
                                hasStock ? "hover:bg-primary/10 hover:text-primary text-foreground" : "opacity-50 bg-muted/30 cursor-not-allowed text-muted-foreground"
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold truncate">{p.code ? `${p.code} - ` : ""}{p.name}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                                hasStock ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                              }`}>
                                {hasStock ? `Stock: ${stock}` : "Agotado (0)"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Cantidad a Trasladar</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  placeholder="Ej. 10"
                  required
                  className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Notas de Envío</label>
                <input type="text" value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} placeholder="Ej. Traslado por reabastecimiento de mercancía" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-md hover:opacity-90">
                {isSubmitting ? "Procesando..." : "Despachar y Enviar (En Tránsito)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR UBICACIÓN FÍSICA */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-extrabold text-xs text-foreground">Añadir Ubicación a {selectedWarehouseForLocation?.name}</h3>
              <button onClick={() => setIsLocationModalOpen(false)}><XCircle size={18} className="text-muted-foreground" /></button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Código de Ubicación / Pasillo</label>
                <input type="text" value={newLocationCode} onChange={(e) => setNewLocationCode(e.target.value)} required placeholder="Ej. A01-E02-N01" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-xs font-mono focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Zona (Opcional)</label>
                <input type="text" value={newLocationZone} onChange={(e) => setNewLocationZone(e.target.value)} placeholder="Ej. Zona Fría, Zona A" className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-md">
                Guardar Ubicación
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

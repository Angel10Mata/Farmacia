"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Trash2,
  Calendar,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  ListTree,
  HandCoins,
  ChevronDown,
  Check,
} from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { Pagination, PageSizeSelect } from "@/components/ui/pagination";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { CustomDatePicker, obtenerSemanasDelMes } from "@/components/ui/CustomDatePicker";
import {
  obtenerMovimientosFinancieros,
  obtenerResumenFinanciero,
  eliminarMovimiento,
} from "./actions";
import {
  CATEGORIA_LABELS,
  FILTROS_TIPO,
  type FiltroTipo,
  type TransaccionFinanciera,
  type ResumenFinanciero,
  type CuentaPorCobrar,
  type CuentaPorPagar,
} from "./schemas";
import { NuevoMovimiento } from "./forms/NuevoMovimiento";
import { CuentasPendientes } from "@/components/(base)/finanzas/CuentasPendientes";

const SEARCH_DEBOUNCE_MS = 350;

const RESUMEN_VACIO: ResumenFinanciero = {
  total_ingresos: 0,
  total_egresos: 0,
  balance: 0,
};

type VistaPrincipal = "movimientos" | "pendientes";

const getSwalThemeOpts = () => {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#171a17" : "#ffffff",
    color: isDark ? "#ffffff" : "#000000",
    confirmButtonColor: "#8DA78E",
    cancelButtonColor: isDark ? "#3f3f46" : "#e4e4e7",
    customClass: {
      popup: "rounded-3xl border border-[#C1D1C5]/20 dark:border-[#525D53]/30",
      title: "text-lg font-bold text-[#525D53] dark:text-[#A3BEB0]",
      htmlContainer: "text-sm text-muted-foreground",
      confirmButton: "rounded-xl font-bold tracking-wide cursor-pointer",
      cancelButton:
        "rounded-xl font-bold tracking-wide text-zinc-800 dark:text-zinc-200 cursor-pointer",
    },
  };
};

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function VerFinanzas() {
  const [vista, setVista] = useState<VistaPrincipal>("movimientos");

  const [movimientos, setMovimientos] = useState<TransaccionFinanciera[]>([]);
  const [resumen, setResumen] = useState<ResumenFinanciero>(RESUMEN_VACIO);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [defaultTipo, setDefaultTipo] = useState<"ingreso" | "egreso">("ingreso");

  const [prefillVentaId, setPrefillVentaId] = useState<string | null>(null);
  const [prefillCompraId, setPrefillCompraId] = useState<string | null>(null);

  const [tipoFiltroFecha, setTipoFiltroFecha] = useState<string>("dia");
  const [fechaDia, setFechaDia] = useState<string>(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [activeMonth, setActiveMonth] = useState(() => new Date().getMonth());
  const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const [mostrarMesDropdown, setMostrarMesDropdown] = useState(false);
  const [mostrarSemanaDropdown, setMostrarSemanaDropdown] = useState(false);
  const mesDropdownRef = useRef<HTMLDivElement>(null);
  const semanaDropdownRef = useRef<HTMLDivElement>(null);

  const [fechaRangoDesde, setFechaRangoDesde] = useState<string>("");
  const [fechaRangoHasta, setFechaRangoHasta] = useState<string>("");

  const [refreshKey, setRefreshKey] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (semanaDropdownRef.current && !semanaDropdownRef.current.contains(event.target as Node)) {
        setMostrarSemanaDropdown(false);
      }
      if (mesDropdownRef.current && !mesDropdownRef.current.contains(event.target as Node)) {
        setMostrarMesDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadMovimientos = useCallback(async () => {
    setIsLoading(true);

    let desde = undefined;
    let hasta = undefined;

    if (tipoFiltroFecha === "dia" && fechaDia) {
      desde = `${fechaDia}T00:00:00.000-06:00`;
      hasta = `${fechaDia}T23:59:59.999-06:00`;
    } else if (tipoFiltroFecha === "semana") {
      const semanas = obtenerSemanasDelMes(activeMonth, activeYear);
      if (selectedWeekIndex === -1) {
        // Todas las semanas del mes
        const pad = (n: number) => n.toString().padStart(2, "0");
        const ultimoDia = new Date(activeYear, activeMonth + 1, 0).getDate();
        desde = `${activeYear}-${pad(activeMonth + 1)}-01T00:00:00.000-06:00`;
        hasta = `${activeYear}-${pad(activeMonth + 1)}-${pad(ultimoDia)}T23:59:59.999-06:00`;
      } else {
        const sem = semanas[selectedWeekIndex];
        if (sem) {
          desde = `${sem.desde}T00:00:00.000-06:00`;
          hasta = `${sem.hasta}T23:59:59.999-06:00`;
        }
      }
    } else if (tipoFiltroFecha === "rango") {
      if (fechaRangoDesde) desde = `${fechaRangoDesde}T00:00:00.000-06:00`;
      if (fechaRangoHasta) hasta = `${fechaRangoHasta}T23:59:59.999-06:00`;
    }

    try {
      const [listado, resumenData] = await Promise.all([
        obtenerMovimientosFinancieros({
          page,
          pageSize,
          tipo: filtroTipo,
          search: searchTerm,
          desde,
          hasta
        }),
        obtenerResumenFinanciero(),
      ]);

      setMovimientos(listado.data);
      setTotalRegistros(listado.count);
      setResumen(resumenData);
    } catch (error: unknown) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: toErrorMessage(error, "No se pudieron cargar los movimientos financieros."),
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,
    filtroTipo,
    searchTerm,
    tipoFiltroFecha,
    fechaDia,
    activeMonth,
    activeYear,
    selectedWeekIndex,
    fechaRangoDesde,
    fechaRangoHasta
  ]);

  useEffect(() => {
    if (vista === "movimientos") loadMovimientos();
  }, [vista, loadMovimientos]);

  const handleDelete = async (id: string, descripcion: string) => {
    const result = await Swal.fire({
      title: "¿Anular registro?",
      text: `Se creará un registro inverso para anular: "${descripcion}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) return;

    try {
      await eliminarMovimiento(id);
      Swal.fire({
        title: "Anulado",
        text: "El registro ha sido anulado correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        ...getSwalThemeOpts(),
      });
      loadMovimientos();
    } catch (error: unknown) {
      Swal.fire({
        title: "Error",
        text: toErrorMessage(error, "No se pudo anular el registro"),
        icon: "error",
        ...getSwalThemeOpts(),
      });
    }
  };

  const handleOpenNuevo = (tipo: "ingreso" | "egreso") => {
    setPrefillVentaId(null);
    setPrefillCompraId(null);
    setDefaultTipo(tipo);
    setShowNuevoMovimiento(true);
  };

  const handleAbonarVenta = (cuenta: CuentaPorCobrar) => {
    setPrefillVentaId(cuenta.venta_id);
    setPrefillCompraId(null);
    setDefaultTipo("ingreso");
    setShowNuevoMovimiento(true);
  };

  const handlePagarCompra = (cuenta: CuentaPorPagar) => {
    setPrefillCompraId(cuenta.compra_id);
    setPrefillVentaId(null);
    setDefaultTipo("egreso");
    setShowNuevoMovimiento(true);
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(amount);

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getCategoriaLabel = (categoria: string) =>
    CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS] ?? categoria.toUpperCase();

  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / pageSize));

  return (
    <div className="w-full flex flex-col gap-6 p-0 md:p-6 pt-32 md:pt-24 min-h-screen relative">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-4 md:px-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-[#8DA78E]/10 dark:bg-[#8DA78E]/20 text-[#8DA78E] rounded-xl overflow-hidden">
                <AnimatedIcon iconKey="hrxrggwa" className="text-[#8DA78E]" size={32} />
              </div>
              Control Financiero
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium ml-1">
              Ingresos, egresos, balance y cuentas pendientes
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleOpenNuevo("ingreso")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#8DA78E] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo</span> Ingreso
            </button>
            <button
              type="button"
              onClick={() => handleOpenNuevo("egreso")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo</span> Egreso
            </button>
          </div>
        </div>

        {/* Totales — siempre el balance real de TODO el libro mayor, calculado en Postgres */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 px-4 md:px-0">
          <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-3 md:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 mb-2">
              <div className="p-1.5 md:p-2 bg-[#8DA78E]/10 rounded-lg text-[#8DA78E] shrink-0">
                <ArrowUpRight className="size-4 md:size-5" />
              </div>
              <h3 className="text-[9px] md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Ingresos
              </h3>
            </div>
            <p className="text-base md:text-2xl font-black text-[#8DA78E] truncate">
              {formatMoney(resumen.total_ingresos)}
            </p>
          </div>

          <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-3 md:p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 mb-2">
              <div className="p-1.5 md:p-2 bg-rose-500/10 rounded-lg text-rose-500 shrink-0">
                <ArrowDownRight className="size-4 md:size-5" />
              </div>
              <h3 className="text-[9px] md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Egresos
              </h3>
            </div>
            <p className="text-base md:text-2xl font-black text-rose-500 truncate">{formatMoney(resumen.total_egresos)}</p>
          </div>

          <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-3 md:p-5 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 mb-2">
              <div className="p-1.5 md:p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 shrink-0">
                <Wallet className="size-4 md:size-5" />
              </div>
              <h3 className="text-[9px] md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Balance Total
              </h3>
            </div>
            <p
              className={cn(
                "text-base md:text-2xl font-black truncate",
                resumen.balance >= 0 ? "text-zinc-900 dark:text-white" : "text-rose-500"
              )}
            >
              {formatMoney(resumen.balance)}
            </p>
          </div>
        </div>

        {/* Filtros de Fecha y Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 md:px-0">
          
          {/* Filtros de Fecha (Izquierda) */}
          <div className="flex-1 w-full sm:w-auto">
            {vista === "movimientos" && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-2 shadow-sm w-full md:w-fit z-20 mx-auto sm:mx-0">
                
                {/* Opciones Dia/Mes/Rango */}
                <div className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-100 dark:border-zinc-800 w-full sm:w-auto">
                  {[
                    { id: "dia", label: "Día" },
                    { id: "semana", label: "Mes" },
                    { id: "rango", label: "Rango" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTipoFiltroFecha(opt.id)}
                      className={cn(
                        "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        tipoFiltroFecha === opt.id
                          ? "bg-white dark:bg-zinc-800 text-[#8DA78E] shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Selector de Fecha específico según tipo */}
                <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                  {tipoFiltroFecha === "dia" && (
                    <CustomDatePicker
                      value={fechaDia}
                      onChange={setFechaDia}
                      align="center"
                    />
                  )}

                  {tipoFiltroFecha === "semana" && (
                    <div className="flex items-center gap-2 w-full">
                      {/* Selector de Mes/Año */}
                      <div className="relative w-1/2 sm:w-auto" ref={mesDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setMostrarMesDropdown(!mostrarMesDropdown)}
                          className="flex items-center justify-between w-full sm:w-[140px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] rounded-xl px-2.5 py-1.5 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#8DA78E] transition-all h-[34px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-[#8DA78E]" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][activeMonth]} {activeYear}
                            </span>
                          </div>
                          <ChevronDown className="size-3 text-slate-400" />
                        </button>

                        <AnimatePresence>
                          {mostrarMesDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2"
                            >
                              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-900">
                                <button
                                  type="button"
                                  onClick={() => setActiveYear((y) => y - 1)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 cursor-pointer"
                                >
                                  <ChevronLeft className="size-3.5" />
                                </button>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{activeYear}</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveYear((y) => y + 1)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 cursor-pointer"
                                >
                                  <ChevronRight className="size-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, idx) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                      setActiveMonth(idx);
                                      setMostrarMesDropdown(false);
                                      setSelectedWeekIndex(-1); // Reset a todo el mes
                                    }}
                                    className={cn(
                                      "px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                                      activeMonth === idx
                                        ? "bg-[#8DA78E] text-white"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                    )}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Selector de Semana */}
                      <div className="relative w-1/2 sm:w-auto" ref={semanaDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setMostrarSemanaDropdown(!mostrarSemanaDropdown)}
                          className="flex items-center justify-between w-full sm:w-[150px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] rounded-xl px-2.5 py-1.5 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#8DA78E] transition-all h-[34px]"
                        >
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {selectedWeekIndex === -1 ? "Todo el mes" : obtenerSemanasDelMes(activeMonth, activeYear)[selectedWeekIndex]?.label || "Semana"}
                          </span>
                          <ChevronDown className="size-3 text-slate-400 shrink-0" />
                        </button>
                        
                        <AnimatePresence>
                          {mostrarSemanaDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[180px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWeekIndex(-1);
                                  setMostrarSemanaDropdown(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between cursor-pointer",
                                  selectedWeekIndex === -1
                                    ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                )}
                              >
                                <span>Todo el mes</span>
                                {selectedWeekIndex === -1 && <Check className="size-3" />}
                              </button>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                              {obtenerSemanasDelMes(activeMonth, activeYear).map((sem, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => {
                                    setSelectedWeekIndex(idx);
                                    setMostrarSemanaDropdown(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer",
                                    selectedWeekIndex === idx
                                      ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                  )}
                                >
                                  <span>{sem.label}</span>
                                  {selectedWeekIndex === idx && <Check className="size-3" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {tipoFiltroFecha === "rango" && (
                    <div className="flex items-center justify-center gap-2">
                      <CustomDatePicker
                        value={fechaRangoDesde}
                        onChange={setFechaRangoDesde}
                        placeholder="Desde"
                        align="center"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <CustomDatePicker
                        value={fechaRangoHasta}
                        onChange={setFechaRangoHasta}
                        placeholder="Hasta"
                        align="center"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs de vista principal (Derecha) */}
          <div className="flex items-center justify-end gap-2 w-full sm:w-fit bg-[#8DA78E]/5 p-1 rounded-xl border border-[#8DA78E]/10 shrink-0">
            <button
              type="button"
              onClick={() => setVista("movimientos")}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                vista === "movimientos"
                  ? "bg-white dark:bg-[#525D53] text-[#8DA78E] dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Movimientos
            </button>
            <button
              type="button"
              onClick={() => setVista("pendientes")}
              className={cn(
                "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                vista === "pendientes"
                  ? "bg-white dark:bg-[#525D53] text-[#8DA78E] dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Cuentas Pendientes
            </button>
          </div>
        </div>
      </div>

      {vista === "pendientes" ? (
        <CuentasPendientes onAbonarVenta={handleAbonarVenta} onPagarCompra={handlePagarCompra} refreshKey={refreshKey} />
      ) : (
        <div className="flex flex-col bg-white dark:bg-[#171a17] border-y md:border border-[#C1D1C5]/30 dark:border-[#525D53]/30 md:rounded-3xl shadow-sm overflow-hidden flex-1">
          {/* Toolbar */}
          <div className="p-4 md:p-5 border-b border-[#C1D1C5]/20 dark:border-[#525D53]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="size-4 text-[#8DA78E]/60" />
              </div>
              <input
                type="text"
                placeholder="Buscar por concepto o categoría..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#8DA78E]/5 dark:bg-[#8DA78E]/5 border border-[#8DA78E]/20 dark:border-[#525D53]/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all placeholder:text-[#8DA78E]/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto bg-[#8DA78E]/5 p-1 rounded-xl border border-[#8DA78E]/10">
              {FILTROS_TIPO.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setFiltroTipo(tipo);
                  }}
                  className={cn(
                    "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    filtroTipo === tipo
                      ? "bg-white dark:bg-[#525D53] text-[#8DA78E] dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[400px] w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 opacity-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8DA78E] mb-4"></div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Cargando registros financieros...
                </p>
              </div>
            ) : movimientos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-[#8DA78E]/10 flex items-center justify-center mb-4">
                  <FileText className="size-8 text-[#8DA78E]/50" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin registros</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                  No se encontraron movimientos financieros que coincidan con los filtros aplicados.
                </p>
              </div>
            ) : (
              <>
                {/* Vista Mobile: Tarjetas (estilo Inventario) */}
                <div className="md:hidden flex flex-col gap-3 px-1">
                  {movimientos.map((mov) => {
                    const isIngreso = mov.tipo_movimiento === "ingreso";
                    const dateFormatted = formatFecha(mov.created_at ?? mov.fecha_movimiento).replace(',', '');
                    return (
                      <motion.div
                        key={mov.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className={cn(
                          "relative border rounded-xl p-3 flex gap-3 items-center min-h-[88px] transition-all bg-white dark:bg-[#525D53]/10 border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 hover:border-[#8DA78E] dark:hover:border-[#A3BEB0]/60"
                        )}
                      >
                        {/* Icon Left */}
                        <div className={cn(
                          "shrink-0 size-10 rounded-xl flex items-center justify-center border",
                          isIngreso 
                            ? "bg-[#8DA78E]/10 border-[#8DA78E]/20 text-[#8DA78E] dark:text-[#A3BEB0]" 
                            : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-500"
                        )}>
                          {isIngreso ? (
                            <TrendingUp className="size-5" />
                          ) : (
                            <TrendingDown className="size-5" />
                          )}
                        </div>

                        {/* Content Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <h3 className={cn(
                                "font-black text-xs truncate uppercase leading-tight",
                                mov.monto < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                              )}>
                                {mov.descripcion}
                              </h3>
                              <span className={cn(
                                "text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 leading-none",
                                isIngreso 
                                  ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0]" 
                                  : "bg-rose-500/10 text-rose-500"
                              )}>
                                {getCategoriaLabel(mov.categoria)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                              <Calendar className="size-3 text-slate-400 shrink-0" />
                              <span className="truncate">{dateFormatted}</span>
                            </div>
                          </div>

                          {/* Bottom Stats & Action */}
                          <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
                            <div className="flex gap-3 text-[9px] leading-none">
                              <div>
                                <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Monto:</span>
                                <span className={cn(
                                  "font-black ml-1 tabular-nums tracking-tight",
                                  mov.monto < 0 ? "text-rose-600" : (isIngreso ? "text-[#8DA78E] dark:text-[#A3BEB0]" : "text-rose-500")
                                )}>
                                  {isIngreso ? (mov.monto < 0 ? "-" : "+") : (mov.monto < 0 ? "+" : "-")}
                                  {formatMoney(Math.abs(mov.monto))}
                                </span>
                              </div>
                              <div>
                                <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Saldo:</span>
                                <span className="font-semibold ml-1 text-zinc-500 dark:text-zinc-400 tabular-nums tracking-tight">
                                  {formatMoney(mov.saldo_nuevo)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDelete(mov.id, mov.descripcion)}
                              className="p-1 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
                              title="Anular registro"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Vista Desktop: Tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-full table-fixed sm:table-auto">
                    <thead>
                      <tr className="border-b border-[#C1D1C5]/20 dark:border-[#525D53]/20 bg-[#f4f7f5]/50 dark:bg-[#151f19]/30">
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] w-20 sm:w-32">
                          Fecha
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E]">
                          Concepto / Categoría
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-20 sm:w-auto">
                          Monto
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-20 sm:w-auto">
                          Saldo
                        </th>
                        <th className="px-1 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] w-8 sm:w-20 text-center">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((mov) => (
                        <motion.tr
                          key={mov.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-b border-[#C1D1C5]/10 dark:border-[#525D53]/10 hover:bg-[#8DA78E]/5 transition-colors group"
                        >
                          <td className="px-2 sm:px-5 py-3 sm:py-4 align-top sm:align-middle">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="size-3 sm:size-3.5 text-zinc-400 shrink-0 hidden sm:block" />
                              <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-300 break-words line-clamp-2">
                                {formatFecha(mov.created_at ?? mov.fecha_movimiento).replace(',', '')}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 align-top sm:align-middle">
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-[11px] sm:text-sm font-bold line-clamp-2 break-words",
                                mov.monto < 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-white"
                              )}>
                                {mov.descripcion}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1 sm:gap-1.5">
                                {mov.tipo_movimiento === "ingreso" ? (
                                  <TrendingUp className="size-2.5 sm:size-3 text-[#8DA78E] shrink-0" />
                                ) : (
                                  <TrendingDown className="size-2.5 sm:size-3 text-rose-500 shrink-0" />
                                )}
                                <span className="truncate">{getCategoriaLabel(mov.categoria)}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                            <span
                              className={cn(
                                "text-xs sm:text-sm font-black tabular-nums tracking-tight",
                                mov.monto < 0 ? "text-rose-600" : (mov.tipo_movimiento === "ingreso" ? "text-[#8DA78E]" : "text-rose-500")
                              )}
                            >
                              {mov.tipo_movimiento === "ingreso" ? (mov.monto < 0 ? "-" : "+") : (mov.monto < 0 ? "+" : "-")}
                              {formatMoney(Math.abs(mov.monto))}
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                            <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums tracking-tight">
                              {formatMoney(mov.saldo_nuevo)}
                            </span>
                          </td>
                          <td className="px-1 sm:px-5 py-3 sm:py-4 text-center align-top sm:align-middle">
                            <button
                              type="button"
                              onClick={() => handleDelete(mov.id, mov.descripcion)}
                              className="p-1 sm:p-2 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all focus:opacity-100 cursor-pointer"
                              title="Anular registro"
                            >
                              <Trash2 className="size-3.5 sm:size-4 mx-auto" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Paginación */}
      {!isLoading && totalRegistros > 0 && vista === "movimientos" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 text-slate-600 dark:text-slate-400">
          <PageSizeSelect
            pageSize={pageSize}
            setPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
          <div className="flex justify-start sm:justify-center w-full sm:w-auto">
            <Pagination
              currentPage={page}
              totalPages={totalPaginas}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showNuevoMovimiento && (
          <NuevoMovimiento
            defaultTipo={defaultTipo}
            defaultVentaId={prefillVentaId}
            defaultCompraId={prefillCompraId}
            onClose={() => setShowNuevoMovimiento(false)}
            onSuccess={() => {
              setShowNuevoMovimiento(false);
              loadMovimientos();
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

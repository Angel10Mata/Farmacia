"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { obtenerMovimientosFinancieros, eliminarMovimiento } from "./actions";
import { NuevoMovimiento } from "./forms/NuevoMovimiento";

// Utilidad para SweetAlert2 acorde al tema de la app
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
      confirmButton: "rounded-xl font-bold tracking-wide",
      cancelButton: "rounded-xl font-bold tracking-wide text-zinc-800 dark:text-zinc-200"
    }
  };
};

export function VerFinanzas() {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "ingreso" | "egreso">("todos");
  const [showNuevoMovimiento, setShowNuevoMovimiento] = useState(false);
  const [defaultTipo, setDefaultTipo] = useState<"ingreso" | "egreso">("ingreso");

  useEffect(() => {
    loadMovimientos();
  }, []);

  const loadMovimientos = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerMovimientosFinancieros();
      setMovimientos(data);
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los movimientos financieros.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, descripcion: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar registro?",
      text: `Se eliminará el movimiento: "${descripcion}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        await eliminarMovimiento(id);
        Swal.fire({
          title: "Eliminado",
          text: "El registro ha sido eliminado correctamente.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          ...getSwalThemeOpts()
        });
        loadMovimientos();
      } catch (error: any) {
        Swal.fire({
          title: "Error",
          text: error.message || "No se pudo eliminar el registro",
          icon: "error",
          ...getSwalThemeOpts()
        });
      }
    }
  };

  const handleOpenNuevo = (tipo: "ingreso" | "egreso") => {
    setDefaultTipo(tipo);
    setShowNuevoMovimiento(true);
  };

  // Filtrado
  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(mov => {
      const matchesSearch = 
        mov.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filtroTipo === "todos" || mov.tipo === filtroTipo;
      
      return matchesSearch && matchesTipo;
    });
  }, [movimientos, searchTerm, filtroTipo]);

  // Cálculos de Resumen
  const totales = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    
    movimientos.forEach(mov => {
      if (mov.tipo === "ingreso") ingresos += Number(mov.monto);
      if (mov.tipo === "egreso") egresos += Number(mov.monto);
    });

    return {
      ingresos,
      egresos,
      balance: ingresos - egresos
    };
  }, [movimientos]);

  // Utilidad formato moneda
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(amount);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      venta: "Venta Directa",
      abono_cliente: "Abono de Cliente",
      pago_proveedor: "Pago a Proveedor",
      compra: "Compra/Surtido",
      gasto_fijo: "Gasto Fijo",
      gasto_vario: "Gasto Vario"
    };
    return labels[categoria] || categoria.toUpperCase();
  };

  return (
    <div className="w-full flex flex-col gap-6 p-0 md:p-6 pt-32 md:pt-24 min-h-screen relative">
      
      {/* Header & Resumen Cards */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-4 md:px-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-[#8DA78E]/10 dark:bg-[#8DA78E]/20 text-[#8DA78E] rounded-xl">
                <Wallet className="size-6 md:size-8" />
              </div>
              Control Financiero
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium ml-1">
              Registro general de ingresos, egresos y balance
            </p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => handleOpenNuevo("ingreso")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#8DA78E] hover:bg-[#525D53] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo</span> Ingreso
            </button>
            <button
              onClick={() => handleOpenNuevo("egreso")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo</span> Egreso
            </button>
          </div>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 md:px-0">
          <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#8DA78E]/10 rounded-lg text-[#8DA78E]">
                <ArrowUpRight className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Ingresos</h3>
            </div>
            <p className="text-2xl font-black text-[#8DA78E]">{formatMoney(totales.ingresos)}</p>
          </div>

          <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                <ArrowDownRight className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Egresos</h3>
            </div>
            <p className="text-2xl font-black text-rose-500">{formatMoney(totales.egresos)}</p>
          </div>

          <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
                <Wallet className="size-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Balance Total</h3>
            </div>
            <p className={cn(
              "text-2xl font-black",
              totales.balance >= 0 ? "text-zinc-900 dark:text-white" : "text-rose-500"
            )}>
              {formatMoney(totales.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#8DA78E]/5 dark:bg-[#8DA78E]/5 border border-[#8DA78E]/20 dark:border-[#525D53]/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all placeholder:text-[#8DA78E]/50"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto bg-[#8DA78E]/5 p-1 rounded-xl border border-[#8DA78E]/10">
            {(["todos", "ingreso", "egreso"] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
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

        {/* Lista */}
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8DA78E] mb-4"></div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Cargando registros financieros...</p>
            </div>
          ) : filteredMovimientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-[#8DA78E]/10 flex items-center justify-center mb-4">
                <FileText className="size-8 text-[#8DA78E]/50" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin registros</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">No se encontraron movimientos financieros que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#C1D1C5]/20 dark:border-[#525D53]/20 bg-[#f4f7f5]/50 dark:bg-[#151f19]/30">
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#8DA78E] w-32">Fecha</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#8DA78E]">Concepto / Categoría</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right">Monto</th>
                  <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#8DA78E] w-20 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMovimientos.map((mov) => (
                  <motion.tr 
                    key={mov.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-[#C1D1C5]/10 dark:border-[#525D53]/10 hover:bg-[#8DA78E]/5 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          {formatFecha(mov.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                          {mov.descripcion}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5 flex items-center gap-1.5">
                          {mov.tipo === "ingreso" ? (
                            <TrendingUp className="size-3 text-[#8DA78E]" />
                          ) : (
                            <TrendingDown className="size-3 text-rose-500" />
                          )}
                          {getCategoriaLabel(mov.categoria)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={cn(
                        "text-sm font-black tabular-nums",
                        mov.tipo === "ingreso" ? "text-[#8DA78E]" : "text-rose-500"
                      )}>
                        {mov.tipo === "ingreso" ? "+" : "-"}
                        {formatMoney(mov.monto)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => handleDelete(mov.id, mov.descripcion)}
                        className="p-2 rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Eliminar registro"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNuevoMovimiento && (
          <NuevoMovimiento
            defaultTipo={defaultTipo}
            onClose={() => setShowNuevoMovimiento(false)}
            onSuccess={() => {
              setShowNuevoMovimiento(false);
              loadMovimientos();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

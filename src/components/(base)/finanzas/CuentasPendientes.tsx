// cache-bust
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Truck, Calendar, FileText, Phone } from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { obtenerCuentasPorCobrar, obtenerCuentasPorPagar } from "./actions";
import type { CuentaPorCobrar, CuentaPorPagar } from "./schemas";

type Tab = "cobrar" | "pagar";

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(amount);

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });

interface CuentasPendientesProps {
  onAbonarVenta?: (cuenta: CuentaPorCobrar) => void;
  onPagarCompra?: (cuenta: CuentaPorPagar) => void;
  refreshKey?: number;
}

export function CuentasPendientes({ onAbonarVenta, onPagarCompra, refreshKey }: CuentasPendientesProps) {
  const [tab, setTab] = useState<Tab>("cobrar");
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaPorCobrar[]>([]);
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPorPagar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [cobrar, pagar] = await Promise.all([
          obtenerCuentasPorCobrar(),
          obtenerCuentasPorPagar(),
        ]);
        setCuentasCobrar(cobrar);
        setCuentasPagar(pagar);
      } catch (error: unknown) {
        Swal.fire({
          title: "Error",
          text: toErrorMessage(error, "No se pudieron cargar las cuentas pendientes."),
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const totalPorCobrar = cuentasCobrar.reduce((acc, c) => acc + c.saldo_pendiente, 0);
  const totalPorPagar = cuentasPagar.reduce((acc, c) => acc + c.saldo_pendiente, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 px-4 md:px-0">
        <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-3 md:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 mb-2">
            <div className="p-1.5 md:p-2 bg-[#8DA78E]/10 rounded-lg text-[#8DA78E] shrink-0">
              <Users className="size-4 md:size-5" />
            </div>
            <h3 className="text-[9px] md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Por Cobrar (Clientes)
            </h3>
          </div>
          <p className="text-base md:text-2xl font-black text-[#8DA78E] truncate">{formatMoney(totalPorCobrar)}</p>
        </div>
        <div className="bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-2xl p-3 md:p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 mb-2">
            <div className="p-1.5 md:p-2 bg-rose-500/10 rounded-lg text-rose-500 shrink-0">
              <Truck className="size-4 md:size-5" />
            </div>
            <h3 className="text-[9px] md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Por Pagar (Proveedores)
            </h3>
          </div>
          <p className="text-base md:text-2xl font-black text-rose-500 truncate">{formatMoney(totalPorPagar)}</p>
        </div>
      </div>

      <div className="flex flex-col bg-white dark:bg-[#171a17] border-y md:border border-[#C1D1C5]/30 dark:border-[#525D53]/30 md:rounded-3xl shadow-sm overflow-hidden">
        {/* Sub-tabs */}
        <div className="p-4 md:p-5 border-b border-[#C1D1C5]/20 dark:border-[#525D53]/20">
          <div className="flex items-center gap-2 w-full sm:w-fit bg-[#8DA78E]/5 p-1 rounded-xl border border-[#8DA78E]/10">
            <button
              type="button"
              onClick={() => setTab("cobrar")}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                tab === "cobrar"
                  ? "bg-white dark:bg-[#525D53] text-[#8DA78E] dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Por Cobrar ({cuentasCobrar.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("pagar")}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                tab === "pagar"
                  ? "bg-white dark:bg-[#525D53] text-rose-500 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Por Pagar ({cuentasPagar.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8DA78E] mb-4"></div>
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                Calculando saldos pendientes...
              </p>
            </div>
          ) : tab === "cobrar" ? (
            cuentasCobrar.length === 0 ? (
              <EmptyState texto="No hay clientes con saldo pendiente." />
            ) : (
              <>
                {/* Vista Mobile: Tarjetas */}
                <div className="md:hidden flex flex-col gap-3 px-2 py-1">
                  {cuentasCobrar.map((c) => (
                    <motion.div
                      key={c.venta_id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className={cn(
                        "relative border rounded-xl p-3 flex gap-3 items-center min-h-[88px] transition-all bg-white dark:bg-[#525D53]/10 border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 hover:border-[#8DA78E] dark:hover:border-[#A3BEB0]/60"
                      )}
                    >
                      {/* Icon Left */}
                      <div className="shrink-0 size-10 rounded-xl flex items-center justify-center border bg-[#8DA78E]/10 border-[#8DA78E]/20 text-[#8DA78E] dark:text-[#A3BEB0]">
                        <Users className="size-5" />
                      </div>

                      {/* Content Right */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="font-black text-xs text-slate-900 dark:text-white truncate uppercase leading-tight">
                              {c.cliente_nombre}
                            </h3>
                            {c.numero_recibo && (
                              <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 rounded-full shrink-0 leading-none">
                                #{c.numero_recibo}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                            <Calendar className="size-3 text-slate-400 shrink-0" />
                            <span className="truncate">{formatFecha(c.fecha_venta).replace(',', '')}</span>
                          </div>
                        </div>

                        {/* Bottom Stats & Action */}
                        <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
                          <div className="flex gap-2.5 text-[9px] leading-none">
                            <div>
                              <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Total:</span>
                              <span className="font-bold ml-0.5 text-zinc-700 dark:text-zinc-200 tabular-nums">
                                {formatMoney(c.total)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Saldo:</span>
                              <span className="font-black ml-0.5 text-[#8DA78E] tabular-nums tracking-tight">
                                {formatMoney(c.saldo_pendiente)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onAbonarVenta?.(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#8DA78E] text-white text-[9px] font-bold cursor-pointer active:scale-95 transition-all shrink-0 uppercase"
                          >
                            Abonar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Vista Desktop: Tabla */}
                <div className="hidden md:block">
                  <table className="w-full text-left border-collapse min-w-full table-fixed sm:table-auto">
                    <thead>
                      <tr className="border-b border-[#C1D1C5]/20 dark:border-[#525D53]/20 bg-[#f4f7f5]/50 dark:bg-[#151f19]/30">
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E]">
                          Cliente
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] w-20 sm:w-32">
                          Fecha Venta
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-16 sm:w-auto">
                          Total
                        </th>
                        <th className="hidden sm:table-cell px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-16 sm:w-auto">
                          Cobrado
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-16 sm:w-auto">
                          Saldo
                        </th>
                        <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-center w-auto sm:w-28">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuentasCobrar.map((c) => (
                        <motion.tr
                          key={c.venta_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-b border-[#C1D1C5]/10 dark:border-[#525D53]/10 hover:bg-[#8DA78E]/5 transition-colors"
                        >
                          <td className="px-2 sm:px-5 py-3 sm:py-4 align-top sm:align-middle">
                            <span className="text-[11px] sm:text-sm font-bold text-zinc-900 dark:text-white break-words line-clamp-2">
                              {c.cliente_nombre}
                            </span>
                            {c.numero_recibo && (
                              <span className="block text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 break-all line-clamp-1">
                                <FileText className="size-2.5 sm:size-3 shrink-0" /> Recibo {c.numero_recibo}
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 align-top sm:align-middle">
                            <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1 sm:gap-1.5 break-words line-clamp-2">
                              <Calendar className="size-3 sm:size-3.5 text-zinc-400 shrink-0 hidden sm:block" />
                              {formatFecha(c.fecha_venta).replace(',', '')}
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums tracking-tight">
                              {formatMoney(c.total)}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                            <span className="text-[10px] sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 tabular-nums tracking-tight">
                              {formatMoney(c.total_cobrado)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-black text-[#8DA78E] tabular-nums tracking-tight">
                              {formatMoney(c.saldo_pendiente)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 text-center align-top sm:align-middle">
                            <button
                              type="button"
                              onClick={() => onAbonarVenta?.(c)}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#8DA78E] text-white text-[9px] sm:text-xs font-bold cursor-pointer active:scale-95 transition-all w-full sm:w-auto min-w-[50px] shrink-0 ml-1 sm:ml-0"
                            >
                              Abonar
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          ) : cuentasPagar.length === 0 ? (
            <EmptyState texto="No hay proveedores con saldo pendiente." />
          ) : (
            <>
              {/* Vista Mobile: Tarjetas */}
              <div className="md:hidden flex flex-col gap-3 px-2 py-1">
                {cuentasPagar.map((c) => (
                  <motion.div
                    key={c.compra_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className={cn(
                      "relative border rounded-xl p-3 flex gap-3 items-center min-h-[88px] transition-all bg-white dark:bg-[#525D53]/10 border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 hover:border-rose-500 dark:hover:border-rose-500/60"
                    )}
                  >
                    {/* Icon Left */}
                    <div className="shrink-0 size-10 rounded-xl flex items-center justify-center border bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 text-rose-500">
                      <Truck className="size-5" />
                    </div>

                    {/* Content Right */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 className="font-black text-xs text-slate-900 dark:text-white truncate uppercase leading-tight">
                            {c.proveedor_nombre}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 mt-1">
                          <Calendar className="size-3 text-slate-400 shrink-0" />
                          <span className="truncate">{formatFecha(c.fecha_compra).replace(',', '')}</span>
                        </div>
                      </div>

                      {/* Bottom Stats & Action */}
                      <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
                        <div className="flex gap-2.5 text-[9px] leading-none">
                          <div>
                            <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Total:</span>
                            <span className="font-bold ml-0.5 text-zinc-700 dark:text-zinc-200 tabular-nums">
                              {formatMoney(c.total)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Saldo:</span>
                            <span className="font-black ml-0.5 text-rose-500 tabular-nums tracking-tight">
                              {formatMoney(c.saldo_pendiente)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onPagarCompra?.(c)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[9px] font-bold cursor-pointer active:scale-95 transition-all shrink-0 uppercase"
                        >
                          Pagar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Vista Desktop: Tabla */}
              <div className="hidden md:block">
                <table className="w-full text-left border-collapse min-w-full table-fixed sm:table-auto">
                  <thead>
                    <tr className="border-b border-[#C1D1C5]/20 dark:border-[#525D53]/20 bg-[#f4f7f5]/50 dark:bg-[#151f19]/30">
                      <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E]">
                        Proveedor
                      </th>
                      <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] w-20 sm:w-32">
                        Fecha Compra
                      </th>
                      <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-16 sm:w-auto">
                        Total
                      </th>
                      <th className="hidden sm:table-cell px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-16 sm:w-auto">
                        Pagado
                      </th>
                      <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-right w-16 sm:w-auto">
                        Saldo
                      </th>
                      <th className="px-2 sm:px-5 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#8DA78E] text-center w-auto sm:w-28">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuentasPagar.map((c) => (
                      <motion.tr
                        key={c.compra_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-[#C1D1C5]/10 dark:border-[#525D53]/10 hover:bg-rose-500/5 transition-colors"
                      >
                        <td className="px-2 sm:px-5 py-3 sm:py-4 align-top sm:align-middle">
                          <span className="text-[11px] sm:text-sm font-bold text-zinc-900 dark:text-white break-words line-clamp-2">
                            {c.proveedor_nombre}
                          </span>
                        </td>
                        <td className="px-2 sm:px-5 py-3 sm:py-4 align-top sm:align-middle">
                          <span className="text-[10px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1 sm:gap-1.5 break-words line-clamp-2">
                            <Calendar className="size-3 sm:size-3.5 text-zinc-400 shrink-0 hidden sm:block" />
                            {formatFecha(c.fecha_compra).replace(',', '')}
                          </span>
                        </td>
                        <td className="px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums tracking-tight">
                            {formatMoney(c.total)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                          <span className="text-[10px] sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 tabular-nums tracking-tight">
                            {formatMoney(c.total_pagado)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-5 py-3 sm:py-4 text-right align-top sm:align-middle whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-black text-rose-500 tabular-nums tracking-tight">
                            {formatMoney(c.saldo_pendiente)}
                          </span>
                        </td>
                        <td className="px-2 sm:px-5 py-3 sm:py-4 text-center align-top sm:align-middle">
                          <button
                            type="button"
                            onClick={() => onPagarCompra?.(c)}
                            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-rose-500 text-white text-[9px] sm:text-xs font-bold cursor-pointer active:scale-95 transition-all w-full sm:w-auto min-w-[50px] shrink-0 ml-1 sm:ml-0"
                          >
                            Pagar
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
    </div>
  );
}

function EmptyState({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[#8DA78E]/10 flex items-center justify-center mb-4">
        <Phone className="size-8 text-[#8DA78E]/50" />
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Todo al día</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">{texto}</p>
    </div>
  );
}

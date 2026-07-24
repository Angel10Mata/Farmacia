"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Receipt, AlertTriangle, X } from "lucide-react";
import { Compra } from "../types";
import { fmtQ } from "@/lib/utils";

interface CompraDetalleModalProps {
  compra: Compra | null;
  onClose: () => void;
  isLoadingDetalles: boolean;
  detallesDeCompra: any[];
}

// Helper para códigos de compra únicos a partir de UUID
const obtenerCodigoCompra = (id: string) => {
  if (!id) return "N/A";
  const cleanId = id.replace(/-/g, "").toUpperCase();
  return `${cleanId.substring(0, 3)}-${cleanId.substring(3, 6)}`;
};

export function CompraDetalleModal({
  compra,
  onClose,
  isLoadingDetalles,
  detallesDeCompra
}: CompraDetalleModalProps) {
  if (!compra) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        />

        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-[calc(100%-2rem)] m-4 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col rounded-[2rem] overflow-hidden"
        >
          {/* Header opcional para móvil */}
          <div className="flex md:hidden justify-end p-4 pb-0 shrink-0">
             <button onClick={onClose} className="p-2 text-zinc-400 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
               <X className="size-5" />
             </button>
          </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-6 pb-6 flex flex-col gap-4 text-left custom-scrollbar">
                {/* Tarjeta Informativa del Proveedor */}
                <div className="bg-white dark:bg-zinc-950 border border-[#C1D1C5]/30 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Proveedor</p>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      {compra.inv_proveedores?.nombre || "Proveedor Desconocido"}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      NIT: {compra.inv_proveedores?.nit || "C/F"}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 dark:border-zinc-900 pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div>
                      <span className="block font-bold text-slate-400">Fecha Registro</span>
                      {new Date(compra.created_at).toLocaleString("es-GT")}
                    </div>
                    <div>
                      <span className="block font-bold text-slate-400">Estado Pago</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(() => {
                          const abonos = compra.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                          const isPaid = abonos >= compra.total;
                          return (
                            <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              isPaid
                                ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            }`}>
                              {isPaid ? "Pagado" : "Pendiente"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Medicamentos */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Detalle de Artículos</h4>
                  {isLoadingDetalles ? (
                    <div className="py-10 flex items-center justify-center">
                      <div className="size-6 rounded-full border-2 border-[#8DA78E]/20 border-t-[#8DA78E] animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                      {detallesDeCompra.map((d, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 p-3 rounded-2xl flex items-center justify-between text-xs gap-3 shadow-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {d.inv_productos?.nombre || "Pedido"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Costo: {fmtQ(d.precio_costo)} | Cant: {d.cantidad}
                            </p>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white shrink-0">
                            {fmtQ(d.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historial de Pagos */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Historial de Pagos</h4>
                  <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-xs text-xs">
                    {(() => {
                      const pagos = compra.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor") || [];
                      if (pagos.length > 0) {
                        return (
                          <div className="divide-y divide-slate-50 dark:divide-zinc-900">
                            {pagos.map((pago: any) => {
                              const dateStr = new Date(pago.created_at).toLocaleDateString("es-GT", {
                                day: "2-digit", month: "short", year: "numeric"
                              });
                              const timeStr = new Date(pago.created_at).toLocaleTimeString("es-GT", {
                                hour: "2-digit", minute: "2-digit"
                              });
                              return (
                                <div key={pago.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{pago.concepto}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Fecha: {dateStr} a las {timeStr}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black text-[#8DA78E] block">
                                      {fmtQ(Math.abs(Number(pago.monto)))}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      } else {
                        return (
                          <div className="p-4 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                            <AlertTriangle className="size-5 text-amber-500/80 animate-pulse" />
                            <p className="font-bold text-[11px] text-slate-500">Pendiente de pago</p>
                            <p className="text-[9px] text-slate-400">No se registran transacciones para esta compra.</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Observaciones */}
                {compra.observaciones && (
                  <div className="text-xs">
                    <h4 className="font-black uppercase text-slate-400 tracking-wider mb-1">Notas / Observaciones</h4>
                    <p className="text-slate-600 dark:text-slate-400 italic bg-white dark:bg-zinc-950 p-3 rounded-xl border border-[#C1D1C5]/30 dark:border-zinc-800">
                      {compra.observaciones}
                    </p>
                  </div>
                )}

                {/* Resumen Totales */}
                <div className="bg-[#8DA78E]/5 border border-[#8DA78E]/20 p-4 rounded-2xl flex justify-between items-center mt-auto">
                  <span className="text-xs font-black uppercase tracking-wider text-[#525D53] dark:text-[#A3BEB0]">Total de la Compra</span>
                  <span className="text-lg font-black text-[#8DA78E]">{fmtQ(compra.total)}</span>
                </div>
              </div>
            </motion.div>
          </div>
    </AnimatePresence>
  );
}

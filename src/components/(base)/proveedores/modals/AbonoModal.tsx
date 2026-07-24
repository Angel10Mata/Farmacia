"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Check } from "lucide-react";
import { Compra } from "../types";
import { fmtQ } from "@/lib/utils";
import Swal from "sweetalert2";

interface AbonoModalProps {
  compra: Compra | null;
  onClose: () => void;
  onAbonar: (id: string, monto: number, metodo: string, notas: string) => Promise<boolean>;
}

const obtenerCodigoCompra = (id: string) => {
  if (!id) return "N/A";
  const cleanId = id.replace(/-/g, "").toUpperCase();
  return `${cleanId.substring(0, 3)}-${cleanId.substring(3, 6)}`;
};

export function AbonoModal({ compra, onClose, onAbonar }: AbonoModalProps) {
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [metodoPagoAbono, setMetodoPagoAbono] = useState("Efectivo");
  const [notasAbono, setNotasAbono] = useState("");
  const [isProcesando, setIsProcesando] = useState(false);

  const getSwalThemeOpts = () => {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return {
      background: isDark ? "#18181b" : "#F5F5F1",
      color: isDark ? "#F5F5F1" : "#525D53",
      confirmButtonColor: "#8DA78E",
      cancelButtonColor: "#525D53",
      customClass: { popup: "!rounded-3xl border-0" }
    };
  };

  const handleAbonar = async () => {
    if (!compra) return;
    const amount = Number(montoAbono);
    if (!amount || amount <= 0) {
      Swal.fire({
        title: "Monto Inválido",
        text: "Ingresa un monto mayor a 0 para el abono.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    setIsProcesando(true);
    try {
      const success = await onAbonar(compra.id, amount, metodoPagoAbono, notasAbono.trim());
      if (success) {
        onClose();
      }
    } finally {
      setIsProcesando(false);
    }
  };

  if (!compra) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black backdrop-blur-xs cursor-pointer"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950/50">
            <h3 className="font-black text-slate-800 dark:text-white uppercase text-sm flex items-center gap-2">
              <Receipt className="size-4 text-[#8DA78E]" />
              Abonar a Compra #{obtenerCodigoCompra(compra.id)}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold px-2 py-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4 text-left">
            {(() => {
              const abonos = compra.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
              const saldoCompra = Math.max(0, compra.total - abonos);
              return (
                <div className="bg-[#8DA78E]/10 border border-[#8DA78E]/20 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-[#525D53] dark:text-[#A3BEB0]">Saldo Actual</span>
                  <span className="text-xl font-black text-[#8DA78E]">{fmtQ(saldoCompra)}</span>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Monto a Abonar (Q)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={montoAbono}
                onChange={(e) => {
                  const val = e.target.value;
                  setMontoAbono(val === "" ? "" : Number(val));
                }}
                placeholder="0.00"
                className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#8DA78E]/50 focus:border-[#8DA78E] focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Método de Pago
              </label>
              <select
                value={metodoPagoAbono}
                onChange={(e) => setMetodoPagoAbono(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm font-bold bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#8DA78E]/50 focus:border-[#8DA78E] focus:outline-none transition-all cursor-pointer"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Notas (Opcional)
              </label>
              <textarea
                value={notasAbono}
                onChange={(e) => setNotasAbono(e.target.value)}
                placeholder="Referencia de transferencia, número de cheque, etc."
                rows={2}
                className="w-full px-4 py-2 border rounded-xl text-sm bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#8DA78E]/50 focus:border-[#8DA78E] focus:outline-none transition-all resize-none"
              />
            </div>

            <button
              onClick={handleAbonar}
              disabled={isProcesando || !montoAbono || Number(montoAbono) <= 0}
              className="mt-2 w-fit max-w-full py-3 px-6 bg-[#8DA78E] disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-[#8DA78E]/20"
            >
              {isProcesando ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="size-4" /> Confirmar Abono
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

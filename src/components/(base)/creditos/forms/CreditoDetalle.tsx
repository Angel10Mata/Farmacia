"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Plus, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { getSwalThemeOpts } from "@/lib/utils";
import { cn, fmtQ } from "@/lib/utils";
import { ModalShell } from "@/components/ui/ModalShell";
import type { CreditoResumen } from "../lib/zod";
import { useDetalleCredito } from "../lib/hooks";
import { ModalAbono } from "./ModalAbono";

interface CreditoDetalleProps {
  cliente: CreditoResumen;
  onClose: () => void;
  onUpdate: () => void;
}

export function CreditoDetalle({
  cliente,
  onClose,
  onUpdate
}: CreditoDetalleProps) {
  const { data: ventas = [], isLoading } = useDetalleCredito(cliente.cliente_id);
  const [abonoModalData, setAbonoModalData] = useState<{ventaId: string, saldo: number} | null>(null);

  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text(`Estado de Cuenta: ${cliente.nombre}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`NIT: ${cliente.nit}`, 14, 22);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-GT")}`, 14, 27);
      
      const tableData: any[] = [];
      let saldoAcumulado = 0;

      // Ordenar cronológico ascendente para el PDF
      const cronologico = [...ventas].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      cronologico.forEach(v => {
        const fecha = new Date(v.created_at).toLocaleDateString("es-GT");
        saldoAcumulado += v.total || 0;
        tableData.push([
          fecha,
          `Compra Crédito #${v.id.substring(0,6).toUpperCase()}`,
          `${fmtQ(v.total || 0)}`,
          "-",
          `${fmtQ(saldoAcumulado)}`
        ]);

        const abonos = v.fin_transacciones?.filter((t:any) => t.categoria === "abono_cliente" || t.categoria === "venta") || [];
        abonos.sort((a:any,b:any) => new Date(a.fecha_movimiento).getTime() - new Date(b.fecha_movimiento).getTime());

        abonos.forEach((a:any) => {
          const fechaAb = new Date(a.fecha_movimiento).toLocaleDateString("es-GT");
          saldoAcumulado -= a.monto;
          tableData.push([
            fechaAb,
            `Abono`,
            "-",
            `${fmtQ(a.monto)}`,
            `${fmtQ(Math.max(0, saldoAcumulado))}`
          ]);
        });
      });
      
      autoTable(doc, {
        head: [["Fecha", "Descripción", "Cargo", "Abono", "Saldo"]],
        body: tableData,
        startY: 35,
        theme: "striped",
        headStyles: { fillColor: [141, 167, 142], textColor: [245, 245, 241], fontStyle: "bold" }
      });
      
      doc.save(`EstadoCuenta_${cliente.nombre.replace(/\s+/g,'_')}.pdf`);
    } catch (e: any) {
      Swal.fire({ title: "Error", text: "No se pudo generar PDF", icon: "error", ...getSwalThemeOpts() });
    }
  };

  return (
    <>
      <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-[calc(100%-2rem)] m-4 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col rounded-[2rem] overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 rounded-xl bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
                <CreditCard className="size-5 text-[#8DA78E]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">Estado de Cuenta</h3>
                <p className="text-xs text-zinc-500">{cliente.nombre}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <X className="size-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Saldo Pendiente</span>
                <p className="text-xl font-black text-rose-500">{fmtQ(cliente.saldo_pendiente)}</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Total Consumido</span>
                <p className="text-xl font-black text-[#8DA78E]">{fmtQ(cliente.total_consumido)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin size-6 border-2 border-[#8DA78E] border-t-transparent rounded-full"/></div>
              ) : ventas.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-8">No hay historial de crédito.</p>
              ) : (
                ventas.map((v) => {
                  const abonos = v.fin_transacciones?.filter((t:any) => t.categoria === "abono_cliente" || t.categoria === "venta") || [];
                  const totalAbonado = abonos.reduce((sum:number, t:any) => sum + Number(t.monto), 0);
                  const saldo = Math.max(0, (v.total || 0) - totalAbonado);
                  const isPagado = saldo <= 0;

                  return (
                    <div key={v.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-start bg-white dark:bg-zinc-800/50">
                        <div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Compra #{v.id.substring(0,6).toUpperCase()}</span>
                          <p className="text-[10px] text-zinc-500">{new Date(v.created_at).toLocaleDateString("es-GT")}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{fmtQ(v.total || 0)}</span>
                          <p className={cn("text-[9px] font-bold uppercase", isPagado ? "text-[#8DA78E]" : "text-rose-500")}>
                            {isPagado ? "Cancelado" : `Pendiente: ${fmtQ(saldo)}`}
                          </p>
                        </div>
                      </div>
                      {abonos.length > 0 && (
                        <div className="p-2 space-y-1 bg-white dark:bg-zinc-800">
                          {abonos.map((a:any) => (
                            <div key={a.id} className="flex justify-between items-center px-2 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                              <span className="text-[10px] text-zinc-500">{new Date(a.fecha_movimiento).toLocaleDateString("es-GT")}</span>
                              <span className="text-[10px] font-bold text-[#8DA78E]">+ {fmtQ(Number(a.monto))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!isPagado && (
                        <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                          <button
                            onClick={() => setAbonoModalData({ventaId: v.id, saldo})}
                            className="w-full py-1.5 rounded-lg bg-[#8DA78E]/10 text-[#8DA78E] hover:bg-[#8DA78E]/20 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="size-3" /> Registrar Abono
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-[#F5F5F1] dark:bg-zinc-900">
            <button
              onClick={handleExportarPDF}
              className="w-full px-6 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer hover:opacity-90"
            >
              Exportar Estado de Cuenta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>

      <AnimatePresence>
        {abonoModalData && (
          <ModalAbono
            cliente={cliente}
            ventaId={abonoModalData.ventaId}
            saldoRestante={abonoModalData.saldo}
            onClose={() => setAbonoModalData(null)}
            onSuccess={() => {
              onUpdate();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

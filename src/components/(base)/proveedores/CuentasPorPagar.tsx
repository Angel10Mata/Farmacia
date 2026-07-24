"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Compra } from "./types";
import { AbonoModal } from "./modals/AbonoModal";
import { fmtQ } from "@/lib/utils";
import { useRegistrarAbonoCompra } from "./lib/hooks";
import Swal from "sweetalert2";

interface CuentasPorPagarProps {
  compras: Compra[];
  cargarDatos: () => void;
}

const obtenerCodigoCompra = (id: string) => {
  if (!id) return "N/A";
  const cleanId = id.replace(/-/g, "").toUpperCase();
  return `${cleanId.substring(0, 3)}-${cleanId.substring(3, 6)}`;
};

export function CuentasPorPagar({ compras, cargarDatos }: CuentasPorPagarProps) {
  const [busquedaCuentasPagar, setBusquedaCuentasPagar] = useState("");
  const [compraAAbonar, setCompraAAbonar] = useState<Compra | null>(null);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);

  const { mutateAsync: registrarAbonoAsync } = useRegistrarAbonoCompra();

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

  const handleRegistrarAbono = async (id: string, monto: number, metodo: string, notas: string) => {
    try {
      const res = await registrarAbonoAsync({ id, monto, metodo, notas: notas || undefined });
      if (!res.success) throw new Error(res.code || "Error");

      Swal.fire({
        title: "Abono Registrado",
        text: `Se registró un abono de ${fmtQ(monto)} correctamente.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });
      cargarDatos();
      return true;
    } catch (e: any) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo registrar el abono.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
      return false;
    }
  };

  const cuentasPendientes = compras.filter((c) => {
    const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
    const saldoCompra = Math.max(0, c.total - abonos);
    // Solo compras con saldo > 0
    if (saldoCompra <= 0) return false;

    const q = busquedaCuentasPagar.toLowerCase();
    const matchSearch =
      obtenerCodigoCompra(c.id).toLowerCase().includes(q) ||
      (c.inv_proveedores?.nombre || "").toLowerCase().includes(q);
    
    return matchSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-1">
        {/* Buscador */}
        <div className="relative w-full sm:max-w-xl text-left">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={busquedaCuentasPagar}
            onChange={(e) => setBusquedaCuentasPagar(e.target.value)}
            placeholder="Buscar por referencia o proveedor..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border-none bg-white dark:bg-zinc-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 transition-all shadow-sm"
          />
        </div>
      </div>

        {/* Tabla de Cuentas por Pagar (Desktop) */}
        <div className="hidden md:block bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-black uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                    <th className="px-5 py-3.5">Referencia</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Proveedor</th>
                    <th className="px-5 py-3.5 text-right">Monto Total</th>
                    <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                    <th className="px-5 py-3.5 text-center">Días Restantes</th>
                    <th className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                {cuentasPendientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400 font-bold">
                      No hay cuentas por pagar pendientes.
                    </td>
                  </tr>
                ) : (
                  cuentasPendientes.map((c) => {
                    const dateStr = new Date(c.created_at).toLocaleDateString("es-GT", {
                      day: "2-digit", month: "short", year: "numeric"
                    });
                    const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                    const saldoCompra = Math.max(0, c.total - abonos);
                    
                    const daysElapsed = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    const isVencido = daysElapsed > 30;
                    const diasRestantes = 30 - daysElapsed;

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-[#8DA78E]/10 dark:hover:bg-[#A3BEB0]/15 transition-all"
                      >
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          #{obtenerCodigoCompra(c.id)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="px-5 py-3.5 font-bold">
                          {c.inv_proveedores?.nombre || "Proveedor Desconocido"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {fmtQ(c.total)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-[#8DA78E] dark:text-[#A3BEB0] whitespace-nowrap">
                          {fmtQ(saldoCompra)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVencido
                              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                              : diasRestantes <= 5 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                          }`}>
                            {isVencido ? "Vencido" : `${diasRestantes} Días`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setCompraAAbonar(c);
                              setIsAbonoModalOpen(true);
                            }}
                            className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 bg-[#8DA78E] hover:bg-[#7a937b] text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase shadow-xs"
                          >
                            <Plus className="size-3" /> Registrar Pago
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-3">
          {cuentasPendientes.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-bold text-sm bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
              No hay cuentas por pagar pendientes.
            </div>
          ) : (
            cuentasPendientes.map((c) => {
              const dateStr = new Date(c.created_at).toLocaleDateString("es-GT", {
                day: "2-digit", month: "short", year: "numeric"
              });
              const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
              const saldoCompra = Math.max(0, c.total - abonos);
              
              const daysElapsed = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
              const isVencido = daysElapsed > 30;
              const diasRestantes = 30 - daysElapsed;

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">#{obtenerCodigoCompra(c.id)}</h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-0.5">{c.inv_proveedores?.nombre || "Desconocido"}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{dateStr}</p>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isVencido
                        ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                        : diasRestantes <= 5 ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                    }`}>
                      {isVencido ? "Vencido" : `${diasRestantes} Días`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span className="font-bold text-[10px] uppercase">Monto Total</span>
                      <span>{fmtQ(c.total)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-[10px] uppercase text-[#8DA78E] dark:text-[#A3BEB0]">Saldo Pendiente</span>
                      <span className="font-black text-[#8DA78E] dark:text-[#A3BEB0]">{fmtQ(saldoCompra)}</span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setCompraAAbonar(c);
                        setIsAbonoModalOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-[#8DA78E] hover:bg-[#7a937b] text-white font-bold rounded-xl transition-colors cursor-pointer text-[10px] uppercase shadow-xs"
                    >
                      <Plus className="size-3" /> Registrar Pago
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      {isAbonoModalOpen && (
        <AbonoModal
          compra={compraAAbonar}
          onClose={() => setIsAbonoModalOpen(false)}
          onAbonar={handleRegistrarAbono}
        />
      )}
    </div>
  );
}

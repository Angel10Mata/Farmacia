"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  ChevronRight,
  Download,
  X,
  Clock,
  Receipt,
  ChevronDown,
  User,
  AlertCircle,
  Plus,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { Pagination, PageSizeSelect } from "@/components/ui/pagination";
import { obtenerResumenCreditos, type CreditoResumen } from "./actions";
import { registrarMovimiento } from "../finanzas/actions";
import { Truck, Calendar, FileText } from "lucide-react";

// ─── Modal Registrar Abono ───────────────────────────────────────────────────
function ModalAbono({
  cliente,
  ventaId,
  saldoRestante,
  onClose,
  onSuccess
}: {
  cliente: CreditoResumen;
  ventaId: string;
  saldoRestante: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [monto, setMonto] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAbonar = async () => {
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) {
      Swal.fire({ title: "Error", text: "Ingresa un monto válido mayor a 0", icon: "error" });
      return;
    }
    if (val > saldoRestante) {
      Swal.fire({ title: "Atención", text: `El monto no puede ser mayor al saldo restante (Q${saldoRestante.toFixed(2)})`, icon: "warning" });
      return;
    }

    setLoading(true);
    try {
      await registrarMovimiento({
        tipo_movimiento: "ingreso",
        categoria: "abono_cliente",
        venta_id: ventaId,
        monto: val,
        descripcion: descripcion.trim() || `Abono a crédito de ${cliente.nombre}`,
      });
      Swal.fire({ title: "Éxito", text: "Abono registrado correctamente", icon: "success", timer: 1500, showConfirmButton: false });
      onSuccess();
      onClose();
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err.message, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100">Registrar Abono</h3>
          <button onClick={onClose} className="text-zinc-400 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Saldo Pendiente</label>
            <p className="text-lg font-black text-rose-500">Q{saldoRestante.toFixed(2)}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Monto a Abonar (Q)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#8DA78E] focus:ring-1 focus:ring-[#8DA78E]"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Descripción (Opcional)</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#8DA78E] focus:ring-1 focus:ring-[#8DA78E] text-sm"
              placeholder={`Abono de ${cliente.nombre}...`}
            />
          </div>
        </div>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer">Cancelar</button>
          <button onClick={handleAbonar} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8DA78E] text-white disabled:opacity-50 cursor-pointer">
            {loading ? "Procesando..." : "Confirmar Abono"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Detalle de Crédito (Estado de Cuenta) ──────────────────────────────────
function CreditoDetalle({
  cliente,
  onClose,
  onUpdate
}: {
  cliente: CreditoResumen;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [abonoModalData, setAbonoModalData] = useState<{ventaId: string, saldo: number} | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("ventas")
        .select("id, created_at, tipo_venta, total, observaciones, fin_transacciones(id, monto, fecha_movimiento, tipo_movimiento, categoria)")
        .eq("cliente_id", cliente.cliente_id)
        .eq("tipo_venta", "Crédito")
        .order("created_at", { ascending: false });
      if (data) setVentas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [cliente.cliente_id]);

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
          `Q${v.total.toFixed(2)}`,
          "-",
          `Q${saldoAcumulado.toFixed(2)}`
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
            `Q${a.monto.toFixed(2)}`,
            `Q${Math.max(0, saldoAcumulado).toFixed(2)}`
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
      Swal.fire({ title: "Error", text: "No se pudo generar PDF", icon: "error" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-4 h-full overflow-hidden fixed top-0 right-0 w-full md:w-[500px] z-[100] shadow-2xl"
    >
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 size-8 rounded-lg bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
            <CreditCard className="size-4.5 text-[#8DA78E]" />
          </div>
          <div>
            <h2 className="font-black text-zinc-900 dark:text-zinc-100 text-base leading-none">Estado de Cuenta</h2>
            <p className="text-xs text-zinc-500 truncate max-w-[200px]">{cliente.nombre}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-400 transition-colors p-2 cursor-pointer">
          <X className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Saldo Pendiente</span>
          <p className="text-xl font-black text-rose-500">Q{cliente.saldo_pendiente.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Total Consumido</span>
          <p className="text-xl font-black text-[#8DA78E]">Q{cliente.total_consumido.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {loading ? (
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
              <div key={v.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-start bg-zinc-50 dark:bg-zinc-800/50">
                  <div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Compra #{v.id.substring(0,6).toUpperCase()}</span>
                    <p className="text-[10px] text-zinc-500">{new Date(v.created_at).toLocaleDateString("es-GT")}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">Q{v.total.toFixed(2)}</span>
                    <p className={cn("text-[9px] font-bold uppercase", isPagado ? "text-[#8DA78E]" : "text-rose-500")}>
                      {isPagado ? "Cancelado" : `Pendiente: Q${saldo.toFixed(2)}`}
                    </p>
                  </div>
                </div>
                {abonos.length > 0 && (
                  <div className="p-2 space-y-1 bg-white dark:bg-zinc-800">
                    {abonos.map((a:any) => (
                      <div key={a.id} className="flex justify-between items-center px-2 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                        <span className="text-[10px] text-zinc-500">{new Date(a.fecha_movimiento).toLocaleDateString("es-GT")}</span>
                        <span className="text-[10px] font-bold text-[#8DA78E]">+ Q{Number(a.monto).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!isPagado && (
                  <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                    <button
                      onClick={() => setAbonoModalData({ventaId: v.id, saldo})}
                      className="w-full py-1.5 rounded-lg bg-[#8DA78E]/10 text-[#8DA78E] hover:bg-[#8DA78E]/20 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1"
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

      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          onClick={handleExportarPDF}
          className="w-fit max-w-full px-6 py-2.5 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer"
        >
          Exportar Estado de Cuenta
        </button>
      </div>

      <AnimatePresence>
        {abonoModalData && (
          <ModalAbono
            cliente={cliente}
            ventaId={abonoModalData.ventaId}
            saldoRestante={abonoModalData.saldo}
            onClose={() => setAbonoModalData(null)}
            onSuccess={() => {
              loadData();
              onUpdate(); // refresh parent
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function VerCreditos() {
  const [tab, setTab] = useState<"cobrar" | "pagados">("cobrar");

  // Estados Por Cobrar
  const [busqueda, setBusqueda] = useState("");
  const [creditos, setCreditos] = useState<CreditoResumen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [criterioOrden, setCriterioOrden] = useState<"saldo-desc" | "saldo-asc" | "nombre-asc">("saldo-desc");
  
  const [clienteSeleccionado, setClienteSeleccionado] = useState<CreditoResumen | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dataCobrar = await obtenerResumenCreditos();
      setCreditos(dataCobrar);
      if (clienteSeleccionado) {
        const updated = dataCobrar.find(c => c.cliente_id === clienteSeleccionado.cliente_id);
        if (updated) setClienteSeleccionado(updated);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ title: "Error", text: "No se pudieron cargar los créditos.", icon: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const creditosFiltrados = creditos.filter((c) => {
    const isActivo = tab === "cobrar" 
      ? (c.estado !== "Solventado" && c.saldo_pendiente > 0)
      : (c.estado === "Solventado" || c.saldo_pendiente <= 0);
    return isActivo && (c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.nit.includes(busqueda));
  });

  const creditosOrdenados = [...creditosFiltrados].sort((a, b) => {
    if (criterioOrden === "saldo-desc") return b.saldo_pendiente - a.saldo_pendiente;
    if (criterioOrden === "saldo-asc") return a.saldo_pendiente - b.saldo_pendiente;
    if (criterioOrden === "nombre-asc") return a.nombre.localeCompare(b.nombre);
    return 0;
  });

  const totalPages = Math.ceil(creditosOrdenados.length / pageSize) || 1;
  const paginatedCreditos = creditosOrdenados.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportarGlobal = () => {
    try {
      const doc = new jsPDF();
      doc.text("Reporte de Créditos", 14, 15);
      
      const tableData = creditosOrdenados.map((c) => [
        c.nombre,
        c.nit,
        c.limite_credito,
        `Q${c.total_consumido.toFixed(2)}`,
        `Q${c.saldo_pendiente.toFixed(2)}`,
        c.estado
      ]);
      
      autoTable(doc, {
        head: [["Cliente", "NIT", "Límite", "Total Consumido", "Saldo Pendiente", "Estado"]],
        body: tableData,
        startY: 22,
        theme: "striped",
        headStyles: { fillColor: [141, 167, 142], textColor: [245, 245, 241], fontStyle: "bold", fontSize: 10 },
      });
      doc.save(`Creditos_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      Swal.fire({ title: "Error", text: "No se pudo generar PDF", icon: "error" });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 pt-32 md:pt-24 min-h-screen relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4">
          <div className="shrink-0 size-12 rounded-2xl bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
             <CreditCard className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Finanzas</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
              Control de Créditos
            </h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Main Tabs */}
        <div className="flex w-fit bg-[#8DA78E]/5 p-1 rounded-xl border border-[#8DA78E]/10">
          <button
            type="button"
            onClick={() => setTab("cobrar")}
            className={cn(
              "px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              tab === "cobrar"
                ? "bg-white dark:bg-[#525D53] text-[#8DA78E] dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Por Cobrar (Clientes)
          </button>
          <button
            type="button"
            onClick={() => setTab("pagados")}
            className={cn(
              "px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              tab === "pagados"
                ? "bg-white dark:bg-[#525D53] text-[#8DA78E] dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Pagados
          </button>
        </div>

        {/* Buscador y Ordenamiento */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o NIT..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 focus:border-[#8DA78E] transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={criterioOrden} onValueChange={(val: any) => setCriterioOrden(val)}>
              <SelectTrigger className="w-[220px] h-[42px] rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 shadow-sm focus:ring-1 focus:ring-[#8DA78E]">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-md">
                <SelectItem value="saldo-desc" className="text-xs font-semibold">Mayor saldo pendiente</SelectItem>
                <SelectItem value="saldo-asc" className="text-xs font-semibold">Menor saldo pendiente</SelectItem>
                <SelectItem value="nombre-asc" className="text-xs font-semibold">Alfabético (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={handleExportarGlobal}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer"
            >
              <Download className="size-3.5" /> Exportar
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 relative w-full h-auto overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-zinc-100/50 dark:bg-zinc-800/50 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
            <div className="animate-spin size-8 border-4 border-[#8DA78E] border-t-transparent rounded-full" />
          </div>
        )}

        <div className="flex flex-col flex-1 min-w-0 gap-4">
          <div className="flex flex-col flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-5 shadow-sm overflow-hidden">
            <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
              {/* VISTA MÓVIL: Tarjetas */}
              <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 content-start pr-2">
                {paginatedCreditos.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-zinc-400 font-medium text-sm">No se encontraron créditos.</div>
                ) : (
                  paginatedCreditos.map((c) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={c.cliente_id} 
                      className={cn(
                        "group relative border rounded-2xl p-4 flex flex-col gap-4 min-h-[140px] transition-all cursor-default",
                        c.estado === "Atrasado" ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/30 hover:border-rose-300" :
                        "bg-[#F5F5F1] dark:bg-[#525D53]/10 border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 hover:border-[#8DA78E] dark:hover:border-[#A3BEB0]/60"
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{c.nombre}</p>
                          <span className="text-[10px] text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 mt-1 inline-block">NIT: {c.nit}</span>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase shrink-0 tracking-wider",
                          c.estado === "Atrasado" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" :
                          c.estado === "Solventado" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                          "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        )}>
                          {c.estado === "Atrasado" ? "En Mora" : c.estado}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs mt-auto">
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Días Restantes</p>
                          <p className={cn("font-mono font-semibold", c.estado === 'Solventado' ? 'text-emerald-600 dark:text-emerald-400' : 30 - c.dias_atraso < 0 ? 'text-rose-600 dark:text-rose-400' : 30 - c.dias_atraso <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300')}>
                            {c.estado === 'Solventado' ? 'Pagado' : 30 - c.dias_atraso < 0 ? 'Vencido' : `${30 - c.dias_atraso} días`}
                          </p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 text-right">
                          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Consumido</p>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">Q{c.total_consumido.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-700/50 mt-1">
                        <div>
                          <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Saldo Pendiente</p>
                          <p className="font-black text-[#8DA78E] text-sm">Q{c.saldo_pendiente.toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => setClienteSeleccionado(c)}
                          className="px-3 py-1.5 bg-[#8DA78E] hover:bg-[#7A937B] text-white font-bold rounded-lg transition-all active:scale-95 text-[10px] uppercase flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <Clock className="size-3" /> Historial
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* VISTA ESCRITORIO: Tabla */}
              <div className="hidden md:block overflow-x-auto w-full pb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-wider text-zinc-500">
                      <th className="px-5 py-3.5">Cliente</th>
                      <th className="px-5 py-3.5">Días Restantes</th>
                      <th className="px-5 py-3.5 text-right">Total Consumido</th>
                      <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                      <th className="px-5 py-3.5 text-center">Estado</th>
                      <th className="px-5 py-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {paginatedCreditos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-400 font-medium">No se encontraron créditos.</td>
                      </tr>
                    ) : (
                      paginatedCreditos.map((c) => (
                        <tr key={c.cliente_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">{c.nombre}</p>
                            <span className="text-[10px] text-zinc-500 border border-zinc-200 dark:border-zinc-700 rounded px-1 mt-0.5 inline-block">NIT: {c.nit}</span>
                          </td>
                          <td className={cn("px-5 py-3.5 font-mono font-semibold", c.estado === 'Solventado' ? 'text-emerald-600 dark:text-emerald-400' : 30 - c.dias_atraso < 0 ? 'text-rose-600 dark:text-rose-400' : 30 - c.dias_atraso <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-700 dark:text-zinc-300')}>
                            {c.estado === 'Solventado' ? 'Pagado' : 30 - c.dias_atraso < 0 ? 'Vencido' : `${30 - c.dias_atraso} días`}
                          </td>
                          <td className="px-5 py-3.5 text-right font-medium">Q{c.total_consumido.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-right font-black text-[#8DA78E]">Q{c.saldo_pendiente.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                              c.estado === "Atrasado" ? "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" :
                              c.estado === "Solventado" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                              "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            )}>
                              {c.estado === "Atrasado" ? "En Mora" : c.estado}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => setClienteSeleccionado(c)}
                              className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/20 text-[#8DA78E] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase flex items-center gap-1 mx-auto"
                            >
                              <Clock className="size-3" /> Historial de Pago
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading && creditosOrdenados.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center sm:justify-start justify-center gap-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <PageSizeSelect pageSize={pageSize} setPageSize={(s) => { setPageSize(s); setCurrentPage(1); }} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {clienteSeleccionado && (
            <CreditoDetalle
              cliente={clienteSeleccionado}
              onClose={() => setClienteSeleccionado(null)}
              onUpdate={loadData}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingBag,
  Calendar,
  ChevronRight,
  Download,
  TrendingUp,
  History,
  X,
  Eye,
  Clock,
  Receipt,
  ChevronDown,
  Check,
  User,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
import { CrearCliente } from "./forms/CrearCliente";
import { EditarCliente } from "./forms/EditarCliente";
import { formatPhoneDisplay, getWhatsappUrl } from "../proveedores/forms/ProveedorDetalle";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  nit: string;
  totalCompras: number;
  ultimaCompra: string;
  saldo: number;
  creditosPendientes?: number;
  activo: boolean;
}

// ─── Panel de detalle ──────────────────────────────────────────────────────────
function ClienteDetalle({
  cliente,
  onClose,
  onEdit,
  onHistorial,
}: {
  cliente: Cliente;
  onClose: () => void;
  onEdit: () => void;
  onHistorial: () => void;
}) {
  const [ventas, setVentas] = useState<any[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);

  useEffect(() => {
    async function loadVentas() {
      setLoadingVentas(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("ventas")
          .select("id, created_at, tipo_venta, total, observaciones, fin_transacciones(id, monto, fecha_movimiento, tipo_movimiento, categoria)")
          .eq("cliente_id", cliente.id)
          .order("created_at", { ascending: false });
        if (data) {
          setVentas(data);
        }
      } catch (err) {
        console.error("Error al cargar ventas de cliente:", err);
      } finally {
        setLoadingVentas(false);
      }
    }
    loadVentas();
  }, [cliente.id]);

  // Helper para obtener colores de SweetAlert según el tema activo (claro/oscuro)
  const getSwalThemeOpts = () => {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return {
      background: isDark ? "#18181b" : "#F5F5F1",
      color: isDark ? "#F5F5F1" : "#525D53",
      confirmButtonColor: "#8DA78E",
      cancelButtonColor: "#525D53",
      customClass: {
        popup: "!rounded-3xl border-0",
      }
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-[#F5F5F1] dark:bg-zinc-900/90 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-2xl p-5 flex flex-col gap-4 h-full overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 size-8 rounded-lg bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
            <Users className="size-4.5 text-[#8DA78E]" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-base leading-none">{cliente.nombre}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors text-lg font-bold px-2 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Datos de contacto */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Contacto</h4>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Mail className="size-4 text-[#8DA78E] shrink-0" />
          <span className="truncate">{cliente.email || "No registrado"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Phone className="size-4 text-[#8DA78E] shrink-0" />
          {cliente.telefono && cliente.telefono !== "No registrado" ? (
            <a
              href={getWhatsappUrl(cliente.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline font-bold inline-flex items-center gap-1"
            >
              {formatPhoneDisplay(cliente.telefono)}
            </a>
          ) : (
            <span className="truncate text-slate-400">No registrado</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <MapPin className="size-4 text-[#8DA78E] shrink-0" />
          <span className="truncate">{cliente.direccion || "No registrada"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <CreditCard className="size-4 text-[#8DA78E] shrink-0" />
          <span className="truncate">NIT: {cliente.nit || "C/F"}</span>
        </div>
      </div>

      {/* Estado Financiero */}
      <div className="space-y-3 pt-2 border-t border-[#C1D1C5]/20">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Estado Financiero</h4>
        {loadingVentas ? (
          <p className="text-xs text-slate-400">Cargando transacciones...</p>
        ) : (() => {
          const ventasPendientes = ventas.filter((v) => {
            if (v.tipo_venta !== "Crédito") return false;
            const abonos = v.fin_transacciones
              ? v.fin_transacciones
                  .filter((t: any) => t.categoria === "abono_cliente" || t.categoria === "venta")
                  .reduce((sum: number, t: any) => sum + Number(t.monto), 0)
              : 0;
            return (v.total || 0) - abonos > 0;
          });

          if (ventasPendientes.length === 0) {
            return (
              <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3">
                <div className="size-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">No tiene pagos pendientes</p>
              </div>
            );
          }

          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-start bg-[#8DA78E]/10 dark:bg-[#8DA78E]/5 border border-[#8DA78E]/20 dark:border-[#A3BEB0]/15 rounded-xl px-3 py-3">
                <span className="text-[10px] uppercase font-bold text-[#525D53] dark:text-[#A3BEB0]">Pendiente ({ventasPendientes.length} {ventasPendientes.length === 1 ? "crédito" : "créditos"})</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Estadísticas */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70 mb-2">Estadísticas</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: ShoppingBag, label: "Total Compras", value: cliente.totalCompras, color: "text-[#8DA78E] dark:text-[#A3BEB0]" },
            { icon: TrendingUp, label: "Pendiente", value: `${cliente.creditosPendientes || 0} créditos`, color: "text-rose-500" },
            { icon: Calendar, label: "Última Compra", value: cliente.ultimaCompra ? new Date(cliente.ultimaCompra).toLocaleDateString("es-GT") : "Sin compras", color: "text-[#8DA78E] dark:text-[#A3BEB0]" },
            { icon: Users, label: "Estado", value: cliente.activo ? "Activo" : "Inactivo", color: cliente.activo ? "text-[#8DA78E] dark:text-[#A3BEB0]" : "text-slate-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-[#525D53]/10 rounded-xl p-3 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`size-3.5 ${color}`} />
                <span className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <p className={`text-sm font-black ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-auto pt-3 border-t border-[#C1D1C5]/20 flex flex-col gap-2">
        <button
          onClick={onHistorial}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#525D53] to-[#3a4a3c] text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
        >
          <History className="size-4 group-hover:rotate-[-20deg] transition-transform duration-300" />
          Ver Historial de Compras
        </button>
        <button
          onClick={onEdit}
          className="w-full py-2 px-4 rounded-xl bg-[#8DA78E] text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          Editar Cliente
        </button>
      </div>
    </motion.div>
  );
}

// ─── Historial de Cliente (Modal completo) ──────────────────────────────────
function HistorialCliente({
  cliente,
  onClose,
}: {
  cliente: Cliente;
  onClose: () => void;
}) {
  const [ventas, setVentas] = useState<any[]>([]);
  const [detallesExpandidos, setDetallesExpandidos] = useState<Record<string, any[]>>({});
  const [expandido, setExpandido] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("ventas")
          .select("id, created_at, tipo_venta, total, observaciones, fin_transacciones(id, monto, fecha_movimiento, tipo_movimiento, categoria)")
          .eq("cliente_id", cliente.id)
          .order("created_at", { ascending: false });
        if (data) setVentas(data);
      } catch (err) {
        console.error("Error al cargar historial:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cliente.id]);

  const toggleDetalle = async (ventaId: string) => {
    if (expandido === ventaId) {
      setExpandido(null);
      return;
    }
    setExpandido(ventaId);
    if (!detallesExpandidos[ventaId]) {
      setLoadingDetalle(ventaId);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("detalle_ventas")
          .select("id, cantidad, precio_aplicado, subtotal, inv_productos(nombre, codigo)")
          .eq("venta_id", ventaId);
        if (data) {
          setDetallesExpandidos((prev) => ({ ...prev, [ventaId]: data }));
        }
      } catch (err) {
        console.error("Error al cargar detalle:", err);
      } finally {
        setLoadingDetalle(null);
      }
    }
  };

  let totalCancelado = 0;
  let totalPendiente = 0;
  let totalGeneral = 0;
  let ventasContado = 0;
  let ventasCredito = 0;

  ventas.forEach((v) => {
    const totalVenta = v.total || 0;
    totalGeneral += totalVenta;
    
    if (v.tipo_venta === "Contado") {
      totalCancelado += totalVenta;
      ventasContado++;
    } else {
      // Es crédito
      const abonos = v.fin_transacciones
        ? v.fin_transacciones
            .filter((t: any) => t.categoria === "abono_cliente" || t.categoria === "venta")
            .reduce((sum: number, t: any) => sum + Number(t.monto), 0)
        : 0;
      
      const saldoVenta = Math.max(0, totalVenta - abonos);
      totalCancelado += abonos;
      totalPendiente += saldoVenta;
      
      if (saldoVenta > 0) {
        ventasCredito++;
      } else {
        ventasContado++; // Si se pagó todo, cuenta como venta cancelada
      }
    }
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full h-full bg-[#F5F5F1] dark:bg-zinc-900 border border-[#C1D1C5]/40 dark:border-zinc-700 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-w-7xl mx-auto md:my-6 md:max-h-[calc(100vh-3rem)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-[#C1D1C5]/30 dark:border-zinc-800 bg-gradient-to-r from-[#525D53] to-[#3a4a3c] shrink-0">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <History className="size-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-none">
                  Historial de Compras
                </h2>
                <p className="text-sm text-white/70 mt-1">{cliente.nombre}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Contenido izquierdo (Resumen y Gráfica) */}
            <div className="w-full md:w-2/5 p-6 border-b md:border-b-0 md:border-r border-[#C1D1C5]/30 dark:border-zinc-800 flex flex-col overflow-y-auto bg-white/50 dark:bg-zinc-950/20">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#525D53] dark:text-[#A3BEB0] mb-4">Resumen General</h3>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="col-span-1 sm:col-span-2 bg-white dark:bg-zinc-800/60 rounded-2xl p-4 border border-[#C1D1C5]/30 dark:border-zinc-700 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[#525D53] dark:text-[#A3BEB0]/70 tracking-wider">Total General</span>
                  <p className="text-3xl font-black text-[#525D53] dark:text-white mt-1">Q{totalGeneral.toFixed(2)}</p>
                  <span className="text-xs font-medium text-[#525D53]/60 dark:text-[#A3BEB0]/50 mt-1 block">{ventas.length} transacciones</span>
                </div>
                <div className="bg-[#8DA78E]/10 dark:bg-[#8DA78E]/5 rounded-2xl p-4 border border-[#8DA78E]/20 dark:border-[#A3BEB0]/15">
                  <span className="text-[10px] uppercase font-bold text-[#525D53] dark:text-[#A3BEB0] tracking-wider">Cancelado</span>
                  <p className="text-xl font-black text-[#525D53] dark:text-[#A3BEB0] mt-1">Q{totalCancelado.toFixed(2)}</p>
                  <span className="text-[10px] font-medium text-[#525D53]/60 dark:text-[#A3BEB0]/50 mt-1 block">{ventas.filter((v) => v.tipo_venta !== "Crédito").length} ventas</span>
                </div>
                <div className="bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border border-rose-500/20 dark:border-rose-500/15">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">Pendiente</span>
                  <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">Q{totalPendiente.toFixed(2)}</p>
                  <span className="text-[10px] font-medium text-rose-600/60 dark:text-rose-400/60 mt-1 block">{ventas.filter((v) => v.tipo_venta === "Crédito").length} créditos</span>
                </div>
              </div>

              {/* Gráfica */}
              <h3 className="text-xs font-black uppercase tracking-widest text-[#525D53] dark:text-[#A3BEB0] mb-4">Tendencia de Compras</h3>
              <div className="flex-1 min-h-[200px] w-full bg-white dark:bg-zinc-800/60 rounded-2xl border border-[#C1D1C5]/30 dark:border-zinc-700 p-4">
                {(() => {
                  if (ventas.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                        Sin datos suficientes
                      </div>
                    );
                  }
                  
                  // Agrupar por mes
                  const datosMes = ventas.reduce((acc, v) => {
                    const mesStr = format(new Date(v.created_at), "MMM yyyy", { locale: es });
                    acc[mesStr] = (acc[mesStr] || 0) + v.total;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  // Convertir a array y tomar los últimos 6 meses (orden cronológico)
                  const chartData = Object.entries(datosMes)
                    .map(([name, total]) => ({ name, total }))
                    .reverse()
                    .slice(0, 6)
                    .reverse();

                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#8DA78E" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#8DA78E" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `Q${val}`} width={50} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(141, 167, 142, 0.1)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value: any) => [`Q${Number(value || 0).toFixed(2)}`, 'Total']}
                        />
                        <Bar dataKey="total" fill="#8DA78E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>

            {/* Lista derecha (Desglose) */}
            <div className="w-full md:w-3/5 flex flex-col h-full">
              <div className="px-6 py-4 border-b border-[#C1D1C5]/30 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#525D53] dark:text-[#A3BEB0]">Desglose de Transacciones</h3>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-white dark:bg-zinc-900/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="size-8 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
                <span className="text-xs font-bold text-slate-400">Cargando historial...</span>
              </div>
            ) : ventas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Receipt className="size-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-400 font-medium">Sin compras registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ventas.map((venta, idx) => {
                  const abonos = venta.fin_transacciones
                    ? venta.fin_transacciones
                        .filter((t: any) => t.categoria === "abono_cliente" || t.categoria === "venta")
                        .reduce((sum: number, t: any) => sum + Number(t.monto), 0)
                    : 0;
                  const saldoVenta = Math.max(0, (venta.total || 0) - abonos);
                  const isPaid = venta.tipo_venta !== "Crédito" || saldoVenta <= 0;
                  
                  const date = new Date(venta.created_at);
                  const dateStr = date.toLocaleDateString("es-GT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("es-GT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isOpen = expandido === venta.id;
                  const detalles = detallesExpandidos[venta.id];

                  return (
                    <motion.div
                      key={venta.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white dark:bg-zinc-800/50 rounded-xl border border-[#C1D1C5]/30 dark:border-zinc-700/50 overflow-hidden"
                    >
                      {/* Row header */}
                      <button
                        onClick={() => toggleDetalle(venta.id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#8DA78E]/5 dark:hover:bg-[#A3BEB0]/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg flex items-center justify-center shrink-0 bg-[#8DA78E]/10 dark:bg-[#8DA78E]/10">
                            <Receipt className="size-4 text-[#8DA78E] dark:text-[#A3BEB0]" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-800 dark:text-white">
                              Recibo #{venta.id.substring(0, 6).toUpperCase()}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock className="size-3 text-slate-400" />
                              <span className="text-[10px] text-slate-400">{dateStr} — {timeStr}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 dark:text-white">
                              Q{venta.tipo_venta === "Crédito" ? saldoVenta.toFixed(2) : venta.total.toFixed(2)}
                            </p>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider",
                              isPaid ? "text-[#8DA78E] dark:text-[#A3BEB0]" : "text-rose-500"
                            )}>
                              {isPaid 
                                ? (venta.tipo_venta === "Crédito" ? "Crédito Pagado" : venta.tipo_venta) 
                                : "Crédito Pendiente"}
                            </span>
                          </div>
                          <ChevronDown className={cn(
                            "size-4 text-slate-400 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )} />
                        </div>
                      </button>

                      {/* Expandable detail */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 border-t border-slate-100 dark:border-zinc-700/50">
                              {loadingDetalle === venta.id ? (
                                <div className="flex items-center gap-2 py-3">
                                  <div className="size-4 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
                                  <span className="text-[10px] text-slate-400">Cargando productos...</span>
                                </div>
                              ) : (
                                <div className="pt-2 space-y-1.5">
                                  {detalles && detalles.length > 0 ? (
                                    <>
                                      {detalles.map((d: any) => (
                                        <div key={d.id} className="flex items-center justify-between text-[11px] py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-zinc-900/50">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                              {d.cantidad}x
                                            </span>
                                            <div>
                                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                                {d.inv_productos?.nombre || "Producto eliminado"}
                                              </span>
                                              {d.inv_productos?.codigo && (
                                                <span className="text-[9px] text-slate-400 ml-1.5">({d.inv_productos.codigo})</span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="font-black text-slate-800 dark:text-white">Q{d.subtotal.toFixed(2)}</span>
                                            <span className="text-[9px] text-slate-400 ml-1">(Q{d.precio_aplicado.toFixed(2)} c/u)</span>
                                          </div>
                                        </div>
                                      ))}
                                      {venta.observaciones && (
                                        <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100 dark:border-zinc-800 mt-1">
                                          Nota: {venta.observaciones}
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <p className="text-[10px] text-slate-400 py-1 italic">Sin detalles disponibles.</p>
                                  )}

                                  {venta.tipo_venta === "Crédito" && (
                                    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-zinc-700/50">
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Abonos</p>
                                      {venta.fin_transacciones?.filter((t:any) => t.categoria === "abono_cliente").length > 0 ? (
                                        <div className="space-y-1">
                                          {venta.fin_transacciones
                                            .filter((t:any) => t.categoria === "abono_cliente")
                                            .map((abono: any) => (
                                              <div key={abono.id} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100/50 dark:border-zinc-800/50 last:border-0">
                                                <span className="text-slate-500 dark:text-slate-400">
                                                  {new Date(abono.fecha_movimiento).toLocaleDateString("es-GT")} - {new Date(abono.fecha_movimiento).toLocaleTimeString("es-GT", { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="font-bold text-[#8DA78E]">+ Q{Number(abono.monto).toFixed(2)}</span>
                                              </div>
                                            ))}
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-slate-400 italic">No se han registrado abonos.</p>
                                      )}
                                      
                                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-zinc-700">
                                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Saldo Pendiente:</span>
                                        <span className="text-[11px] font-black text-rose-500">
                                          Q{Math.max(0, (venta.total || 0) - (venta.fin_transacciones?.filter((t:any) => t.categoria === "abono_cliente" || t.categoria === "venta").reduce((sum:number, t:any) => sum + Number(t.monto), 0) || 0)).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#C1D1C5]/30 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <button
              onClick={onClose}
              className="w-full md:w-auto md:ml-auto py-3 px-8 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Cerrar Historial
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function VerClientes() {
  const [busqueda, setBusqueda] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  // Estados de Base de Datos Real
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [historialCliente, setHistorialCliente] = useState<Cliente | null>(null);
  
  // Criterio de Orden
  const [criterioOrden, setCriterioOrden] = useState<"nombre-asc" | "nombre-desc" | "compras-desc" | "saldo-asc" | "saldo-desc">("nombre-asc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper para obtener colores de SweetAlert según el tema activo (claro/oscuro)
  const getSwalThemeOpts = () => {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return {
      background: isDark ? "#18181b" : "#F5F5F1",
      color: isDark ? "#F5F5F1" : "#525D53",
      confirmButtonColor: "#8DA78E",
      cancelButtonColor: "#525D53",
      customClass: {
        popup: "!rounded-3xl border-0",
      }
    };
  };

  // Función para cargar los clientes reales desde Supabase
  const loadDbClientes = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // 1. Obtener todos los clientes
      const { data: clientesData, error: cliError } = await supabase
        .from("ven_clientes")
        .select("*")
        .order("nombre", { ascending: true });

      if (cliError) throw cliError;

      // 2. Obtener todas las ventas para calcular estadísticas de consumo y saldos
      const { data: ventasData, error: ventasError } = await supabase
        .from("ventas")
        .select("id, cliente_id, total, tipo_venta, created_at")
        .not("cliente_id", "is", null);

      if (ventasError) throw ventasError;

      // Obtener cuentas por cobrar reales para saber cuántos créditos pendientes tiene cada cliente
      const { data: cuentasPendientes } = await supabase.rpc("fin_cuentas_por_cobrar");

      const clientSalesMap = new Map<string, any[]>();
      if (ventasData) {
        ventasData.forEach((v) => {
          if (v.cliente_id) {
            const list = clientSalesMap.get(v.cliente_id) || [];
            list.push(v);
            clientSalesMap.set(v.cliente_id, list);
          }
        });
      }

      if (clientesData) {
        const mapped: Cliente[] = clientesData.map((row: any) => {
          const clientSales = clientSalesMap.get(row.id) || [];
          const totalCompras = clientSales.length;

          let ultimaCompra = "";
          if (totalCompras > 0) {
            const sorted = [...clientSales].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            ultimaCompra = sorted[0].created_at;
          }

          // Contar cuántos créditos pendientes tiene este cliente según el RPC
          const creditosPendientes = cuentasPendientes 
            ? cuentasPendientes.filter((c: any) => c.cliente_id === row.id).length
            : 0;

          return {
            id: row.id,
            nombre: row.nombre || "Cliente sin nombre",
            email: row.email || "No registrado",
            telefono: row.telefono || "No registrado",
            direccion: row.direccion || "No registrada",
            nit: row.nit || "C/F",
            totalCompras,
            ultimaCompra,
            saldo: 0, // ya no se usa como dinero, pero lo dejamos por compatibilidad o lo cambiamos
            creditosPendientes,
            activo: true,
          };
        });

        setClientes(mapped);
        setClienteSeleccionado((prev) => {
          if (!prev) return null;
          const fresh = mapped.find((c) => c.id === prev.id);
          return fresh || null;
        });
      }
    } catch (err: any) {
      console.error("Error en loadDbClientes:", err);
      Swal.fire({
        title: "Error de Conexión",
        text: "No se pudieron obtener los clientes desde Supabase: " + err.message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        ...getSwalThemeOpts()
      });
      setClientes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar al montar la página
  useEffect(() => {
    loadDbClientes();
  }, []);

  // Filtrado de clientes por término de búsqueda
  const clientesFiltrados = clientes.filter((c) => {
    return (
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono.includes(busqueda) ||
      c.nit.includes(busqueda)
    );
  });

  // Ordenamiento de Clientes
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (criterioOrden === "nombre-asc") {
      return a.nombre.localeCompare(b.nombre);
    } else if (criterioOrden === "nombre-desc") {
      return b.nombre.localeCompare(a.nombre);
    } else if (criterioOrden === "compras-desc") {
      return b.totalCompras - a.totalCompras;
    } else if (criterioOrden === "saldo-asc") {
      return a.saldo - b.saldo;
    } else if (criterioOrden === "saldo-desc") {
      return b.saldo - a.saldo;
    }
    return 0;
  });

  // Paginación logic
  const totalPages = Math.ceil(clientesOrdenados.length / pageSize) || 1;
  const paginatedClientes = clientesOrdenados.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Función para agregar nuevo cliente interactivo
  const handleNuevoCliente = () => {
    setIsCreateOpen(true);
  };

  // Función para exportar PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Reporte General de Clientes", 14, 15);
      
      const tableData = clientesOrdenados.map((c) => [
        c.nombre,
        c.telefono,
        c.email,
        c.nit,
        c.totalCompras.toString(),
        `Q${c.saldo.toFixed(2)}`
      ]);
      
      autoTable(doc, {
        head: [["Nombre", "Teléfono", "Email", "NIT", "Compras", "Saldo Pendiente"]],
        body: tableData,
        startY: 22,
        theme: "striped",
        headStyles: {
          fillColor: [141, 167, 142], // #8DA78E (Salvia Menta)
          textColor: [245, 245, 241], // #F5F5F1 (Blanco Hueso)
          fontStyle: "bold",
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [245, 245, 241] // #F5F5F1 (Blanco Hueso)
        },
        margin: { top: 40 },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      // Descargar PDF
      doc.save(`Reporte_Clientes_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      Swal.fire({
        title: "¡PDF Exportado!",
        text: "El reporte de clientes se ha descargado exitosamente.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });
    } catch (error: any) {
      console.error("Error al exportar PDF:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo generar el archivo PDF: " + error.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 pt-32 md:pt-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-4">
          <div className="shrink-0 size-12 rounded-2xl bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center overflow-hidden">
            <AnimatedIcon iconKey="zdwrqfmb" className="text-[#8DA78E] dark:text-[#A3BEB0]" size={32} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Módulo</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
              Clientes
            </h1>
          </div>
        </div>

        {/* Botón Nuevo Cliente */}
        <button
          onClick={handleNuevoCliente}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#8DA78E] text-[#F5F5F1] text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="size-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Buscador, Ordenamiento y Exportar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono o NIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-zinc-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 focus:border-[#8DA78E] transition-all"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Select 
            value={criterioOrden} 
            onValueChange={(val) => setCriterioOrden(val as any)}
          >
            <SelectTrigger className="w-[280px] h-10 rounded-xl bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-white focus:ring-1 focus:ring-[#8DA78E] shadow-sm">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-950 shadow-md">
              <SelectItem value="nombre-asc" className="text-xs font-semibold cursor-pointer">Nombre (A-Z)</SelectItem>
              <SelectItem value="nombre-desc" className="text-xs font-semibold cursor-pointer">Nombre (Z-A)</SelectItem>
              <SelectItem value="compras-desc" className="text-xs font-semibold cursor-pointer">Nivel de Consumo (Compras)</SelectItem>
              <SelectItem value="saldo-asc" className="text-xs font-semibold cursor-pointer">Saldo Pendiente (Menor a Mayor)</SelectItem>
              <SelectItem value="saldo-desc" className="text-xs font-semibold cursor-pointer">Saldo Pendiente (Mayor a Menor)</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleExportarPDF}
            className="px-4 py-2.5 rounded-xl border border-[#C1D1C5] dark:border-[#A3BEB0]/30 text-[#525D53] dark:text-[#A3BEB0] hover:bg-[#C1D1C5]/10 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Download className="size-3.5" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Grid de clientes + detalle */}
      <div className="flex gap-4 relative w-full overflow-x-hidden p-1">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Cargando base de datos...</span>
            </div>
          </div>
        )}

        {/* Contenedor principal de tarjetas/tabla y paginación */}
        <div className="flex flex-col flex-1 min-w-0 gap-4">
          {/* Vista Mobile: Tarjetas */}
          <div className="md:hidden flex flex-col gap-3 px-1 py-1 w-full">
          {paginatedClientes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold text-sm bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
              No se encontraron clientes.
            </div>
          ) : (
            paginatedClientes.map((cliente) => (
              <motion.div
                key={cliente.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={cn(
                  "relative border rounded-xl p-3 flex gap-3 items-center min-h-[96px] transition-all bg-white dark:bg-[#525D53]/10 border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 hover:border-[#8DA78E] dark:hover:border-[#A3BEB0]/60"
                )}
              >
                {/* Icon Left */}
                <div className="shrink-0 size-10 rounded-xl flex items-center justify-center border bg-[#8DA78E]/10 border-[#8DA78E]/20 text-[#8DA78E] dark:text-[#A3BEB0]">
                  <User className="size-5" />
                </div>

                {/* Content Right */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="font-black text-xs text-slate-900 dark:text-white truncate uppercase leading-tight">
                        {cliente.nombre}
                      </h3>
                      <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-zinc-850 text-slate-500 rounded-full shrink-0 leading-none">
                        NIT: {cliente.nit || "C/F"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-[10px]">
                      {cliente.telefono && cliente.telefono !== "No registrado" && (
                        <a
                          href={getWhatsappUrl(cliente.telefono)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline font-bold"
                        >
                          <Phone className="size-3" /> {formatPhoneDisplay(cliente.telefono)}
                        </a>
                      )}
                      {cliente.email && cliente.email !== "No registrado" && (
                        <span className="text-slate-400 dark:text-slate-500 truncate flex items-center gap-0.5">
                          <Mail className="size-3 shrink-0" /> {cliente.email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats & Action Buttons */}
                  <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
                    <div className="flex gap-2.5 text-[9px] leading-none">
                      <div>
                        <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Compras:</span>
                        <span className="font-bold ml-0.5 text-zinc-700 dark:text-zinc-200 tabular-nums">
                          {cliente.totalCompras}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#525D53]/60 dark:text-[#A3BEB0]/50 font-bold uppercase">Saldo:</span>
                        <span className="font-black ml-0.5 text-[#8DA78E] dark:text-[#A3BEB0] tabular-nums tracking-tight">
                          Q{cliente.saldo.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setHistorialCliente(cliente)}
                        className="px-2 py-1 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/20 text-[#8DA78E] dark:text-[#A3BEB0] text-[9px] font-bold rounded-md transition-all cursor-pointer uppercase"
                      >
                        Historial
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClienteParaEditar(cliente);
                          setIsEditOpen(true);
                        }}
                        className="px-2 py-1 bg-[#A3BEB0]/20 hover:bg-[#A3BEB0]/40 text-[#525D53] dark:text-[#A3BEB0] text-[9px] font-bold rounded-md transition-all cursor-pointer uppercase"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Vista Desktop: Tabla */}
        <div className="hidden md:block flex-1 bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#C1D1C5]/30 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3.5 text-center w-12">#</th>
                  <th className="px-5 py-3.5">Nombre Completo</th>
                  <th className="px-5 py-3.5">Teléfono</th>
                  <th className="px-5 py-3.5">Correo Electrónico</th>
                  <th className="px-5 py-3.5">NIT</th>
                  <th className="px-5 py-3.5 text-right">Compras</th>
                  <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                  <th className="px-5 py-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C1D1C5]/15 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
                {paginatedClientes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : (
                  paginatedClientes.map((cliente, index) => (
                    <tr
                      key={cliente.id}
                      onClick={() => {
                        const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
                        if (!isMobile) {
                          setClienteSeleccionado(clienteSeleccionado?.id === cliente.id ? null : cliente);
                        }
                      }}
                      className={cn(
                        "hover:bg-[#8DA78E]/10 dark:hover:bg-[#A3BEB0]/15 transition-all cursor-pointer",
                        clienteSeleccionado?.id === cliente.id && "bg-[#8DA78E]/20 dark:bg-[#8DA78E]/25"
                      )}
                    >
                      <td className="px-5 py-3.5 text-center font-bold text-slate-400 dark:text-slate-500">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {cliente.nombre}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {cliente.telefono && cliente.telefono !== "No registrado" ? (
                          <a
                            href={getWhatsappUrl(cliente.telefono)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline font-bold"
                          >
                            <Phone className="size-3" /> {formatPhoneDisplay(cliente.telefono)}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{cliente.email}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{cliente.nit}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {cliente.totalCompras}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-[#8DA78E] dark:text-[#A3BEB0]">
                        Q{cliente.saldo.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setClienteParaEditar(cliente);
                              setIsEditOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#A3BEB0]/20 hover:bg-[#A3BEB0]/40 text-[#525D53] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {!isLoading && clientesOrdenados.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 px-2.5 md:px-0 text-slate-600 dark:text-slate-400">
            <PageSizeSelect
              pageSize={pageSize}
              setPageSize={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
            <div className="flex justify-start sm:justify-center w-full sm:w-auto">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        )}
        </div>

        {/* Panel de detalle */}
        <AnimatePresence>
          {clienteSeleccionado && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block absolute top-0 right-0 h-full w-[450px] z-20 shadow-2xl"
            >
              <div className="h-full">
                <ClienteDetalle
                  cliente={clienteSeleccionado}
                  onClose={() => setClienteSeleccionado(null)}
                  onEdit={() => {
                    setClienteParaEditar(clienteSeleccionado);
                    setIsEditOpen(true);
                  }}
                  onHistorial={() => setHistorialCliente(clienteSeleccionado)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CrearCliente
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadDbClientes}
      />

      <EditarCliente
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setClienteParaEditar(null);
        }}
        onSuccess={loadDbClientes}
        cliente={clienteParaEditar}
      />

      {/* Modal de Historial */}
      <AnimatePresence>
        {historialCliente && (
          <HistorialCliente
            cliente={historialCliente}
            onClose={() => setHistorialCliente(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

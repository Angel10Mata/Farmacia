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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  activo: boolean;
}

// ─── Panel de detalle ──────────────────────────────────────────────────────────
function ClienteDetalle({
  cliente,
  onClose,
  onEdit,
}: {
  cliente: Cliente;
  onClose: () => void;
  onEdit: () => void;
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
          .select("id, created_at, tipo_venta, total, observaciones")
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
        ) : ventas.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Sin transacciones registradas.</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-2.5">
                <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Cancelado (Total)</span>
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  Q{ventas
                    .filter((v) => v.tipo_venta !== "Crédito")
                    .reduce((sum, v) => sum + (v.total || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 rounded-xl p-2.5">
                <span className="text-[9px] uppercase font-bold text-amber-700 dark:text-amber-400">Pendiente (Total)</span>
                <p className="text-xs font-black text-amber-800 dark:text-amber-300">
                  Q{ventas
                    .filter((v) => v.tipo_venta === "Crédito")
                    .reduce((sum, v) => sum + (v.total || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
              <div className="max-h-[160px] overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800">
                {ventas.map((v) => {
                  const isPaid = v.tipo_venta !== "Crédito";
                  const dateStr = new Date(v.created_at).toLocaleDateString("es-GT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });
                  return (
                    <div key={v.id} className="p-2 flex items-center justify-between text-[11px] hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Recibo #{v.id.substring(0, 6).toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-400">{dateStr} ({v.tipo_venta})</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="font-black text-slate-900 dark:text-white">Q{v.total.toFixed(2)}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${
                          isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {isPaid ? "Cancelado" : "Pendiente"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70 mb-2">Estadísticas</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: ShoppingBag, label: "Total Compras", value: cliente.totalCompras, color: "text-[#8DA78E] dark:text-[#A3BEB0]" },
            { icon: TrendingUp, label: "Saldo Actual", value: `Q${cliente.saldo.toFixed(2)}`, color: "text-[#8DA78E] dark:text-[#A3BEB0]" },
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
          onClick={onEdit}
          className="w-full py-2 px-4 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          Editar Cliente
        </button>
      </div>
    </motion.div>
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
  
  // Criterio de Orden
  const [criterioOrden, setCriterioOrden] = useState<"nombre-asc" | "nombre-desc" | "compras-desc" | "saldo-asc" | "saldo-desc">("nombre-asc");

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

          const saldo = clientSales
            .filter((v) => v.tipo_venta === "Crédito")
            .reduce((sum, v) => sum + (v.total || 0), 0);

          return {
            id: row.id,
            nombre: row.nombre || "Cliente sin nombre",
            email: row.email || "No registrado",
            telefono: row.telefono || "No registrado",
            direccion: row.direccion || "No registrada",
            nit: row.nit || "C/F",
            totalCompras,
            ultimaCompra,
            saldo,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0 size-12 rounded-2xl bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
            <Users className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Módulo</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
              Clientes
            </h1>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center flex-wrap gap-3 sm:ml-auto">
          {/* Botón Nuevo Cliente */}
          <button
            onClick={handleNuevoCliente}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="size-4" /> Nuevo Cliente
          </button>
        </div>
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
          <select
            value={criterioOrden}
            onChange={(e) => setCriterioOrden(e.target.value as any)}
            className="px-3 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors cursor-pointer"
          >
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
            <option value="compras-desc">Nivel de Consumo (Compras)</option>
            <option value="saldo-asc">Saldo Pendiente (Menor a Mayor)</option>
            <option value="saldo-desc">Saldo Pendiente (Mayor a Menor)</option>
          </select>
          <button
            onClick={handleExportarPDF}
            className="px-4 py-2.5 rounded-xl border border-[#C1D1C5] dark:border-[#A3BEB0]/30 text-[#525D53] dark:text-[#A3BEB0] hover:bg-[#C1D1C5]/10 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Download className="size-3.5" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Grid de clientes + detalle */}
      <div className="flex gap-4 flex-1 relative min-h-[550px] overflow-x-hidden p-1">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Cargando base de datos...</span>
            </div>
          </div>
        )}

        {/* Tabla principal */}
        <div className="flex-1 min-w-0 bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-4 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#C1D1C5]/30 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                {clientesOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : (
                  clientesOrdenados.map((cliente) => (
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
    </div>
  );
}

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

// ─── Datos de ejemplo ─────────────────────────────────────────────────────────
const CLIENTES_EJEMPLO: Cliente[] = [
  {
    id: "1",
    nombre: "María García López",
    email: "maria.garcia@email.com",
    telefono: "5555-1234",
    direccion: "Zona 10, Ciudad de Guatemala",
    nit: "1234567-8",
    totalCompras: 15,
    ultimaCompra: "2026-06-20",
    saldo: 250.00,
    activo: true,
  },
  {
    id: "2",
    nombre: "Carlos Mendoza Ruiz",
    email: "carlos.m@gmail.com",
    telefono: "4444-5678",
    direccion: "Zona 5, Ciudad de Guatemala",
    nit: "9876543-2",
    totalCompras: 8,
    ultimaCompra: "2026-06-18",
    saldo: 0,
    activo: true,
  },
  {
    id: "3",
    nombre: "Ana Sofía Pérez",
    email: "ana.perez@hotmail.com",
    telefono: "3333-9012",
    direccion: "Mixco, Guatemala",
    nit: "5555444-1",
    totalCompras: 2,
    ultimaCompra: "2026-06-22",
    saldo: 50.00,
    activo: true,
  },
  {
    id: "4",
    nombre: "Roberto Cifuentes",
    email: "roberto.c@empresa.com",
    telefono: "2222-3456",
    direccion: "Villa Nueva, Guatemala",
    nit: "3333222-5",
    totalCompras: 25,
    ultimaCompra: "2026-06-15",
    saldo: 750.00,
    activo: true,
  },
  {
    id: "5",
    nombre: "Lucía Hernández",
    email: "lucia.hdz@gmail.com",
    telefono: "7777-8901",
    direccion: "Zona 12, Ciudad de Guatemala",
    nit: "7777666-3",
    totalCompras: 5,
    ultimaCompra: "2026-06-10",
    saldo: 0,
    activo: false,
  },
];

// ─── Tarjeta de cliente ────────────────────────────────────────────────────────
function ClienteCard({
  cliente,
  onClick,
  onEdit,
}: {
  cliente: Cliente;
  onClick: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative bg-[#F5F5F1] dark:bg-[#525D53]/10 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-2xl p-4 cursor-pointer transition-shadow hover:shadow-md hover:shadow-black/5 hover:border-[#8DA78E] dark:hover:border-[#A3BEB0]/60"
    >
      {/* Status dot */}
      <div className={`absolute top-4 right-4 size-2 rounded-full ${cliente.activo ? "bg-[#8DA78E]" : "bg-slate-400"}`} />

      <div className="flex items-start">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-none">
              {cliente.nombre}
            </h3>
          </div>
          <p className="text-[11px] text-[#525D53] dark:text-[#A3BEB0] mt-1 flex items-center gap-1 truncate">
            <Mail className="size-3 shrink-0 text-[#8DA78E]" />
            {cliente.email}
          </p>
          <p className="text-[11px] text-[#525D53] dark:text-[#A3BEB0] mt-0.5 flex items-center gap-1">
            <Phone className="size-3 shrink-0 text-[#8DA78E]" />
            {cliente.telefono}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 uppercase tracking-wide font-semibold">Compras</p>
          <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{cliente.totalCompras}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 uppercase tracking-wide font-semibold">Saldo</p>
          <p className="text-sm font-black text-[#8DA78E] dark:text-[#A3BEB0] mt-0.5">
            Q{cliente.saldo.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 uppercase tracking-wide font-semibold">Última</p>
          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
            {cliente.ultimaCompra ? (
              new Date(cliente.ultimaCompra).toLocaleDateString("es-GT", { day: "2-digit", month: "short" })
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Mobile Actions: only visible on mobile (md:hidden) */}
      <div className="flex md:hidden items-center justify-end mt-3 pt-2 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="px-3 py-1.5 rounded-lg bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-[11px] font-bold transition-all shadow-xs"
        >
          Editar
        </button>
      </div>

      {/* Desktop Actions: only visible on desktop (md:flex) */}
      <div className="hidden md:flex mt-2 items-center justify-end gap-1 text-[10px] font-bold text-[#8DA78E] dark:text-[#A3BEB0] uppercase tracking-wide group-hover:gap-2 transition-all">
        Ver detalle <ChevronRight className="size-3" />
      </div>
    </motion.div>
  );
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
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-[#F5F5F1] dark:bg-zinc-900/90 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-2xl p-5 flex flex-col gap-4 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-br from-[#C1D1C5] to-[#8DA78E] flex items-center justify-center text-white font-black shadow-sm">
            {cliente.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-base leading-none">{cliente.nombre}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors text-lg font-bold px-2"
        >
          ✕
        </button>
      </div>

      {/* Datos de contacto */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Contacto</h4>
        {[
          { icon: Mail, label: cliente.email },
          { icon: Phone, label: cliente.telefono },
          { icon: MapPin, label: cliente.direccion },
          { icon: CreditCard, label: `NIT: ${cliente.nit}` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Icon className="size-4 text-[#8DA78E] shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        ))}
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
      <div className="mt-auto space-y-2">
        <button
          onClick={onEdit}
          className="w-full py-2.5 px-4 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
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
      const { data, error } = await supabase
        .from("ven_clientes")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar clientes desde Supabase:", error);
        Swal.fire({
          title: "Error de Conexión",
          text: "No se pudieron obtener los clientes desde Supabase: " + error.message,
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          ...getSwalThemeOpts()
        });
        setClientes([]);
      } else if (data) {
        // Mapear datos de BD a la interfaz del frontend
        const mapped: Cliente[] = data.map((row: any) => {
          return {
            id: row.id,
            nombre: row.nombre || "Cliente sin nombre",
            email: row.email || "No registrado",
            telefono: row.telefono || "No registrado",
            direccion: row.direccion || "No registrada",
            nit: row.nit || "C/F",
            totalCompras: 0,
            ultimaCompra: "",
            saldo: 0,
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

  // Función para agregar nuevo cliente interactivo
  const handleNuevoCliente = () => {
    setIsCreateOpen(true);
  };

  // Función para poblar la BD de Supabase con datos semilla
  const handleSeedData = async () => {
    const result = await Swal.fire({
      title: "¿Generar clientes de ejemplo?",
      text: "Esto insertará 5 clientes ficticios preconfigurados en la base de datos de Supabase.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, generar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const rows = CLIENTES_EJEMPLO.map(c => ({
        nombre: c.nombre,
        email: c.email,
        telefono: c.telefono,
        direccion: c.direccion,
        nit: c.nit
      }));
      const { error } = await supabase.from("ven_clientes").insert(rows);

      if (error) {
        throw new Error(error.message);
      }

      Swal.fire({
        title: "¡Datos Generados!",
        text: "Se han insertado los clientes de prueba en Supabase.",
        icon: "success",
        ...getSwalThemeOpts()
      });
      await loadDbClientes();
    } catch (err: any) {
      Swal.fire({
        title: "Error al generar datos",
        text: err.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para vaciar por completo la tabla de Supabase (ven_clientes)
  const handleClearDb = async () => {
    const result = await Swal.fire({
      title: "¿Estás seguro de vaciar la tabla?",
      text: "Esto eliminará permanentemente todos los registros de clientes de la base de datos de Supabase.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, vaciar tabla",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("ven_clientes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) {
        throw new Error(error.message);
      }

      Swal.fire({
        title: "Tabla vaciada",
        text: "Todos los registros de clientes han sido eliminados de Supabase.",
        icon: "success",
        ...getSwalThemeOpts()
      });
      await loadDbClientes();
    } catch (err: any) {
      Swal.fire({
        title: "Error al vaciar",
        text: err.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para exportar la lista de clientes a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Encabezado del PDF
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(82, 93, 83); // #525D53 (Olivo Oscuro)
      doc.text("KORE BMS - REPORTE DE CLIENTES", 14, 20);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const fecha = new Date().toLocaleDateString("es-GT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      doc.text(`Fecha de generación: ${fecha}`, 14, 27);
      doc.text(`Total de clientes: ${clientesFiltrados.length}`, 14, 33);
      
      // Línea divisoria
      doc.setDrawColor(193, 209, 197); // #C1D1C5
      doc.line(14, 38, 196, 38);
      
      // Generar tabla
      autoTable(doc, {
        startY: 42,
        head: [["Nombre", "NIT", "Teléfono", "Email", "Dirección"]],
        body: clientesFiltrados.map((c) => [
          c.nombre,
          c.nit || "C/F",
          c.telefono || "No registrado",
          c.email || "No registrado",
          c.direccion || "No registrada"
        ]),
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-sm font-bold transition-all shadow-sm"
          >
            <Plus className="size-4" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Buscador y Exportar */}
      <div className="flex gap-3">
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
        <button
          onClick={handleExportarPDF}
          className="px-4 py-2.5 rounded-xl border border-[#C1D1C5] dark:border-[#A3BEB0]/30 text-[#525D53] dark:text-[#A3BEB0] hover:bg-[#C1D1C5]/10 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
        >
          <Download className="size-3.5" /> Exportar PDF
        </button>
      </div>

      {/* Grid de clientes + detalle */}
      <div className="flex gap-4 flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Cargando base de datos...</span>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
          <AnimatePresence mode="popLayout">
            {clientesFiltrados.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full w-full flex flex-col items-center justify-center py-16 text-center bg-white/40 dark:bg-zinc-900/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl"
              >
                <Users className="size-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No se encontraron clientes</p>
                
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-normal">
                  Intenta registrar un nuevo cliente o ajustar tus filtros de búsqueda.
                </p>
              </motion.div>
            ) : (
              clientesFiltrados.map((cliente) => (
                <ClienteCard
                  key={cliente.id}
                  cliente={cliente}
                  onClick={() => {
                    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
                    if (!isMobile) {
                      setClienteSeleccionado(clienteSeleccionado?.id === cliente.id ? null : cliente);
                    }
                  }}
                  onEdit={() => {
                    setClienteParaEditar(cliente);
                    setIsEditOpen(true);
                  }}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Panel de detalle */}
        <AnimatePresence>
          {clienteSeleccionado && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block absolute top-0 right-0 h-full w-80 z-20 shadow-2xl"
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

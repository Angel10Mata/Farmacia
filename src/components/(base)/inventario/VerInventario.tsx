"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Truck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { CrearProducto } from "./forms/CrearProducto";
import { EditarProducto } from "./forms/EditarProducto";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at?: string;
  proveedor_id?: string | null;
  inv_proveedores?: {
    nombre: string;
  } | null;
  inv_compras_detalles?: {
    inv_compras?: {
      inv_proveedores?: {
        nombre: string;
      } | null;
    } | null;
  }[];
}



// ─── Tarjeta de producto ─────────────────────────────────────────────────────
function ProductoCard({
  producto,
  onClick,
  onEdit,
  onDelete,
}: {
  producto: Producto;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isLowStock = producto.stock_actual <= producto.stock_minimo;
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
      <div className={`absolute top-4 right-4 size-2 rounded-full ${producto.activo ? "bg-[#8DA78E]" : "bg-slate-400"}`} />

      <div className="flex items-start">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-none">
              {producto.nombre}
            </h3>
          </div>
          <p className="text-[10px] font-mono text-[#525D53] dark:text-[#A3BEB0] mt-1.5 uppercase tracking-wide">
            Cód: {producto.codigo || "SIN CÓDIGO"}
          </p>
          {(producto.inv_proveedores?.nombre || producto.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre) && (
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase flex items-center gap-1">
              <Truck className="size-3 text-[#8DA78E] dark:text-[#A3BEB0]" /> {producto.inv_proveedores?.nombre || producto.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 uppercase tracking-wide font-semibold">Existencias</p>
          <p className={`text-sm font-black mt-0.5 ${isLowStock ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white"}`}>
            {producto.stock_actual}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 uppercase tracking-wide font-semibold">Precio</p>
          <p className="text-sm font-black text-[#8DA78E] dark:text-[#A3BEB0] mt-0.5">
            Q{producto.precio_base.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#525D53] dark:text-[#A3BEB0]/70 uppercase tracking-wide font-semibold">Estado</p>
          <p className={`text-[10px] font-bold mt-0.5 uppercase ${producto.activo ? "text-[#8DA78E]" : "text-slate-400"}`}>
            {producto.activo ? "Activo" : "Inactivo"}
          </p>
        </div>
      </div>

      {/* Mobile Actions: only visible on mobile (md:hidden) */}
      <div className="flex md:hidden items-center justify-end gap-2 mt-3 pt-2 border-t border-[#C1D1C5]/20 dark:border-[#A3BEB0]/10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold transition-all shadow-xs"
        >
          Eliminar
        </button>
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
function ProductoDetalle({
  producto,
  onClose,
  onEdit,
}: {
  producto: Producto;
  onClose: () => void;
  onEdit: () => void;
}) {
  const isLowStock = producto.stock_actual <= producto.stock_minimo;
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-[#F5F5F1] dark:bg-zinc-900/90 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-2xl p-5 flex flex-col gap-4 h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-11 rounded-xl bg-gradient-to-br from-[#C1D1C5] to-[#8DA78E] flex items-center justify-center text-white">
            <Package className="size-6" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 dark:text-white text-base leading-tight pr-6">{producto.nombre}</h2>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase">Cód: {producto.codigo || "Sin Código"}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors text-lg font-bold px-2 self-start"
        >
          ✕
        </button>
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Descripción</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal bg-white dark:bg-zinc-950 p-3 rounded-xl border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10">
          {producto.descripcion || "Sin descripción registrada para este producto."}
        </p>
      </div>

      {/* Datos técnicos */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70 mb-2">Inventario y Costos</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Existencias", value: producto.stock_actual, color: isLowStock ? "text-red-500" : "text-[#8DA78E] dark:text-[#A3BEB0]" },
            { label: "Alerta Mínima", value: producto.stock_minimo, color: "text-[#8DA78E] dark:text-[#A3BEB0]" },
            { label: "Precio Unitario", value: `Q${producto.precio_base.toFixed(2)}`, color: "text-[#8DA78E] dark:text-[#A3BEB0]" },
            { label: "Estado", value: producto.activo ? "Activo" : "Inactivo", color: producto.activo ? "text-[#8DA78E] dark:text-[#A3BEB0]" : "text-slate-400" },
            { label: "Proveedor", value: producto.inv_proveedores?.nombre || producto.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre || "Sin Proveedor", color: "text-[#8DA78E] dark:text-[#A3BEB0] truncate", fullWidth: true },
          ].map(({ label, value, color, fullWidth }) => (
            <div key={label} className={cn("bg-white dark:bg-[#525D53]/10 rounded-xl p-3 border border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10", fullWidth && "col-span-2")}>
              <span className="text-[9px] text-[#525D53] dark:text-[#A3BEB0]/70 font-semibold uppercase tracking-wide block mb-1">{label}</span>
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
          Editar Producto
        </button>
      </div>
    </motion.div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function VerInventario() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  // Estados de Base de Datos Real
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mostrarPageSizeDropdown, setMostrarPageSizeDropdown] = useState(false);
  const pageSizeDropdownRef = useRef<HTMLDivElement>(null);

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [productoParaEditar, setProductoParaEditar] = useState<Producto | null>(null);

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

  // Cargar productos de la base de datos
  const loadDbProductos = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("inv_productos")
        .select("*, inv_proveedores(nombre), inv_compras_detalles(inv_compras(inv_proveedores(nombre)))")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar productos desde Supabase:", error);
        Swal.fire({
          title: "Error de Conexión",
          text: "No se pudieron obtener los productos desde Supabase: " + error.message,
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
          ...getSwalThemeOpts()
        });
        setProductos([]);
      } else if (data) {
        // Mapear datos
        const mapped: Producto[] = data.map((row: any) => ({
          id: row.id,
          codigo: row.codigo || "",
          nombre: row.nombre || "Producto sin nombre",
          descripcion: row.descripcion || "",
          precio_base: row.precio_base || 0,
          stock_actual: row.stock_actual || 0,
          stock_minimo: row.stock_minimo || 0,
          activo: row.activo !== false,
          proveedor_id: row.proveedor_id || null,
          inv_proveedores: row.inv_proveedores || null,
          inv_compras_detalles: row.inv_compras_detalles || []
        }));
        setProductos(mapped);

        // Sincronizar selección actual
        setProductoSeleccionado((prev) => {
          if (!prev) return null;
          const fresh = mapped.find((p) => p.id === prev.id);
          return fresh || null;
        });
      }
    } catch (err: any) {
      console.error("Error en loadDbProductos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDbProductos();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageSizeDropdownRef.current && !pageSizeDropdownRef.current.contains(event.target as Node)) {
        setMostrarPageSizeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrado de productos
  const productosFiltrados = productos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchesStock = !filtroStockBajo || p.stock_actual <= p.stock_minimo;
    
    return matchesSearch && matchesStock;
  });

  const totalItems = productosFiltrados.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  
  const productosPaginados = productosFiltrados.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize
  );



  const handleNuevoProducto = () => {
    setIsCreateOpen(true);
  };

  const handleEliminarProducto = async (producto: Producto) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      html: `¿Estás seguro de que deseas eliminar <strong>${producto.nombre}</strong>? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444"
    });
    if (!confirm.isConfirmed) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("inv_productos")
        .delete()
        .eq("id", producto.id);

      if (error) throw new Error(error.message);

      if (productoSeleccionado?.id === producto.id) setProductoSeleccionado(null);

      Swal.fire({
        title: "Eliminado",
        text: `${producto.nombre} fue eliminado del inventario.`,
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });

      loadDbProductos();
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el producto: " + err.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    }
  };



  // Exportar lista a PDF
  const handleExportarPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(82, 93, 83); // #525D53 (Olivo Oscuro)
      doc.text("KORE BMS - REPORTE DE INVENTARIO", 14, 20);
      
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
      doc.text(`Total de productos listados: ${productosFiltrados.length}`, 14, 33);
      
      // Línea divisoria
      doc.setDrawColor(193, 209, 197); // #C1D1C5
      doc.line(14, 38, 196, 38);
      
      // Generar tabla
      autoTable(doc, {
        startY: 42,
        head: [["Código", "Nombre del Producto", "Proveedor", "Stock Actual", "Mínimo", "Precio Venta", "Estado"]],
        body: productosFiltrados.map((p) => [
          p.codigo || "Sin Código",
          p.nombre,
          p.inv_proveedores?.nombre || p.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre || "—",
          p.stock_actual,
          p.stock_minimo,
          `Q${p.precio_base.toFixed(2)}`,
          p.activo ? "Activo" : "Inactivo"
        ]),
        headStyles: {
          fillColor: [141, 167, 142], // #8DA78E
          textColor: [245, 245, 241],
          fontStyle: "bold",
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [245, 245, 241]
        },
        margin: { top: 40 },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });
      
      doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      Swal.fire({
        title: "¡PDF Exportado!",
        text: "El reporte de inventario se ha descargado exitosamente.",
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
            <Package className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Módulo</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
              Inventario
            </h1>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleNuevoProducto}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-sm font-bold transition-all shadow-sm"
          >
            <Plus className="size-4" /> Nuevo Producto
          </button>
        </div>
      </div>


      {/* Buscador, Filtros y Exportar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-zinc-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 focus:border-[#8DA78E] transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFiltroStockBajo(!filtroStockBajo);
              setCurrentPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              filtroStockBajo
                ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40"
                : "border-[#C1D1C5] dark:border-[#A3BEB0]/30 text-[#525D53] dark:text-[#A3BEB0] hover:bg-[#C1D1C5]/10"
            }`}
          >
            <AlertTriangle className="size-3.5" /> Stock Bajo
          </button>
          
          <button
            onClick={handleExportarPDF}
            className="px-4 py-2.5 rounded-xl border border-[#C1D1C5] dark:border-[#A3BEB0]/30 text-[#525D53] dark:text-[#A3BEB0] hover:bg-[#C1D1C5]/10 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            <Download className="size-3.5" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Grid de productos + detalle */}
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
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Mobile: Product Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {productosPaginados.length === 0 ? (
              <div className="text-center py-14 text-slate-400 font-bold text-sm">
                No se encontraron productos
              </div>
            ) : (
              productosPaginados.map((p) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  onClick={() => setProductoSeleccionado(p)}
                  onEdit={() => {
                    setProductoParaEditar(p);
                    setIsEditOpen(true);
                  }}
                  onDelete={() => handleEliminarProducto(p)}
                />
              ))
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F1] dark:bg-[#525D53]/20 text-[#525D53] dark:text-[#A3BEB0] font-black uppercase tracking-wider border-b border-[#C1D1C5]/30">
                    <th className="px-5 py-3.5">Código</th>
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-5 py-3.5">Proveedor</th>
                    <th className="px-5 py-3.5">Existencias</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Precio Venta</th>
                    <th className="px-5 py-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C1D1C5]/15 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
                  {productosPaginados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-slate-400 font-bold">
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    productosPaginados.map((p) => {
                      const isLowStock = p.stock_actual <= p.stock_minimo;
                      const isSelected = productoSeleccionado?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setProductoSeleccionado(isSelected ? null : p);
                          }}
                          className={cn(
                            "hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors cursor-pointer",
                            isSelected && "bg-[#8DA78E]/5 dark:bg-[#8DA78E]/10"
                          )}
                        >
                          <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white font-mono">
                            {p.codigo || "Sin Código"}
                          </td>
                          <td className="px-5 py-3.5 font-bold">
                            {p.nombre}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                            {p.inv_proveedores?.nombre || p.inv_compras_detalles?.[0]?.inv_compras?.inv_proveedores?.nombre || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "font-black text-sm",
                              isLowStock ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white"
                            )}>
                              {p.stock_actual}
                            </span>
                            {isLowStock && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[9px] font-bold uppercase tracking-wide">
                                Stock Bajo
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              p.activo
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                : "bg-slate-50 text-slate-700 dark:bg-zinc-950/20 dark:text-slate-400"
                            )}>
                              {p.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-black text-[#8DA78E] dark:text-[#A3BEB0]">
                            Q{p.precio_base.toFixed(2)}
                          </td>
                          <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setProductoSeleccionado(isSelected ? null : p);
                                }}
                                className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                              >
                                Ver Detalle
                              </button>
                              <button
                                onClick={() => {
                                  setProductoParaEditar(p);
                                  setIsEditOpen(true);
                                }}
                                className="px-3 py-1.5 bg-slate-800 dark:bg-zinc-800 hover:bg-slate-700 dark:hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarProducto(p)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Barra de Paginación */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 relative" ref={pageSizeDropdownRef}>
                  <span>Mostrar</span>
                  <button
                    type="button"
                    onClick={() => setMostrarPageSizeDropdown(!mostrarPageSizeDropdown)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-xs font-bold text-[#525D53] dark:text-[#A3BEB0] transition-all cursor-pointer flex items-center gap-1.5 hover:border-[#8DA78E] h-[34px] min-w-[55px] justify-between"
                  >
                    <span>{pageSize}</span>
                    <ChevronDown className="size-3 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {mostrarPageSizeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-1.5 left-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 min-w-[70px]"
                      >
                        {[10, 50, 100].map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setPageSize(size);
                              setCurrentPage(1);
                              setMostrarPageSizeDropdown(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              pageSize === size
                                ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0]"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                            }`}
                          >
                            <span>{size}</span>
                            {pageSize === size && <Check className="size-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <span>registros</span>
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                  disabled={activePage === 1}
                  className="size-8 rounded-lg border transition-all disabled:opacity-40 select-none bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 cursor-pointer flex items-center justify-center"
                  title="Anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      totalPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - activePage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "size-8 rounded-lg text-[11px] font-bold transition-all select-none cursor-pointer flex items-center justify-center border",
                            activePage === pageNum
                              ? "bg-[#8DA78E] border-[#8DA78E] text-[#F5F5F1]"
                              : "bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#8DA78E]"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return (
                        <span key={pageNum} className="px-1 text-slate-400 text-[11px]">
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                  disabled={activePage === totalPages}
                  className="size-8 rounded-lg border transition-all disabled:opacity-40 select-none bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 cursor-pointer flex items-center justify-center"
                  title="Siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        <AnimatePresence>
          {productoSeleccionado && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:block absolute top-0 right-0 h-full w-80 z-20 shadow-2xl"
            >
              <div className="h-full">
                <ProductoDetalle
                  producto={productoSeleccionado}
                  onClose={() => setProductoSeleccionado(null)}
                  onEdit={() => {
                    setProductoParaEditar(productoSeleccionado);
                    setIsEditOpen(true);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modales */}
      <CrearProducto
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadDbProductos}
      />

      <EditarProducto
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setProductoParaEditar(null);
        }}
        onSuccess={loadDbProductos}
        producto={productoParaEditar}
      />
    </div>
  );
}

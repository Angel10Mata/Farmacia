"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Search,
  Receipt,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  User,
  Mail,
  Phone,
  FileDown,
  Calendar,
  AlertTriangle,
  MapPin,
  TrendingDown
} from "lucide-react";
import Swal from "sweetalert2";
import { createClient } from "@/utils/supabase/client";
import { cn, fmtQ, fmtNum } from "@/lib/utils";
import { Pagination, PageSizeSelect } from "@/components/ui/pagination";
import { CrearProveedor } from "./forms/CrearProveedor";
import { EditarProveedor } from "./forms/EditarProveedor";
import { ProveedorDetalle, formatPhoneDisplay, getWhatsappUrl } from "./forms/ProveedorDetalle";
import {
  obtenerProveedoresYProductos,
  crearCompra,
  obtenerHistorialCompras,
  obtenerDetalleCompra,
  eliminarProveedor,
  actualizarEstadoPagoCompra,
  registrarAbonoCompra,
  ItemCompraInput
} from "./actions";

// Helper para códigos de compra únicos a partir de UUID
const obtenerCodigoCompra = (id: string) => {
  if (!id) return "N/A";
  const cleanId = id.replace(/-/g, "").toUpperCase();
  return `${cleanId.substring(0, 3)}-${cleanId.substring(3, 6)}`;
};

interface IntervaloSemana {
  label: string; // e.g. "Lun 1 - Dom 7" o "Lun 29 - Mar 30"
  desde: string; // YYYY-MM-DD
  hasta: string; // YYYY-MM-DD
}

function obtenerSemanasDelMes(month: number, year: number): IntervaloSemana[] {
  const semanas: IntervaloSemana[] = [];
  const ultimoDia = new Date(year, month + 1, 0);
  const totalDias = ultimoDia.getDate();

  let diaInicio = 1;

  while (diaInicio <= totalDias) {
    const fechaInicio = new Date(year, month, diaInicio);
    const diasHastaDomingo = fechaInicio.getDay() === 0 ? 0 : 7 - fechaInicio.getDay();
    let diaFin = diaInicio + diasHastaDomingo;
    if (diaFin > totalDias) {
      diaFin = totalDias;
    }

    const fechaFin = new Date(year, month, diaFin);

    const formatDia = (d: Date) => {
      const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return `${nombresDias[d.getDay()]} ${d.getDate()}`;
    };

    const pad = (n: number) => n.toString().padStart(2, "0");
    const desdeStr = `${year}-${pad(month + 1)}-${pad(diaInicio)}`;
    const hastaStr = `${year}-${pad(month + 1)}-${pad(diaFin)}`;

    semanas.push({
      label: `${formatDia(fechaInicio)} - ${formatDia(fechaFin)}`,
      desde: desdeStr,
      hasta: hastaStr
    });

    diaInicio = diaFin + 1;
  }

  return semanas;
}

interface CalendarioCell {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

function obtenerDiasDelMes(month: number, year: number): CalendarioCell[] {
  const cells: CalendarioCell[] = [];
  const primerDiaSemana = new Date(year, month, 1).getDay();
  const diasMesActual = new Date(year, month + 1, 0).getDate();
  const diasMesAnterior = new Date(year, month, 0).getDate();

  for (let i = primerDiaSemana - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({
      day: diasMesAnterior - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= diasMesActual; i++) {
    cells.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  const totalCeldas = cells.length;
  const celdasRestantes = 42 - totalCeldas;
  for (let i = 1; i <= celdasRestantes; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false
    });
  }

  return cells;
}

const CustomDatePicker = ({
  value,
  onChange,
  placeholder,
  align = "left"
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  align?: "left" | "right";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getParsedDate = () => {
    if (!value) return new Date();
    const [y, m, d] = value.split("-").map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
    return new Date(y, m - 1, d);
  };

  const parsedDate = getParsedDate();
  const [navMonth, setNavMonth] = useState(parsedDate.getMonth());
  const [navYear, setNavYear] = useState(parsedDate.getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = getParsedDate();
    setNavMonth(p.getMonth());
    setNavYear(p.getFullYear());
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear(navYear - 1);
    } else {
      setNavMonth(navMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear(navYear + 1);
    } else {
      setNavMonth(navMonth + 1);
    }
  };

  const handleSelectDay = (cell: CalendarioCell) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const valStr = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
    onChange(valStr);
    setIsOpen(false);
  };

  const getDisplayDate = () => {
    if (!value) return placeholder || "Seleccionar...";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return placeholder || "Seleccionar...";
    return `${d}/${m}/${y}`;
  };

  const cells = obtenerDiasDelMes(navMonth, navYear);
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] rounded-xl px-2.5 py-1.5 cursor-pointer select-none transition-all shadow-xs h-[34px] min-w-[130px] text-left focus:outline-none focus:ring-1 focus:ring-[#8DA78E]"
      >
        <div className="flex items-center">
          <Calendar className="size-3.5 text-[#8DA78E] mr-1.5 shrink-0" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {getDisplayDate()}
          </span>
        </div>
        <ChevronDown className="size-3 text-slate-400 ml-1.5 shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute mt-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-100/50 dark:shadow-none z-50 p-4 min-w-[280px]",
              align === "left" ? "left-0" : "right-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-slate-100 dark:border-slate-900/60">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg cursor-pointer text-slate-500 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-700 dark:text-[#A3BEB0] tracking-wide select-none">
                {nombresMeses[navMonth]} {navYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg cursor-pointer text-slate-500 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
              {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((dayName) => (
                <div key={dayName} className="py-1">{dayName}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {cells.map((cell, idx) => {
                const pad = (n: number) => n.toString().padStart(2, "0");
                const cellValStr = `${cell.year}-${pad(cell.month + 1)}-${pad(cell.day)}`;
                const isSelected = value === cellValStr;
                const isToday = () => {
                  const today = new Date();
                  return (
                    today.getDate() === cell.day &&
                    today.getMonth() === cell.month &&
                    today.getFullYear() === cell.year
                  );
                };

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#8DA78E] text-white shadow-sm shadow-[#8DA78E]/30 scale-105 font-bold"
                        : cell.isCurrentMonth
                        ? isToday()
                          ? "border border-[#8DA78E] text-[#8DA78E] dark:text-[#A3BEB0] font-bold bg-[#8DA78E]/5 hover:bg-[#8DA78E]/10"
                          : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-900/60"
                        : "text-slate-400/50 dark:text-slate-650/30 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900/60 text-xs">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const pad = (n: number) => n.toString().padStart(2, "0");
                  const todayObj = new Date();
                  const todayStr = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-${pad(todayObj.getDate())}`;
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="px-2.5 py-1 text-[#8DA78E] dark:text-[#A3BEB0] hover:bg-[#8DA78E]/10 font-bold transition-colors cursor-pointer rounded-md"
              >
                Hoy
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Proveedor {
  id: string;
  nombre: string;
  descripcion?: string | null;
  nit?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  precio_base: number;
  stock_actual: number;
  proveedor_id?: string | null;
}
interface ItemCarritoCompra {
  producto: Producto;
  cantidad: number;
  precio_costo: number;
  subtotal: number;
}

interface Compra {
  id: string;
  created_at: string;
  proveedor_id: string;
  total: number;
  estado_pago: string;
  fecha_pago: string | null;
  observaciones: string | null;
  fin_transacciones?: any[];
  inv_proveedores?: {
    nombre: string;
    nit: string | null;
  } | null;
}

export function VerProveedores() {
  const [activeTab, setActiveTab] = useState<"compras" | "historial" | "proveedores" | "cuentas_por_pagar">("compras");

  // Catalogos
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);
  const [proveedorSeleccionadoTab3, setProveedorSeleccionadoTab3] = useState<Proveedor | null>(null);
  const [modoEdicionProveedor, setModoEdicionProveedor] = useState(false);

  // Carrito de compras
  const [carrito, setCarrito] = useState<ItemCarritoCompra[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [proveedorBusqueda, setProveedorBusqueda] = useState("");
  const [mostrarSugerenciasProv, setMostrarSugerenciasProv] = useState(false);
  const [proveedorAutoSeleccionado, setProveedorAutoSeleccionado] = useState(false);

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [mostrarSugerenciasProd, setMostrarSugerenciasProd] = useState(false);
  const [cantSeleccionada, setCantSeleccionada] = useState<number | "">(1);
  const [costoSeleccionado, setCostoSeleccionado] = useState<number | "">("");

  // Datos orden
  const [estadoPago, setEstadoPago] = useState<"Pendiente" | "Pagado">("Pagado");
  const [observaciones, setObservaciones] = useState("");
  const [isProcesando, setIsProcesando] = useState(false);

  // Historial de compras
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroPago, setFiltroPago] = useState("todos");
  const [compraDetalleSeleccionada, setCompraDetalleSeleccionada] = useState<Compra | null>(null);
  const [detallesDeCompra, setDetallesDeCompra] = useState<any[]>([]);
  const [isLoadingDetalles, setIsLoadingDetalles] = useState(false);

  // Date filters for compras (matching ventas design)
  const [tipoFiltroFechaCompras, setTipoFiltroFechaCompras] = useState<"dia" | "mes" | "rango">("dia");
  const [fechaDiaCompras, setFechaDiaCompras] = useState(() => {
    const t = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  });
  const [activeMonthCompras, setActiveMonthCompras] = useState(new Date().getMonth());
  const [activeYearCompras, setActiveYearCompras] = useState(new Date().getFullYear());
  const [selectedWeekIndexCompras, setSelectedWeekIndexCompras] = useState(0);
  const [fechaRangoDesdeCompras, setFechaRangoDesdeCompras] = useState("");
  const [fechaRangoHastaCompras, setFechaRangoHastaCompras] = useState("");
  const [mostrarSemanaDropdownCompras, setMostrarSemanaDropdownCompras] = useState(false);
  const [mostrarMesDropdownCompras, setMostrarMesDropdownCompras] = useState(false);

  // Pagination for compras
  const [currentPageCompras, setCurrentPageCompras] = useState(1);
  const [pageSizeCompras, setPageSizeCompras] = useState(10);
  const [mostrarPageSizeDropdownCompras, setMostrarPageSizeDropdownCompras] = useState(false);

  // Cuentas por pagar - Abono modal
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [compraAAbonar, setCompraAAbonar] = useState<Compra | null>(null);
  const [montoAbono, setMontoAbono] = useState<number | "">("");
  const [metodoPagoAbono, setMetodoPagoAbono] = useState("Efectivo");
  const [notasAbono, setNotasAbono] = useState("");
  const [isProcesandoAbono, setIsProcesandoAbono] = useState(false);
  const [busquedaCuentasPagar, setBusquedaCuentasPagar] = useState("");

  const provDropdownRef = useRef<HTMLDivElement>(null);
  const prodDropdownRef = useRef<HTMLDivElement>(null);
  const semanaDropdownComprasRef = useRef<HTMLDivElement>(null);
  const mesDropdownComprasRef = useRef<HTMLDivElement>(null);
  const pageSizeDropdownComprasRef = useRef<HTMLDivElement>(null);

  // Cargar datos
  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const data = await obtenerProveedoresYProductos();
      setProveedores(data.proveedores);
      setProductos(data.productos);

      const listCompras = await obtenerHistorialCompras();
      setCompras(listCompras);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cierra los dropdowns si haces clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (provDropdownRef.current && !provDropdownRef.current.contains(event.target as Node)) {
        setMostrarSugerenciasProv(false);
      }
      if (prodDropdownRef.current && !prodDropdownRef.current.contains(event.target as Node)) {
        setMostrarSugerenciasProd(false);
      }
      if (semanaDropdownComprasRef.current && !semanaDropdownComprasRef.current.contains(event.target as Node)) {
        setMostrarSemanaDropdownCompras(false);
      }
      if (mesDropdownComprasRef.current && !mesDropdownComprasRef.current.contains(event.target as Node)) {
        setMostrarMesDropdownCompras(false);
      }
      if (pageSizeDropdownComprasRef.current && !pageSizeDropdownComprasRef.current.contains(event.target as Node)) {
        setMostrarPageSizeDropdownCompras(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Filtrado de autocompletados
  const sugerenciasProveedores = proveedores.filter((p) => {
    if (!proveedorBusqueda) return false;
    const q = proveedorBusqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.nit && p.nit.toLowerCase().includes(q));
  });

  const sugerenciasProductos = productos.filter((p) => {
    if (!productoBusqueda) return false;
    const q = productoBusqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.codigo && p.codigo.toLowerCase().includes(q));
  });

  // Helper: autoseleccionar proveedor desde un producto (si no hay uno elegido aún)
  const autoSeleccionarProveedor = (producto: Producto) => {
    if (producto.proveedor_id && !proveedorSeleccionado) {
      const prov = proveedores.find((p) => p.id === producto.proveedor_id);
      if (prov) {
        setProveedorSeleccionado(prov);
        setProveedorBusqueda(prov.nombre);
        setProveedorAutoSeleccionado(true);
      }
    }
  };

  // Agregar al carrito
  const handleAgregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    const cant = Number(cantSeleccionada) || 0;
    const costo = Number(costoSeleccionado) || 0;

    if (cant <= 0) {
      Swal.fire({
        title: "Cantidad Inválida",
        text: "Por favor ingresa una cantidad mayor a 0.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }
    if (costo <= 0) {
      Swal.fire({
        title: "Precio Costo Inválida",
        text: "Por favor ingresa un precio de costo mayor a 0.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    const itemExistente = carrito.find((i) => i.producto.id === productoSeleccionado.id);
    if (itemExistente) {
      setCarrito(
        carrito.map((i) =>
          i.producto.id === productoSeleccionado.id
            ? {
                ...i,
                cantidad: i.cantidad + cant,
                precio_costo: costo,
                subtotal: (i.cantidad + cant) * costo
              }
            : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          producto: productoSeleccionado,
          cantidad: cant,
          precio_costo: costo,
          subtotal: cant * costo
        }
      ]);
    }

    // Intentar autoseleccionar proveedor al agregar al carrito
    autoSeleccionarProveedor(productoSeleccionado);

    // Resetear inputs
    setProductoSeleccionado(null);
    setProductoBusqueda("");
    setCantSeleccionada(1);
    setCostoSeleccionado("");
  };

  const handleScanBarcode = (product: Producto) => {
    const cant = 1;
    const costo = product.precio_base || 1;

    const itemExistente = carrito.find((i) => i.producto.id === product.id);
    if (itemExistente) {
      setCarrito(
        carrito.map((i) =>
          i.producto.id === product.id
            ? {
                ...i,
                cantidad: i.cantidad + cant,
                precio_costo: i.precio_costo || costo,
                subtotal: (i.cantidad + cant) * (i.precio_costo || costo)
              }
            : i
        )
      );
    } else {
      setCarrito([
        ...carrito,
        {
          producto: product,
          cantidad: cant,
          precio_costo: costo,
          subtotal: cant * costo
        }
      ]);
    }

    autoSeleccionarProveedor(product);

    setProductoSeleccionado(null);
    setProductoBusqueda("");
    setCantSeleccionada(1);
    setCostoSeleccionado("");

    Swal.fire({
      toast: true,
      position: "top-end",
      title: "Producto escaneado",
      text: `${product.nombre} agregado al pedido`,
      icon: "success",
      showConfirmButton: false,
      timer: 2000,
      background: "#8DA78E",
      color: "#ffffff",
      iconColor: "#ffffff"
    });
  };

  const handleAjustarCantidad = (index: number, delta: number) => {
    const item = carrito[index];
    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
      setCarrito(carrito.filter((_, idx) => idx !== index));
      return;
    }
    setCarrito(
      carrito.map((i, idx) =>
        idx === index
          ? {
              ...i,
              cantidad: nuevaCant,
              subtotal: nuevaCant * i.precio_costo
            }
          : i
      )
    );
  };

  const handleEliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, idx) => idx !== index));
  };

  const totalCarrito = carrito.reduce((sum, i) => sum + i.subtotal, 0);

  // Guardar Compra
  const handleFinalizarCompra = async () => {
    if (!proveedorSeleccionado) {
      Swal.fire({
        title: "Proveedor requerido",
        text: "Por favor selecciona un proveedor antes de registrar la compra.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }
    if (carrito.length === 0) {
      Swal.fire({
        title: "Carrito vacío",
        text: "Agrega productos a la compra antes de guardar.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Registrar esta Compra?",
      text: `Se cargará una compra por ${fmtQ(totalCarrito)} al proveedor ${proveedorSeleccionado.nombre}. Se actualizará el inventario.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    });

    if (!confirm.isConfirmed) return;

    setIsProcesando(true);
    try {
      const itemsFormatted: ItemCompraInput[] = carrito.map((i) => ({
        producto_id: i.producto.id,
        cantidad: i.cantidad,
        precio_costo: i.precio_costo,
        subtotal: i.subtotal
      }));

      const res = await crearCompra({
        proveedor_id: proveedorSeleccionado.id,
        total: totalCarrito,
        estado_pago: estadoPago,
        observaciones: observaciones.trim() || null,
        items: itemsFormatted
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      Swal.fire({
        title: "¡Compra Registrada!",
        text: "La compra ha sido cargada con éxito y el stock de inventario se ha incrementado.",
        icon: "success",
        timer: 2500,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });

      // Limpiar POS
      setCarrito([]);
      setProveedorSeleccionado(null);
      setProveedorBusqueda("");
      setProveedorAutoSeleccionado(false);
      setObservaciones("");
      setEstadoPago("Pagado");

      cargarDatos();
    } catch (e: any) {
      Swal.fire({
        title: "Error al procesar",
        text: e.message || "No se pudo registrar la compra.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsProcesando(false);
    }
  };

  // Cargar detalles de compra
  const cargarDetallesCompra = async (compra: Compra) => {
    setCompraDetalleSeleccionada(compra);
    setIsLoadingDetalles(true);
    try {
      const details = await obtenerDetalleCompra(compra.id);
      setDetallesDeCompra(details);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetalles(false);
    }
  };

  const handleCambiarEstadoPago = async (compraId: string, estadoActual: string, actualizarDetalleRef?: boolean) => {
    if (estadoActual === "Pagado") {
      Swal.fire({
        title: "Operación no permitida",
        text: "Una compra marcada como PAGADO ya no puede ser modificada.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }
    const nuevoEstado = "Pagado";
    try {
      const res = await actualizarEstadoPagoCompra(compraId, nuevoEstado);
      if (res.success) {
        setCompras((prevCompras) =>
          prevCompras.map((c) =>
            c.id === compraId ? { ...c, estado_pago: nuevoEstado } : c
          )
        );
        if (actualizarDetalleRef && compraDetalleSeleccionada && compraDetalleSeleccionada.id === compraId) {
          setCompraDetalleSeleccionada({
            ...compraDetalleSeleccionada,
            estado_pago: nuevoEstado
          });
        }
        Swal.fire({
          title: "Estado Actualizado",
          text: `La compra ha sido marcada como ${nuevoEstado.toUpperCase()}.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          ...getSwalThemeOpts()
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudo cambiar el estado de pago.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    }
  };

  // Eliminar proveedor
  const handleEliminarProveedor = async (id: string, nombre: string) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar Proveedor?",
      text: `¿Seguro que deseas eliminar a ${nombre}? Esta acción no se puede deshacer si tiene registros asociados.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444"
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await eliminarProveedor(id);
      if (!res.success) throw new Error(res.error);

      Swal.fire({
        title: "Eliminado",
        text: "Proveedor eliminado exitosamente.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });
      cargarDatos();
    } catch (e: any) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo eliminar el proveedor.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    }
  };

  // Abonar Compra
  const handleAbonarCompra = async () => {
    if (!compraAAbonar) return;
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

    setIsProcesandoAbono(true);
    try {
      const res = await registrarAbonoCompra(compraAAbonar.id, amount, metodoPagoAbono, notasAbono.trim() || undefined);
      if (!res.success) throw new Error(res.error);

      Swal.fire({
        title: "Abono Registrado",
        text: `Se registró un abono de ${fmtQ(amount)} correctamente.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });

      setIsAbonoModalOpen(false);
      setCompraAAbonar(null);
      setMontoAbono("");
      setNotasAbono("");
      cargarDatos();
    } catch (e: any) {
      Swal.fire({
        title: "Error",
        text: e.message || "No se pudo registrar el abono.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsProcesandoAbono(false);
    }
  };

  // Filtros Historial
  const comprasFiltradas = compras.filter((c) => {
    const query = busquedaHistorial.toLowerCase();
    const matchSearch =
      obtenerCodigoCompra(c.id).toLowerCase().includes(query) ||
      (c.inv_proveedores?.nombre || "").toLowerCase().includes(query) ||
      (c.observaciones || "").toLowerCase().includes(query);

    const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
    const isPaid = abonos >= c.total;
    const estadoCalculado = isPaid ? "Pagado" : "Pendiente";
    const matchPago = filtroPago === "todos" || estadoCalculado === filtroPago;

    let matchFecha = true;
    if (c.created_at) {
      const cDate = new Date(c.created_at);
      const offset = cDate.getTimezoneOffset();
      const cLocalDate = new Date(cDate.getTime() - offset * 60 * 1000);
      const cLocalDateStr = cLocalDate.toISOString().split("T")[0]; // YYYY-MM-DD

      if (tipoFiltroFechaCompras === "dia") {
        matchFecha = cLocalDateStr === fechaDiaCompras;
      } else if (tipoFiltroFechaCompras === "mes") {
        if (selectedWeekIndexCompras === -1) {
          const mesStr = String(activeMonthCompras + 1).padStart(2, "0");
          const prefix = `${activeYearCompras}-${mesStr}`;
          matchFecha = cLocalDateStr.startsWith(prefix);
        } else {
          const semanas = obtenerSemanasDelMes(activeMonthCompras, activeYearCompras);
          const sem = semanas[selectedWeekIndexCompras];
          if (sem) {
            matchFecha = cLocalDateStr >= sem.desde && cLocalDateStr <= sem.hasta;
          }
        }
      } else if (tipoFiltroFechaCompras === "rango") {
        const desde = fechaRangoDesdeCompras || "0000-00-00";
        const hasta = fechaRangoHastaCompras || "9999-12-31";
        matchFecha = cLocalDateStr >= desde && cLocalDateStr <= hasta;
      }
    } else {
      matchFecha = false;
    }

    return matchSearch && matchPago && matchFecha;
  });

  const totalComprasItems = comprasFiltradas.length;
  const totalComprasPages = Math.ceil(totalComprasItems / pageSizeCompras) || 1;
  const activeComprasPage = Math.min(currentPageCompras, totalComprasPages);
  const comprasPaginadas = comprasFiltradas.slice(
    (activeComprasPage - 1) * pageSizeCompras,
    activeComprasPage * pageSizeCompras
  );

  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 pt-32 md:pt-24 min-h-screen">
      {/* Modales */}
      <CrearProveedor
        isOpen={isCrearOpen}
        onClose={() => setIsCrearOpen(false)}
        onSuccess={cargarDatos}
      />
      <EditarProveedor
        isOpen={isEditarOpen}
        onClose={() => {
          setIsEditarOpen(false);
          setProveedorAEditar(null);
        }}
        onSuccess={cargarDatos}
        proveedor={proveedorAEditar}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0 size-12 rounded-2xl bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
            <Truck className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Compras</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
              Gestión de Compra
            </h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#F5F5F1] dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 p-1.5 rounded-2xl w-fit">
          {[
            { id: "compras", label: "Registrar Compra" },
            { id: "historial", label: "Historial de Compras" },
            { id: "proveedores", label: "Proveedores" },
            { id: "cuentas_por_pagar", label: "Cuentas por Pagar" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#8DA78E] text-[#F5F5F1] shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="size-10 rounded-full border-4 border-[#8DA78E]/25 border-t-[#8DA78E] animate-spin" />
        </div>
      ) : (
        <div className="flex-1">
          {/* TAB 1: REGISTRAR COMPRA (POS COMPRA) */}
          {activeTab === "compras" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Panel de Llenado */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-5">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 border-b border-[#C1D1C5]/30 pb-2">
                    Ingreso de Compra / Entrada de Factura
                  </h2>

                  {/* 1. Producto y Detalles */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Autocomplete Producto */}
                    <div className="md:col-span-6 relative" ref={prodDropdownRef}>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 text-left">
                        Buscar Producto
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                          type="text"
                          value={productoBusqueda}
                          onChange={(e) => {
                            setProductoBusqueda(e.target.value);
                            setMostrarSugerenciasProd(true);
                          }}
                          onFocus={() => setMostrarSugerenciasProd(true)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const query = e.currentTarget.value.trim().toLowerCase();
                              if (!query) return;

                              const exactMatch = productos.find(p => p.codigo?.toLowerCase() === query);
                              if (exactMatch) {
                                handleScanBarcode(exactMatch);
                              } else {
                                Swal.fire({
                                  toast: true,
                                  position: "top-end",
                                  title: "Producto no encontrado",
                                  text: `No se encontró el código: ${query}`,
                                  icon: "error",
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  showConfirmButton: false,
                                  timer: 3000,
                                  iconColor: "#ffffff"
                                });
                              }
                            }
                          }}
                          placeholder="Nombre o código de barras..."
                          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
                        />
                      </div>

                      <AnimatePresence>
                        {mostrarSugerenciasProd && sugerenciasProductos.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-left"
                          >
                            {sugerenciasProductos.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setProductoSeleccionado(p);
                                  setProductoBusqueda(p.nombre);
                                  setMostrarSugerenciasProd(false);
                                  // Autoseleccionar proveedor al elegir un producto del dropdown
                                  autoSeleccionarProveedor(p);
                                }}
                                className="w-full px-4 py-2 border-b border-slate-100 dark:border-slate-900 hover:bg-[#8DA78E]/10 dark:hover:bg-[#8DA78E]/20 text-left flex items-center justify-between text-xs cursor-pointer"
                              >
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                                  <p className="text-[10px] text-slate-400">Barras: {p.codigo || "N/A"}</p>
                                </div>
                                <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 px-2 py-0.5 rounded-full font-semibold">
                                  Stock: {p.stock_actual}
                                </span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Cantidad Input */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 text-left">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cantSeleccionada}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCantSeleccionada(val === "" ? "" : Number(val));
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Costo Unitario Input */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 text-left">
                        Costo Unitario
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Q</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={costoSeleccionado}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCostoSeleccionado(val === "" ? "" : Number(val));
                          }}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botón de Agregar */}
                  <button
                    onClick={handleAgregarAlCarrito}
                    disabled={!productoSeleccionado}
                    className="w-fit max-w-full py-2.5 px-4 bg-[#8DA78E] disabled:opacity-40 text-[#F5F5F1] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <Plus className="size-4" /> Agregar Producto a la Compra
                  </button>
                </div>

                {/* Carrito de Compra (Productos Agregados) */}
                <div className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-[#C1D1C5]/20 pb-2 text-left">
                    Productos en el Pedido
                  </h3>

                  {carrito.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                      <Receipt className="size-10 mb-2 opacity-55 text-slate-400" />
                      <p className="text-xs font-semibold">Aún no hay productos cargados</p>
                      <p className="text-[10px] opacity-70">Usa el panel superior para buscar e ingresar productos.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                      {carrito.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {item.producto.nombre}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Código: {item.producto.codigo || "N/A"} | Costo: {fmtQ(item.precio_costo)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-zinc-800/80 pt-2 sm:pt-0">
                            {/* Selector de Cantidades */}
                            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 rounded-lg p-0.5">
                              <button
                                onClick={() => handleAjustarCantidad(index, -1)}
                                className="p-1 hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-400 rounded transition-colors cursor-pointer"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                                {item.cantidad}
                              </span>
                              <button
                                onClick={() => handleAjustarCantidad(index, 1)}
                                className="p-1 hover:bg-white dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-400 rounded transition-colors cursor-pointer"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Subtotal */}
                              <span className="w-16 text-right text-xs font-black text-slate-800 dark:text-white">
                                {fmtQ(item.subtotal)}
                              </span>

                              {/* Eliminar */}
                              <button
                                onClick={() => handleEliminarDelCarrito(index)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Derecho - Totales y Registro */}
              <div className="lg:col-span-4 flex flex-col gap-4 bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 border-b border-[#C1D1C5]/30 pb-2 text-left">
                  Resumen de Compra
                </h3>

                {/* 1. Selección de Proveedor */}
                <div className="relative text-left" ref={provDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                      Seleccionar Proveedor
                    </label>
                    {proveedorAutoSeleccionado && proveedorSeleccionado && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#8DA78E] dark:text-[#A3BEB0] bg-[#8DA78E]/10 dark:bg-[#8DA78E]/20 px-2 py-0.5 rounded-full">
                        <Truck className="size-2.5" />
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <input
                        type="text"
                        value={proveedorBusqueda}
                        onChange={(e) => {
                          setProveedorBusqueda(e.target.value);
                          setMostrarSugerenciasProv(true);
                          setProveedorAutoSeleccionado(false);
                          if (!e.target.value) setProveedorSeleccionado(null);
                        }}
                        onFocus={() => setMostrarSugerenciasProv(true)}
                        placeholder="Escribe nombre o NIT del proveedor..."
                        className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors ${
                          proveedorAutoSeleccionado && proveedorSeleccionado
                            ? "border-[#8DA78E] dark:border-[#A3BEB0]/60"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCrearOpen(true)}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Registrar nuevo proveedor"
                    >
                      Nuevo
                    </button>
                  </div>

                  <AnimatePresence>
                    {mostrarSugerenciasProv && sugerenciasProveedores.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-left"
                      >
                        {sugerenciasProveedores.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setProveedorSeleccionado(p);
                              setProveedorBusqueda(p.nombre);
                              setMostrarSugerenciasProv(false);
                            }}
                            className="w-full px-4 py-2 border-b border-slate-100 dark:border-slate-900 hover:bg-[#8DA78E]/10 dark:hover:bg-[#8DA78E]/20 text-left flex items-center justify-between text-xs cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{p.nombre}</p>
                              <p className="text-[10px] text-slate-400">NIT: {p.nit || "C/F"}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Estado de Pago */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Estado de Pago
                  </label>
                  <div className="grid grid-cols-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEstadoPago("Pagado")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        estadoPago === "Pagado"
                          ? "bg-white dark:bg-zinc-900 text-[#8DA78E] shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      PAGADO
                    </button>
                    <button
                      type="button"
                      onClick={() => setEstadoPago("Pendiente")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        estadoPago === "Pendiente"
                          ? "bg-white dark:bg-zinc-900 text-amber-500 shadow-xs"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      PENDIENTE
                    </button>
                  </div>
                </div>

                {/* 3. Observaciones */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Observaciones / Comentario
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={2}
                    placeholder="Número de factura del proveedor, condiciones de entrega..."
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Total a pagar */}
                <div className="border-t border-[#C1D1C5]/30 pt-3 mt-auto space-y-2 text-left">
                  <div className="flex items-center justify-between text-sm font-black text-slate-800 dark:text-white pt-1">
                    <span>Total a pagar:</span>
                    <span className="text-base text-[#8DA78E]">{fmtQ(totalCarrito)}</span>
                  </div>
                </div>

                {/* Registrar Compra Button */}
                <button
                  type="button"
                  onClick={handleFinalizarCompra}
                  disabled={carrito.length === 0 || isProcesando}
                  className="w-fit max-w-full px-6 py-3 bg-[#8DA78E] disabled:opacity-40 disabled:bg-[#8DA78E] text-[#F5F5F1] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  {isProcesando ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-[#F5F5F1]/30 border-t-[#F5F5F1] animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      Registrar Compra
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORIAL DE COMPRAS */}
          {activeTab === "historial" && (
            <div className="flex flex-col flex-1 min-w-0 bg-[#F5F5F1] dark:bg-[#171a17] border-y md:border border-[#C1D1C5]/30 dark:border-[#525D53]/30 md:rounded-3xl p-5 overflow-hidden shadow-sm">
              {/* Buscador y switch de pago */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Buscador */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por código, proveedor..."
                    value={busquedaHistorial}
                    onChange={(e) => {
                      setBusquedaHistorial(e.target.value);
                      setCurrentPageCompras(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-zinc-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 focus:border-[#8DA78E] transition-all"
                  />
                </div>

                {/* Switch de pago segmentado horizontal */}
                <div className="flex bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/30 dark:border-zinc-800 p-1 rounded-xl w-fit h-[46px] items-center shrink-0">
                  {[
                    { id: "todos", label: "Todos" },
                    { id: "Pagado", label: "Pagado" },
                    { id: "Pendiente", label: "Pendiente" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFiltroPago(opt.id);
                        setCurrentPageCompras(1);
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative h-[38px] ${
                        filtroPago === opt.id
                          ? "bg-[#8DA78E] text-[#F5F5F1] shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtros de Fecha */}
              <div className="flex flex-row gap-3 items-center bg-[#F5F5F1]/50 dark:bg-[#525D53]/5 border border-[#C1D1C5]/60 dark:border-zinc-800/50 rounded-2xl px-4 py-3 text-left w-fit flex-wrap max-w-full">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: "dia", label: "Día" },
                    { id: "mes", label: "Mes" },
                    { id: "rango", label: "Rango" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTipoFiltroFechaCompras(opt.id as any);
                        setCurrentPageCompras(1);
                        if (opt.id === "mes") {
                          setSelectedWeekIndexCompras(-1); // Default to full month
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        tipoFiltroFechaCompras === opt.id
                          ? "bg-[#8DA78E]/10 dark:bg-[#8DA78E]/20 text-[#8DA78E] border border-[#8DA78E]/30"
                          : "border border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-800/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    {tipoFiltroFechaCompras === "dia" && (
                      <motion.div
                        key="dia"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <CustomDatePicker
                          value={fechaDiaCompras}
                          onChange={(val) => {
                            setFechaDiaCompras(val);
                            setCurrentPageCompras(1);
                          }}
                          align="right"
                        />
                      </motion.div>
                    )}

                    {tipoFiltroFechaCompras === "mes" && (
                      <motion.div
                        key="mes"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-row items-center gap-1.5 w-auto flex-nowrap max-w-full"
                      >
                        {/* Navegador de Mes/Año */}
                        <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl px-1.5 py-0.5 h-[34px] shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeMonthCompras === 0) {
                                  setActiveMonthCompras(11);
                                  setActiveYearCompras(activeYearCompras - 1);
                              } else {
                                  setActiveMonthCompras(activeMonthCompras - 1);
                              }
                              setSelectedWeekIndexCompras(-1);
                              setCurrentPageCompras(1);
                            }}
                            className="size-5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
                          >
                            <ChevronLeft className="size-3" />
                          </button>

                          <div className="relative" ref={mesDropdownComprasRef}>
                            <button
                              type="button"
                              onClick={() => setMostrarMesDropdownCompras(!mostrarMesDropdownCompras)}
                              className="px-2 py-1 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-lg text-xs font-bold text-slate-700 dark:text-[#A3BEB0] cursor-pointer"
                            >
                              {[
                                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                              ][activeMonthCompras]} {activeYearCompras}
                            </button>

                            <AnimatePresence>
                              {mostrarMesDropdownCompras && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-55 p-1 grid grid-cols-3 gap-1 min-w-[240px]"
                                >
                                  {[
                                    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
                                    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
                                  ].map((mName, mIdx) => (
                                    <button
                                      key={mIdx}
                                      type="button"
                                      onClick={() => {
                                        setActiveMonthCompras(mIdx);
                                        setSelectedWeekIndexCompras(-1);
                                        setCurrentPageCompras(1);
                                        setMostrarMesDropdownCompras(false);
                                      }}
                                      className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                        activeMonthCompras === mIdx
                                          ? "bg-[#8DA78E] text-white"
                                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                      }`}
                                    >
                                      {mName}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (activeMonthCompras === 11) {
                                  setActiveMonthCompras(0);
                                  setActiveYearCompras(activeYearCompras + 1);
                              } else {
                                  setActiveMonthCompras(activeMonthCompras + 1);
                              }
                              setSelectedWeekIndexCompras(-1);
                              setCurrentPageCompras(1);
                            }}
                            className="size-5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
                          >
                            <ChevronRight className="size-3" />
                          </button>
                        </div>

                        {/* Dropdown de semanas */}
                        <div className="relative" ref={semanaDropdownComprasRef}>
                          {(() => {
                            const semanas = obtenerSemanasDelMes(activeMonthCompras, activeYearCompras);
                            const semSeleccionada = semanas[selectedWeekIndexCompras] || semanas[0];
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setMostrarSemanaDropdownCompras(!mostrarSemanaDropdownCompras)}
                                  className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-[11px] font-bold text-[#525D53] dark:text-[#A3BEB0] transition-all cursor-pointer flex items-center gap-1.5 justify-between min-w-[130px] h-[34px]"
                                >
                                  <span>{selectedWeekIndexCompras === -1 ? "Todas las semanas" : (semSeleccionada ? semSeleccionada.label : "Seleccionar semana")}</span>
                                  <ChevronDown className="size-3.5 text-slate-400" />
                                </button>

                                <AnimatePresence>
                                  {mostrarSemanaDropdownCompras && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                      className="absolute left-0 mt-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5 min-w-[220px]"
                                    >
                                      {/* Opción: Todas las semanas */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedWeekIndexCompras(-1);
                                          setCurrentPageCompras(1);
                                          setMostrarSemanaDropdownCompras(false);
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                                          selectedWeekIndexCompras === -1
                                            ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                        }`}
                                      >
                                        <span>Todas las semanas</span>
                                        {selectedWeekIndexCompras === -1 && <Check className="size-3.5" />}
                                      </button>
                                      {/* Separador */}
                                      <div className="border-t border-slate-200 dark:border-zinc-800 my-0.5" />
                                      {/* Semanas individuales */}
                                      {semanas.map((s, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => {
                                            setSelectedWeekIndexCompras(idx);
                                            setCurrentPageCompras(1);
                                            setMostrarSemanaDropdownCompras(false);
                                          }}
                                          className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                                            selectedWeekIndexCompras === idx
                                              ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                          }`}
                                        >
                                          <span>{s.label}</span>
                                          {selectedWeekIndexCompras === idx && <Check className="size-3.5" />}
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}

                    {tipoFiltroFechaCompras === "rango" && (
                      <motion.div
                        key="rango"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 flex-wrap max-w-full"
                      >
                        <span className="text-[10px] font-bold text-slate-400">Desde:</span>
                        <CustomDatePicker
                          value={fechaRangoDesdeCompras}
                          onChange={(val) => {
                            setFechaRangoDesdeCompras(val);
                            setCurrentPageCompras(1);
                          }}
                          placeholder="Inicio"
                          align="left"
                        />
                        <span className="text-[10px] font-bold text-slate-400">Hasta:</span>
                        <CustomDatePicker
                          value={fechaRangoHastaCompras}
                          onChange={(val) => {
                            setFechaRangoHastaCompras(val);
                            setCurrentPageCompras(1);
                          }}
                          placeholder="Fin"
                          align="right"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Listado de compras */}
              <div className="flex-1 overflow-y-auto custom-scrollbar w-full mt-2 pr-1">
                {comprasPaginadas.length === 0 ? (
                  <div className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl p-14 text-center text-slate-400 font-bold">
                    No se encontraron compras en el historial.
                  </div>
                ) : (
                <>
                  {/* Vista Móvil (Tarjetas) */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {comprasPaginadas.map((c) => {
                      const date = new Date(c.created_at).toLocaleString("es-GT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      return (
                        <div
                          key={c.id}
                          className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/30 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs text-left"
                        >
                          {/* Mobile View Item */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              Compra #{obtenerCodigoCompra(c.id)}
                            </span>
                            {(() => {
                              const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                              const isPaid = abonos >= c.total;
                              const daysPassed = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));
                              const daysRemaining = 30 - daysPassed;
                              return (
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isPaid
                                    ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                    : daysRemaining < 0 
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                }`}>
                                  {isPaid ? "Pagado" : daysRemaining < 0 ? "Vencido" : `Quedan ${daysRemaining} días`}
                                </span>
                              );
                            })()}
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <p className="font-bold text-slate-800 dark:text-zinc-200">
                              {c.inv_proveedores?.nombre || "Proveedor Desconocido"}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="size-3.5 text-[#8DA78E]" /> {date}
                            </p>
                            {c.observaciones && (
                              <p className="text-[10px] text-slate-550 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-slate-100 dark:border-zinc-800/40 truncate">
                                {c.observaciones}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-900 mt-1">
                            {(() => {
                              const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                              const saldoCompra = Math.max(0, c.total - abonos);
                              return (
                                <>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-450 uppercase leading-none">
                                      {saldoCompra < c.total && saldoCompra > 0 ? "Saldo Pendiente" : "Total"}
                                    </span>
                                    <span className="text-xs font-black text-[#8DA78E] mt-1">
                                      {fmtQ(saldoCompra < c.total && saldoCompra > 0 ? saldoCompra : c.total)}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => cargarDetallesCompra(c)}
                                      className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border border-[#8DA78E]/20"
                                    >
                                      Ver Detalle
                                    </button>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vista Desktop (Tabla) */}
                  <div className="hidden md:block bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#F5F5F1] dark:bg-[#525D53]/20 text-[#525D53] dark:text-[#A3BEB0] font-black uppercase tracking-wider border-b border-[#C1D1C5]/30">
                            <th className="px-5 py-3.5">Compra #</th>
                            <th className="px-5 py-3.5">Fecha</th>
                            <th className="px-5 py-3.5">Proveedor</th>
                            <th className="px-5 py-3.5">Estado Pago</th>
                            <th className="px-5 py-3.5 text-right">Total</th>
                            <th className="px-5 py-3.5 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C1D1C5]/15 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
                          {comprasPaginadas.map((c) => {
                            const date = new Date(c.created_at).toLocaleString("es-GT", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            });
                            const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                            const isPaid = abonos >= c.total;
                            const saldoCompra = Math.max(0, c.total - abonos);
                            const daysPassed = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));
                            const daysRemaining = 30 - daysPassed;
                            return (
                              <tr
                                key={c.id}
                                className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                              >
                                <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                  #{obtenerCodigoCompra(c.id)}
                                </td>
                                <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{date}</td>
                                <td className="px-5 py-3.5 font-bold">
                                  {c.inv_proveedores?.nombre || "Proveedor Desconocido"}
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isPaid
                                      ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                      : daysRemaining < 0 
                                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                  }`}>
                                    {isPaid ? "Pagado" : daysRemaining < 0 ? "Vencido" : `Quedan ${daysRemaining} días`}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right font-black text-[#8DA78E] dark:text-[#A3BEB0] whitespace-nowrap">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">
                                      {saldoCompra < c.total && saldoCompra > 0 ? "Saldo" : "Total"}
                                    </span>
                                    <span>
                                      {fmtQ(saldoCompra < c.total && saldoCompra > 0 ? saldoCompra : c.total)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => cargarDetallesCompra(c)}
                                      className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border border-[#8DA78E]/20"
                                    >
                                      Ver Detalle
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Barra de Paginación */}
            {totalComprasItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-[#C1D1C5]/40 dark:border-[#525D53]/30 text-slate-600 dark:text-slate-400">
                <PageSizeSelect
                    pageSize={pageSizeCompras}
                    setPageSize={(size) => {
                      setPageSizeCompras(size);
                      setCurrentPageCompras(1);
                      setMostrarPageSizeDropdownCompras(false);
                    }}
                  />
                  <div className="flex justify-center w-full sm:w-auto">
                    <Pagination
                      currentPage={activeComprasPage}
                      totalPages={totalComprasPages}
                      onPageChange={(p) => setCurrentPageCompras(p)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATALOGO DE PROVEEDORES */}
          {activeTab === "proveedores" && (
            <div className="flex gap-4 flex-1 relative min-h-[550px] overflow-x-hidden p-1">
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  {/* Buscador */}
                  <div className="relative w-full sm:max-w-md text-left">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={proveedorBusqueda}
                      onChange={(e) => setProveedorBusqueda(e.target.value)}
                      placeholder="Buscar proveedor por nombre o NIT..."
                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => setIsCrearOpen(true)}
                    className="py-2 px-4 bg-[#8DA78E] text-[#F5F5F1] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus className="size-4" /> Nuevo Proveedor
                  </button>
                </div>

                {/* Tabla de Proveedores (Desktop) */}
                {(() => {
                  const proveedoresFiltrados = proveedores.filter((p) => {
                    const q = proveedorBusqueda.toLowerCase();
                    return p.nombre.toLowerCase().includes(q) || (p.nit && p.nit.toLowerCase().includes(q));
                  });
                  return (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-[#F5F5F1] dark:bg-[#525D53]/20 text-[#525D53] dark:text-[#A3BEB0] font-black uppercase tracking-wider border-b border-[#C1D1C5]/30">
                                <th className="px-5 py-3.5">Nombre</th>
                                <th className="px-5 py-3.5">NIT</th>
                                <th className="px-5 py-3.5">Teléfono</th>
                                <th className="px-5 py-3.5">Correo</th>
                                <th className="px-5 py-3.5">Descripción</th>
                                <th className="px-5 py-3.5 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#C1D1C5]/15 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
                              {proveedoresFiltrados.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="text-center py-14 text-slate-400 font-bold">
                                    No se encontraron proveedores
                                  </td>
                                </tr>
                              ) : (
                                proveedoresFiltrados.map((p) => (
                                  <tr
                                    key={p.id}
                                    onClick={() => {
                                      const isSelected = proveedorSeleccionadoTab3?.id === p.id;
                                      setProveedorSeleccionadoTab3(isSelected ? null : p);
                                      setModoEdicionProveedor(false);
                                    }}
                                    className={cn(
                                      "hover:bg-[#8DA78E]/10 dark:hover:bg-[#A3BEB0]/15 transition-all cursor-pointer",
                                      proveedorSeleccionadoTab3?.id === p.id && "bg-[#8DA78E]/20 dark:bg-[#8DA78E]/25"
                                    )}
                                  >
                                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                      {p.nombre}
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                                      {p.nit || <span className="text-slate-300 dark:text-slate-600">C/F</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                      {p.telefono ? (
                                        <a
                                          href={getWhatsappUrl(p.telefono)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400 hover:underline font-bold"
                                        >
                                          <Phone className="size-3" /> {formatPhoneDisplay(p.telefono)}
                                        </a>
                                      ) : (
                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                      {p.correo ? (
                                        <span className="flex items-center gap-1.5">
                                          <Mail className="size-3 text-[#8DA78E]" /> {p.correo}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-[200px]">
                                      {p.descripcion ? (
                                        <span className="line-clamp-1 italic">{p.descripcion}</span>
                                      ) : (
                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                      )}
                                    </td>
                                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setProveedorSeleccionadoTab3(p);
                                            setModoEdicionProveedor(true);
                                          }}
                                          className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEliminarProveedor(p.id, p.nombre);
                                          }}
                                          className="px-3 py-1.5 bg-red-400 hover:bg-red-500 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                                        >
                                          Eliminar
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

                      {/* Mobile Cards */}
                      <div className="md:hidden flex flex-col gap-3">
                        {proveedoresFiltrados.length === 0 ? (
                          <div className="py-10 text-center text-slate-400 font-bold text-sm bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                            No se encontraron proveedores
                          </div>
                        ) : (
                          proveedoresFiltrados.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setProveedorSeleccionadoTab3(p);
                                setModoEdicionProveedor(false);
                              }}
                              className={cn(
                                "bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xs cursor-pointer hover:border-[#8DA78E] transition-all",
                                proveedorSeleccionadoTab3?.id === p.id && "border-[#8DA78E] ring-1 ring-[#8DA78E]/30"
                              )}
                            >
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.nombre}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">NIT: {p.nit || "C/F"}</p>
                              </div>
                              <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                                {p.telefono && (
                                  <p className="flex items-center gap-1.5">
                                    <Phone className="size-3.5 text-[#8DA78E] shrink-0" />
                                    <a
                                      href={getWhatsappUrl(p.telefono)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-green-600 dark:text-green-400 hover:underline font-bold"
                                    >
                                      {formatPhoneDisplay(p.telefono)}
                                    </a>
                                  </p>
                                )}
                                {p.correo && (
                                  <p className="flex items-center gap-1.5 truncate"><Mail className="size-3.5 text-[#8DA78E]" /> {p.correo}</p>
                                )}
                              </div>
                              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProveedorSeleccionadoTab3(p);
                                    setModoEdicionProveedor(true);
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold text-[#8DA78E] hover:bg-[#8DA78E]/10 rounded-lg cursor-pointer transition-colors uppercase border border-[#8DA78E]/30"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEliminarProveedor(p.id, p.nombre);
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors uppercase border border-red-200 dark:border-red-900/40"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Panel de detalle de Proveedor */}
            <AnimatePresence>
              {proveedorSeleccionadoTab3 && (
                <motion.div
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="hidden md:block absolute top-0 right-0 h-full w-[600px] z-20 shadow-2xl"
                >
                  <div className="h-full">
                    <ProveedorDetalle
                      proveedor={proveedorSeleccionadoTab3}
                      onClose={() => setProveedorSeleccionadoTab3(null)}
                      onUpdate={() => {
                        cargarDatos();
                        setProveedorSeleccionadoTab3(null);
                      }}
                      defaultEdit={modoEdicionProveedor}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 4: CUENTAS POR PAGAR */}
        {activeTab === "cuentas_por_pagar" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Buscador */}
                <div className="relative w-full sm:max-w-md text-left">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaCuentasPagar}
                    onChange={(e) => setBusquedaCuentasPagar(e.target.value)}
                    placeholder="Buscar por referencia o proveedor..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Tabla de Cuentas por Pagar (Desktop) */}
              {(() => {
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
                  <>
                    <div className="hidden md:block bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#F5F5F1] dark:bg-[#525D53]/20 text-[#525D53] dark:text-[#A3BEB0] font-black uppercase tracking-wider border-b border-[#C1D1C5]/30">
                              <th className="px-5 py-3.5">Referencia</th>
                              <th className="px-5 py-3.5">Fecha</th>
                              <th className="px-5 py-3.5">Proveedor</th>
                              <th className="px-5 py-3.5 text-right">Monto Total</th>
                              <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                              <th className="px-5 py-3.5 text-center">Días Restantes</th>
                              <th className="px-5 py-3.5 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#C1D1C5]/15 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
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
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    )}

      {/* Slide-over Detalles (Historial de Compras) */}
      <AnimatePresence>
        {compraDetalleSeleccionada && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setCompraDetalleSeleccionada(null)}
                className="absolute inset-0 bg-black backdrop-blur-xs cursor-pointer"
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="pointer-events-auto w-screen max-w-md bg-[#F5F5F1] dark:bg-zinc-900 shadow-2xl flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="p-5 border-b border-[#C1D1C5]/30 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950">
                    <div className="flex items-center gap-2">
                      <Receipt className="size-5 text-[#8DA78E]" />
                      <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm">
                        Compra #{obtenerCodigoCompra(compraDetalleSeleccionada.id)}
                      </h3>
                    </div>
                    <button
                      onClick={() => setCompraDetalleSeleccionada(null)}
                      className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors font-bold px-2 text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-left">
                    {/* Tarjeta Informativa del Proveedor */}
                    <div className="bg-white dark:bg-zinc-950 border border-[#C1D1C5]/30 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-2 shadow-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Proveedor</p>
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {compraDetalleSeleccionada.inv_proveedores?.nombre || "Proveedor Desconocido"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          NIT: {compraDetalleSeleccionada.inv_proveedores?.nit || "C/F"}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 dark:border-zinc-900 pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                        <div>
                          <span className="block font-bold text-slate-400">Fecha Registro</span>
                          {new Date(compraDetalleSeleccionada.created_at).toLocaleString("es-GT")}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-400">Estado Pago</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(() => {
                              const abonos = compraDetalleSeleccionada.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                              const isPaid = abonos >= compraDetalleSeleccionada.total;
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
                          const pagos = compraDetalleSeleccionada.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor") || [];
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
                    {compraDetalleSeleccionada.observaciones && (
                      <div className="text-xs">
                        <h4 className="font-black uppercase text-slate-400 tracking-wider mb-1">Notas / Observaciones</h4>
                        <p className="text-slate-600 dark:text-slate-400 italic bg-white dark:bg-zinc-950 p-3 rounded-xl border border-[#C1D1C5]/30 dark:border-zinc-800">
                          {compraDetalleSeleccionada.observaciones}
                        </p>
                      </div>
                    )}

                    {/* Resumen Totales */}
                    <div className="bg-[#8DA78E]/5 border border-[#8DA78E]/20 p-4 rounded-2xl flex justify-between items-center mt-auto">
                      <span className="text-xs font-black uppercase tracking-wider text-[#525D53] dark:text-[#A3BEB0]">Total de la Compra</span>
                      <span className="text-lg font-black text-[#8DA78E]">{fmtQ(compraDetalleSeleccionada.total)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Abono Compra */}
      <AnimatePresence>
        {isAbonoModalOpen && compraAAbonar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAbonoModalOpen(false)}
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
                  Abonar a Compra #{obtenerCodigoCompra(compraAAbonar.id)}
                </h3>
                <button
                  onClick={() => setIsAbonoModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold px-2 py-1 cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4 text-left">
                {(() => {
                  const abonos = compraAAbonar.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                  const saldoCompra = Math.max(0, compraAAbonar.total - abonos);
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
                  onClick={handleAbonarCompra}
                  disabled={isProcesandoAbono || !montoAbono || Number(montoAbono) <= 0}
                  className="mt-2 w-fit max-w-full py-3 bg-[#8DA78E] disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-[#8DA78E]/20"
                >
                  {isProcesandoAbono ? (
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
        )}
      </AnimatePresence>
    </div>
  );
}

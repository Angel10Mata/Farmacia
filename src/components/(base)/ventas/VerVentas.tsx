"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Receipt,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Printer,
  User,
  FileDown,
  ChevronDown,
  Check,
  ChevronLeft,
  Calendar,
  Edit,
  Package
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { CrearCliente } from "@/components/(base)/clientes/forms/CrearCliente";
import {
  obtenerProductosYClientes,
  crearVenta,
  obtenerHistorialVentas,
  obtenerDetalleVenta,
  anularVenta,
  ItemVentaInput,
  editarDetalleVentaDirecto,
  eliminarDetalleVentaDirecto
} from "./actions";
import { toBlob } from "html-to-image";
import { ReciboVenta, buildReciboProps } from "./ReciboVenta";
import { formatFechaRecibo, obtenerCodigoRecibo } from "./recibo-utils";

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
      month,
      year,
      isCurrentMonth: true
    });
  }

  let nextMonthDay = 1;
  while (cells.length < 42) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({
      day: nextMonthDay,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false
    });
    nextMonthDay++;
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
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-slate-500 hover:text-[#8DA78E] dark:hover:text-[#A3BEB0] transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              
              <span className="text-xs font-bold text-slate-700 dark:text-[#A3BEB0] tracking-wide select-none">
                {nombresMeses[navMonth]} {navYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer text-slate-500 hover:text-[#8DA78E] dark:hover:text-[#A3BEB0] transition-colors"
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

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  stock_actual: number;
  stock_minimo: number;
  imagen_url?: string | null;
  imagen_url_2?: string | null;
  imagen_url_3?: string | null;
  activo: boolean;
}

interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
}

interface Venta {
  id: string;
  created_at: string;
  numero_recibo: number;
  cliente_id: string | null;
  usuario_id: string;
  tipo_venta: string;
  total: number;
  observaciones: string | null;
  ven_clientes?: {
    nombre: string;
    nit: string;
  } | null;
  profiles?: {
    nombre: string;
  } | null;
}

export function VerVentas() {
  const [activeTab, setActiveTab] = useState<"pos" | "historial">("pos");
  
  // Datos maestros
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Punto de Venta (POS)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [productoBusqueda, setProductoBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantSeleccionada, setCantSeleccionada] = useState<number | "">(1);
  const [mostrarSugerenciasProd, setMostrarSugerenciasProd] = useState(false);
  
  // Clientes en POS
  const [clienteBusqueda, setClienteBusqueda] = useState("Consumidor Final");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mostrarSugerenciasCli, setMostrarSugerenciasCli] = useState(false);
  const [isCrearClienteOpen, setIsCrearClienteOpen] = useState(false);
  
  // Cobro
  const [tipoVenta, setTipoVenta] = useState<"Contado" | "Crédito">("Contado");
  const [mostrarMetodoPagoDropdown, setMostrarMetodoPagoDropdown] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [isProcesandoVenta, setIsProcesandoVenta] = useState(false);

  // Impresión de Ticket
  const reciboCaptureRef = useRef<HTMLDivElement>(null);
  const [ticketParaImprimir, setTicketParaImprimir] = useState<{
    venta: Venta;
    detalles: any[];
    clienteCompleto?: Cliente | null;
  } | null>(null);
  const [reciboCaptura, setReciboCaptura] = useState<{
    venta: Venta;
    detalles: any[];
    clienteCompleto?: Cliente | null;
  } | null>(null);

  // Modal de Recibo post-cobro
  const [reciboModalData, setReciboModalData] = useState<{
    venta: Venta;
    detalles: any[];
    clienteCompleto?: Cliente | null;
  } | null>(null);

  useEffect(() => {
    if (ticketParaImprimir) {
      const timer = setTimeout(() => {
        window.print();
        setTicketParaImprimir(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [ticketParaImprimir]);

  // Historial y Detalle
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [tipoPagoSwitch, setTipoPagoSwitch] = useState<"todos" | "contado" | "credito">("todos");
  const [tipoFiltroFecha, setTipoFiltroFecha] = useState<"dia" | "semana" | "rango">("dia");

  const getLocalDateString = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const [fechaDia, setFechaDia] = useState<string>(getLocalDateString());
  const [imagenAmpliadaUrl, setImagenAmpliadaUrl] = useState<string | null>(null);
  const [fechaRangoDesde, setFechaRangoDesde] = useState<string>("");
  const [fechaRangoHasta, setFechaRangoHasta] = useState<string>("");

  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [mostrarSemanaDropdown, setMostrarSemanaDropdown] = useState(false);
  const [mostrarMesDropdown, setMostrarMesDropdown] = useState(false);

  const [currentPageVentas, setCurrentPageVentas] = useState(1);
  const [pageSizeVentas, setPageSizeVentas] = useState(10);
  const [mostrarPageSizeDropdownVentas, setMostrarPageSizeDropdownVentas] = useState(false);
  const pageSizeDropdownVentasRef = useRef<HTMLDivElement>(null);
  const [ventaDetalleSeleccionada, setVentaDetalleSeleccionada] = useState<Venta | null>(null);
  const [detallesDeVenta, setDetallesDeVenta] = useState<any[]>([]);
  const [isLoadingDetalles, setIsLoadingDetalles] = useState(false);
  const [editingDetalleId, setEditingDetalleId] = useState<string | null>(null);
  const [editingDetalleQty, setEditingDetalleQty] = useState<number>(0);
  const [editingDetallePrice, setEditingDetallePrice] = useState<number>(0);
  const [isSavingDetalle, setIsSavingDetalle] = useState(false);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [editingQty, setEditingQty] = useState<string>("");
  const [animateCart, setAnimateCart] = useState(false);

  const prodDropdownRef = useRef<HTMLDivElement>(null);
  const cliDropdownRef = useRef<HTMLDivElement>(null);
  const payDropdownRef = useRef<HTMLDivElement>(null);
  const semanaDropdownRef = useRef<HTMLDivElement>(null);
  const mesDropdownRef = useRef<HTMLDivElement>(null);
  const fechaDiaRef = useRef<HTMLInputElement>(null);
  const fechaRangoDesdeRef = useRef<HTMLInputElement>(null);
  const fechaRangoHastaRef = useRef<HTMLInputElement>(null);

  // Helper para SweetAlert con el tema del sistema (claro/oscuro)
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

  // Cargar datos del servidor
  const cargarDatos = async () => {
    setIsLoading(true);
    try {
      const dataMaster = await obtenerProductosYClientes();
      setProductos(dataMaster.productos as Producto[]);
      setClientes(dataMaster.clientes as Cliente[]);

      const dataVentas = await obtenerHistorialVentas();
      setVentas(dataVentas as any[]);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Error de Conexión",
        text: "No se pudieron obtener los datos de la base de datos.",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        ...getSwalThemeOpts()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Global barcode scanner listener
  useEffect(() => {
    if (activeTab !== "pos") return;
    
    let barcode = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea manually
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      const currentTime = Date.now();
      // If time between keystrokes is too long (>50ms), it's probably human typing, reset
      if (currentTime - lastKeyTime > 50) {
        barcode = ""; 
      }

      if (e.key === "Enter" && barcode.length > 0) {
        e.preventDefault();
        const query = barcode.toLowerCase();
        barcode = "";
        
        const exactMatch = productos.find(p => p.codigo?.toLowerCase() === query);
        if (exactMatch) {
          handleAgregarAlCarrito(exactMatch, 1);
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
      } else if (e.key.length === 1) { 
        barcode += e.key;
      }
      
      lastKeyTime = currentTime;
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [productos, activeTab]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (prodDropdownRef.current && !prodDropdownRef.current.contains(event.target as Node)) {
        setMostrarSugerenciasProd(false);
      }
      if (cliDropdownRef.current && !cliDropdownRef.current.contains(event.target as Node)) {
        setMostrarSugerenciasCli(false);
      }
      if (payDropdownRef.current && !payDropdownRef.current.contains(event.target as Node)) {
        setMostrarMetodoPagoDropdown(false);
      }
      if (semanaDropdownRef.current && !semanaDropdownRef.current.contains(event.target as Node)) {
        setMostrarSemanaDropdown(false);
      }
      if (mesDropdownRef.current && !mesDropdownRef.current.contains(event.target as Node)) {
        setMostrarMesDropdown(false);
      }
      if (pageSizeDropdownVentasRef.current && !pageSizeDropdownVentasRef.current.contains(event.target as Node)) {
        setMostrarPageSizeDropdownVentas(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar detalles de venta cuando se selecciona una del historial
  const cargarDetallesVenta = async (venta: Venta) => {
    setVentaDetalleSeleccionada(venta);
    setIsLoadingDetalles(true);
    try {
      const details = await obtenerDetalleVenta(venta.id);
      setDetallesDeVenta(details);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetalles(false);
    }
  };

  // Autocompletado de productos
  const sugerenciasProductos = productos.filter((p) => {
    if (!productoBusqueda) return false;
    const query = productoBusqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(query) ||
      (p.codigo && p.codigo.toLowerCase().includes(query))
    );
  });

  // Autocompletado de clientes
  const sugerenciasClientes = clientes.filter((c) => {
    if (!clienteBusqueda || clienteBusqueda === "Consumidor Final") return false;
    const query = clienteBusqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(query) ||
      (c.nit && c.nit.toLowerCase().includes(query))
    );
  });

  // Agregar item al carrito
  const handleAgregarAlCarrito = (productoOverride?: Producto, cantOverride?: number) => {
    const prod = productoOverride || productoSeleccionado;
    if (!prod) return;
    
    const cant = cantOverride !== undefined ? cantOverride : (Number(cantSeleccionada) || 0);
    // Validar cantidad
    if (cant <= 0) return;
    
    setCarrito(prev => {
      const itemExistente = prev.find((i) => i.producto.id === prod.id);
      const cantidadFinal = (itemExistente?.cantidad || 0) + cant;

      if (cantidadFinal > prod.stock_actual) {
        Swal.fire({
          title: "Stock Insuficiente",
          text: `No hay suficientes existencias para agregar ${cant} unidad(es). Disponibles en inventario: ${prod.stock_actual}.`,
          icon: "warning",
          ...getSwalThemeOpts()
        });
        return prev;
      }

      if (itemExistente) {
        return prev.map((i) =>
          i.producto.id === prod.id
            ? {
                ...i,
                cantidad: cantidadFinal,
                subtotal: cantidadFinal * i.precio_aplicado
              }
            : i
        );
      } else {
        return [
          ...prev,
          {
            producto: prod,
            cantidad: cant,
            precio_aplicado: prod.precio_base,
            subtotal: cant * prod.precio_base
          }
        ];
      }
    });

    // Disparar animación de carrito
    setAnimateCart(true);
    setTimeout(() => setAnimateCart(false), 500);

    // Toast de confirmación
    Swal.fire({
      toast: true,
      position: "top-end",
      title: `Se añadió ${prod.nombre}`,
      icon: "success",
      background: "#22c55e",
      color: "#ffffff",
      showConfirmButton: false,
      timer: 3000,
      iconColor: "#ffffff"
    });

    // Limpiar selección de producto
    setProductoSeleccionado(null);
    setProductoBusqueda("");
    setCantSeleccionada(1);
    setMostrarSugerenciasProd(false);
  };

  // Ajustar cantidad de item en carrito
  const handleAjustarCantidad = (index: number, delta: number) => {
    const item = carrito[index];
    const nuevaCant = item.cantidad + delta;

    if (nuevaCant <= 0) {
      handleEliminarDelCarrito(index);
      return;
    }

    if (nuevaCant > item.producto.stock_actual) {
      Swal.fire({
        title: "Stock Insuficiente",
        text: `Solo hay ${item.producto.stock_actual} unidades disponibles en el inventario.`,
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    setCarrito(
      carrito.map((i, idx) =>
        idx === index
          ? {
              ...i,
              cantidad: nuevaCant,
              subtotal: nuevaCant * i.precio_aplicado
            }
          : i
      )
    );
  };

  const handleEliminarDelCarrito = async (index: number) => {
    const item = carrito[index];
    const confirm = await Swal.fire({
      title: "¿Eliminar del carrito?",
      text: `¿Estás seguro de que deseas eliminar "${item.producto.nombre}" de esta venta?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    });

    if (confirm.isConfirmed) {
      setCarrito(carrito.filter((_, idx) => idx !== index));
    }
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // Registrar la venta en la base de datos
  const handleFinalizarVenta = async () => {
    if (carrito.length === 0) {
      Swal.fire({
        title: "Venta vacía",
        text: "Por favor agrega productos a la venta antes de cobrar.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    const resConfirm = await Swal.fire({
      title: "¿Confirmar cobro?",
      text: `Se registrará la venta por un total de Q${totalCarrito.toFixed(2)} (${tipoVenta}).`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, registrar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    });

    if (!resConfirm.isConfirmed) return;

    setIsProcesandoVenta(true);
    try {
      const itemsFormatted: ItemVentaInput[] = carrito.map((i) => ({
        producto_id: i.producto.id,
        cantidad: i.cantidad,
        precio_aplicado: i.precio_aplicado,
        subtotal: i.subtotal
      }));

      const res = await crearVenta({
        cliente_id: clienteSeleccionado?.id || null,
        tipo_venta: tipoVenta,
        total: totalCarrito,
        observaciones: observaciones.trim() || null,
        items: itemsFormatted
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      // Generar el objeto de venta para impresión inmediata
      const ventaObj: Venta = {
        id: res.venta_id!,
        created_at: new Date().toISOString(),
        numero_recibo: res.numero_recibo!,
        cliente_id: clienteSeleccionado?.id || null,
        usuario_id: "",
        tipo_venta: tipoVenta,
        total: totalCarrito,
        observaciones: observaciones.trim() || null,
        ven_clientes: clienteSeleccionado
          ? { nombre: clienteSeleccionado.nombre, nit: clienteSeleccionado.nit }
          : null
      };

      const freshDetails = carrito.map((i) => ({
        cantidad: i.cantidad,
        precio_aplicado: i.precio_aplicado,
        subtotal: i.subtotal,
        inv_productos: {
          nombre: i.producto.nombre,
          codigo: i.producto.codigo
        }
      }));

      // Cargar historial fresco
      cargarDatos();
      
      const clientSave = clienteSeleccionado;

      // Limpiar el POS
      setCarrito([]);
      setClienteSeleccionado(null);
      setClienteBusqueda("Consumidor Final");
      setObservaciones("");

      // Mostrar el modal de recibo con los detalles del pago
      setReciboModalData({
        venta: ventaObj,
        detalles: freshDetails,
        clienteCompleto: clientSave
      });
    } catch (err: any) {
      Swal.fire({
        title: "Error al procesar",
        text: err.message || "No se pudo completar el cobro.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsProcesandoVenta(false);
    }
  };

  const handleAnularVenta = async (ventaId: string) => {
    const resConfirm = await Swal.fire({
      title: "¿Anular esta venta?",
      text: "Esta acción devolverá los productos vendidos al inventario y eliminará el registro de venta. No se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444"
    });

    if (!resConfirm.isConfirmed) return;

    setIsLoading(true);
    try {
      const res = await anularVenta(ventaId);
      if (!res.success) {
        throw new Error(res.error);
      }

      Swal.fire({
        title: "¡Anulada!",
        text: "La venta ha sido anulada exitosamente y el stock ha sido restablecido.",
        icon: "success",
        ...getSwalThemeOpts()
      });

      cargarDatos();
    } catch (err: any) {
      Swal.fire({
        title: "Error al anular",
        text: err.message || "No se pudo anular la venta.",
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditarVenta = async (venta: Venta) => {
    if (carrito.length > 0) {
      const confirmOverwrite = await Swal.fire({
        title: "Carrito con productos",
        text: "Tienes productos en el Punto de Venta actual. Editar esta venta los reemplazará.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, reemplazar",
        cancelButtonText: "Cancelar",
        ...getSwalThemeOpts()
      });
      if (!confirmOverwrite.isConfirmed) return;
    }

    const resConfirm = await Swal.fire({
      title: "¿Editar esta venta?",
      text: "Esto anulará la venta original (devolviendo el stock) y cargará los productos en el Punto de Venta para modificarlos.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, editar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    });

    if (!resConfirm.isConfirmed) return;

    setIsLoading(true);
    try {
      // 1. Obtener detalles de la venta original antes de borrarla
      const detalles = await obtenerDetalleVenta(venta.id);
      if (!detalles || detalles.length === 0) {
        throw new Error("No se pudieron cargar los detalles de la venta.");
      }

      // 2. Anular la venta original (esto repone el stock en base de datos)
      const resAnulacion = await anularVenta(venta.id);
      if (!resAnulacion.success) {
        throw new Error(resAnulacion.error);
      }

      // 3. Recargar datos maestros (productos actualizados con el stock repuesto)
      const dataMaster = await obtenerProductosYClientes();
      const nuevosProductos: Producto[] = dataMaster.productos as Producto[];
      setProductos(nuevosProductos);
      setClientes(dataMaster.clientes as Cliente[]);
      
      // Recargar historial
      const dataVentas = await obtenerHistorialVentas();
      setVentas(dataVentas as any[]);

      // 4. Mapear y cargar al carrito
      const nuevosItemsCarrito: ItemCarrito[] = detalles.map((d: any) => {
        const prodEncontrado = nuevosProductos.find(p => p.id === d.producto_id);
        
        return {
          producto: prodEncontrado || {
            id: d.producto_id,
            codigo: d.inv_productos?.codigo || "",
            nombre: d.inv_productos?.nombre || "Producto",
            descripcion: "",
            precio_base: d.precio_aplicado,
            stock_actual: d.cantidad,
            stock_minimo: 0,
            activo: true
          },
          cantidad: d.cantidad,
          precio_aplicado: d.precio_aplicado,
          subtotal: d.subtotal
        };
      });

      setCarrito(nuevosItemsCarrito);
      
      // Cargar datos de cliente si existe
      if (venta.cliente_id) {
        const cliente = dataMaster.clientes.find((c: any) => c.id === venta.cliente_id);
        if (cliente) {
          setClienteSeleccionado(cliente as Cliente);
          setClienteBusqueda(cliente.nombre);
        }
      } else {
        setClienteSeleccionado(null);
        setClienteBusqueda("Consumidor Final");
      }

      setTipoVenta(venta.tipo_venta === "Crédito" ? "Crédito" : "Contado");
      setObservaciones(venta.observaciones || "");
      
      // Ir a la pestaña de POS
      setActiveTab("pos");

      Swal.fire({
        title: "Venta cargada",
        text: "La venta ha sido cargada en el Punto de Venta. Modifica los productos y finaliza el cobro para guardar los cambios.",
        icon: "success",
        ...getSwalThemeOpts()
      });

    } catch (err: any) {
      Swal.fire({
        title: "Error al editar",
        text: err.message || "No se pudo cargar la venta para edición.",
        icon: "error",
        ...getSwalThemeOpts()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintDirectly = async (venta: Venta) => {
    try {
      const detalles = await obtenerDetalleVenta(venta.id);
      setTicketParaImprimir({ venta, detalles });
    } catch (err) {
      console.error("Error al imprimir directamente:", err);
    }
  };

  const shareWhatsAppAsImage = async (venta: any, detalles: any[], clienteCompleto?: any) => {
    try {
      Swal.fire({
        title: "Generando recibo...",
        text: "Preparando imagen del recibo para compartir...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        ...getSwalThemeOpts(),
      });

      setReciboCaptura({ venta, detalles, clienteCompleto });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const node = reciboCaptureRef.current;
      if (!node) {
        throw new Error("No se pudo renderizar el recibo.");
      }

      const blob = await toBlob(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#F9F6F0",
      });

      setReciboCaptura(null);

      if (!blob) {
        throw new Error("No se pudo generar la imagen del recibo.");
      }

      const code = obtenerCodigoRecibo(venta.id);
      const clientName =
        clienteCompleto?.nombre || venta.ven_clientes?.nombre || "Consumidor final";

      try {
        const supabase = createClient();
        const filePath = `tickets/recibo_${venta.id}.png`;

        const { error: uploadError } = await supabase.storage
          .from("Imagenes_Farmacia")
          .upload(filePath, blob, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("Imagenes_Farmacia").getPublicUrl(filePath);

        Swal.close();

        const whatsAppText =
          `*FARMACIA SALUD*\n` +
          `*Recibo de Venta:* #${code}\n` +
          `*Cliente:* ${clientName}\n` +
          `*Total:* Q${venta.total.toFixed(2)}\n\n` +
          `📄 *Ver recibo:* ${publicUrl}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppText)}`, "_blank");
      } catch (err) {
        console.error("Error al subir a Supabase Storage:", err);
        Swal.close();

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          Swal.fire({
            title: "Recibo copiado",
            text: "Se copió al portapapeles. Abre WhatsApp y presiona Ctrl + V.",
            icon: "info",
            confirmButtonText: "Ir a WhatsApp",
            ...getSwalThemeOpts(),
          }).then(() => {
            window.open("https://web.whatsapp.com/", "_blank");
          });
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Recibo_${code}.png`;
          a.click();
          URL.revokeObjectURL(url);
          Swal.fire({
            title: "Recibo descargado",
            text: "Se descargó la imagen del recibo. Compártela en WhatsApp.",
            icon: "info",
            confirmButtonText: "Ir a WhatsApp",
            ...getSwalThemeOpts(),
          }).then(() => {
            window.open("https://web.whatsapp.com/", "_blank");
          });
        }
      }
    } catch (error) {
      console.error("Error al generar e iniciar compartir por WhatsApp:", error);
      setReciboCaptura(null);
      Swal.close();
      Swal.fire({
        title: "Error",
        text: "No se pudo generar la imagen del recibo.",
        icon: "error",
        ...getSwalThemeOpts(),
      });
    }
  };

  const handleShareWhatsAppDirectly = async (venta: Venta) => {
    try {
      const details = await obtenerDetalleVenta(venta.id);
      await shareWhatsAppAsImage(venta, details);
    } catch (err) {
      console.error("Error al compartir por WhatsApp:", err);
    }
  };

  const handleSaveDetalleVentaDirecto = async (detalle: any) => {
    if (editingDetalleQty <= 0 || editingDetallePrice < 0) {
      Swal.fire({
        title: "Valores inválidos",
        text: "La cantidad debe ser mayor a 0 y el precio no puede ser negativo.",
        icon: "error",
        ...getSwalThemeOpts()
      });
      return;
    }

    setIsSavingDetalle(true);
    try {
      const res = await editarDetalleVentaDirecto({
        detalleId: detalle.id,
        ventaId: ventaDetalleSeleccionada!.id,
        productoId: detalle.producto_id,
        nuevaCantidad: editingDetalleQty,
        nuevoPrecio: editingDetallePrice
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      // Actualizar total localmente
      setVentaDetalleSeleccionada((prev) => prev ? { ...prev, total: res.nuevoTotal! } : null);
      
      // Volver a cargar detalles para refrescar listado
      const details = await obtenerDetalleVenta(ventaDetalleSeleccionada!.id);
      setDetallesDeVenta(details);

      // Recargar datos principales para actualizar la tabla del historial y stock
      cargarDatos();

      Swal.fire({
        title: "¡Guardado!",
        text: "El producto de la venta ha sido editado correctamente sin anular la venta.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });

      setEditingDetalleId(null);
    } catch (err: any) {
      Swal.fire({
        title: "Error al guardar",
        text: err.message || "No se pudo actualizar el producto en la venta.",
        icon: "error",
        ...getSwalThemeOpts()
      });
    } finally {
      setIsSavingDetalle(false);
    }
  };

  const handleEliminarProductoDeVenta = async (detalle: any) => {
    Swal.fire({
      title: "¿Eliminar producto?",
      text: `¿Estás seguro de que deseas eliminar "${detalle.inv_productos?.nombre}" de esta venta? Se devolverán ${detalle.cantidad} unidades al stock del inventario.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts()
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({
            title: "Procesando...",
            text: "Eliminando producto y devolviendo stock...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
            ...getSwalThemeOpts()
          });

          const res = await eliminarDetalleVentaDirecto({
            detalleId: detalle.id,
            ventaId: ventaDetalleSeleccionada!.id,
            productoId: detalle.producto_id,
            cantidadADevolver: detalle.cantidad
          });

          Swal.close();

          if (res.success) {
            Swal.fire({
              title: "¡Eliminado!",
              text: "El producto ha sido removido y las unidades se devolvieron al stock.",
              icon: "success",
              ...getSwalThemeOpts()
            });

            // Actualizar detalles locales
            const updatedDetails = detallesDeVenta.filter((d: any) => d.id !== detalle.id);
            setDetallesDeVenta(updatedDetails);

            // Actualizar cabecera local de la venta
            setVentaDetalleSeleccionada((prev) => prev ? { ...prev, total: res.nuevoTotal! } : null);

            // Recargar datos principales para actualizar la tabla e inventarios
            cargarDatos();
          } else {
            Swal.fire({
              title: "Error",
              text: res.error || "No se pudo eliminar el producto.",
              icon: "error",
              ...getSwalThemeOpts()
            });
          }
        } catch (err: any) {
          Swal.close();
          console.error("Error al eliminar producto del detalle:", err);
          Swal.fire({
            title: "Error",
            text: err.message || "Ocurrió un error inesperado.",
            icon: "error",
            ...getSwalThemeOpts()
          });
        }
      }
    });
  };

  // Filtrado de Historial
  const ventasFiltradas = ventas.filter((v) => {
    const query = busquedaHistorial.toLowerCase();
    const matchesSearch =
      obtenerCodigoRecibo(v.id).toLowerCase().includes(query) ||
      (v.ven_clientes?.nombre || "consumidor final").toLowerCase().includes(query) ||
      (v.observaciones || "").toLowerCase().includes(query);

    let matchesPago = true;
    if (tipoPagoSwitch === "contado") {
      matchesPago = v.tipo_venta === "Efectivo" || v.tipo_venta === "Tarjeta";
    } else if (tipoPagoSwitch === "credito") {
      matchesPago = v.tipo_venta === "Crédito";
    }

    let matchesFecha = true;
    if (v.created_at) {
      const vDate = new Date(v.created_at);
      const offset = vDate.getTimezoneOffset();
      const vLocalDate = new Date(vDate.getTime() - offset * 60 * 1000);
      const vLocalDateStr = vLocalDate.toISOString().split("T")[0]; // YYYY-MM-DD

      if (tipoFiltroFecha === "dia") {
        matchesFecha = vLocalDateStr === fechaDia;
      } else if (tipoFiltroFecha === "semana") {
        if (selectedWeekIndex === -1) {
          // Todo el mes
          const mesStr = String(activeMonth + 1).padStart(2, "0");
          const prefix = `${activeYear}-${mesStr}`;
          matchesFecha = vLocalDateStr.startsWith(prefix);
        } else {
          const semanas = obtenerSemanasDelMes(activeMonth, activeYear);
          const sem = semanas[selectedWeekIndex];
          if (sem) {
            matchesFecha = vLocalDateStr >= sem.desde && vLocalDateStr <= sem.hasta;
          }
        }
      } else if (tipoFiltroFecha === "rango") {
        const desde = fechaRangoDesde || "0000-00-00";
        const hasta = fechaRangoHasta || "9999-12-31";
        matchesFecha = vLocalDateStr >= desde && vLocalDateStr <= hasta;
      }
    } else {
      matchesFecha = false;
    }

    return matchesSearch && matchesPago && matchesFecha;
  });

  const totalVentasItems = ventasFiltradas.length;
  const totalVentasPages = Math.ceil(totalVentasItems / pageSizeVentas) || 1;
  const activeVentasPage = Math.min(currentPageVentas, totalVentasPages);

  const ventasPaginadas = ventasFiltradas.slice(
    (activeVentasPage - 1) * pageSizeVentas,
    activeVentasPage * pageSizeVentas
  );



  // Generación de Factura PDF
  const exportarFacturaPDF = (venta: Venta, detalles: any[]) => {
    try {
      const doc = new jsPDF({
        unit: "mm",
        format: [80, 150] // Formato ticket de 80mm de ancho
      });

      // Margen e info
      const clientName = venta.ven_clientes?.nombre || "Consumidor Final";
      const clientNit = venta.ven_clientes?.nit || "C/F";
      const dateFormatted = new Date(venta.created_at).toLocaleString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Título / Info Farmacia
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(82, 93, 83); // Color Olivo
      doc.text("FARMACIA SALUD", 40, 10, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Guatemala", 40, 14, { align: "center" });

      doc.setDrawColor(193, 209, 197); // Color salvia suave
      doc.line(5, 17, 75, 17);

      // Info Recibo
      const codigoRecibo = obtenerCodigoRecibo(venta.id);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(82, 93, 83);
      doc.text(`RECIBO DE VENTA #${codigoRecibo}`, 5, 23);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text(`Fecha: ${dateFormatted}`, 5, 28);
      doc.text(`Cliente: ${clientName}`, 5, 33);
      doc.text(`NIT: ${clientNit}`, 5, 38);
      doc.text(`Pago: ${venta.tipo_venta}`, 5, 43);

      doc.line(5, 46, 75, 46);

      // Tabla de items
      autoTable(doc, {
        startY: 48,
        head: [["Cant", "Detalle", "Precio", "Sub"]],
        body: detalles.map((d) => [
          d.cantidad,
          d.inv_productos?.nombre || "Pedido",
          `Q${d.precio_aplicado.toFixed(2)}`,
          `Q${d.subtotal.toFixed(2)}`
        ]),
        theme: "plain",
        styles: {
          fontSize: 7,
          cellPadding: 1,
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 35 },
          2: { cellWidth: 12, halign: "right" },
          3: { cellWidth: 15, halign: "right" }
        },
        headStyles: {
          fontStyle: "bold",
          fillColor: [245, 245, 241],
          textColor: [82, 93, 83]
        },
        margin: { left: 4, right: 4 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 5;

      doc.line(5, finalY, 75, finalY);

      // Totales
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(82, 93, 83);
      doc.text(`TOTAL A PAGAR: Q${venta.total.toFixed(2)}`, 75, finalY + 6, { align: "right" });

      if (venta.observaciones) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`Notas: ${venta.observaciones}`, 5, finalY + 12);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("¡Gracias por su compra!", 40, finalY + 20, { align: "center" });

      doc.save(`Recibo_FarmaciaSalud_${codigoRecibo}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
    }
  };



  return (
    <div className="w-full flex flex-col gap-6 p-4 md:p-6 pt-32 md:pt-24 min-h-screen">
      {/* Modales */}
      <CrearCliente
        isOpen={isCrearClienteOpen}
        onClose={() => setIsCrearClienteOpen(false)}
        onSuccess={cargarDatos}
      />

      {/* Modal de Confirmación de Pago y Recibo */}
      <AnimatePresence>
        {reciboModalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] min-h-0"
            >
              {/* Header del Modal */}
              <div className="shrink-0 bg-[#8DA78E] dark:bg-[#525D53] p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider">¡Cobro Exitoso!</h3>
                  <p className="text-[10px] text-white/80 font-medium">Venta registrada bajo el Recibo #{obtenerCodigoRecibo(reciboModalData.venta.id)}</p>
                </div>
                <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Receipt className="size-5 text-white" />
                </div>
              </div>

              {/* Contenido / Vista Previa del Recibo */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-zinc-50 dark:bg-zinc-950">
                <div className="p-6">
                  <div className="rounded-2xl overflow-hidden border border-[#525D53]/15 shadow-sm">
                    <ReciboVenta
                      {...buildReciboProps(
                        reciboModalData.venta,
                        reciboModalData.detalles,
                        reciboModalData.clienteCompleto,
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Footer con Acciones */}
              <div className="shrink-0 p-5 bg-zinc-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setTicketParaImprimir({
                      venta: reciboModalData.venta,
                      detalles: reciboModalData.detalles,
                      clienteCompleto: reciboModalData.clienteCompleto,
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-200 dark:hover:bg-zinc-300 dark:text-zinc-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-transparent"
                >
                  <Printer className="size-4" /> Imprimir Ticket
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      exportarFacturaPDF(reciboModalData.venta, reciboModalData.detalles);
                    }}
                    className="py-2 px-3 rounded-lg border border-slate-350 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileDown className="size-4" /> Descargar PDF
                  </button>

                  <button
                    onClick={() => {
                      shareWhatsAppAsImage(reciboModalData.venta, reciboModalData.detalles, reciboModalData.clienteCompleto);
                    }}
                    className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="size-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg> WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => setReciboModalData(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-800 hover:bg-slate-200/50 dark:hover:bg-zinc-900/50 text-slate-700 dark:text-slate-350 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Nueva Venta / Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0 size-12 rounded-2xl bg-[#8DA78E]/10 border border-[#8DA78E]/20 flex items-center justify-center">
            <ShoppingCart className="size-6 text-[#8DA78E] dark:text-[#A3BEB0]" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8DA78E] dark:text-[#A3BEB0]">Módulo</p>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none">
              Área de Ventas
            </h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#F5F5F1] dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("pos")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "pos"
                ? "bg-[#8DA78E] text-[#F5F5F1] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Punto de Venta
          </button>
          <button
            onClick={() => setActiveTab("historial")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "historial"
                ? "bg-[#8DA78E] text-[#F5F5F1] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Historial de Ventas
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === "pos" ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* POS Panel (Llenado de datos) */}
          <div className="w-full lg:w-[30%] shrink-0 flex flex-col gap-4">
            <div className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5 flex flex-col gap-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 border-b border-[#C1D1C5]/30 pb-2">
                Punto de Venta
              </h2>

              {/* 1. Cliente */}
              <div className="w-full relative text-left" ref={cliDropdownRef}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Seleccionar Cliente
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={clienteBusqueda}
                    onChange={(e) => {
                      setClienteBusqueda(e.target.value);
                      setMostrarSugerenciasCli(true);
                      if (!e.target.value) setClienteSeleccionado(null);
                    }}
                    onFocus={() => {
                      setMostrarSugerenciasCli(true);
                      if (clienteBusqueda === "Consumidor Final") {
                        setClienteBusqueda("");
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!clienteSeleccionado && !clienteBusqueda) {
                          setClienteBusqueda("Consumidor Final");
                        }
                      }, 200);
                    }}
                    placeholder="Nombre o NIT del cliente..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors h-9"
                  />
                </div>

                {/* Dropdown sugerencias */}
                <AnimatePresence>
                  {mostrarSugerenciasCli && sugerenciasClientes.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-left"
                    >
                      {sugerenciasClientes.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setClienteSeleccionado(c);
                            setClienteBusqueda(c.nombre);
                            setMostrarSugerenciasCli(false);
                          }}
                          className="w-full px-4 py-2 border-b border-slate-100 dark:border-slate-900 hover:bg-[#8DA78E]/10 dark:hover:bg-[#8DA78E]/20 text-left flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-950 dark:text-white">{c.nombre}</p>
                            <p className="text-[10px] text-slate-500">Tel: {c.telefono || "Sin Teléfono"}</p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            NIT: {c.nit || "C/F"}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Método de Pago */}
              <div className="w-full relative text-left" ref={payDropdownRef}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Método de Pago
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarMetodoPagoDropdown(!mostrarMetodoPagoDropdown)}
                  className="w-full flex items-center justify-center px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-all cursor-pointer h-[38px] hover:border-[#8DA78E] relative"
                >
                  <span className="font-bold">
                    {tipoVenta === "Contado"
                      ? "Contado"
                      : "Crédito"}
                  </span>
                  <ChevronDown className="absolute right-3 size-4 text-slate-400" />
                </button>

                <AnimatePresence>
                  {mostrarMetodoPagoDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5"
                    >
                      {[
                        { id: "Contado", label: "Contado" },
                        { id: "Crédito", label: "Crédito" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setTipoVenta(opt.id as any);
                            setMostrarMetodoPagoDropdown(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                            tipoVenta === opt.id
                              ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0]"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {tipoVenta === opt.id && <Check className="size-3.5" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Producto y Cantidad */}
              <div className="flex flex-col gap-4 w-full">
                {/* Autocomplete Producto */}
                <div className="w-full relative text-left" ref={prodDropdownRef}>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Búsqueda manual de producto
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
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
                            handleAgregarAlCarrito(exactMatch, 1);
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
                            setProductoBusqueda("");
                          }
                        }
                      }}
                      placeholder="Nombre o código de barras..."
                      className="w-full pl-12 pr-4 py-4 border rounded-xl text-base bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors h-14"
                    />
                  </div>

                  {/* Dropdown sugerencias */}
                  <AnimatePresence>
                    {mostrarSugerenciasProd && sugerenciasProductos.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 mt-1 max-h-[380px] overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-left"
                      >
                        {sugerenciasProductos.map((p) => {
                          const isLow = p.stock_actual <= p.stock_minimo;
                          const isOut = p.stock_actual <= 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setProductoSeleccionado(p);
                                setProductoBusqueda(p.nombre);
                                setMostrarSugerenciasProd(false);
                              }}
                              disabled={isOut}
                              className={`w-full px-4 py-2.5 border-b border-slate-100 dark:border-slate-900 hover:bg-[#8DA78E]/10 dark:hover:bg-[#8DA78E]/20 text-left flex items-center justify-between text-xs cursor-pointer ${
                                isOut ? "opacity-40 cursor-not-allowed" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {p.imagen_url ? (
                                  <img
                                    src={createClient().storage.from("Imagenes_Farmacia").getPublicUrl(p.imagen_url).data.publicUrl}
                                    alt={p.nombre}
                                    className="w-10 h-10 object-cover rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800"
                                  />
                                ) : (
                                  <div className="w-10 h-10 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-zinc-800 text-slate-400">
                                    <Search className="size-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-950 dark:text-white">{p.nombre}</p>
                                  <p className="text-[10px] text-slate-500">Cód: {p.codigo || "C/F"}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-[#8DA78E]">Q{p.precio_base.toFixed(2)}</p>
                                <p className={`text-[9px] font-bold ${isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-slate-400"}`}>
                                  Stock: {p.stock_actual}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cantidad Selector + Agregar */}
                <div className="flex items-end gap-3 w-full">
                  <div className="w-[40%]">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 text-left truncate">
                      Cantidad
                    </label>
                    <div className="flex items-center justify-between gap-0.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-zinc-900 px-0.5 h-10 w-full">
                      <button
                        type="button"
                        onClick={() => setCantSeleccionada(Math.max(1, (Number(cantSeleccionada) || 0) - 1))}
                        className="size-8 flex items-center justify-center hover:bg-slate-150 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400 rounded-md cursor-pointer shrink-0"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={cantSeleccionada}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setCantSeleccionada("");
                          } else {
                            const parsed = parseInt(val);
                            setCantSeleccionada(isNaN(parsed) ? 1 : Math.max(1, parsed));
                          }
                        }}
                        className="w-full text-center text-sm font-bold bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-0"
                      />
                      <button
                        type="button"
                        onClick={() => setCantSeleccionada((Number(cantSeleccionada) || 0) + 1)}
                        className="size-8 flex items-center justify-center hover:bg-slate-150 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400 rounded-md cursor-pointer shrink-0"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAgregarAlCarrito()}
                    disabled={!productoSeleccionado}
                    className="w-[60%] h-10 bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-40 disabled:hover:bg-[#8DA78E] text-[#F5F5F1] text-xs font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                  >
                    Añadir
                  </button>
                </div>

                {/* Vista previa de imagen del producto seleccionado */}
                <AnimatePresence>
                  {productoSeleccionado && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden mt-1"
                    >
                      <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm w-full">
                        <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Galería de Imágenes (3 Máx)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            productoSeleccionado.imagen_url,
                            productoSeleccionado.imagen_url_2,
                            productoSeleccionado.imagen_url_3
                          ].map((imgUrl, imgIdx) => {
                            if (imgUrl) {
                              const fullUrl = createClient().storage.from("Imagenes_Farmacia").getPublicUrl(imgUrl).data.publicUrl;
                              return (
                                <img
                                  key={imgIdx}
                                  src={fullUrl}
                                  alt={`${productoSeleccionado.nombre} ${imgIdx + 1}`}
                                  onClick={() => setImagenAmpliadaUrl(fullUrl)}
                                  className="aspect-square w-full object-cover rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-800 shadow-xs cursor-pointer hover:opacity-85 transition-opacity"
                                />
                              );
                            } else {
                              return (
                                <div key={imgIdx} className="aspect-square w-full flex items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-zinc-950 text-slate-400">
                                  <Package className="size-4 opacity-50" />
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Carrito de Compras */}
          <div className="w-full lg:w-[70%] flex flex-col gap-4 font-mono">
            <motion.div
              animate={{ scale: animateCart ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl p-5 shadow-xs flex flex-col gap-4 min-h-[380px] h-auto"
            >
              <div className="flex items-center justify-between border-b border-[#C1D1C5]/30 pb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShoppingCart className="size-4 text-[#8DA78E]" /> Venta
                </h2>
                <span className="bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0] text-xs font-bold px-2 py-0.5 rounded-full">
                  {carrito.length} Producto(s)
                </span>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 space-y-2.5">
                <AnimatePresence initial={false}>
                  {carrito.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center py-8"
                    >
                      <ShoppingCart className="size-10 text-slate-400 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200">Venta vacía</p>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 max-w-[200px] leading-normal mt-1.5 text-center">
                        Busca y agrega productos desde el panel izquierdo.
                      </p>
                    </motion.div>
                  ) : (
                    carrito.map((item, idx) => (
                      <motion.div
                        key={item.producto.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/20 dark:border-zinc-800 rounded-xl p-3 flex flex-col gap-2.5 text-left"
                      >
                        {editingCartItemIndex === idx ? (
                          <div className="flex flex-col gap-2.5 w-full">
                            <h4 className="text-sm font-black text-slate-800 dark:text-white truncate">
                              Editar: {item.producto.nombre}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase text-slate-500">Precio Unitario</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editingPrice}
                                  onChange={(e) => setEditingPrice(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8DA78E]"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black uppercase text-slate-500">Cantidad</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editingQty}
                                  onChange={(e) => setEditingQty(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#8DA78E]"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => setEditingCartItemIndex(null)}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60 cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const newPrice = parseFloat(editingPrice);
                                  const newQty = parseInt(editingQty);
                                  if (isNaN(newPrice) || newPrice < 0 || isNaN(newQty) || newQty <= 0) {
                                    Swal.fire({
                                      title: "Valores inválidos",
                                      text: "Por favor ingresa un precio y una cantidad válidos.",
                                      icon: "error",
                                      ...getSwalThemeOpts()
                                    });
                                    return;
                                  }
                                  if (newQty > item.producto.stock_actual) {
                                    Swal.fire({
                                      title: "Stock Insuficiente",
                                      text: `Solo hay ${item.producto.stock_actual} unidades en inventario.`,
                                      icon: "warning",
                                      ...getSwalThemeOpts()
                                    });
                                    return;
                                  }
                                  setCarrito(prev => prev.map((it, i) => i === idx ? {
                                    ...it,
                                    cantidad: newQty,
                                    precio_aplicado: newPrice,
                                    subtotal: newQty * newPrice
                                  } : it));
                                  setEditingCartItemIndex(null);
                                }}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#8DA78E] text-[#F5F5F1] hover:bg-[#525D53] cursor-pointer transition-colors"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3 w-full">
                            {/* Product First Image */}
                            <div className="size-11 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                              {item.producto.imagen_url ? (
                                <img
                                  src={createClient().storage.from("Imagenes_Farmacia").getPublicUrl(item.producto.imagen_url).data.publicUrl}
                                  alt={item.producto.nombre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="size-5 text-slate-400 opacity-60" />
                              )}
                            </div>

                            {/* Name and Unit Price */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.producto.nombre}>
                                {item.producto.nombre}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-medium">
                                Unitario: Q{item.precio_aplicado.toFixed(2)}
                              </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-zinc-900 px-1 py-0.5 shrink-0">
                              <button
                                onClick={() => handleAjustarCantidad(idx, -1)}
                                className="size-5 flex items-center justify-center hover:bg-slate-150 dark:hover:bg-zinc-800 text-slate-500 rounded cursor-pointer"
                              >
                                <Minus className="size-2.5" />
                              </button>
                              <span className="w-6 text-center text-[11px] font-bold text-slate-900 dark:text-white">
                                {item.cantidad}
                              </span>
                              <button
                                onClick={() => handleAjustarCantidad(idx, 1)}
                                className="size-5 flex items-center justify-center hover:bg-slate-150 dark:hover:bg-zinc-800 text-slate-500 rounded cursor-pointer"
                              >
                                <Plus className="size-2.5" />
                              </button>
                            </div>

                            {/* Subtotal */}
                            <span className="text-xs font-black text-[#8DA78E] dark:text-[#A3BEB0] min-w-[75px] text-right shrink-0">
                              Q{item.subtotal.toFixed(2)}
                            </span>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEliminarDelCarrito(idx)}
                                className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                                title="Eliminar item"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Observaciones */}
              <div className="flex flex-col gap-1 text-left mt-2 border-t border-[#C1D1C5]/30 pt-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Observaciones / Comentarios
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas o especificaciones adicionales de esta venta..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors h-20 resize-none"
                />
              </div>

              {/* Totales */}
              <div className="border-t border-[#C1D1C5]/30 pt-3 mt-auto space-y-2 text-left">
                <div className="flex items-center justify-between text-sm font-black text-slate-800 dark:text-white pt-1">
                  <span>Total a pagar:</span>
                  <span className="text-base text-[#8DA78E]">Q{totalCarrito.toFixed(2)}</span>
                </div>
              </div>

              {/* Cobrar Button */}
              <div className="flex justify-end w-full mt-4">
                <button
                  type="button"
                  onClick={handleFinalizarVenta}
                  disabled={carrito.length === 0 || isProcesandoVenta}
                  className="w-full lg:w-auto px-6 py-3 bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-40 disabled:hover:bg-[#8DA78E] text-[#F5F5F1] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  {isProcesandoVenta ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-[#F5F5F1]/30 border-t-[#F5F5F1] animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="size-4.5" /> Registrar y Cobrar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* HISTORIAL DE VENTAS */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por recibo, cliente o notas de venta..."
                value={busquedaHistorial}
                onChange={(e) => {
                  setBusquedaHistorial(e.target.value);
                  setCurrentPageVentas(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-zinc-900/60 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/30 focus:border-[#8DA78E] transition-all"
              />
            </div>

            {/* Switch de pago segmentado horizontal */}
            <div className="flex bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/30 dark:border-zinc-800 p-1 rounded-xl w-fit h-[46px] items-center shrink-0">
              {[
                { id: "todos", label: "Todos" },
                { id: "contado", label: "Contado" },
                { id: "credito", label: "Crédito" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTipoPagoSwitch(opt.id as any);
                    setCurrentPageVentas(1);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer relative h-[38px] ${
                    tipoPagoSwitch === opt.id
                      ? "bg-[#8DA78E] text-[#F5F5F1] shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-row gap-3 items-center bg-[#F5F5F1]/50 dark:bg-[#525D53]/5 border border-[#C1D1C5]/60 dark:border-zinc-800/50 rounded-2xl px-4 py-3 text-left w-fit flex-wrap max-w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "dia", label: "Día" },
                { id: "semana", label: "Mes" },
                { id: "rango", label: "Rango" }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTipoFiltroFecha(opt.id as any);
                    setCurrentPageVentas(1);
                    if (opt.id === "semana") {
                      setSelectedWeekIndex(0);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    tipoFiltroFecha === opt.id
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
                {tipoFiltroFecha === "dia" && (
                  <motion.div
                    key="dia"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <CustomDatePicker
                      value={fechaDia}
                      onChange={(val) => {
                        setFechaDia(val);
                        setCurrentPageVentas(1);
                      }}
                      align="right"
                    />
                  </motion.div>
                )}

                {tipoFiltroFecha === "semana" && (
                  <motion.div
                    key="semana"
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
                          if (activeMonth === 0) {
                            setActiveMonth(11);
                            setActiveYear(activeYear - 1);
                          } else {
                            setActiveMonth(activeMonth - 1);
                          }
                          setSelectedWeekIndex(0);
                          setCurrentPageVentas(1);
                        }}
                        className="size-4.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
                      >
                        <ChevronLeft className="size-3" />
                      </button>
                      
                      <div className="relative" ref={mesDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setMostrarMesDropdown(!mostrarMesDropdown)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#525D53] dark:text-[#A3BEB0] min-w-[95px] justify-center capitalize px-1 py-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/60 cursor-pointer transition-all"
                        >
                          <Calendar className="size-3 text-[#8DA78E]" />
                          <span>
                            {new Date(activeYear, activeMonth).toLocaleString("es-GT", { month: "long" })} {activeYear}
                          </span>
                          <ChevronDown className="size-3 text-slate-400" />
                        </button>
                        
                        <AnimatePresence>
                          {mostrarMesDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3 min-w-[200px]"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-2 mb-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveYear(activeYear - 1)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer text-slate-500"
                                >
                                  <ChevronLeft className="size-3" />
                                </button>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{activeYear}</span>
                                <button
                                  type="button"
                                  onClick={() => setActiveYear(activeYear + 1)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer text-slate-500"
                                >
                                  <ChevronRight className="size-3" />
                                </button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1 text-center">
                                {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((monthName, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setActiveMonth(idx);
                                      setSelectedWeekIndex(0);
                                      setCurrentPageVentas(1);
                                      setMostrarMesDropdown(false);
                                    }}
                                    className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      activeMonth === idx
                                        ? "bg-[#8DA78E] text-[#F5F5F1] shadow-xs"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                    }`}
                                  >
                                    {monthName}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeMonth === 11) {
                            setActiveMonth(0);
                            setActiveYear(activeYear + 1);
                          } else {
                            setActiveMonth(activeMonth + 1);
                          }
                          setSelectedWeekIndex(0);
                          setCurrentPageVentas(1);
                        }}
                        className="size-4.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
                      >
                        <ChevronRight className="size-3" />
                      </button>
                    </div>

                    {/* Dropdown de semanas */}
                    <div className="relative" ref={semanaDropdownRef}>
                      {(() => {
                        const semanas = obtenerSemanasDelMes(activeMonth, activeYear);
                        const semSeleccionada = semanas[selectedWeekIndex] || semanas[0];
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => setMostrarSemanaDropdown(!mostrarSemanaDropdown)}
                              className="px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-[11px] font-bold text-[#525D53] dark:text-[#A3BEB0] transition-all cursor-pointer flex items-center gap-1.5 justify-between min-w-[130px] h-[34px]"
                            >
                              <span>{selectedWeekIndex === -1 ? "Todas las semanas" : (semSeleccionada ? semSeleccionada.label : "Seleccionar semana")}</span>
                              <ChevronDown className="size-3.5 text-slate-400" />
                            </button>

                            <AnimatePresence>
                              {mostrarSemanaDropdown && (
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
                                      setSelectedWeekIndex(-1);
                                      setCurrentPageVentas(1);
                                      setMostrarSemanaDropdown(false);
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                                      selectedWeekIndex === -1
                                        ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                    }`}
                                  >
                                    <span>Todas las semanas</span>
                                    {selectedWeekIndex === -1 && <Check className="size-3.5" />}
                                  </button>
                                  {/* Separador */}
                                  <div className="border-t border-slate-200 dark:border-zinc-800 my-0.5" />
                                  {/* Semanas individuales */}
                                  {semanas.map((s, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setSelectedWeekIndex(idx);
                                        setCurrentPageVentas(1);
                                        setMostrarSemanaDropdown(false);
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                                        selectedWeekIndex === idx
                                          ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                                      }`}
                                    >
                                      <span>{s.label}</span>
                                      {selectedWeekIndex === idx && <Check className="size-3.5" />}
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

                {tipoFiltroFecha === "rango" && (
                  <motion.div
                    key="rango"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 flex-wrap max-w-full"
                  >
                    <span className="text-[10px] font-bold text-slate-400">Desde:</span>
                    <CustomDatePicker
                      value={fechaRangoDesde}
                      onChange={(val) => {
                        setFechaRangoDesde(val);
                        setCurrentPageVentas(1);
                      }}
                      placeholder="Inicio"
                      align="left"
                    />
                    <span className="text-[10px] font-bold text-slate-400">Hasta:</span>
                    <CustomDatePicker
                      value={fechaRangoHasta}
                      onChange={(val) => {
                        setFechaRangoHasta(val);
                        setCurrentPageVentas(1);
                      }}
                      placeholder="Fin"
                      align="right"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Listado de registros (Responsivo: tabla en desktop, tarjetas en móvil) */}
          {ventasPaginadas.length === 0 ? (
            <div className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl p-14 text-center text-slate-400 font-bold">
              No se encontraron registros de ventas
            </div>
          ) : (
            <>
              {/* Vista Móvil (Tarjetas) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {ventasPaginadas.map((v) => {
                  const date = new Date(v.created_at).toLocaleString("es-GT", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });
                  return (
                    <div
                      key={v.id}
                      className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/30 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-3 shadow-xs text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          Recibo {obtenerCodigoRecibo(v.id)}
                        </span>
                        <span className="text-sm font-black text-[#8DA78E] dark:text-[#A3BEB0]">
                          Q{v.total.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Cliente:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {v.ven_clientes?.nombre || "Consumidor Final"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fecha:</span>
                          <span>{date}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#C1D1C5]/15 dark:border-zinc-800/40 pt-2.5 mt-1">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          v.tipo_venta === "Efectivo" || v.tipo_venta === "Contado"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : v.tipo_venta === "Tarjeta"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {v.tipo_venta}
                        </span>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => cargarDetallesVenta(v)}
                            className="px-2.5 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-xs uppercase"
                          >
                            Detalle
                          </button>
                          <button
                            onClick={() => handlePrintDirectly(v)}
                            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir directamente"
                          >
                            <Printer className="size-4" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsAppDirectly(v)}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-250 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-lg transition-colors cursor-pointer"
                            title="WhatsApp"
                          >
                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                        </div>
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
                        <th className="px-5 py-3.5">Recibo</th>
                        <th className="px-5 py-3.5">Fecha</th>
                        <th className="px-5 py-3.5">Cliente</th>
                        <th className="px-5 py-3.5">Pago</th>
                        <th className="px-5 py-3.5 text-right">Total</th>
                        <th className="px-5 py-3.5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#C1D1C5]/15 dark:divide-zinc-800/40 text-slate-700 dark:text-slate-300">
                      {ventasPaginadas.map((v) => {
                        const date = new Date(v.created_at).toLocaleString("es-GT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        return (
                          <tr
                            key={v.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                          >
                            <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {obtenerCodigoRecibo(v.id)}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{date}</td>
                            <td className="px-5 py-3.5 font-bold">
                              {v.ven_clientes?.nombre || "Consumidor Final"}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                v.tipo_venta === "Efectivo" || v.tipo_venta === "Contado"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : v.tipo_venta === "Tarjeta"
                                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                              }`}>
                                {v.tipo_venta}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-black text-[#8DA78E] dark:text-[#A3BEB0] whitespace-nowrap">
                              Q{v.total.toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => cargarDetallesVenta(v)}
                                  className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                                >
                                  Ver Detalle
                                </button>
                                <button
                                  onClick={() => handlePrintDirectly(v)}
                                  className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors cursor-pointer"
                                  title="Imprimir directamente"
                                >
                                  <Printer className="size-4" />
                                </button>
                                <button
                                  onClick={() => handleShareWhatsAppDirectly(v)}
                                  className="p-1.5 bg-emerald-100 hover:bg-emerald-250 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-lg transition-colors cursor-pointer"
                                  title="Compartir por WhatsApp"
                                >
                                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
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

          {/* Barra de Paginación */}
          {totalVentasItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 relative" ref={pageSizeDropdownVentasRef}>

                  <button
                    type="button"
                    onClick={() => setMostrarPageSizeDropdownVentas(!mostrarPageSizeDropdownVentas)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900 text-xs font-bold text-[#525D53] dark:text-[#A3BEB0] transition-all cursor-pointer flex items-center gap-1.5 hover:border-[#8DA78E] h-[34px] min-w-[55px] justify-between"
                  >
                    <span>{pageSizeVentas}</span>
                    <ChevronDown className="size-3 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {mostrarPageSizeDropdownVentas && (
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
                              setPageSizeVentas(size);
                              setCurrentPageVentas(1);
                              setMostrarPageSizeDropdownVentas(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                              pageSizeVentas === size
                                ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0]"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-900/60"
                            }`}
                          >
                            <span>{size}</span>
                            {pageSizeVentas === size && <Check className="size-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPageVentas(Math.max(1, activeVentasPage - 1))}
                  disabled={activeVentasPage === 1}
                  className="size-8 rounded-lg border transition-all disabled:opacity-40 select-none bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 cursor-pointer flex items-center justify-center"
                  title="Anterior"
                >
                  <ChevronLeft className="size-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalVentasPages }, (_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      totalVentasPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === totalVentasPages ||
                      Math.abs(pageNum - activeVentasPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPageVentas(pageNum)}
                          className={cn(
                            "size-8 rounded-lg text-[11px] font-bold transition-all select-none cursor-pointer flex items-center justify-center border",
                            activeVentasPage === pageNum
                              ? "bg-[#8DA78E] border-[#8DA78E] text-[#F5F5F1]"
                              : "bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#8DA78E]"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    if (pageNum === 2 || pageNum === totalVentasPages - 1) {
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
                  onClick={() => setCurrentPageVentas(Math.min(totalVentasPages, activeVentasPage + 1))}
                  disabled={activeVentasPage === totalVentasPages}
                  className="size-8 rounded-lg border transition-all disabled:opacity-40 select-none bg-white dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 cursor-pointer flex items-center justify-center"
                  title="Siguiente"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Panel de Detalles (Historial) */}
      <AnimatePresence>
        {ventaDetalleSeleccionada && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setVentaDetalleSeleccionada(null)}
              className="absolute inset-0 bg-black backdrop-blur-xs cursor-pointer"
            />
            
            {/* Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-[#F5F5F1] dark:bg-zinc-900 shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-[#C1D1C5]/30 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-5 text-[#8DA78E]" />
                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm">
                      Recibo #{obtenerCodigoRecibo(ventaDetalleSeleccionada.id)}
                    </h3>
                  </div>
                  <button
                    onClick={() => setVentaDetalleSeleccionada(null)}
                    className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors font-bold px-2 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left">
                  {/* Encabezado info (solo datos adicionales no visibles en la tabla principal) */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-[#C1D1C5]/30 dark:border-zinc-800 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold uppercase">NIT de Cliente:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {ventaDetalleSeleccionada.ven_clientes?.nit || "C/F"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-zinc-900 pt-2 mt-1">
                      <span className="text-slate-500 font-semibold uppercase">Vendedor:</span>
                      <span className="text-slate-900 dark:text-white font-bold text-right">
                        {ventaDetalleSeleccionada.profiles?.nombre || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Listado de Productos */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#525D53] dark:text-[#A3BEB0]/70">Detalle de Artículos</h4>
                    <div className="bg-white dark:bg-zinc-950 border border-[#C1D1C5]/30 dark:border-zinc-800 rounded-2xl overflow-hidden">
                      {isLoadingDetalles ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-2">
                          <div className="size-6 rounded-full border-2 border-[#8DA78E]/30 border-t-[#8DA78E] animate-spin" />
                          <span className="text-[10px] font-bold text-slate-400">Cargando detalles...</span>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-150/40 dark:divide-zinc-900">
                          {detallesDeVenta.map((d: any) => (
                            <div key={d.id} className="p-3.5 flex items-center justify-between text-xs">
                              {editingDetalleId === d.id ? (
                                <div className="flex flex-col gap-1 text-xs w-full bg-slate-50 dark:bg-zinc-900/40 p-2.5 rounded-lg">
                                  <p className="font-bold text-slate-800 dark:text-white mb-1.5">{d.inv_productos?.nombre}</p>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase font-bold text-slate-400">Cant</label>
                                      <input
                                        type="number"
                                        value={editingDetalleQty}
                                        onChange={(e) => setEditingDetalleQty(parseInt(e.target.value) || 0)}
                                        className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border rounded text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[9px] uppercase font-bold text-slate-400">Precio</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={editingDetallePrice}
                                        onChange={(e) => setEditingDetallePrice(parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border rounded text-slate-900 dark:text-white"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-1.5 mt-2">
                                    <button
                                      onClick={() => setEditingDetalleId(null)}
                                      disabled={isSavingDetalle}
                                      className="px-2 py-1 text-[10px] font-bold rounded border cursor-pointer text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      onClick={() => handleSaveDetalleVentaDirecto(d)}
                                      disabled={isSavingDetalle}
                                      className="px-2 py-1 text-[10px] font-bold rounded bg-[#8DA78E] text-[#F5F5F1] cursor-pointer hover:bg-[#525D53]"
                                    >
                                      {isSavingDetalle ? "Guardando..." : "Guardar"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between text-xs w-full">
                                  <div className="flex items-center gap-3">
                                    {d.inv_productos?.imagen_url ? (
                                      <img
                                        src={createClient().storage.from("Imagenes_Farmacia").getPublicUrl(d.inv_productos.imagen_url).data.publicUrl}
                                        alt={d.inv_productos?.nombre}
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-100 dark:border-zinc-800"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-zinc-800 rounded-lg text-[8px] text-slate-400 font-bold">N/A</div>
                                    )}
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-white">{d.inv_productos?.nombre}</p>
                                      <p className="text-[10px] text-slate-400">
                                        {d.cantidad} ud(s) x Q{d.precio_aplicado.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#8DA78E]">Q{d.subtotal.toFixed(2)}</span>
                                    <button
                                      onClick={() => {
                                        setEditingDetalleId(d.id);
                                        setEditingDetalleQty(d.cantidad);
                                        setEditingDetallePrice(d.precio_aplicado);
                                      }}
                                      className="text-slate-400 hover:text-blue-500 p-1 cursor-pointer transition-colors"
                                      title="Editar artículo en venta"
                                    >
                                      <Edit className="size-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEliminarProductoDeVenta(d)}
                                      className="text-slate-400 hover:text-red-500 p-1 cursor-pointer transition-colors"
                                      title="Eliminar artículo y devolver a stock"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observaciones */}
                  {ventaDetalleSeleccionada.observaciones && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#525D53] dark:text-[#A3BEB0]/70">Observaciones</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-zinc-950 p-3 rounded-xl border border-[#C1D1C5]/30 dark:border-zinc-800">
                        {ventaDetalleSeleccionada.observaciones}
                      </p>
                    </div>
                  )}

                  {/* Resumen Totales */}
                  <div className="bg-[#8DA78E]/5 border border-[#8DA78E]/20 p-4 rounded-2xl flex justify-between items-center mt-6">
                    <span className="text-xs font-black uppercase tracking-wider text-[#525D53] dark:text-[#A3BEB0]">Total de la Venta</span>
                    <span className="text-lg font-black text-[#8DA78E]">Q{ventaDetalleSeleccionada.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 bg-white dark:bg-zinc-950 border-t border-[#C1D1C5]/30 dark:border-zinc-800 mt-auto">
                  <div className="flex flex-col gap-2">
                    <div className="w-full">
                      <button
                        onClick={() => {
                          const v = ventaDetalleSeleccionada;
                          setVentaDetalleSeleccionada(null);
                          handleAnularVenta(v.id);
                        }}
                        disabled={isLoadingDetalles}
                        className="w-full py-2.5 px-4 rounded-xl bg-red-50/80 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Trash2 className="size-4" /> Anular Venta
                      </button>
                    </div>

                    <div className="w-full">
                      <button
                        onClick={() => {
                          const v = ventaDetalleSeleccionada;
                          const details = detallesDeVenta;
                          setVentaDetalleSeleccionada(null);
                          setTicketParaImprimir({
                            venta: v,
                            detalles: details
                          });
                        }}
                        disabled={isLoadingDetalles}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-50 text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Printer className="size-4" /> Imprimir Recibo
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket de Impresión (altura dinámica según productos) */}
      {ticketParaImprimir && (
        <div id="print-receipt-ticket" className="hidden print:block">
          <ReciboVenta
            {...buildReciboProps(
              ticketParaImprimir.venta,
              ticketParaImprimir.detalles,
              ticketParaImprimir.clienteCompleto,
            )}
            className="max-w-none"
          />
        </div>
      )}

      {/* Recibo oculto para captura de imagen (WhatsApp) */}
      {reciboCaptura && (
        <div className="pointer-events-none fixed left-[-9999px] top-0 z-[-1]">
          <div ref={reciboCaptureRef} className="w-[480px]">
            <ReciboVenta
              {...buildReciboProps(
                reciboCaptura.venta,
                reciboCaptura.detalles,
                reciboCaptura.clienteCompleto,
              )}
            />
          </div>
        </div>
      )}

      {/* Modal para ampliar imagen */}
      <AnimatePresence>
        {imagenAmpliadaUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImagenAmpliadaUrl(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={imagenAmpliadaUrl}
              alt="Imagen ampliada"
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain bg-white dark:bg-zinc-900"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

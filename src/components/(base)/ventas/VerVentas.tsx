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
  Calendar
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
  ItemVentaInput
} from "./actions";

const obtenerCodigoRecibo = (id: string) => {
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
  const [ticketParaImprimir, setTicketParaImprimir] = useState<{
    venta: Venta;
    detalles: any[];
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
  const handleAgregarAlCarrito = () => {
    if (!productoSeleccionado) return;
    
    const cant = Number(cantSeleccionada) || 0;
    // Validar cantidad
    if (cant <= 0) return;
    
    const itemExistente = carrito.find((i) => i.producto.id === productoSeleccionado.id);
    const cantidadFinal = (itemExistente?.cantidad || 0) + cant;

    if (cantidadFinal > productoSeleccionado.stock_actual) {
      Swal.fire({
        title: "Stock Insuficiente",
        text: `No hay suficientes existencias para agregar ${cant} unidad(es). Disponibles en inventario: ${productoSeleccionado.stock_actual}.`,
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    if (itemExistente) {
      setCarrito(
        carrito.map((i) =>
          i.producto.id === productoSeleccionado.id
            ? {
                ...i,
                cantidad: cantidadFinal,
                subtotal: cantidadFinal * i.precio_aplicado
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
          precio_aplicado: productoSeleccionado.precio_base,
          subtotal: cant * productoSeleccionado.precio_base
        }
      ]);
    }

    // Limpiar selección de producto
    setProductoSeleccionado(null);
    setProductoBusqueda("");
    setCantSeleccionada(1);
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

  const handleEliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, idx) => idx !== index));
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
        const semanas = obtenerSemanasDelMes(activeMonth, activeYear);
        const sem = semanas[selectedWeekIndex];
        if (sem) {
          matchesFecha = vLocalDateStr >= sem.desde && vLocalDateStr <= sem.hasta;
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
          d.inv_productos?.nombre || "Medicamento",
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

  // Generación de Factura PDF en Tamaño Carta
  const exportarFacturaCartaPDF = (venta: Venta, detalles: any[], clienteCompleto?: Cliente | null) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter"
      });

      const clientName = clienteCompleto?.nombre || venta.ven_clientes?.nombre || "Consumidor Final";
      const clientNit = clienteCompleto?.nit || venta.ven_clientes?.nit || "C/F";
      const clientPhone = clienteCompleto?.telefono || "-";
      const clientAddress = clienteCompleto?.direccion || "-";
      const clientEmail = clienteCompleto?.email || "-";
      
      const dateFormatted = new Date(venta.created_at).toLocaleString("es-GT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      // Cabecera Premium
      doc.setFillColor(82, 93, 83); // Olivo #525D53
      doc.rect(0, 0, 215.9, 15, "F");

      // Nombre Farmacia
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(82, 93, 83);
      doc.text("FARMACIA SALUD", 15, 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Guatemala | Tu Bienestar, Nuestro Compromiso", 15, 36);

      // Bloque del Recibo
      const codigoRecibo = obtenerCodigoRecibo(venta.id);
      doc.setFillColor(245, 245, 241);
      doc.rect(140, 22, 60, 22, "F");
      doc.setDrawColor(193, 209, 197);
      doc.rect(140, 22, 60, 22, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(82, 93, 83);
      doc.text("RECIBO DE VENTA", 170, 28, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(141, 167, 142); // Salvia #8DA78E
      doc.text(`#${codigoRecibo}`, 170, 35, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Fecha: ${dateFormatted}`, 170, 40, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 48, 200, 48);

      // Datos Cliente
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(82, 93, 83);
      doc.text("DATOS DEL CLIENTE", 15, 55);
      doc.text("DETALLES DEL PAGO", 120, 55);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      
      doc.text(`Nombre: ${clientName}`, 15, 61);
      doc.text(`NIT: ${clientNit}`, 15, 66);
      doc.text(`Teléfono: ${clientPhone}`, 15, 71);
      doc.text(`Dirección: ${clientAddress}`, 15, 76);
      if (clientEmail !== "-") {
        doc.text(`Email: ${clientEmail}`, 15, 81);
      }

      doc.text(`Tipo de Venta: ${venta.tipo_venta}`, 120, 61);
      doc.text(`Estado: PAGADO`, 120, 66);
      doc.text(`Moneda: Quetzal (Q)`, 120, 71);

      // Tabla
      autoTable(doc, {
        startY: 88,
        head: [["Cant", "Código", "Descripción del Producto", "Precio Unitario", "Subtotal"]],
        body: detalles.map((d) => [
          d.cantidad,
          d.inv_productos?.codigo || "N/A",
          d.inv_productos?.nombre || "Medicamento",
          `Q${d.precio_aplicado.toFixed(2)}`,
          `Q${d.subtotal.toFixed(2)}`
        ]),
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          valign: "middle"
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 30 },
          2: { cellWidth: 90 },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 25, halign: "right" }
        },
        headStyles: {
          fontStyle: "bold",
          fillColor: [82, 93, 83],
          textColor: [245, 245, 241],
          halign: "left"
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: 15, right: 15 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      if (venta.observaciones) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(82, 93, 83);
        doc.text("Observaciones:", 15, finalY);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(venta.observaciones, 15, finalY + 5, { maxWidth: 100 });
      }

      // Totales
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(82, 93, 83);
      doc.text("TOTAL A PAGAR:", 145, finalY + 4, { align: "right" });
      doc.text(`Q${venta.total.toFixed(2)}`, 200, finalY + 4, { align: "right" });

      // Footer
      const footerY = 262;
      doc.setDrawColor(226, 232, 240);
      doc.line(15, footerY, 200, footerY);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Este documento es un comprobante de pago digital para el control interno de la farmacia.", 107.9, footerY + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.text("¡Muchas gracias por su preferencia!", 107.9, footerY + 9, { align: "center" });

      doc.save(`Factura_Carta_${codigoRecibo}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF tamaño carta:", error);
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
              className="bg-white dark:bg-zinc-900 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header del Modal */}
              <div className="bg-[#8DA78E] dark:bg-[#525D53] p-5 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider">¡Cobro Exitoso!</h3>
                  <p className="text-[10px] text-white/80 font-medium">Venta registrada bajo el Recibo #{obtenerCodigoRecibo(reciboModalData.venta.id)}</p>
                </div>
                <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Receipt className="size-5 text-white" />
                </div>
              </div>

              {/* Contenido / Vista Previa del Recibo */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-slate-800 dark:text-slate-200">
                <div className="border border-dashed border-[#C1D1C5]/50 dark:border-zinc-800 rounded-2xl p-4 bg-[#F5F5F1]/50 dark:bg-zinc-950/40 flex flex-col gap-3 font-mono text-xs leading-normal">
                  <div className="text-center font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                    FARMACIA SALUD
                  </div>
                  <div className="text-center text-[10px] text-slate-500 -mt-2">
                    Guatemala
                  </div>
                  <div className="border-t border-dashed border-slate-300 dark:border-zinc-800 my-1"></div>
                  
                  {/* Detalles del Recibo */}
                  <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                    <span className="text-slate-400">Recibo:</span>
                    <span className="font-bold text-right text-slate-900 dark:text-white">#{obtenerCodigoRecibo(reciboModalData.venta.id)}</span>
                    
                    <span className="text-slate-400">Fecha:</span>
                    <span className="text-right">{new Date(reciboModalData.venta.created_at).toLocaleString("es-GT")}</span>
                    
                    <span className="text-slate-400">Cliente:</span>
                    <span className="text-right font-semibold">{reciboModalData.clienteCompleto?.nombre || reciboModalData.venta.ven_clientes?.nombre || "Consumidor Final"}</span>
                    
                    <span className="text-slate-400">NIT:</span>
                    <span className="text-right">{reciboModalData.clienteCompleto?.nit || reciboModalData.venta.ven_clientes?.nit || "C/F"}</span>
                    
                    <span className="text-slate-400">Pago:</span>
                    <span className="text-right">{reciboModalData.venta.tipo_venta}</span>
                  </div>

                  <div className="border-t border-dashed border-slate-300 dark:border-zinc-800 my-1"></div>

                  {/* Tabla de Productos */}
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-zinc-800 text-slate-400 font-bold">
                        <th className="pb-1 text-center">Cant</th>
                        <th className="pb-1">Detalle</th>
                        <th className="pb-1 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reciboModalData.detalles.map((d, idx) => (
                        <tr key={idx} className="border-b border-slate-200/50 dark:border-zinc-900/50 last:border-0">
                          <td className="py-1.5 text-center text-slate-900 dark:text-white font-medium">{d.cantidad}</td>
                          <td className="py-1.5 text-slate-800 dark:text-slate-300">
                            {d.inv_productos?.nombre || "Medicamento"}
                            {d.inv_productos?.codigo && <span className="block text-[9px] text-slate-400">{d.inv_productos.codigo}</span>}
                          </td>
                          <td className="py-1.5 text-right font-semibold text-slate-900 dark:text-white">Q{d.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-dashed border-slate-300 dark:border-zinc-800 my-1"></div>

                  {/* Total */}
                  <div className="flex justify-between items-center font-bold text-sm text-[#8DA78E] dark:text-[#A3BEB0] pt-1">
                    <span>TOTAL PAGADO:</span>
                    <span className="text-base font-black">Q{reciboModalData.venta.total.toFixed(2)}</span>
                  </div>

                  {reciboModalData.venta.observaciones && (
                    <div className="text-[10px] text-slate-500 italic mt-2 border-t border-dashed border-slate-200 dark:border-zinc-900 pt-2">
                      <span className="font-bold block not-italic text-slate-400">Notas:</span>
                      {reciboModalData.venta.observaciones}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer con Acciones */}
              <div className="p-5 bg-[#F5F5F1] dark:bg-zinc-950 border-t border-[#C1D1C5]/30 dark:border-zinc-800 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setTicketParaImprimir({
                        venta: reciboModalData.venta,
                        detalles: reciboModalData.detalles
                      });
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-transparent"
                  >
                    <Printer className="size-4" /> Imprimir Ticket
                  </button>

                  <button
                    onClick={() => {
                      exportarFacturaCartaPDF(reciboModalData.venta, reciboModalData.detalles, reciboModalData.clienteCompleto);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 dark:bg-zinc-800 hover:bg-slate-700 dark:hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-slate-700 dark:border-zinc-700"
                  >
                    <FileDown className="size-4" /> PDF (Carta)
                  </button>
                </div>

                <button
                  onClick={() => setReciboModalData(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-800 hover:bg-slate-200/50 dark:hover:bg-zinc-900/50 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                      ? "💵 Contado"
                      : "⏳ Crédito"}
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
                        { id: "Contado", label: "💵 Contado" },
                        { id: "Crédito", label: "⏳ Crédito" }
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
                    Buscar Producto / Medicamento
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400" />
                    <input
                      type="text"
                      value={productoBusqueda}
                      onChange={(e) => {
                        setProductoBusqueda(e.target.value);
                        setMostrarSugerenciasProd(true);
                      }}
                      onFocus={() => setMostrarSugerenciasProd(true)}
                      placeholder="Nombre o código de barras..."
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors h-10"
                    />
                  </div>

                  {/* Dropdown sugerencias */}
                  <AnimatePresence>
                    {mostrarSugerenciasProd && sugerenciasProductos.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 text-left"
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
                              <div>
                                <p className="font-bold text-slate-950 dark:text-white">{p.nombre}</p>
                                <p className="text-[10px] text-slate-500">Cód: {p.codigo || "C/F"}</p>
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
                    onClick={handleAgregarAlCarrito}
                    disabled={!productoSeleccionado}
                    className="w-[60%] h-10 bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-40 disabled:hover:bg-[#8DA78E] text-[#F5F5F1] text-xs font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-xs shrink-0"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Carrito de Compras */}
          <div className="w-full lg:w-[70%] flex flex-col gap-4 font-mono">
            <div className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-3xl p-5 shadow-xs flex flex-col gap-4 h-full min-h-[750px]">
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
                      className="h-full flex flex-col items-center justify-center py-20 text-slate-400"
                    >
                      <ShoppingCart className="size-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-xs font-bold">Venta vacía</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[150px] leading-normal mt-1 text-center">
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
                        className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/20 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between gap-3 text-left"
                      >
                        {/* Name and Unit Price */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.producto.nombre}>
                            {item.producto.nombre}
                          </h4>
                          <p className="text-[10px] text-slate-500">
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

                        {/* Delete Button */}
                        <button
                          onClick={() => handleEliminarDelCarrito(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1 shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
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
            </div>
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
                { id: "semana", label: "Semana" },
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
                              <span>{semSeleccionada ? semSeleccionada.label : "Seleccionar semana"}</span>
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
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => cargarDetallesVenta(v)}
                            className="px-2.5 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                          >
                            Detalle
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const details = await obtenerDetalleVenta(v.id);
                                setTicketParaImprimir({
                                  venta: v,
                                  detalles: details
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900"
                            title="Imprimir Recibo"
                          >
                            <Printer className="size-3.5" />
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
                                  onClick={async () => {
                                    try {
                                      const details = await obtenerDetalleVenta(v.id);
                                      setTicketParaImprimir({
                                        venta: v,
                                        detalles: details
                                      });
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-zinc-900"
                                  title="Imprimir Recibo"
                                >
                                  <Printer className="size-3.5" />
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
                  <span>Mostrar</span>
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
                  <span>registros</span>
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
                  {/* Encabezado info */}
                  <div className="bg-white dark:bg-zinc-950 p-4 border border-[#C1D1C5]/30 dark:border-zinc-800 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold uppercase">Fecha de Emisión:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {new Date(ventaDetalleSeleccionada.created_at).toLocaleString("es-GT")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-zinc-900 pt-2 mt-1">
                      <span className="text-slate-500 font-semibold uppercase">Cliente:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {ventaDetalleSeleccionada.ven_clientes?.nombre || "Consumidor Final"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-zinc-900 pt-2 mt-1">
                      <span className="text-slate-500 font-semibold uppercase">NIT de Cliente:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {ventaDetalleSeleccionada.ven_clientes?.nit || "C/F"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-zinc-900 pt-2 mt-1">
                      <span className="text-slate-500 font-semibold uppercase">Forma de Pago:</span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        {ventaDetalleSeleccionada.tipo_venta}
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
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{d.inv_productos?.nombre}</p>
                                <p className="text-[10px] text-slate-400">
                                  {d.cantidad} ud(s) x Q{d.precio_aplicado.toFixed(2)}
                                </p>
                              </div>
                              <span className="font-bold text-[#8DA78E]">Q{d.subtotal.toFixed(2)}</span>
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

                {/* Footer Print actions */}
                <div className="p-4 bg-white dark:bg-zinc-950 border-t border-[#C1D1C5]/30 dark:border-zinc-800 mt-auto">
                  <div className="grid grid-cols-2 gap-2">
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
                      className="py-2.5 px-4 rounded-xl bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-50 text-[#F5F5F1] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Printer className="size-4" /> Imprimir Recibo
                    </button>

                    <button
                      onClick={() => {
                        const v = ventaDetalleSeleccionada;
                        const details = detallesDeVenta;
                        let fullCli = null;
                        if (v.cliente_id) {
                          const found = clientes.find((c) => c.id === v.cliente_id);
                          if (found) fullCli = found;
                        }
                        exportarFacturaCartaPDF(v, details, fullCli);
                      }}
                      disabled={isLoadingDetalles}
                      className="py-2.5 px-4 rounded-xl bg-slate-800 dark:bg-zinc-800 hover:bg-slate-700 dark:hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-700 dark:border-zinc-700"
                    >
                      <FileDown className="size-4" /> PDF (Carta)
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket de Impresión (Solo visible al imprimir) */}
      {ticketParaImprimir && (
        <div id="print-receipt-ticket" className="hidden print:block w-[80mm] p-4 bg-white text-black font-mono text-[11px] leading-tight text-left">
          <div className="text-center font-bold text-[13px] mb-0.5">
            FARMACIA SALUD
          </div>
          <div className="text-center text-[9px] text-slate-500 mb-2">
            Guatemala
          </div>
          <div className="border-t border-dashed border-black my-1.5"></div>
          <div className="space-y-0.5 mb-2 text-[10px]">
            <p className="font-bold">RECIBO DE VENTA #{obtenerCodigoRecibo(ticketParaImprimir.venta.id)}</p>
            <p>Fecha: {new Date(ticketParaImprimir.venta.created_at).toLocaleString("es-GT")}</p>
            <p>Cliente: {ticketParaImprimir.venta.ven_clientes?.nombre || "Consumidor Final"}</p>
            <p>NIT: {ticketParaImprimir.venta.ven_clientes?.nit || "C/F"}</p>
            <p>Pago: {ticketParaImprimir.venta.tipo_venta}</p>
          </div>
          <div className="border-t border-dashed border-black my-1.5"></div>
          <table className="w-full text-left text-[10px] mb-2">
            <thead>
              <tr className="border-b border-black">
                <th className="py-0.5">Cant</th>
                <th className="py-0.5">Detalle</th>
                <th className="py-0.5 text-right">Sub</th>
              </tr>
            </thead>
            <tbody>
              {ticketParaImprimir.detalles.map((d, idx) => (
                <tr key={idx}>
                  <td className="py-0.5">{d.cantidad}</td>
                  <td className="py-0.5">{d.inv_productos?.nombre || "Medicamento"}</td>
                  <td className="py-0.5 text-right">Q{d.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed border-black my-1.5"></div>
          <div className="text-right font-bold text-xs mb-2">
            TOTAL A PAGAR: Q{ticketParaImprimir.venta.total.toFixed(2)}
          </div>
          {ticketParaImprimir.venta.observaciones && (
            <p className="italic text-[9px] mb-2">Notas: {ticketParaImprimir.venta.observaciones}</p>
          )}
          <div className="text-center text-[9px] text-slate-500 mt-3">
            ¡Gracias por su compra!
          </div>
        </div>
      )}
    </div>
  );
}

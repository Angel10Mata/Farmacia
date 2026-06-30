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
import { CrearProveedor } from "./forms/CrearProveedor";
import { EditarProveedor } from "./forms/EditarProveedor";
import {
  obtenerProveedoresYProductos,
  crearCompra,
  obtenerHistorialCompras,
  obtenerDetalleCompra,
  eliminarProveedor,
  actualizarEstadoPagoCompra,
  ItemCompraInput
} from "./actions";

// Helper para códigos de compra únicos a partir de UUID
const obtenerCodigoCompra = (id: string) => {
  if (!id) return "N/A";
  const cleanId = id.replace(/-/g, "").toUpperCase();
  return `${cleanId.substring(0, 3)}-${cleanId.substring(3, 6)}`;
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
  inv_proveedores?: {
    nombre: string;
    nit: string | null;
  } | null;
}

export function VerProveedores() {
  const [activeTab, setActiveTab] = useState<"compras" | "historial" | "proveedores">("compras");

  // Catalogos
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modales
  const [isCrearOpen, setIsCrearOpen] = useState(false);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [proveedorAEditar, setProveedorAEditar] = useState<Proveedor | null>(null);

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

  const provDropdownRef = useRef<HTMLDivElement>(null);
  const prodDropdownRef = useRef<HTMLDivElement>(null);

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
      text: `Se cargará una compra por Q${totalCarrito.toFixed(2)} al proveedor ${proveedorSeleccionado.nombre}. Se actualizará el inventario.`,
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
    const nuevoEstado = estadoActual === "Pagado" ? "Pendiente" : "Pagado";
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

  // Filtros Historial
  const comprasFiltradas = compras.filter((c) => {
    const query = busquedaHistorial.toLowerCase();
    const matchSearch =
      obtenerCodigoCompra(c.id).toLowerCase().includes(query) ||
      (c.inv_proveedores?.nombre || "").toLowerCase().includes(query) ||
      (c.observaciones || "").toLowerCase().includes(query);

    const matchPago = filtroPago === "todos" || c.estado_pago === filtroPago;
    return matchSearch && matchPago;
  });

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
              Gestión de Proveedores
            </h1>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#F5F5F1] dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 p-1.5 rounded-2xl w-fit">
          {[
            { id: "compras", label: "Registrar Compra" },
            { id: "historial", label: "Historial de Compras" },
            { id: "proveedores", label: "Proveedores" }
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
                    className="py-2.5 px-4 bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-40 text-[#F5F5F1] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
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
                              Código: {item.producto.codigo || "N/A"} | Costo: Q{item.precio_costo.toFixed(2)}
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
                                Q{item.subtotal.toFixed(2)}
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
                    <span className="text-base text-[#8DA78E]">Q{totalCarrito.toFixed(2)}</span>
                  </div>
                </div>

                {/* Registrar Compra Button */}
                <button
                  type="button"
                  onClick={handleFinalizarCompra}
                  disabled={carrito.length === 0 || isProcesando}
                  className="w-full py-3 bg-[#8DA78E] hover:bg-[#525D53] disabled:opacity-40 disabled:hover:bg-[#8DA78E] text-[#F5F5F1] text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  {isProcesando ? (
                    <>
                      <div className="size-4 rounded-full border-2 border-[#F5F5F1]/30 border-t-[#F5F5F1] animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="size-4.5" /> Registrar Compra
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORIAL DE COMPRAS */}
          {activeTab === "historial" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#F5F5F1] dark:bg-zinc-900/60 border border-[#C1D1C5]/40 dark:border-zinc-800 rounded-3xl p-5">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Buscador */}
                  <div className="relative flex-1 sm:max-w-md text-left">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={busquedaHistorial}
                      onChange={(e) => setBusquedaHistorial(e.target.value)}
                      placeholder="Buscar por código, proveedor..."
                      className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Filtro Pago */}
                  <div className="flex items-center gap-2 justify-between sm:justify-start">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase shrink-0">Pago:</span>
                    <select
                      value={filtroPago}
                      onChange={(e) => setFiltroPago(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none cursor-pointer w-full sm:w-auto"
                    >
                      <option value="todos">Todos</option>
                      <option value="Pagado">Pagados</option>
                      <option value="Pendiente">Pendientes</option>
                    </select>
                  </div>
                </div>

                {/* Tabla de Compras - Escritorio */}
                <div className="hidden md:block overflow-x-auto border border-slate-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 mt-4">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#F5F5F1] dark:bg-zinc-900 text-[#525D53] dark:text-[#A3BEB0] border-b border-slate-200 dark:border-zinc-800 font-bold">
                        <th className="px-5 py-3.5">Compra #</th>
                        <th className="px-5 py-3.5">Fecha</th>
                        <th className="px-5 py-3.5">Proveedor</th>
                        <th className="px-5 py-3.5">Estado Pago</th>
                        <th className="px-5 py-3.5">Total</th>
                        <th className="px-5 py-3.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                      {comprasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                            No se encontraron compras en el historial.
                          </td>
                        </tr>
                      ) : (
                        comprasFiltradas.map((c) => {
                          const date = new Date(c.created_at).toLocaleString("es-GT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          });
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                #{obtenerCodigoCompra(c.id)}
                              </td>
                              <td className="px-5 py-3.5 text-slate-500">{date}</td>
                              <td className="px-5 py-3.5 font-bold">
                                {c.inv_proveedores?.nombre || "Proveedor Desconocido"}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  c.estado_pago === "Pagado"
                                    ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                }`}>
                                  {c.estado_pago}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-black text-[#8DA78E]">
                                Q{c.total.toFixed(2)}
                              </td>
                              <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                                <button
                                  onClick={() => cargarDetallesCompra(c)}
                                  className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border border-[#8DA78E]/20"
                                >
                                  Ver Detalle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCambiarEstadoPago(c.id, c.estado_pago)}
                                  className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border ${
                                    c.estado_pago === "Pagado"
                                      ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                                      : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40"
                                  }`}
                                >
                                  {c.estado_pago === "Pagado" ? "Marcar Pendiente" : "Marcar Pagado"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Vista Móvil (Tarjetas) */}
                <div className="block md:hidden space-y-3 mt-4">
                  {comprasFiltradas.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl">
                      No se encontraron compras en el historial.
                    </div>
                  ) : (
                    comprasFiltradas.map((c) => {
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
                          className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 shadow-xs text-left"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-900 pb-2">
                            <span className="font-black text-slate-900 dark:text-white text-xs">
                              #{obtenerCodigoCompra(c.id)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c.estado_pago === "Pagado"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            }`}>
                              {c.estado_pago}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <p className="font-bold text-slate-850 dark:text-zinc-200">
                              {c.inv_proveedores?.nombre || "Proveedor Desconocido"}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Calendar className="size-3.5 text-[#8DA78E]" /> {date}
                            </p>
                            {c.observaciones && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-slate-100 dark:border-zinc-800/40 truncate">
                                {c.observaciones}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-900 mt-1">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-450 uppercase leading-none">Total</span>
                              <span className="text-sm font-black text-[#8DA78E] mt-1">
                                Q{c.total.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => cargarDetallesCompra(c)}
                                className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border border-[#8DA78E]/20"
                              >
                                Ver Detalle
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCambiarEstadoPago(c.id, c.estado_pago)}
                                className={`px-3 py-1.5 font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase border ${
                                  c.estado_pago === "Pagado"
                                    ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40"
                                    : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40"
                                }`}
                              >
                                {c.estado_pago === "Pagado" ? "Pendiente" : "Pagado"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATALOGO DE PROVEEDORES */}
          {activeTab === "proveedores" && (
            <div className="flex flex-col gap-4">
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
                    className="py-2 px-4 bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
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
                                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/10 transition-colors"
                                  >
                                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                                      {p.nombre}
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                                      {p.nit || <span className="text-slate-300 dark:text-slate-600">C/F</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                      {p.telefono ? (
                                        <span className="flex items-center gap-1.5">
                                          <Phone className="size-3 text-[#8DA78E]" /> {p.telefono}
                                        </span>
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
                                          onClick={() => {
                                            setProveedorAEditar(p);
                                            setIsEditarOpen(true);
                                          }}
                                          className="px-3 py-1.5 bg-[#8DA78E]/10 hover:bg-[#8DA78E]/25 text-[#8DA78E] dark:text-[#A3BEB0] font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => handleEliminarProveedor(p.id, p.nombre)}
                                          className="px-3 py-1.5 bg-slate-800 dark:bg-zinc-800 hover:bg-red-600 dark:hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px] uppercase"
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
                              className="bg-white dark:bg-[#525D53]/10 border border-[#C1D1C5]/40 dark:border-[#A3BEB0]/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xs"
                            >
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.nombre}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">NIT: {p.nit || "C/F"}</p>
                              </div>
                              <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                                {p.telefono && (
                                  <p className="flex items-center gap-1.5"><Phone className="size-3.5 text-[#8DA78E]" /> {p.telefono}</p>
                                )}
                                {p.correo && (
                                  <p className="flex items-center gap-1.5 truncate"><Mail className="size-3.5 text-[#8DA78E]" /> {p.correo}</p>
                                )}
                              </div>
                              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
                                <button
                                  onClick={() => { setProveedorAEditar(p); setIsEditarOpen(true); }}
                                  className="px-3 py-1.5 text-xs font-bold text-[#8DA78E] hover:bg-[#8DA78E]/10 rounded-lg cursor-pointer transition-colors uppercase border border-[#8DA78E]/30"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleEliminarProveedor(p.id, p.nombre)}
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
                            <span className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              compraDetalleSeleccionada.estado_pago === "Pagado"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            }`}>
                              {compraDetalleSeleccionada.estado_pago}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCambiarEstadoPago(compraDetalleSeleccionada.id, compraDetalleSeleccionada.estado_pago, true)}
                              className="text-[10px] text-[#8DA78E] hover:underline font-bold cursor-pointer"
                            >
                              (Cambiar)
                            </button>
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
                                  Costo: Q{d.precio_costo.toFixed(2)} | Cant: {d.cantidad}
                                </p>
                              </div>
                              <span className="font-black text-slate-900 dark:text-white shrink-0">
                                Q{d.subtotal.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
                      <span className="text-lg font-black text-[#8DA78E]">Q{compraDetalleSeleccionada.total.toFixed(2)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

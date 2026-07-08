"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, TrendingUp, TrendingDown, FileText, Tag, DollarSign, Loader2, ListTree, ChevronDown, Check } from "lucide-react";
import Swal from "sweetalert2";
import { cn } from "@/lib/utils";
import { registrarMovimiento, obtenerCuentasPorCobrar, obtenerCuentasPorPagar } from "../actions";
import type { CuentaPorCobrar, CuentaPorPagar } from "../schemas";

interface Props {
  defaultTipo: "ingreso" | "egreso";
  defaultVentaId?: string | null;
  defaultCompraId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const getSwalThemeOpts = () => {
  const isDark = document.documentElement.classList.contains("dark");
  return {
    background: isDark ? "#171a17" : "#ffffff",
    color: isDark ? "#ffffff" : "#000000",
    confirmButtonColor: "#8DA78E",
    cancelButtonColor: isDark ? "#3f3f46" : "#e4e4e7",
  };
};

export function NuevoMovimiento({ defaultTipo, defaultVentaId, defaultCompraId, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState<"ingreso" | "egreso">(defaultTipo);
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  
  const [ventaId, setVentaId] = useState(defaultVentaId || "");
  const [compraId, setCompraId] = useState(defaultCompraId || "");
  
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaPorCobrar[]>([]);
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPorPagar[]>([]);
  const [isLoadingCuentas, setIsLoadingCuentas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  const categoriasIngreso = [
    { id: "abono_cliente", label: "Abono de Cliente" },
    { id: "venta", label: "Venta Directa" },
  ];

  const categoriasEgreso = [
    { id: "pago_proveedor", label: "Pago a Proveedor" },
    { id: "gasto_fijo", label: "Gasto Fijo (Luz, Agua, Renta...)" },
    { id: "gasto_vario", label: "Gasto Vario (Limpieza, Transporte...)" },
    { id: "compra", label: "Compra de Inventario" }
  ];

  const categoriasActuales = tipo === "ingreso" ? categoriasIngreso : categoriasEgreso;
  const selectedCat = categoriasActuales.find(c => c.id === categoria);

  useEffect(() => {
    if (defaultVentaId) setCategoria("abono_cliente");
    if (defaultCompraId) setCategoria("pago_proveedor");
  }, [defaultVentaId, defaultCompraId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCuentas = async () => {
      setIsLoadingCuentas(true);
      try {
        if (tipo === "ingreso") {
          setCuentasCobrar(await obtenerCuentasPorCobrar());
        } else {
          setCuentasPagar(await obtenerCuentasPorPagar());
        }
      } catch (error) {
        console.error("Error cargando cuentas", error);
      } finally {
        setIsLoadingCuentas(false);
      }
    };
    fetchCuentas();
  }, [tipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !monto || !descripcion) {
      Swal.fire({
        title: "Campos incompletos",
        text: "Por favor llena todos los campos.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    if (categoria === "abono_cliente" && !ventaId) {
      Swal.fire({ title: "Falta Venta", text: "Selecciona la venta a abonar.", icon: "warning", ...getSwalThemeOpts() });
      return;
    }
    if (categoria === "pago_proveedor" && !compraId) {
      Swal.fire({ title: "Falta Compra", text: "Selecciona la compra a pagar.", icon: "warning", ...getSwalThemeOpts() });
      return;
    }

    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      Swal.fire({
        title: "Monto inválido",
        text: "El monto debe ser un número mayor a cero.",
        icon: "warning",
        ...getSwalThemeOpts()
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await registrarMovimiento({
        tipo_movimiento: tipo,
        categoria: categoria as any,
        monto: numMonto,
        descripcion,
        venta_id: categoria === "abono_cliente" ? ventaId : null,
        compra_id: categoria === "pago_proveedor" ? compraId : null,
      });

      Swal.fire({
        title: "Registrado",
        text: `El ${tipo} se ha registrado correctamente.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });
      onSuccess();
    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo registrar el movimiento.",
        icon: "error",
        ...getSwalThemeOpts()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95%] max-w-md bg-white dark:bg-[#171a17] rounded-3xl shadow-2xl border border-[#C1D1C5]/30 dark:border-[#525D53]/30 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#C1D1C5]/30 dark:border-[#525D53]/30 bg-[#f4f7f5]/50 dark:bg-[#151f19]/30">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl text-white",
              tipo === "ingreso" ? "bg-[#8DA78E]" : "bg-rose-500"
            )}>
              {tipo === "ingreso" ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">
                Registrar Movimiento
              </h2>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Finanzas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Monto */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <DollarSign className="size-3.5" /> Monto (Q)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className={cn(
                    "text-lg font-black",
                    tipo === "ingreso" ? "text-[#8DA78E]" : "text-rose-500"
                  )}>Q</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-black/20 border border-[#C1D1C5]/40 dark:border-[#525D53]/40 rounded-xl text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                  autoFocus
                />
              </div>
            </div>

            {/* Categoría */}
            <div className="space-y-1.5" ref={catDropdownRef}>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Tag className="size-3.5" /> Categoría
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  disabled={!!defaultVentaId || !!defaultCompraId}
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-black/20 border border-[#C1D1C5]/40 dark:border-[#525D53]/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all disabled:opacity-50 cursor-pointer text-left"
                >
                  {selectedCat ? (
                    <span className="text-zinc-800 dark:text-zinc-200 text-sm font-semibold">{selectedCat.label}</span>
                  ) : (
                    <span className="text-zinc-400 text-sm">Selecciona una categoría...</span>
                  )}
                  <ChevronDown className="size-4 text-zinc-400 shrink-0" />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-[#171a17] border border-[#C1D1C5]/30 dark:border-[#525D53]/30 rounded-xl shadow-xl z-50 p-1 flex flex-col gap-0.5"
                    >
                      {categoriasActuales.map(c => {
                        const isSelected = categoria === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategoria(c.id);
                              setIsOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 rounded-lg text-left flex items-center justify-between cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 text-sm",
                              isSelected ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:text-[#A3BEB0] font-black" : "text-zinc-700 dark:text-zinc-300 font-medium"
                            )}
                          >
                            <span>{c.label}</span>
                            {isSelected && <Check className="size-4 text-[#8DA78E] dark:text-[#A3BEB0]" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Selector de Venta para Abono */}
            {categoria === "abono_cliente" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <ListTree className="size-3.5" /> Venta Pendiente
                </label>
                <select
                  value={ventaId}
                  onChange={(e) => setVentaId(e.target.value)}
                  disabled={!!defaultVentaId || isLoadingCuentas}
                  className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-[#C1D1C5]/40 dark:border-[#525D53]/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all disabled:opacity-50"
                >
                  <option value="" disabled>{isLoadingCuentas ? "Cargando..." : "Selecciona una venta..."}</option>
                  {cuentasCobrar.map(c => (
                    <option key={c.venta_id} value={c.venta_id}>
                      {c.cliente_nombre} - Pendiente: Q{c.saldo_pendiente}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Compra para Pago */}
            {categoria === "pago_proveedor" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <ListTree className="size-3.5" /> Compra Pendiente
                </label>
                <select
                  value={compraId}
                  onChange={(e) => setCompraId(e.target.value)}
                  disabled={!!defaultCompraId || isLoadingCuentas}
                  className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-[#C1D1C5]/40 dark:border-[#525D53]/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all disabled:opacity-50"
                >
                  <option value="" disabled>{isLoadingCuentas ? "Cargando..." : "Selecciona una compra..."}</option>
                  {cuentasPagar.map(c => (
                    <option key={c.compra_id} value={c.compra_id}>
                      {c.proveedor_nombre} - Pendiente: Q{c.saldo_pendiente}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <FileText className="size-3.5" /> Descripción / Concepto
              </label>
              <textarea
                rows={3}
                placeholder="Ej. Pago parcial factura #123"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-[#C1D1C5]/40 dark:border-[#525D53]/40 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8DA78E]/40 transition-all resize-none placeholder:text-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 text-white px-5 py-3.5 rounded-xl text-sm font-bold transition-all mt-2 active:scale-[0.98]",
                tipo === "ingreso" 
                  ? "bg-[#8DA78E]" 
                  : "bg-rose-500 hover:bg-rose-600",
                isSubmitting && "opacity-70 pointer-events-none"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Save className="size-5" />
              )}
              {isSubmitting ? "Guardando..." : `Guardar ${tipo === "ingreso" ? "Ingreso" : "Egreso"}`}
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}

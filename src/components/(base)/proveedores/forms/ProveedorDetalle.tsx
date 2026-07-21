"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Clock, Calendar, ChevronDown, ChevronLeft, ChevronRight, Receipt, ShoppingBag } from "lucide-react";
import Swal from "sweetalert2";
import { guardarProveedor, eliminarProveedor } from "../actions";
import { ArrowLeft, Check, Copy, Pencil, X, Mail, Phone, MapPin, Building, Info, FileText, FileDown, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, fmtQ } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@/utils/supabase/client";
import { CustomDatePicker, obtenerSemanasDelMes } from "@/components/ui/CustomDatePicker";

interface Proveedor {
  id: string;
  nombre: string;
  descripcion?: string | null;
  nit?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

interface ProveedorDetalleProps {
  proveedor: Proveedor;
  onClose: () => void;
  onUpdate: () => void;
  defaultEdit?: boolean;
}

export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";
  let clean = phone.trim();
  const prefixRegex = /^\+\d{1,4}\s?/;
  if (prefixRegex.test(clean)) {
    clean = clean.replace(prefixRegex, "");
  } else if (clean.startsWith("502") && clean.length > 8) {
    clean = clean.substring(3);
  }
  
  const digitsOnly = clean.replace(/\D/g, "");
  if (digitsOnly.length === 8) {
    return `${digitsOnly.substring(0, 4)}-${digitsOnly.substring(4)}`;
  }
  
  return clean;
};

export const getWhatsappUrl = (phone: string | null | undefined): string => {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/[^\d+]/g, ""); // Keep digits and +
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 8) {
      cleaned = "+502" + cleaned;
    } else if (cleaned.startsWith("502") && cleaned.length > 8) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+502" + cleaned;
    }
  }
  return `https://wa.me/${cleaned.replace("+", "")}`;
};

export function ProveedorDetalle({
  proveedor,
  onClose,
  onUpdate,
  defaultEdit = false,
}: ProveedorDetalleProps) {
  const [isEditing, setIsEditing] = useState(defaultEdit);
  const [formData, setFormData] = useState<Proveedor>(proveedor);
  const [areaCode, setAreaCode] = useState("+502");
  const [telefonoVal, setTelefonoVal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Historial logic
  const [compras, setCompras] = useState<any[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  useEffect(() => {
    async function loadCompras() {
      if (!proveedor?.id) return;
      setLoadingCompras(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("inv_compras")
          .select("id, created_at, total, fin_transacciones(id, monto, fecha_movimiento, tipo_movimiento, categoria)")
          .eq("proveedor_id", proveedor.id)
          .order("created_at", { ascending: false });
        if (data) {
          setCompras(data);
        }
      } catch (err) {
        console.error("Error al cargar compras de proveedor:", err);
      } finally {
        setLoadingCompras(false);
      }
    }
    loadCompras();
  }, [proveedor?.id]);

  useEffect(() => {
    setFormData(proveedor);
    setIsEditing(defaultEdit);

    if (proveedor && proveedor.telefono) {
      const telStr = proveedor.telefono.trim();
      const match = telStr.match(/^(\+\d{1,4})\s?(.*)$/);
      if (match) {
        setAreaCode(match[1]);
        setTelefonoVal(match[2]);
      } else {
        setAreaCode("+502");
        setTelefonoVal(telStr);
      }
    } else {
      setAreaCode("+502");
      setTelefonoVal("");
    }
  }, [proveedor, defaultEdit]);

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

  const handleSave = async () => {
    const nombreTrimmed = formData.nombre?.trim();
    if (!nombreTrimmed) {
      Swal.fire({
        title: "Error",
        text: "El nombre es requerido",
        icon: "error",
        ...getSwalThemeOpts()
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await guardarProveedor({
        id: proveedor.id,
        nombre: nombreTrimmed,
        descripcion: formData.descripcion?.trim() || null,
        nit: formData.nit?.trim() || null,
        telefono: telefonoVal.trim() ? `${areaCode} ${telefonoVal.trim()}` : null,
        correo: formData.correo?.trim() || null,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setIsEditing(false);
      onUpdate();

      Swal.fire({
        title: "¡Guardado!",
        text: "Proveedor actualizado correctamente",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        ...getSwalThemeOpts()
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar: " + error.message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminar = async () => {
    const confirm = await Swal.fire({
      title: "¿Eliminar Proveedor?",
      text: `¿Estás seguro de eliminar a "${proveedor.nombre}"? Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      ...getSwalThemeOpts(),
      confirmButtonColor: "#ef4444"
    });

    if (confirm.isConfirmed) {
      try {
        const res = await eliminarProveedor(proveedor.id);
        if (res.success) {
          Swal.fire({
            title: "Eliminado",
            text: "El proveedor ha sido eliminado.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
            ...getSwalThemeOpts()
          });
          onUpdate();
        } else {
          throw new Error(res.error);
        }
      } catch (err: any) {
        Swal.fire({
          title: "Error",
          text: err.message || "No se pudo eliminar el proveedor.",
          icon: "error",
          ...getSwalThemeOpts()
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="bg-zinc-100 dark:bg-zinc-800 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-2xl p-4 flex flex-col gap-3 h-full overflow-y-auto w-full animate-fade-in text-left"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-2 border-b border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="shrink-0 size-8 rounded-lg bg-gradient-to-br from-[#C1D1C5] to-[#8DA78E] flex items-center justify-center text-white">
            <Truck className="size-4.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Detalle del Proveedor</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 transition-colors text-base font-bold px-1.5 cursor-pointer shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Nombre */}
      <div className="space-y-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Nombre Comercial</h4>
        {isEditing ? (
          <input 
            type="text"
            value={formData.nombre || ""}
            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
            className="w-full font-bold text-slate-900 dark:text-white text-sm bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all shadow-sm"
          />
        ) : (
          <h2 className="font-black text-slate-900 dark:text-white text-base leading-tight break-words">{formData.nombre}</h2>
        )}
      </div>

      {/* NIT / Identificación */}
      <div className="space-y-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">NIT / Identificación Fiscal</h4>
        {isEditing ? (
          <input 
            type="text"
            value={formData.nit || ""}
            onChange={(e) => setFormData({...formData, nit: e.target.value})}
            className="w-full text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all shadow-sm"
            placeholder="1234567-8"
          />
        ) : (
          <p className="text-xs font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900/40 border border-[#C1D1C5]/20 rounded-lg px-3 py-2 uppercase">{formData.nit || "C/F"}</p>
        )}
      </div>

      {/* Teléfono y Correo */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Teléfono</h4>
          {isEditing ? (
            <div className="flex gap-1.5">
              <select
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                className="px-1 py-1.5 border rounded-lg text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors w-16 shrink-0"
              >
                <option value="+502">+502</option>
                <option value="+503">+503</option>
                <option value="+504">+504</option>
                <option value="+505">+505</option>
                <option value="+506">+506</option>
                <option value="+507">+507</option>
                <option value="+52">+52</option>
                <option value="+1">+1</option>
              </select>
              <input 
                type="text"
                value={telefonoVal}
                onChange={(e) => setTelefonoVal(e.target.value)}
                className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all shadow-sm"
                placeholder="5555-1234"
              />
            </div>
          ) : (
            <p className="text-xs text-slate-850 dark:text-slate-200 bg-white dark:bg-zinc-900/40 border border-[#C1D1C5]/20 rounded-lg px-3 py-2">
              {formData.telefono ? (
                <a
                  href={getWhatsappUrl(formData.telefono)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 dark:text-green-400 hover:underline font-bold inline-flex items-center gap-1"
                >
                  {formatPhoneDisplay(formData.telefono)}
                </a>
              ) : (
                "—"
              )}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Correo Electrónico</h4>
          {isEditing ? (
            <input 
              type="email"
              value={formData.correo || ""}
              onChange={(e) => setFormData({...formData, correo: e.target.value})}
              className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all shadow-sm"
              placeholder="proveedor@email.com"
            />
          ) : (
            <p className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900/40 border border-[#C1D1C5]/20 rounded-lg px-3 py-2 truncate" title={formData.correo || undefined}>{formData.correo || "—"}</p>
          )}
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-[#525D53] dark:text-[#A3BEB0]/70">Descripción / Notas</h4>
        {isEditing ? (
          <textarea 
            value={formData.descripcion || ""}
            onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            rows={3}
            className="w-full text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-zinc-900 border border-[#C1D1C5]/60 dark:border-[#A3BEB0]/20 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#8DA78E] outline-none transition-all resize-none shadow-sm"
            placeholder="Descripción del proveedor..."
          />
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-zinc-900/40 border border-[#C1D1C5]/20 rounded-lg px-3 py-2 min-h-[50px]">{formData.descripcion || "Sin descripción."}</p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="mt-auto pt-3 border-t border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 flex flex-wrap justify-end gap-2">
        <button
          onClick={() => setShowHistorial(true)}
          className="w-fit py-2 px-4 rounded-xl bg-white dark:bg-[#525D53]/20 border border-[#8DA78E] text-[#8DA78E] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          Historial de Compras
        </button>

        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="w-fit px-4 py-2 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-fit px-4 py-2 bg-[#8DA78E] text-[#F5F5F1] text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEliminar}
              className="w-fit px-4 py-2 bg-red-400 text-white text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              Eliminar
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="w-fit px-4 py-2 bg-[#A3BEB0]/20 text-[#525D53] dark:text-[#A3BEB0] text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              Editar
            </button>
          </>
        )}
      </div>
      <AnimatePresence>
        {showHistorial && (
          <HistorialComprasProveedorModal 
            proveedor={proveedor}
            compras={compras}
            onClose={() => setShowHistorial(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Modal Historial Compras Proveedor ──────────────────────────────────────────────────
function HistorialComprasProveedorModal({
  proveedor,
  compras,
  onClose
}: {
  proveedor: Proveedor;
  compras: any[];
  onClose: () => void;
}) {
  const [tipoFiltroFecha, setTipoFiltroFecha] = useState<string>("semana");
  const [fechaDia, setFechaDia] = useState<string>(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [activeMonth, setActiveMonth] = useState(() => new Date().getMonth());
  const [activeYear, setActiveYear] = useState(() => new Date().getFullYear());
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(-1);
  const [mostrarMesDropdown, setMostrarMesDropdown] = useState(false);
  const [mostrarSemanaDropdown, setMostrarSemanaDropdown] = useState(false);
  
  const [fechaRangoDesde, setFechaRangoDesde] = useState<string>("");
  const [fechaRangoHasta, setFechaRangoHasta] = useState<string>("");

  const mesDropdownRef = useRef<HTMLDivElement>(null);
  const semanaDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mesDropdownRef.current && !mesDropdownRef.current.contains(event.target as Node)) {
        setMostrarMesDropdown(false);
      }
      if (semanaDropdownRef.current && !semanaDropdownRef.current.contains(event.target as Node)) {
        setMostrarSemanaDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const comprasFiltradas = useMemo(() => {
    return compras.filter(c => {
      const fechaCompra = new Date(c.created_at);
      if (tipoFiltroFecha === "dia") {
        return fechaCompra.toISOString().split('T')[0] === fechaDia;
      } else if (tipoFiltroFecha === "semana") {
        if (fechaCompra.getMonth() !== activeMonth || fechaCompra.getFullYear() !== activeYear) return false;
        if (selectedWeekIndex !== -1) {
          const semanas = obtenerSemanasDelMes(activeMonth, activeYear);
          const semanaSeleccionada = semanas[selectedWeekIndex];
          if (semanaSeleccionada) {
            const dateC = new Date(fechaCompra).setHours(0,0,0,0);
            const desde = new Date(semanaSeleccionada.desde + "T00:00:00").getTime();
            const hasta = new Date(semanaSeleccionada.hasta + "T00:00:00").getTime();
            return dateC >= desde && dateC <= hasta;
          }
        }
        return true;
      } else if (tipoFiltroFecha === "rango") {
        const dateC = new Date(fechaCompra).setHours(0,0,0,0);
        const from = fechaRangoDesde ? new Date(fechaRangoDesde).setHours(0,0,0,0) : 0;
        const to = fechaRangoHasta ? new Date(fechaRangoHasta).setHours(23,59,59,999) : Infinity;
        return dateC >= from && dateC <= to;
      }
      return true;
    });
  }, [compras, tipoFiltroFecha, fechaDia, activeMonth, activeYear, selectedWeekIndex, fechaRangoDesde, fechaRangoHasta]);

  const chartData = useMemo(() => {
    if (tipoFiltroFecha === "dia") {
      const d = new Date(fechaDia + "T00:00:00");
      if (isNaN(d.getTime())) return [];
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const data = [];
      for (let i = 1; i <= daysInMonth; i++) {
        const total = compras.filter(c => {
          const cDate = new Date(c.created_at);
          return cDate.getFullYear() === year && cDate.getMonth() === month && cDate.getDate() === i;
        }).reduce((acc, curr) => acc + curr.total, 0);
        data.push({
          fecha: `${i} ${d.toLocaleDateString("es-GT", { month: "short" })}`,
          total
        });
      }
      return data;
    } else if (tipoFiltroFecha === "semana") {
      const data = [];
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(activeYear, i, 1);
        const monthName = monthDate.toLocaleDateString("es-GT", { month: "short" });
        const total = compras.filter(c => {
          const date = new Date(c.created_at);
          return date.getFullYear() === activeYear && date.getMonth() === i;
        }).reduce((acc, curr) => acc + curr.total, 0);
        data.push({
          fecha: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          total
        });
      }
      return data;
    } else if (tipoFiltroFecha === "rango") {
      if (!fechaRangoDesde || !fechaRangoHasta) return [];
      const start = new Date(fechaRangoDesde + "T00:00:00");
      const end = new Date(fechaRangoHasta + "T23:59:59");
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
      
      const data = [];
      const current = new Date(start);
      current.setHours(0,0,0,0);
      let daysCount = 0;
      while (current <= end && daysCount < 366) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const dateDay = current.getDate();
        const total = compras.filter(c => {
          const cDate = new Date(c.created_at);
          return cDate.getFullYear() === year && cDate.getMonth() === month && cDate.getDate() === dateDay;
        }).reduce((acc, curr) => acc + curr.total, 0);
        
        data.push({
          fecha: current.toLocaleDateString("es-GT", { month: "short", day: "numeric" }),
          total
        });
        current.setDate(current.getDate() + 1);
        daysCount++;
      }
      return data;
    }
    return [];
  }, [compras, tipoFiltroFecha, fechaDia, activeYear, fechaRangoDesde, fechaRangoHasta]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-[95vw] h-[85vh] max-w-none bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden flex flex-col mt-10"
      >
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 shrink-0">
          <div>
            <h3 className="font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-wider text-sm flex items-center gap-2">
              <Clock className="size-4" /> Historial de Compras
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Proveedor: {proveedor.nombre}</p>
          </div>

          <div className="flex-1 flex justify-center w-full md:w-auto">
            {/* Opciones Dia/Mes/Rango */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full md:w-fit mx-auto sm:mx-0">
              <div className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-900/50 p-1 rounded-xl border border-slate-100 dark:border-zinc-800 w-full sm:w-auto">
                {[
                  { id: "dia", label: "Día" },
                  { id: "semana", label: "Mes" },
                  { id: "rango", label: "Rango" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTipoFiltroFecha(opt.id)}
                    className={cn(
                      "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      tipoFiltroFecha === opt.id
                        ? "bg-white dark:bg-zinc-800 text-[#8DA78E] shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Selector de Fecha específico según tipo */}
              <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                {tipoFiltroFecha === "dia" && (
                  <CustomDatePicker
                    value={fechaDia}
                    onChange={setFechaDia}
                    align="center"
                  />
                )}

                {tipoFiltroFecha === "semana" && (
                  <div className="flex items-center gap-2 w-full">
                    {/* Selector de Mes/Año */}
                    <div className="relative w-1/2 sm:w-auto" ref={mesDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setMostrarMesDropdown(!mostrarMesDropdown)}
                        className="flex items-center justify-between w-full sm:w-[140px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] rounded-xl px-2.5 py-1.5 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#8DA78E] transition-all h-[34px]"
                      >
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-[#8DA78E]" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][activeMonth]} {activeYear}
                          </span>
                        </div>
                        <ChevronDown className="size-3 text-slate-400" />
                      </button>

                      <AnimatePresence>
                        {mostrarMesDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-48 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2"
                          >
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-900">
                              <button
                                type="button"
                                onClick={() => setActiveYear((y) => y - 1)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 cursor-pointer"
                              >
                                <ChevronLeft className="size-3.5" />
                              </button>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{activeYear}</span>
                              <button
                                type="button"
                                onClick={() => setActiveYear((y) => y + 1)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 cursor-pointer"
                              >
                                <ChevronRight className="size-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, idx) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setActiveMonth(idx);
                                    setMostrarMesDropdown(false);
                                    setSelectedWeekIndex(-1); // Reset a todo el mes
                                  }}
                                  className={cn(
                                    "px-1 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                                    activeMonth === idx
                                      ? "bg-[#8DA78E] text-white"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                  )}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selector de Semana */}
                    <div className="relative w-1/2 sm:w-auto" ref={semanaDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setMostrarSemanaDropdown(!mostrarSemanaDropdown)}
                        className="flex items-center justify-between w-full sm:w-[150px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 hover:border-[#8DA78E] rounded-xl px-2.5 py-1.5 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[#8DA78E] transition-all h-[34px]"
                      >
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {selectedWeekIndex === -1 ? "Todo el mes" : obtenerSemanasDelMes(activeMonth, activeYear)[selectedWeekIndex]?.label || "Semana"}
                        </span>
                        <ChevronDown className="size-3 text-slate-400 shrink-0" />
                      </button>
                      
                      <AnimatePresence>
                        {mostrarSemanaDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[180px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWeekIndex(-1);
                                setMostrarSemanaDropdown(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between cursor-pointer",
                                selectedWeekIndex === -1
                                  ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                              )}
                            >
                              <span>Todo el mes</span>
                              {selectedWeekIndex === -1 && <Check className="size-3" />}
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                            {obtenerSemanasDelMes(activeMonth, activeYear).map((sem, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedWeekIndex(idx);
                                  setMostrarSemanaDropdown(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer",
                                  selectedWeekIndex === idx
                                    ? "bg-[#8DA78E]/10 text-[#8DA78E]"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900"
                                )}
                              >
                                <span>{sem.label}</span>
                                {selectedWeekIndex === idx && <Check className="size-3" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {tipoFiltroFecha === "rango" && (
                  <div className="flex items-center justify-center gap-2">
                    <CustomDatePicker
                      value={fechaRangoDesde}
                      onChange={setFechaRangoDesde}
                      placeholder="Desde"
                      align="center"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <CustomDatePicker
                      value={fechaRangoHasta}
                      onChange={setFechaRangoHasta}
                      placeholder="Hasta"
                      align="center"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="text-zinc-400 ml-auto md:ml-0 cursor-pointer">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="h-64 w-full bg-white dark:bg-zinc-900 rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="fecha" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `Q${value}`} />
                <Tooltip 
                  formatter={(value: any) => [fmtQ(Number(value)), "Total"]}
                  labelStyle={{ color: '#000' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="total" stroke="#8DA78E" strokeWidth={3} dot={{ r: 4, fill: "#8DA78E", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#525D53" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#525D53] dark:text-[#A3BEB0] mb-3">Detalle de Compras</h4>
            {comprasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <ShoppingBag className="size-12 mb-3 opacity-20" />
                <p className="text-sm font-bold">No hay compras registradas en este período.</p>
              </div>
            ) : (
              comprasFiltradas.map(c => {
                const abonos = c.fin_transacciones?.filter((t:any) => t.categoria === "pago_proveedor").reduce((sum:number, t:any) => sum + Math.abs(Number(t.monto)), 0) || 0;
                const saldoCompra = Math.max(0, c.total - abonos);
                const isPaid = abonos >= c.total;

                return (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                    <div>
                      <p className="font-black text-sm text-zinc-800 dark:text-zinc-100">{fmtQ(c.total)}</p>
                      <p className="text-[10px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5"><Clock className="size-3" /> {new Date(c.created_at).toLocaleString("es-GT")}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md", isPaid ? "bg-[#8DA78E]/10 text-[#8DA78E] dark:bg-[#A3BEB0]/10 dark:text-[#A3BEB0]" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400")}>
                      {isPaid ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

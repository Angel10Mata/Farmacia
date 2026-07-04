"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import Swal from "sweetalert2";
import { guardarProveedor, eliminarProveedor } from "../actions";

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
    return clean.replace(prefixRegex, "");
  }
  if (clean.startsWith("502") && clean.length > 8) {
    return clean.substring(3);
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
          className="text-slate-400 hover:text-[#525D53] dark:hover:text-[#A3BEB0] transition-colors text-base font-bold px-1.5 cursor-pointer shrink-0"
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
      <div className="mt-auto pt-3 border-t border-[#C1D1C5]/30 dark:border-[#A3BEB0]/10 flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-2 bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEliminar}
              className="flex-1 py-2 bg-red-400 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              Eliminar
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2 bg-[#A3BEB0]/20 hover:bg-[#A3BEB0]/40 text-[#525D53] dark:text-[#A3BEB0] text-xs font-bold rounded-xl transition-all cursor-pointer uppercase text-center"
            >
              Editar
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

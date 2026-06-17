"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Save,
  DollarSign, 
  Calendar as CalendarIcon,
  RefreshCw
} from "lucide-react";
import { registrarPagoMantenimiento } from "@/components/(Kore)/proyectos/lib/actions";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

interface PagoMantenimientoModalProps {
  proyecto: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function PagoMantenimientoModal({ proyecto, onClose, onSuccess }: PagoMantenimientoModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const pct = Number(proyecto.monto_mantenimiento) || Number(proyecto.mantenimiento) || 0;
  const sugerido = proyecto.monto_mensual_fijo 
    ? Number(proyecto.monto_mensual_fijo) 
    : ((Number(proyecto.precio) || 0) * pct / 100);

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    monto_cobrado: sugerido > 0 ? sugerido.toFixed(2) : "",
    fecha_pago: new Date().toISOString().split("T")[0],
    descripcion: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.monto_cobrado || !formData.fecha_pago) {
      Swal.fire({
        icon: "error",
        title: "Campos requeridos",
        text: "Monto y Fecha de pago son obligatorios.",
        background: isDark ? "#18181b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
      return;
    }

    if (sugerido > 0 && Number(formData.monto_cobrado) !== sugerido) {
      Swal.fire({
        icon: "error",
        title: "Monto incorrecto",
        text: `El monto ingresado debe coincidir con la mensualidad estipulada de ${formatMoney(sugerido)}.`,
        background: isDark ? "#18181b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
      return;
    }

    setLoading(true);
    
    // Add time component to dates for timestamptz
    let fechaPagoIso = new Date().toISOString();
    try {
      const parsedPagoDate = new Date(formData.fecha_pago + "T12:00:00");
      if (!isNaN(parsedPagoDate.getTime())) {
        fechaPagoIso = parsedPagoDate.toISOString();
      }
    } catch {}
    
    // Auto-advance proxima_fecha_cobro by 1 month
    let proximaFechaIso = null;
    try {
      const parsedCobroDate = proyecto.mantenimiento_fecha_cobro ? new Date(proyecto.mantenimiento_fecha_cobro) : null;
      if (parsedCobroDate && !isNaN(parsedCobroDate.getTime())) {
        parsedCobroDate.setUTCMonth(parsedCobroDate.getUTCMonth() + 1);
        proximaFechaIso = parsedCobroDate.toISOString();
      } else {
        const d = new Date(formData.fecha_pago + "T12:00:00");
        if (!isNaN(d.getTime())) {
          d.setUTCMonth(d.getUTCMonth() + 1);
          proximaFechaIso = d.toISOString();
        }
      }
    } catch {}


    const res = await registrarPagoMantenimiento(
      proyecto.id,
      Number(formData.monto_cobrado),
      fechaPagoIso,
      "", // periodo_pagado removed
      formData.descripcion,
      proximaFechaIso
    );

    setLoading(false);

    if (res?.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: isDark ? "#18181b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Pago Registrado",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        background: isDark ? "#18181b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
      });
      onSuccess();
    }
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(val);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div>
            <h3 className="font-black text-lg text-foreground uppercase tracking-widest leading-none">Registrar Pago</h3>
            <p className="text-xs text-muted-foreground mt-1">{proyecto.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <form id="pago-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Monto Cobrado <span className="text-emerald-500 lowercase normal-case">(Mensualidad: {formatMoney(sugerido)})</span>
                </label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    name="monto_cobrado"
                    value={formData.monto_cobrado}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha de Pago</label>
                <input
                  type="date"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleChange}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                  required
                />
              </div>
            </div>



            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Notas</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={2}
                className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            CANCELAR
          </button>
          <button
            type="submit"
            form="pago-form"
            disabled={loading}
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black tracking-widest transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            GUARDAR PAGO
          </button>
        </div>
      </motion.div>
    </div>
  );
}

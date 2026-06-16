"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Save, 
  History, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Calendar as CalendarIcon,
  RefreshCw
} from "lucide-react";
import { getMantenimientoHistorial, registrarPagoMantenimiento } from "@/components/(Kore)/proyectos/lib/actions";
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
  const sugerido = (Number(proyecto.precio) || 0) * pct / 100;

  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);

  const [formData, setFormData] = useState({
    monto_cobrado: sugerido.toString(),
    fecha_pago: new Date().toISOString().split("T")[0],
    periodo_pagado: "",
    descripcion: "",
    proxima_fecha_cobro: proyecto.mantenimiento_fecha_cobro ? new Date(proyecto.mantenimiento_fecha_cobro).toISOString().split("T")[0] : ""
  });

  useEffect(() => {
    const fetchHistorial = async () => {
      setLoadingHistorial(true);
      try {
        const data = await getMantenimientoHistorial(proyecto.id);
        setHistorial(data);
      } catch (err) {
        console.error("Error fetching historial:", err);
      } finally {
        setLoadingHistorial(false);
      }
    };
    fetchHistorial();
  }, [proyecto.id]);

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

    setLoading(true);
    
    // Add time component to dates for timestamptz
    const fechaPagoIso = new Date(formData.fecha_pago + "T12:00:00").toISOString();
    const proximaFechaIso = formData.proxima_fecha_cobro ? new Date(formData.proxima_fecha_cobro + "T12:00:00").toISOString() : null;

    const res = await registrarPagoMantenimiento(
      proyecto.id,
      Number(formData.monto_cobrado),
      fechaPagoIso,
      formData.periodo_pagado,
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
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monto Cobrado (Q)</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    name="monto_cobrado"
                    value={formData.monto_cobrado}
                    onChange={handleChange}
                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
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
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Periodo Pagado</label>
              <input
                type="text"
                name="periodo_pagado"
                value={formData.periodo_pagado}
                onChange={handleChange}
                placeholder="Ej. Enero 2024, Q1 2024..."
                className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Próxima Fecha de Cobro</label>
              <input
                type="date"
                name="proxima_fecha_cobro"
                value={formData.proxima_fecha_cobro}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
              />
              <p className="text-[9px] text-muted-foreground">Actualizará la fecha de próximo cobro del proyecto.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Notas</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={2}
                className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all resize-none"
              />
            </div>
          </form>

          {/* Historial Accordion */}
          <div className="mt-8 border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHistorial(!showHistorial)}
              className="w-full flex items-center justify-between p-4 bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History size={16} className="text-muted-foreground" />
                <span className="text-xs font-black uppercase tracking-widest text-foreground">Historial de Pagos</span>
              </div>
              {showHistorial ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
            </button>
            
            <AnimatePresence>
              {showHistorial && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-background"
                >
                  <div className="p-4 border-t border-border">
                    {loadingHistorial ? (
                      <div className="flex justify-center py-4">
                        <RefreshCw size={16} className="animate-spin text-muted-foreground" />
                      </div>
                    ) : historial.length === 0 ? (
                      <p className="text-xs text-center text-muted-foreground py-4">No hay pagos registrados.</p>
                    ) : (
                      <div className="space-y-3">
                        {historial.map((h) => (
                          <div key={h.id} className="flex justify-between items-center p-3 rounded-lg border border-border/50 bg-muted/5">
                            <div>
                              <p className="text-xs font-bold text-foreground">{formatMoney(Number(h.monto_cobrado))}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(h.fecha_pago).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              {h.periodo_pagado && <p className="text-[10px] font-medium text-foreground bg-muted px-2 py-0.5 rounded inline-block">{h.periodo_pagado}</p>}
                              {h.descripcion && <p className="text-[9px] text-muted-foreground mt-1 truncate max-w-[150px]">{h.descripcion}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-xs font-black tracking-widest transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            GUARDAR PAGO
          </button>
        </div>
      </motion.div>
    </div>
  );
}

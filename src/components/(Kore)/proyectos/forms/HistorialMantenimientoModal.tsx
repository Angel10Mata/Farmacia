"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, History, RefreshCw, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { getMantenimientoHistorial } from "@/components/(Kore)/proyectos/lib/actions";

interface HistorialMantenimientoModalProps {
  proyecto: any;
  onClose: () => void;
}

export function HistorialMantenimientoModal({ proyecto, onClose }: HistorialMantenimientoModalProps) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(val);
  };

  useEffect(() => {
    const fetchHistorial = async () => {
      setLoading(true);
      try {
        const data = await getMantenimientoHistorial(proyecto.id);
        setHistorial(data);
      } catch (err) {
        console.error("Error fetching historial:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, [proyecto.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <History size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                Historial de Pagos
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium">
                {proyecto.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <RefreshCw size={24} className="animate-spin text-red-500" />
              <p className="text-xs font-bold uppercase tracking-widest">Cargando historial...</p>
            </div>
          ) : historial.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                <DollarSign size={20} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-foreground">Sin registros</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Aún no hay pagos de mantenimiento registrados para este proyecto.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((h) => (
                <div key={h.id} className="flex flex-col gap-2 p-3 rounded-xl border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-emerald-400">
                        {formatMoney(Number(h.monto_cobrado))}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground font-medium">
                        <CalendarIcon size={10} />
                        {new Date(h.fecha_pago).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {h.descripcion && (
                    <div className="mt-1 pt-2 border-t border-border/30">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {h.descripcion}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

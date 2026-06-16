"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ChevronRight, Bell } from "lucide-react";
import { getProyectos } from "@/components/(Kore)/proyectos/lib/actions";

const ALERT_DAYS = 5;

interface AlertProyecto {
  id: string;
  nombre: string;
  cliente_nombre: string;
  days: number;
  fechaCobro: string;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

export function MaintenanceAlertBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertProyecto[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Only show on proyectos pages
  const isProyectosPage = pathname?.startsWith("/kore/proyectos");

  const fetchAlerts = useCallback(async () => {
    if (!isProyectosPage) return;
    try {
      const data = await getProyectos();
      const alertsFound: AlertProyecto[] = [];
      (data || []).forEach((p: any) => {
        if (!p.mantenimiento_activo || !p.mantenimiento_fecha_cobro) return;
        const days = getDaysUntil(p.mantenimiento_fecha_cobro);
        if (days >= 0 && days <= ALERT_DAYS) {
          alertsFound.push({
            id: p.id,
            nombre: p.nombre,
            cliente_nombre: p.cliente_nombre || "",
            days,
            fechaCobro: p.mantenimiento_fecha_cobro,
          });
        }
      });
      // Sort by soonest first
      alertsFound.sort((a, b) => a.days - b.days);
      setAlerts(alertsFound);
      setDismissed(false);
      setCurrentIdx(0);
    } catch {
      // silently fail — don't block UI
    }
  }, [isProyectosPage]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, pathname]);

  // Auto-rotate through alerts if more than one
  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  const isVisible = isProyectosPage && !dismissed && alerts.length > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="maintenance-alert-bar"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 w-full z-[98] bg-gradient-to-r from-amber-500/95 via-amber-400/95 to-amber-500/95 backdrop-blur-md border-b border-amber-300/30 shadow-lg shadow-amber-500/20"
          style={{ top: "var(--header-height, 56px)" }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-10 flex items-center justify-between gap-3">
            {/* Icon + message */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="shrink-0 flex items-center gap-1">
                <Bell size={14} className="text-black/80 animate-bounce" />
                {alerts.length > 1 && (
                  <span className="text-[9px] font-black text-black/70 px-1.5 py-0.5 rounded-full bg-black/10 border border-black/10">
                    {currentIdx + 1}/{alerts.length}
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {alerts[currentIdx] && (
                  <motion.p
                    key={currentIdx}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] sm:text-xs font-bold text-black/90 truncate"
                  >
                    <AlertTriangle size={10} className="inline mr-1 -mt-px" />
                    <span className="font-black">COBRO EN {alerts[currentIdx].days === 0 ? "HOY" : `${alerts[currentIdx].days} DÍA${alerts[currentIdx].days !== 1 ? "S" : ""}`}</span>
                    {" — "}
                    <span className="font-semibold">{alerts[currentIdx].nombre}</span>
                    {alerts[currentIdx].cliente_nombre && (
                      <span className="opacity-70"> ({alerts[currentIdx].cliente_nombre})</span>
                    )}
                    {" · "}
                    <span className="opacity-70">{formatDate(alerts[currentIdx].fechaCobro)}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => router.push("/kore/proyectos/mantenimiento")}
                className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-black/80 hover:text-black px-2 py-1 rounded-lg bg-black/10 hover:bg-black/20 transition-all border border-black/10 cursor-pointer"
              >
                VER TODOS <ChevronRight size={10} />
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded-lg hover:bg-black/20 text-black/70 hover:text-black transition-all cursor-pointer"
                title="Cerrar alerta"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

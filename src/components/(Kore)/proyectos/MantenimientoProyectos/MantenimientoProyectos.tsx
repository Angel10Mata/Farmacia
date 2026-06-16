"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import { 
  getProyectos, 
  updateMantenimientoProyecto,
} from "@/components/(Kore)/proyectos/lib/actions";

// Components
import { PagoMantenimientoModal } from "@/components/(Kore)/proyectos/forms/PagoMantenimientoModal";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { useTheme } from "next-themes";
import Swal from "sweetalert2";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
}

function formatMoney(val: number): string {
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(val);
}

function DaysChip({ days }: { days: number | null }) {
  if (days === null) return <span className="text-muted-foreground text-xs">Sin fecha</span>;
  if (days < 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
      <AlertTriangle size={10} /> Vencido
    </span>
  );
  if (days <= 5) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
      <Clock size={10} /> {days}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
      <CheckCircle2 size={10} /> {days}d
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MantenimientoProyectos() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { effectiveRole } = useUserContext();

  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  // Editing state per row: id → "date-input string"
  const [editingDate, setEditingDate] = useState<Record<string, string>>({});
  // Modal state
  const [pagoModalProyecto, setPagoModalProyecto] = useState<any>(null);

  // Role guard
  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProyectos();
      setProyectos(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Toggle mantenimiento_activo
  const handleToggle = async (p: any) => {
    const newActivo = !p.mantenimiento_activo;
    setSaving(p.id);
    const res = await updateMantenimientoProyecto(p.id, newActivo, p.mantenimiento_fecha_cobro);
    if (res?.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: isDark ? "#18181b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } else {
      setProyectos(prev =>
        prev.map(x => x.id === p.id ? { ...x, mantenimiento_activo: newActivo } : x)
      );
    }
    setSaving(null);
  };

  // Save date for a specific project
  const handleSaveDate = async (p: any) => {
    const newDate = editingDate[p.id] ?? "";
    // Convert local date string to ISO timestamp with timezone
    const isoDate = newDate ? new Date(newDate + "T00:00:00").toISOString() : null;
    setSaving(p.id);
    const res = await updateMantenimientoProyecto(p.id, p.mantenimiento_activo, isoDate);
    if (res?.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: isDark ? "#18181b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    } else {
      setProyectos(prev =>
        prev.map(x => x.id === p.id ? { ...x, mantenimiento_fecha_cobro: isoDate } : x)
      );
      setEditingDate(prev => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      Swal.fire({
        icon: "success",
        toast: true,
        title: "Fecha actualizada",
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        background: isDark ? "#18181b" : "#fff",
        color: isDark ? "#fff" : "#000",
      });
    }
    setSaving(null);
  };

  // Derived data
  const activeProyectos = proyectos.filter(p => p.aplica_mantenimiento || p.mantenimiento > 0);

  // For the date input default value
  function toInputDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 text-foreground px-4 pt-32 pb-16 md:px-8 md:pt-24 relative">
      {/* Decorative glow */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none">
            GESTIÓN DE <br className="hidden sm:block" />
            <span className="text-celeste-kore">MANTENIMIENTO</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium tracking-wider uppercase">
            Proyectos con cobro mensual activo
          </p>
        </div>
        <div className="flex items-stretch gap-2 w-full sm:w-auto">
          <button
            onClick={() => router.push("/kore/proyectos")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft size={14} className="sm:w-[18px] sm:h-[18px] text-celeste-kore" />
            PROYECTOS
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={`sm:w-[18px] sm:h-[18px] ${loading ? "animate-spin" : ""}`} />
            ACTUALIZAR
          </button>
        </div>
      </div>



      {/* ── TABLE ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-none dark:shadow-2xl dark:shadow-black/20 overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-border/50">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Wrench size={16} className="text-amber-400" />
          </div>
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground/90">
            Proyectos con Mantenimiento
          </h3>
          <span className="ml-auto text-[9px] font-bold px-2 py-1 rounded-full bg-muted/30 text-muted-foreground uppercase tracking-widest">
            {activeProyectos.length} proyecto{activeProyectos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <RefreshCw size={18} className="text-amber-400 animate-spin" />
            <span className="text-sm text-muted-foreground font-medium">Cargando proyectos...</span>
          </div>
        ) : activeProyectos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
              <Wrench size={32} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-muted-foreground">Sin proyectos con mantenimiento</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs">
              Los proyectos aparecen aquí cuando tienen una deducción de tipo "Mantenimiento" registrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left px-4 sm:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Proyecto</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cliente</th>
                  <th className="text-right px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Monto</th>
                  <th className="text-center px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Activo</th>
                  <th className="text-left px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Fecha Cobro</th>
                  <th className="text-center px-4 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Días</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {activeProyectos.map((p, idx) => {
                    const pct = Number(p.monto_mantenimiento) || Number(p.mantenimiento) || 0;
                    const montoMensual = (Number(p.precio) || 0) * pct / 100;
                    const days = getDaysUntil(p.mantenimiento_fecha_cobro);
                    const isEditing = p.id in editingDate;
                    const isSaving = saving === p.id;

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors group"
                      >
                        {/* Project */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 shrink-0">
                              <Wrench size={12} className="text-amber-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground leading-none">{p.nombre}</p>
                              <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{p.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3.5">
                          <p className="text-xs font-medium text-foreground/80">{p.cliente_nombre || "—"}</p>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3.5 text-right">
                          <div>
                            <p className="text-xs font-bold text-emerald-400">{formatMoney(montoMensual)}</p>
                            <p className="text-[9px] text-muted-foreground">{pct}% mensual</p>
                          </div>
                        </td>

                        {/* Toggle */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggle(p)}
                            disabled={isSaving}
                            className="flex items-center justify-center mx-auto transition-all hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                            title={p.mantenimiento_activo ? "Desactivar mantenimiento" : "Activar mantenimiento"}
                          >
                            {isSaving ? (
                              <RefreshCw size={22} className="text-amber-400 animate-spin" />
                            ) : p.mantenimiento_activo ? (
                              <ToggleRight size={28} className="text-emerald-400" />
                            ) : (
                              <ToggleLeft size={28} className="text-muted-foreground/40" />
                            )}
                          </button>
                        </td>

                        {/* Date input */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={isEditing ? editingDate[p.id] : toInputDate(p.mantenimiento_fecha_cobro)}
                              onChange={e => setEditingDate(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="text-xs bg-muted/20 border border-border/50 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-foreground w-[130px]"
                            />
                            {isEditing && (
                              <button
                                onClick={() => handleSaveDate(p)}
                                disabled={isSaving}
                                className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-400 text-[10px] font-bold border border-amber-400/20 cursor-pointer transition-all disabled:opacity-50"
                              >
                                OK
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Days chip */}
                        <td className="px-4 py-3.5 text-center">
                          {p.mantenimiento_activo ? <DaysChip days={days} /> : (
                            <span className="text-[10px] text-muted-foreground/40 font-medium">Inactivo</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPagoModalProyecto(p)}
                              className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-500 transition-colors cursor-pointer bg-amber-400/10 hover:bg-amber-400/20 px-2 py-1 rounded-md"
                            >
                              <DollarSign size={12} /> PAGO
                            </button>
                            <button
                              onClick={() => {
                              sessionStorage.setItem('selectedProyectoId', p.id);
                              router.push('/kore/proyectos/ver');
                            }}
                              className="flex items-center gap-1 text-[10px] font-bold text-celeste-kore hover:text-celeste-kore/80 transition-colors cursor-pointer"
                            >
                              VER <ChevronRight size={12} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {pagoModalProyecto && (
          <PagoMantenimientoModal
            proyecto={pagoModalProyecto}
            onClose={() => setPagoModalProyecto(null)}
            onSuccess={() => {
              setPagoModalProyecto(null);
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

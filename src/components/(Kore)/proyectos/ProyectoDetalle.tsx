"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { deleteProyecto, getProyectos } from "@/app/kore/proyectos/actions";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import QRProyecto from "./QRProyecto";

interface ProyectoDetalleProps {
  proyecto?: any;
}

const DASH_TIPO_STYLE: Record<string, string> = {
  "IVA":           "bg-amber-500/10 text-amber-400 border-amber-500/25",
  "Documentación": "bg-purple-500/10 text-purple-400 border-purple-500/25",
  "Comisión":      "bg-blue-500/10 text-blue-400 border-blue-500/25",
  "Vendedor":      "bg-blue-500/10 text-blue-400 border-blue-500/25",
  "Kore":          "bg-red-500/10 text-red-400 border-red-500/25",
  "Desarrollador": "bg-sky-500/10 text-sky-400 border-sky-500/25",
};

function DetailDeduccionItem({ d, forceOpen, precio }: { d: any; forceOpen: boolean; precio: number }) {
  const [open, setOpen] = useState(false);
  const userName = d.usuario_nombre || "";
  const hasDetails = !!(userName || d.descripcion);
  const isOpen = forceOpen || open;
  const pillClass = DASH_TIPO_STYLE[d.tipo] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/25";
  const valorMonetario = precio * (Number(d.porcentaje) || 0) / 100;

  return (
    <div
      className={`border-b border-zinc-200 dark:border-zinc-800 last:border-0 ${
        hasDetails ? "cursor-pointer" : ""
      }`}
      onClick={() => hasDetails && setOpen((o) => !o)}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0 ${pillClass}`}>
          {d.tipo}
        </span>
        <div className="flex-1" />
        <div className="flex flex-col items-end shrink-0 text-right">
          <span className="text-sm font-black tabular-nums text-foreground">
            Q{valorMonetario.toLocaleString('en-US', {minimumFractionDigits: 2})}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground tabular-nums leading-none mt-0.5">
            {Number(d.porcentaje)}%
          </span>
        </div>
        {hasDetails ? (
          <ChevronDown
            size={12}
            className={`text-muted-foreground/40 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        ) : (
          <ChevronDown
            size={12}
            className="text-transparent shrink-0 pointer-events-none select-none"
          />
        )}
      </div>

      <AnimatePresence initial={false}>
        {isOpen && hasDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-2.5 space-y-0.5 border-t border-zinc-100 dark:border-zinc-800/60">
              {userName && (
                <p className="text-[11px] text-foreground/60 pt-1.5">
                  <span className="font-semibold text-foreground/50">Asignado a:</span>{" "}
                  <span className="font-bold text-sky-500">{userName}</span>
                </p>
              )}
              {d.descripcion && (
                <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-1.5 break-words">
                  &ldquo;{d.descripcion}&rdquo;
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailDedListWithToggle({
  deds,
  totalPct,
  precio,
  mant,
  restante,
}: {
  deds: any[];
  totalPct: number;
  precio: number;
  mant: number;
  restante: number;
}) {
  const [allExpanded, setAllExpanded] = useState(false);
  const totalDeduccionesMonetario = (precio * totalPct) / 100;

  const sortedDeds = [...deds].sort((a, b) => {
    const getOrderScore = (tipo: string) => {
      const t = tipo.toLowerCase();
      if (t === "kore") return 1;
      if (t === "iva") return 2;
      if (t === "documentación" || t === "documentacion") return 3;
      if (t === "desarrollador" || t === "desarrolladores" || t === "desarrollo") return 4;
      if (t === "vendedor" || t === "vendedores" || t === "comisión" || t === "comision") return 5;
      return 6;
    };
    return getOrderScore(a.tipo) - getOrderScore(b.tipo);
  });

  return (
    <div className="space-y-3 pt-3.5 border-t border-zinc-200 dark:border-zinc-800/80">
      <button
        type="button"
        onClick={() => setAllExpanded((v) => !v)}
        className="w-full flex items-center gap-3 pb-2 text-left hover:opacity-80 transition-opacity"
      >
        <h5 className="text-[11px] font-black uppercase tracking-widest text-foreground/70">
          Deducibles:
        </h5>
        {sortedDeds.length > 0 && (
          <span className="text-[11px] font-black text-foreground/70">
            {sortedDeds.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-black px-2 py-1 rounded-lg border text-destructive border-destructive/20 bg-destructive/10">
            Total: Q{totalDeduccionesMonetario.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({totalPct}%)
          </span>
          {sortedDeds.length > 0 && (
            <ChevronDown
              size={13}
              className={`text-muted-foreground/50 transition-transform duration-200 ${
                allExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </button>

      <AnimatePresence mode="popLayout">
        {sortedDeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5"
          >
            {sortedDeds.map((d, index) => (
              <DetailDeduccionItem
                key={index}
                d={d}
                forceOpen={allExpanded}
                precio={precio}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 pt-2 text-xs sm:text-sm border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex justify-between items-center gap-2 py-0.5">
          <span className="text-zinc-500 dark:text-zinc-400 min-w-0 truncate">
            Total Deducibles ({totalPct}%):
          </span>
          <span className="font-bold shrink-0 text-right text-destructive">
            Q{totalDeduccionesMonetario.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {mant > 0 && (
          <div className="flex justify-between items-center gap-2 py-0.5">
            <span className="text-zinc-500 dark:text-zinc-400 min-w-0 truncate">
              Mantenimiento Mensual:
            </span>
            <span className="font-bold shrink-0 text-right text-celeste-kore">
              Q{mant.toLocaleString("en-US", { minimumFractionDigits: 2 })} / mes
            </span>
          </div>
        )}

        <div className="flex justify-between items-center gap-2 py-1.5 border-t border-zinc-200 dark:border-zinc-800/80 pt-2 font-black text-sm sm:text-base text-celeste-kore">
          <span className="min-w-0 truncate">Saldo Final:</span>
          <span className="shrink-0 text-right">
            Q{restante.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ProyectoDetalle({ proyecto: proyectoProp }: ProyectoDetalleProps) {
  const params = useParams();
  const paramId = params?.id as string | undefined;

  const [proyecto, setProyecto] = useState<any | null>(proyectoProp ?? null);
  const [loadingProyecto, setLoadingProyecto] = useState(!!paramId && !proyectoProp);
  const [notFound, setNotFound] = useState(false);

  const { effectiveRole } = useUserContext();
  const isDeveloper = effectiveRole === "proyectos";
  const router = useRouter();
  const { theme } = useTheme();
  const [qrProyecto, setQrProyecto] = useState<any | null>(null);

  // Role guard
  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  // Fetch project by ID from URL when no prop is passed
  useEffect(() => {
    if (!paramId || proyectoProp) return;
    let active = true;
    setLoadingProyecto(true);
    getProyectos()
      .then((data) => {
        if (!active) return;
        const found = data.find((p: any) => p.id === paramId);
        if (found) {
          setProyecto(found);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoadingProyecto(false); });
    return () => { active = false; };
  }, [paramId, proyectoProp]);

  // Loading state
  if (loadingProyecto) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-32 md:p-8 md:pt-24">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <RefreshCw size={32} className="animate-spin text-celeste-kore" />
          <p className="text-sm font-bold uppercase tracking-widest">Cargando proyecto…</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !proyecto) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 pt-32 md:p-8 md:pt-24">
        <div className="text-center space-y-3">
          <p className="text-lg font-black text-foreground">Proyecto no encontrado</p>
          <p className="text-sm text-muted-foreground">El proyecto que buscas no existe o fue eliminado.</p>
        </div>
      </div>
    );
  }

  const getCode = (id: string) => {
    if (!id) return "";
    const clean = id.replace(/-/g, "").slice(0, 6).toUpperCase();
    return clean.slice(0, 3) + "-" + clean.slice(3, 6);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatPhoneDisplay = (phone: string | null | undefined): string => {
    if (!phone) return "";
    const clean = phone.trim();
    if (!clean) return "";
    const cleanNoSpaces = clean.replace(/\s+/g, "");
    const gtMatch = cleanNoSpaces.match(/^\+502(\d{4})(\d{4})$/);
    if (gtMatch) return `${gtMatch[1]}-${gtMatch[2]}`;
    const gtShortMatch = cleanNoSpaces.match(/^(\d{4})(\d{4})$/);
    if (gtShortMatch) return `${gtShortMatch[1]}-${gtShortMatch[2]}`;
    return clean;
  };

  const handleDeleteProyecto = async () => {
    const isDark = theme === "dark";
    const result = await Swal.fire({
      title: "¿Eliminar proyecto?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: isDark ? "#27272a" : "#e4e4e7",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: isDark ? "#18181b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
    });

    if (result.isConfirmed) {
      const res = await deleteProyecto(proyecto.id);
      if (res.error) {
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
          title: "Eliminado",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: isDark ? "#18181b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
        router.push("/kore/proyectos");
      }
    }
  };

  const precio = Number(proyecto.precio) || 0;
  const mant = Number(proyecto.mantenimiento) || 0;
  
  const getDedSum = (tipo: string) => {
    return (proyecto.deducciones || [])
      .filter((d: any) => d.tipo.toLowerCase() === tipo.toLowerCase() || (tipo === "Vendedor" && d.tipo === "Comisión") || (tipo === "Desarrollador" && d.tipo === "Desarrollo"))
      .reduce((acc: number, curr: any) => acc + (precio * (Number(curr.porcentaje) || 0) / 100), 0);
  };

  const iva = getDedSum("IVA");
  const doc = getDedSum("Documentación");
  const vendedor = getDedSum("Vendedor");
  const dev = getDedSum("Desarrollador");
  const kore = getDedSum("Kore");

  const totalDeducciones = (proyecto.deducciones || []).reduce((acc: number, curr: any) => acc + (precio * (Number(curr.porcentaje) || 0) / 100), 0);
  const restante = precio - totalDeducciones;

  const donutData = [
    { name: "Saldo Final", value: restante, color: "#B7494E" },
    { name: "Vendedor", value: vendedor, color: "#3D3C3C" },
    { name: "Desarrollo", value: dev, color: "#0ea5e9" },
    { name: "IVA", value: iva, color: "#52525b" },
    { name: "Doc", value: doc, color: "#a1a1aa" },
    { name: "Kore", value: kore, color: "#f59e0b" },
    { name: "Mantenimiento", value: mant, color: "#14b8a6" },
  ].filter(d => d.value > 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-4 pt-20 pb-16 md:px-8 md:pt-20">
      {/* Dynamic Browser Tab Title */}
      <title>{`Detalle de Proyecto: ${proyecto.nombre} | KORE BMS`}</title>

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none uppercase">
            DETALLE DEL <br className="hidden sm:block" />
            <span className="text-celeste-kore">PROYECTO</span>
          </h1>
        </div>

        <div className="flex items-stretch gap-2 w-full sm:w-auto">
          {!isDeveloper && (
            <>
              <button
                type="button"
                onClick={() => setQrProyecto(proyecto)}
                className="flex-1 sm:flex-none flex items-center justify-center px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer uppercase"
              >
                VER QR
              </button>
              <button
                type="button"
                onClick={() => router.push(`/kore/proyectos/editar/${proyecto.id}`)}
                className="flex-1 sm:flex-none flex items-center justify-center px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-celeste-kore text-black hover:opacity-90 transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer uppercase"
              >
                EDITAR
              </button>
              <button
                type="button"
                onClick={handleDeleteProyecto}
                className="flex-1 sm:flex-none flex items-center justify-center px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-500 transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer uppercase"
              >
                ELIMINAR
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Info General */}
          <div className="rounded-2xl border border-celeste-kore/55 dark:border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-none dark:shadow-2xl dark:shadow-black/20 p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <code className="text-[10px] sm:text-xs font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-2.5 py-1 rounded-lg border border-celeste-kore/20">
                {getCode(proyecto.id)}
              </code>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-wider border ${
                proyecto.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20' :
                proyecto.estado === 'Finalizados' ? 'bg-muted text-muted-foreground border-border' :
                'bg-azul-kore/10 text-azul-kore border-azul-kore/20'
              }`}>
                {proyecto.estado}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{proyecto.nombre}</h2>
              {proyecto.fecha_entrega && (
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">Entrega: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(proyecto.fecha_entrega)}</span></p>
              )}
            </div>
          </div>

          {/* Info Cliente */}
          <div className="rounded-2xl border border-celeste-kore/55 dark:border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-none dark:shadow-2xl dark:shadow-black/20 p-5 sm:p-6 space-y-2.5">
            <h3 className="text-[10px] sm:text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">Información del Cliente</h3>
            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
              <p><span className="text-zinc-500 dark:text-zinc-400">Nombre:</span> <span className="font-bold text-zinc-950 dark:text-zinc-50">{proyecto.cliente_nombre || 'N/A'}</span></p>
              {proyecto.cliente_nit && (
                <p><span className="text-zinc-500 dark:text-zinc-400">NIT:</span> <span className="font-bold text-zinc-950 dark:text-zinc-50">{proyecto.cliente_nit}</span></p>
              )}
              {proyecto.cliente_telefono && (
                <p className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-zinc-400">Teléfono:</span> 
                  <a href={`https://wa.me/${proyecto.cliente_telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-celeste-kore hover:underline flex items-center gap-1">
                    {formatPhoneDisplay(proyecto.cliente_telefono)}
                  </a>
                </p>
              )}
              {proyecto.cliente_correo && (
                <p><span className="text-zinc-500 dark:text-zinc-400">Correo:</span> <span className="font-bold text-zinc-950 dark:text-zinc-50 break-all">{proyecto.cliente_correo}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Finanzas & Dona) */}
        <div className="rounded-2xl border border-celeste-kore/55 dark:border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-none dark:shadow-2xl dark:shadow-black/20 p-5 sm:p-6 space-y-3">
          <h3 className="text-[10px] sm:text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">Distribución Financiera</h3>
          
          {donutData.length > 0 ? (
            <div className="w-full h-[180px] sm:h-[220px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`donut-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-black">Valor Total</span>
                <span className="text-sm sm:text-lg font-black text-zinc-950 dark:text-zinc-50">Q{precio.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-zinc-500 dark:text-zinc-400 text-xs">No hay datos financieros.</div>
          )}

          {donutData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 px-1 text-[9px] sm:text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400">
              {donutData.map((item, idx) => (
                <div key={`legend-${idx}`} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}

          {(() => {
            const activeDeds = (proyecto.deducciones || []).filter(
              (d: any) => (Number(d.porcentaje) || 0) > 0
            );
            const totalPct = activeDeds.reduce(
              (acc: number, d: any) => acc + (Number(d.porcentaje) || 0), 0
            );
            if (activeDeds.length === 0) return null;

            return (
              <DetailDedListWithToggle deds={activeDeds} totalPct={totalPct} precio={precio} mant={mant} restante={restante} />
            );
          })()}
        </div>
      </div>

      {/* MODAL QR */}
      <QRProyecto
        isOpen={!!qrProyecto}
        proyecto={qrProyecto}
        onClose={() => setQrProyecto(null)}
        onSuccess={() => {}}
      />
    </div>
  );
}

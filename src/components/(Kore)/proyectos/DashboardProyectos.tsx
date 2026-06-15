"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  CircleDollarSign,
  CalendarDays,
  Filter,
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  RefreshCw,
  Clock,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  Home
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getProyectos, deleteProyecto } from "@/app/kore/proyectos/actions";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRProyecto from "./QRProyecto";
import { QrCode, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { MagicCard } from "@/components/ui/magic-card";
import { useUserContext } from "@/components/(base)/providers/UserProvider";


// TypeScript declaration for the Lordicon web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        trigger?: string;
        colors?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

// ── DashboardDeduccionItem ───────────────────────────────────────────────────────────────────

const DASH_TIPO_STYLE: Record<string, string> = {
  "IVA":           "bg-amber-500/10 text-amber-400 border-amber-500/25",
  "Documentación": "bg-purple-500/10 text-purple-400 border-purple-500/25",
  "Comisión":      "bg-blue-500/10 text-blue-400 border-blue-500/25",
  "Vendedor":      "bg-blue-500/10 text-blue-400 border-blue-500/25",
  "Kore":          "bg-red-500/10 text-red-400 border-red-500/25",
  "Desarrollador": "bg-sky-500/10 text-sky-400 border-sky-500/25",
};

function DashboardDeduccionItem({ d, forceOpen, precio }: { d: any; forceOpen: boolean; precio: number }) {
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
      {/* Fila principal */}
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

      {/* Detalles colapsables */}
      <AnimatePresence initial={false}>
        {isOpen && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DedListWithToggle({
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

  // Sort by specific order: Kore, IVA, Documentación, Desarrollador, Vendedor, others
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
      {/* Header — Clickable to expand/collapse all */}
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

      {/* Accordion List */}
      <AnimatePresence mode="popLayout">
        {sortedDeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5"
          >
            {sortedDeds.map((d, index) => (
              <DashboardDeduccionItem
                key={index}
                d={d}
                forceOpen={allExpanded}
                precio={precio}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extra Financial Details: Mantenimiento (only if > 0) & Saldo Final */}
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

export default function DashboardProyectos() {
  const router = useRouter();
  const { theme } = useTheme();
  const { effectiveRole } = useUserContext();
  const isAdmin = ["super", "admin"].includes(effectiveRole);

  useEffect(() => {
    if (!["super", "admin", "proyectos"].includes(effectiveRole)) {
      router.replace("/kore");
    }
  }, [effectiveRole, router]);

  const [chartTab, setChartTab] = useState<"MES" | "AÑO" | "RANGO">("MES");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showList, setShowList] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [qrProyecto, setQrProyecto] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getProyectos();
      setProyectos(data || []);
      
      // Si el modal de QR está abierto, actualizar sus datos con la información más reciente de la DB
      if (qrProyecto) {
        const updated = data?.find((p: any) => p.id === qrProyecto.id);
        if (updated) {
          setQrProyecto(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load Lordicon script
  useEffect(() => {
    if (!document.querySelector('script[src="https://cdn.lordicon.com/lordicon.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.lordicon.com/lordicon.js';
      document.head.appendChild(script);
    }
  }, []);

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const fechaReporte = now.toLocaleDateString("es-GT", { day: "2-digit", month: "long", year: "numeric" });

    // ── Fondo header ──
    doc.setFillColor(18, 18, 20);
    doc.rect(0, 0, pageW, 38, "F");

    // ── Título KORE ──
    doc.setTextColor(183, 73, 78);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("KORE", 14, 16);

    doc.setTextColor(161, 161, 170);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA INTEGRAL DE GESTIÓN", 14, 22);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE PROYECTOS", 14, 32);

    // ── Fecha ──
    doc.setTextColor(161, 161, 170);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${fechaReporte}`, pageW - 14, 32, { align: "right" });

    // ── Tarjetas resumen ──
    const totalComisiones = proyectos.reduce((acc, p) => {
      const precio = Number(p.precio) || 0;
      return acc + (p.aplica_vendedor ? precio * (Number(p.porcentaje_vendedor) || 0) / 100 : 0);
    }, 0);
    const totalIva = proyectos.reduce((acc, p) => {
      const precio = Number(p.precio) || 0;
      return acc + (p.aplica_iva ? precio * (Number(p.porcentaje_iva) || 0) / 100 : 0);
    }, 0);

    const cards = [
      { label: "TOTAL PROYECTOS", value: String(summary.count), color: [183, 73, 78] as [number, number, number] },
      { label: "INGRESOS TOTALES", value: `Q${summary.totalPrecio.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: [61, 60, 60] as [number, number, number] },
      { label: "COMISIONES", value: `Q${totalComisiones.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: [61, 60, 60] as [number, number, number] },
      { label: "IVA TOTAL", value: `Q${totalIva.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: [61, 60, 60] as [number, number, number] },
      { label: "MANT. MENSUAL", value: `Q${summary.totalMantenimiento.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, color: [183, 73, 78] as [number, number, number] },
    ];

    const cardW = (pageW - 28 - (cards.length - 1) * 4) / cards.length;
    cards.forEach((card, i) => {
      const x = 14 + i * (cardW + 4);
      const y = 44;
      doc.setFillColor(30, 30, 32);
      doc.roundedRect(x, y, cardW, 22, 3, 3, "F");
      doc.setDrawColor(...card.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, 22, 3, 3, "S");
      doc.setTextColor(...card.color);
      doc.setFontSize(6);
      doc.setFont("helvetica", "bold");
      doc.text(card.label, x + cardW / 2, y + 7, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(card.value, x + cardW / 2, y + 16, { align: "center" });
    });

    // ── Tabla ──
    const tableRows = filteredProyectos.map((p) => {
      const precio = Number(p.precio) || 0;
      const comision = p.aplica_vendedor ? precio * (Number(p.porcentaje_vendedor) || 0) / 100 : 0;
      const desarrollo = p.aplica_desarrollo ? precio * (Number(p.porcentaje_desarrollo) || 0) / 100 : 0;
      const iva = p.aplica_iva ? precio * (Number(p.porcentaje_iva) || 0) / 100 : 0;
      const docPct = p.aplica_doc ? precio * (Number(p.porcentaje_doc) || 0) / 100 : 0;
      const mant = p.aplica_mantenimiento ? Number(p.monto_mantenimiento) || 0 : 0;
      const restante = precio - comision - desarrollo - iva - docPct + mant;
      const code = p.id.replace(/-/g, "").slice(0, 6).toUpperCase();
      const shortCode = code.slice(0, 3) + "-" + code.slice(3, 6);
      return [
        shortCode,
        p.nombre || "",
        p.cliente_nombre || "N/A",
        p.vendedor_nombre || "N/A",
        p.desarrollador_nombre || "N/A",
        p.estado || "",
        `Q${precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        comision > 0 ? `Q${comision.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—",
        desarrollo > 0 ? `Q${desarrollo.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—",
        iva > 0 ? `Q${iva.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—",
        mant > 0 ? `Q${mant.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—",
        `Q${restante.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      ];
    });

    autoTable(doc, {
      startY: 72,
      head: [["Código", "Proyecto", "Cliente", "Vendedor", "Dev", "Estado", "Precio", "Comisión", "Desarrollo", "IVA", "Mant.", "Saldo Final"]],
      body: tableRows,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 3,
        textColor: [220, 220, 220],
        fillColor: [24, 24, 27],
        lineColor: [50, 50, 55],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [183, 73, 78],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
      },
      alternateRowStyles: { fillColor: [30, 30, 32] },
      columnStyles: {
        0: { halign: "center", fontStyle: "bold", textColor: [183, 73, 78] },
        5: { halign: "center" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right" },
        10: { halign: "right" },
        11: { halign: "right", fontStyle: "bold", textColor: [183, 73, 78] },
      },
      didDrawPage: (data) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFillColor(18, 18, 20);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setTextColor(100, 100, 110);
        doc.setFontSize(6);
        doc.text(`© ${now.getFullYear()} Kore — Reporte generado el ${fechaReporte}`, 14, pageH - 3);
        doc.text(`Pág. ${data.pageNumber}`, pageW - 14, pageH - 3, { align: "right" });
      },
    });

    doc.save(`kore-proyectos-${now.toISOString().split("T")[0]}.pdf`);
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    const isDark = theme === 'dark';
    const result = await Swal.fire({
      title: '¿Eliminar proyecto?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: isDark ? '#27272a' : '#e4e4e7',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: isDark ? '#18181b' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
    });

    if (result.isConfirmed) {
      const res = await deleteProyecto(id);
      if (res.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.error,
          background: isDark ? '#18181b' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
        return false;
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: isDark ? '#18181b' : '#ffffff',
          color: isDark ? '#ffffff' : '#000000',
        });
        fetchData();
        return true;
      }
    }
    return false;
  };

  // --- DERIVED DATA ---
  const summary = useMemo(() => {
    let totalPrecio = 0;
    let totalIva = 0;
    let totalComisiones = 0;
    let totalMantenimiento = 0;

    proyectos.forEach(p => {
      const precio = Number(p.precio) || 0;
      totalPrecio += precio;
      if (p.aplica_iva) totalIva += precio * (Number(p.porcentaje_iva) || 0) / 100;
      if (p.aplica_vendedor) totalComisiones += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
      totalMantenimiento += Number(p.mantenimiento) || 0;
    });

    return { totalPrecio, totalIva, totalComisiones, totalMantenimiento, count: proyectos.length };
  }, [proyectos]);

  const pieData = useMemo(() => {
    const counts = { 
      "En Progreso": { count: 0, mant: 0 }, 
      "En pausa": { count: 0, mant: 0 }, 
      "Finalizados": { count: 0, mant: 0 } 
    };
    proyectos.forEach(p => {
      const mant = Number(p.mantenimiento) || 0;
      if (p.estado === "En Progreso") { counts["En Progreso"].count++; counts["En Progreso"].mant += mant; }
      else if (p.estado === "En pausa") { counts["En pausa"].count++; counts["En pausa"].mant += mant; }
      else { counts["Finalizados"].count++; counts["Finalizados"].mant += mant; }
    });
 
    return [
      { name: "Activos", value: counts["En Progreso"].count || 0, mant: counts["En Progreso"].mant, color: "#B7494E" },
      { name: "En pausa", value: counts["En pausa"].count || 0, mant: counts["En pausa"].mant, color: "#3D3C3C" },
      { name: "Finalizados", value: counts["Finalizados"].count || 0, mant: counts["Finalizados"].mant, color: "#a1a1aa" },
    ].filter(d => d.value > 0);
  }, [proyectos]);

  const barData = useMemo(() => {
    const now = new Date();

    if (chartTab === "RANGO") {
      const start = new Date(dateRange.start + "T00:00:00");
      const end = new Date(dateRange.end + "T23:59:59");
      const data: any[] = [];
      
      // Creamos un mapa para agrupar
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 45) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          data.push({ name: d.getDate().toString(), dateStr: d.toISOString().split('T')[0], precio: 0, comision: 0, iva: 0 });
        }
        proyectos.forEach(p => {
          const pDate = new Date(p.created_at);
          if (pDate >= start && pDate <= end) {
            const s = pDate.toISOString().split('T')[0];
            const item = data.find(i => i.dateStr === s);
            if (item) {
              const precio = Number(p.precio) || 0;
              item.precio += precio;
              if (p.aplica_vendedor) item.comision += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
              if (p.aplica_iva) item.iva += precio * (Number(p.porcentaje_iva) || 0) / 100;
            }
          }
        });
      } else {
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        // Agrupación por mes si el rango es largo
        proyectos.forEach(p => {
          const pDate = new Date(p.created_at);
          if (pDate >= start && pDate <= end) {
            const mName = months[pDate.getMonth()] + " " + pDate.getFullYear().toString().slice(2);
            let item = data.find(i => i.name === mName);
            if (!item) {
              item = { name: mName, precio: 0, comision: 0, iva: 0, sortKey: pDate.getFullYear() * 100 + pDate.getMonth() };
              data.push(item);
            }
            const precio = Number(p.precio) || 0;
            item.precio += precio;
            if (p.aplica_vendedor) item.comision += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
            if (p.aplica_iva) item.iva += precio * (Number(p.porcentaje_iva) || 0) / 100;
          }
        });
        data.sort((a, b) => a.sortKey - b.sortKey);
      }
      return data;
    }

    if (chartTab === "MES") {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const dataByDay = Array.from({ length: daysInMonth }, (_, i) => ({
        name: (i + 1).toString(),
        precio: 0,
        comision: 0,
        iva: 0
      }));

      proyectos.forEach(p => {
        const date = new Date(p.created_at);
        if (date.getFullYear() === selectedYear && date.getMonth() === selectedMonth) {
          const d = date.getDate() - 1;
          const precio = Number(p.precio) || 0;
          dataByDay[d].precio += precio;
          if (p.aplica_vendedor) dataByDay[d].comision += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
          if (p.aplica_iva) dataByDay[d].iva += precio * (Number(p.porcentaje_iva) || 0) / 100;
        }
      });

      const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
      return dataByDay.filter(d => d.precio > 0 || !isCurrentMonth || Number(d.name) <= now.getDate());
    } else {
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const dataByMonth = Array.from({ length: 12 }, (_, i) => ({ name: months[i], precio: 0, comision: 0, iva: 0 }));

      proyectos.forEach(p => {
        const date = new Date(p.created_at);
        if (date.getFullYear() === selectedYear) {
          const m = date.getMonth();
          const precio = Number(p.precio) || 0;
          dataByMonth[m].precio += precio;
          if (p.aplica_vendedor) dataByMonth[m].comision += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
          if (p.aplica_iva) dataByMonth[m].iva += precio * (Number(p.porcentaje_iva) || 0) / 100;
        }
      });

      const isCurrentYear = selectedYear === now.getFullYear();
      if (isCurrentYear) {
        return dataByMonth.slice(0, Math.min(12, now.getMonth() + 2)).filter(d => d.precio > 0 || d.name === months[now.getMonth()]);
      } else {
        return dataByMonth;
      }
    }
  }, [proyectos, chartTab, dateRange, selectedMonth, selectedYear]);

  const filteredProyectos = useMemo(() => {
    if (!searchTerm) return proyectos;
    const lower = searchTerm.toLowerCase();
    return proyectos.filter(p => 
      p.nombre?.toLowerCase().includes(lower) || 
      p.cliente_nombre?.toLowerCase().includes(lower) ||
      p.vendedor_nombre?.toLowerCase().includes(lower)
    );
  }, [proyectos, searchTerm]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProyectos.length / itemsPerPage) || 1;
  }, [filteredProyectos]);

  const paginatedProyectos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProyectos.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProyectos, currentPage]);

  const emptyRowsCount = useMemo(() => {
    return itemsPerPage - paginatedProyectos.length;
  }, [paginatedProyectos]);

  // Proyectos con fecha de entrega para la vista de usuarios normales
  const proyectosConFecha = useMemo(() => {
    return proyectos
      .filter(p => p.fecha_entrega)
      .sort((a, b) => new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime());
  }, [proyectos]);

  // Genera código corto: primeros 6 chars del UUID con guion en medio → "a1b-2c3"
  const getCode = (id: string) => {
    const clean = id.replace(/-/g, "").slice(0, 6).toUpperCase();
    return clean.slice(0, 3) + "-" + clean.slice(3, 6);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatPhoneDisplay = (phone: string | null | undefined): string => {
    if (!phone) return "";
    const clean = phone.trim();
    if (!clean) return "";
    
    // Clean spaces to match formats like +502 4214 0797 or +50242140797
    const cleanNoSpaces = clean.replace(/\s+/g, "");
    
    // GT number with +502 and 8 digits -> XXXX-XXXX
    const gtMatch = cleanNoSpaces.match(/^\+502(\d{4})(\d{4})$/);
    if (gtMatch) {
      return `${gtMatch[1]}-${gtMatch[2]}`;
    }
    
    // GT number with 8 digits (no prefix) -> XXXX-XXXX
    const gtShortMatch = cleanNoSpaces.match(/^(\d{4})(\d{4})$/);
    if (gtShortMatch) {
      return `${gtShortMatch[1]}-${gtShortMatch[2]}`;
    }
    
    return clean;
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 text-foreground px-4 pt-32 pb-16 md:px-8 md:pt-24 relative">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-azul-kore/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none">
            GESTIÓN DE <br className="hidden sm:block" />
            <span className="text-celeste-kore">PROYECTOS</span>
          </h1>
        </div>

        <div className="flex items-stretch gap-2 w-full sm:w-auto">
          <button 
            onClick={() => router.push("/kore/clientes")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-black dark:text-white transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <Users size={14} className="sm:w-[18px] sm:h-[18px] text-celeste-kore" />
            CLIENTES
          </button>
          <button 
            onClick={() => router.push("/kore/proyectos/nuevo")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-celeste-kore text-black hover:bg-celeste-kore border border-transparent transition-all font-black text-[10px] sm:text-sm whitespace-nowrap cursor-pointer"
          >
            <Plus size={14} className="sm:w-[18px] sm:h-[18px]" />
            NUEVO PROYECTO
          </button>
        </div>
      </div>

      {/* ========== ADMIN VIEW: Summary Cards + Charts + Full Table ========== */}
      {isAdmin && (
        <>
          {/* TABLE SECTION - Admin only (Rendered FIRST) */}
          <div className="rounded-2xl border border-celeste-kore/55 dark:border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-none dark:shadow-2xl dark:shadow-black/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <button 
                  onClick={() => setShowList(!showList)}
                  className="p-1.5 sm:p-2 hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  <motion.div
                    animate={{ rotate: showList ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Filter size={16} className="text-celeste-kore sm:w-[18px] sm:h-[18px]" />
                  </motion.div>
                </button>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground/90">Lista de Proyectos</h3>
              </div>
              <motion.div 
                initial={false}
                animate={{ opacity: showList ? 1 : 0, scale: showList ? 1 : 0.95, x: showList ? 0 : 20 }}
                className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto ${!showList ? 'pointer-events-none' : ''}`}
              >
                <div className="relative flex-1 sm:w-[240px]">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="BUSCAR PROYECTO..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-muted/20 border border-border/60 rounded-lg py-2 pl-9 pr-3 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-celeste-kore/30 transition-all placeholder:text-muted-foreground/40 shadow-inner"
                  />
                </div>
                <button 
                  onClick={exportarPDF}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border/50 bg-card hover:bg-muted/50 hover:border-celeste-kore/30 transition-all text-xs font-bold shadow-sm group whitespace-nowrap"
                >
                  <Download size={14} className="text-celeste-kore group-hover:scale-110 transition-transform" />
                  <span className="uppercase tracking-widest text-[9px]">Exportar</span>
                </button>
              </motion.div>
            </div>

            <motion.div 
              initial={false}
              animate={{ 
                height: showList ? "auto" : 0,
                opacity: showList ? 1 : 0
              }}
              className="w-full overflow-hidden"
            >
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <RefreshCw className="animate-spin text-celeste-kore" />
                </div>
              ) : filteredProyectos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border-t border-border/30">
                  <p className="text-sm">No se encontraron proyectos.</p>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE - hidden on mobile */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                      <thead>
                        <tr className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
                          <th className="pb-2 px-4 font-black">Código</th>
                          <th className="pb-2 px-2 font-black">Proyecto</th>
                          <th className="pb-2 px-2 font-black">Cliente</th>
                          <th className="pb-2 px-2 font-black">Estado</th>
                          <th className="pb-2 px-2 font-black text-right">Precio</th>
                          <th className="pb-2 px-2 font-black text-right">Comisión</th>
                          <th className="pb-2 px-2 font-black text-right">Desarrollo</th>
                          <th className="pb-2 px-2 font-black text-right">IVA</th>
                          <th className="pb-2 px-2 font-black text-right">Doc</th>
                          <th className="pb-2 px-2 font-black text-right">Mant.</th>
                          <th className="pb-2 pl-2 pr-4 font-black text-right">Saldo Final</th>
                        </tr>
                      </thead>
                      <tbody className="before:block before:h-2">
                        {paginatedProyectos.map((p) => {
                          const precio = Number(p.precio) || 0;
                          const comision = p.aplica_vendedor ? precio * (Number(p.porcentaje_vendedor) || 0) / 100 : 0;
                          const desarrollo = p.aplica_desarrollo ? precio * (Number(p.porcentaje_desarrollo) || 0) / 100 : 0;
                          const iva = p.aplica_iva ? precio * (Number(p.porcentaje_iva) || 0) / 100 : 0;
                          const doc = p.aplica_doc ? precio * (Number(p.porcentaje_doc) || 0) / 100 : 0;
                          const mant = Number(p.mantenimiento) || 0;
                          const restante = precio - comision - desarrollo - iva - doc + mant;

                          return (
                            <tr
                              key={p.id}
                              onClick={() => router.push(`/kore/proyectos/ver/${getCode(p.id)}`)}
                              className="group border-y border-border/50 dark:border-white/5 bg-card/20 hover:bg-card/40 cursor-pointer transition-all duration-300"
                            >
                              <td className="py-3 px-4 rounded-l-xl border-y border-l border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <code className="text-xs font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-2 py-1 rounded border border-celeste-kore/20">{getCode(p.id)}</code>
                              </td>
                              <td className="py-4 border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className="font-bold text-sm text-foreground">{p.nombre}</p>
                              </td>
                              <td className="py-4 border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className="text-sm text-foreground">{p.cliente_nombre || 'N/A'}</p>
                                <p className="text-[10px] text-muted-foreground">{formatPhoneDisplay(p.cliente_telefono)}</p>
                              </td>
                              <td className="py-4 border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                  p.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20' :
                                  p.estado === 'Finalizados' ? 'bg-muted text-muted-foreground border-border' :
                                  'bg-azul-kore/10 text-azul-kore border-azul-kore/20 shadow-sm'
                                }`}>
                                  {p.estado}
                                </span>
                              </td>
                              <td className="py-4 text-right border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className="font-bold text-sm">Q{precio.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                              </td>
                              <td className="py-4 text-right border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className={`text-sm ${comision > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                  {comision > 0 ? `Q${comision.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                                </p>
                                {comision > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_vendedor}%</p>}
                              </td>
                              <td className="py-4 text-right border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className={`text-sm ${desarrollo > 0 ? 'text-celeste-kore font-bold' : 'text-muted-foreground'}`}>
                                  {desarrollo > 0 ? `Q${desarrollo.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                                </p>
                                {desarrollo > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_desarrollo}%</p>}
                              </td>
                              <td className="py-4 text-right border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className={`text-sm ${iva > 0 ? 'text-azul-kore font-bold' : 'text-muted-foreground'}`}>
                                  {iva > 0 ? `Q${iva.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                                </p>
                                {iva > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_iva}%</p>}
                              </td>
                              <td className="py-4 text-right border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className={`text-sm ${doc > 0 ? 'text-azul-kore font-bold' : 'text-muted-foreground'}`}>
                                  {doc > 0 ? `Q${doc.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                                </p>
                                {doc > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_doc}%</p>}
                              </td>
                              <td className="py-4 text-right border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className={`text-sm ${mant > 0 ? 'text-celeste-kore font-bold' : 'text-muted-foreground'}`}>{mant > 0 ? `Q${mant.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}</p>
                                {mant > 0 && <p className="text-[10px] text-muted-foreground">Mes</p>}
                              </td>
                              <td className="py-4 pr-4 text-right rounded-r-xl border-y border-r border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                                <p className="font-black text-sm text-celeste-kore">Q{restante.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                              </td>
                            </tr>
                          );
                        })}
                        {emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
                          <tr
                            key={`empty-${idx}`}
                            className="opacity-0 pointer-events-none select-none"
                          >
                            <td className="py-3 px-4">
                              <code className="text-xs font-mono font-bold">&nbsp;</code>
                            </td>
                            <td className="py-4">
                              <p className="font-bold text-sm text-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4">
                              <p className="text-sm text-foreground">&nbsp;</p>
                              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4">
                              <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">&nbsp;</span>
                            </td>
                            <td className="py-4 text-right">
                              <p className="font-bold text-sm">&nbsp;</p>
                            </td>
                            <td className="py-4 text-right">
                              <p className="text-sm text-muted-foreground">&nbsp;</p>
                              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4 text-right">
                              <p className="text-sm text-muted-foreground">&nbsp;</p>
                              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4 text-right">
                              <p className="text-sm text-muted-foreground">&nbsp;</p>
                              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4 text-right">
                              <p className="text-sm text-muted-foreground">&nbsp;</p>
                              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4 text-right">
                              <p className="text-sm text-muted-foreground">&nbsp;</p>
                              <p className="text-[10px] text-muted-foreground">&nbsp;</p>
                            </td>
                            <td className="py-4 pr-4 text-right">
                              <p className="font-black text-sm text-celeste-kore">&nbsp;</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS - hidden on desktop */}
                  <div className="lg:hidden flex flex-col gap-2">
                    {paginatedProyectos.map((p) => {
                      return (
                        <div 
                          key={p.id} 
                          className="rounded-lg border border-celeste-kore/55 dark:border-white/10 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-lg p-2.5 flex flex-col gap-1.5 shadow-none dark:shadow-md hover:border-celeste-kore/70 transition-all duration-300 cursor-pointer"
                          onClick={() => router.push(`/kore/proyectos/ver/${getCode(p.id)}`)}
                        >
                          {/* Top row: Code & State */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 min-w-0">
                              <code className="text-[8px] font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-1 py-0.5 rounded border border-celeste-kore/20 shrink-0">
                                {getCode(p.id)}
                              </code>
                              <span className={`inline-flex items-center px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border shrink-0 ${
                                p.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20' :
                                p.estado === 'Finalizados' ? 'bg-muted text-muted-foreground border-border' :
                                'bg-azul-kore/10 text-azul-kore border-azul-kore/20'
                              }`}>
                                {p.estado}
                              </span>
                            </div>
                          </div>

                          {/* Info row */}
                          <div className="min-w-0">
                            <h4 className="font-bold text-[11px] text-foreground truncate tracking-tight">{p.nombre}</h4>
                            <p className="text-[8px] text-muted-foreground mt-0.5 truncate">
                              Cliente: <span className="font-semibold text-foreground/80">{p.cliente_nombre || 'Sin cliente'}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
                      <div
                        key={`empty-mobile-${idx}`}
                        className="opacity-0 pointer-events-none select-none p-2.5 flex flex-col gap-1.5 border border-transparent bg-transparent rounded-lg"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <code className="text-[8px]">&nbsp;</code>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-[11px]">&nbsp;</h4>
                          <p className="text-[8px] mt-0.5">&nbsp;</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/30">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className="p-2 rounded-xl border border-border bg-card/50 hover:bg-muted/50 hover:border-celeste-kore/30 text-muted-foreground hover:text-celeste-kore disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-black uppercase tracking-widest text-foreground bg-muted/30 border border-border/30 px-3.5 py-1.5 rounded-lg select-none">
                        PÁG. {currentPage} / {totalPages}
                      </span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className="p-2 rounded-xl border border-border bg-card/50 hover:bg-muted/50 hover:border-celeste-kore/30 text-muted-foreground hover:text-celeste-kore disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-4">
            {/* Bar Chart */}
            <div className="rounded-2xl border border-celeste-kore/55 dark:border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-none dark:shadow-2xl dark:shadow-black/20">
              
              {/* First Line: INGRESO & SWITCH */}
              <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30 shrink-0">
                    <CircleDollarSign size={14} className="text-celeste-kore" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground">
                    Ingreso
                  </h3>
                </div>
                <div className="flex items-center rounded-full bg-muted/30 border border-border/30 p-[2px]">
                  {["MES", "AÑO", "RANGO"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setChartTab(tab as any)}
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                        chartTab === tab
                          ? "bg-celeste-kore text-white shadow-md"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Second Line: Active Filters (Centered) */}
              <div className="flex items-center justify-center w-full min-h-[40px] mt-2 mb-4">
                {chartTab === "MES" && (
                  <div className="flex items-center gap-2 bg-muted/20 border border-border/40 px-3 py-1.5 rounded-xl">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-muted border border-border rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:border-celeste-kore/50 transition-colors uppercase tracking-wider cursor-pointer text-foreground"
                    >
                      {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, idx) => (
                        <option key={m} value={idx} className="bg-card text-foreground font-bold">
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-muted border border-border rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:border-celeste-kore/50 transition-colors uppercase tracking-wider cursor-pointer text-foreground"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y} className="bg-card text-foreground font-bold">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {chartTab === "AÑO" && (
                  <div className="flex items-center justify-center gap-2 bg-muted/20 border border-border/40 px-3 py-1.5 rounded-xl">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-muted border border-border rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:border-celeste-kore/50 transition-colors uppercase tracking-wider cursor-pointer text-foreground"
                    >
                      {[2024, 2025, 2026, 2027, 2028].map((y) => (
                        <option key={y} value={y} className="bg-card text-foreground font-bold">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {chartTab === "RANGO" && (
                  <div className="flex flex-wrap items-center justify-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground">Desde:</span>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-bold outline-none focus:border-celeste-kore/50 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground">Hasta:</span>
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-bold outline-none focus:border-celeste-kore/50 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-celeste-kore"></div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Precio total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-[#3D3C3C]"></div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Comisión</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-muted-foreground/40"></div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">IVA</span>
                </div>
              </div>

              <div className="h-[200px] sm:h-[250px] w-full">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} tickFormatter={(val) => `Q${val/1000}k`} />
                      <RechartsTooltip 
                        cursor={{ fill: "rgba(255,255,255,0.05)" }} 
                        contentStyle={{ 
                          backgroundColor: "#18181b", 
                          borderColor: "rgba(255,255,255,0.1)", 
                          borderRadius: "12px", 
                          fontSize: "12px",
                          color: "#fff",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                        }}
                        itemStyle={{ color: "#fff" }}
                        separator=""
                        formatter={(value: any, name: any) => {
                          const formattedValue = typeof value === "number"
                            ? value.toLocaleString()
                            : value;
                          if (name === "comision") return [formattedValue, "Comisión: Q "];
                          if (name === "iva") return [formattedValue, "IVA: Q "];
                          if (name === "precio") return [formattedValue, "Precio; Q "];
                          return [formattedValue, name];
                        }}
                      />
                      <Bar dataKey="precio" stackId="a" fill="#B7494E" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="comision" stackId="a" fill="#3D3C3C" radius={[0, 0, 0, 0]} barSize={20} />
                      <Bar dataKey="iva" stackId="a" fill="#a1a1aa" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No hay datos para mostrar
                  </div>
                )}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="rounded-2xl border border-celeste-kore/55 dark:border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-none dark:shadow-2xl dark:shadow-black/20 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30 shrink-0">
                  <Briefcase size={14} className="text-celeste-kore" />
                </div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest">Estado de Proyectos</h3>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px] sm:min-h-[200px]">
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius="65%"
                          outerRadius="85%"
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: "#18181b", 
                            borderColor: "rgba(255,255,255,0.1)", 
                            borderRadius: "12px", 
                            fontSize: "12px",
                            color: "#fff",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                          }}
                          itemStyle={{ color: "#fff" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground font-black">Total</span>
                      <span className="text-sm sm:text-xl font-black text-foreground">{summary.count}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs sm:text-sm">No hay proyectos</span>
                )}
              </div>
              
              <div className="w-full space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      {item.mant > 0 && (
                        <span className="text-[9px] sm:text-[10px] font-black text-celeste-kore bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">
                          Q{item.mant.toLocaleString()}
                        </span>
                      )}
                      <div className="text-[10px] sm:text-xs font-black">
                        {item.value} <span className="text-muted-foreground font-bold">— {Math.round((item.value / Math.max(1, summary.count)) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== NORMAL USER VIEW: Only payment dates ========== */}
      {!isAdmin && (
        <div className="rounded-2xl border border-celeste-kore/30 dark:border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-6 shadow-none dark:shadow-2xl dark:shadow-black/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30 shrink-0">
              <CalendarDays size={16} className="text-celeste-kore" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Fechas de Entrega</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Próximas fechas de pago programadas</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="animate-spin text-celeste-kore" />
            </div>
          ) : proyectosConFecha.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-t border-border/30">
              <p className="text-sm">No hay fechas de entrega programadas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proyectosConFecha.map((p) => {
                const days = getDaysUntil(p.fecha_entrega);
                const isPast = days < 0;
                const isToday = days === 0;
                const isUrgent = days > 0 && days <= 7;

                return (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-celeste-kore/55 dark:border-white/10 bg-card/40 hover:bg-card/60 backdrop-blur-sm transition-all duration-300 shadow-none dark:shadow-sm">
                    <div className="flex items-center gap-4">
                      <code className="text-xs font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-2 py-1 rounded border border-celeste-kore/20">{getCode(p.id)}</code>
                      <div>
                        <p className="font-bold text-sm text-foreground">{p.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">Cliente: {p.cliente_nombre || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatDate(p.fecha_entrega)}</p>
                        <p className={`text-[10px] font-bold ${
                          isPast ? 'text-celeste-kore' :
                          isToday ? 'text-red-400' :
                          isUrgent ? 'text-azul-kore' :
                          'text-muted-foreground'
                        }`}>
                          {isPast ? `Vencido hace ${Math.abs(days)} días` :
                           isToday ? 'Hoy' :
                           `En ${days} días`}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        isPast ? 'bg-celeste-kore' :
                        isToday ? 'bg-red-400' :
                        isUrgent ? 'bg-azul-kore' :
                        'bg-celeste-kore'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}



      <QRProyecto
        isOpen={!!qrProyecto}
        proyecto={qrProyecto}
        onClose={() => setQrProyecto(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}



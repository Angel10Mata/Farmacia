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
  X
} from "lucide-react";
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

interface DashboardProyectosProps {
  role: string;
}

export default function DashboardProyectos({ role }: DashboardProyectosProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isAdmin = ["super", "admin"].includes(role);

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
  const [detalleProyecto, setDetalleProyecto] = useState<any | null>(null);

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
      head: [["Código", "Proyecto", "Cliente", "Vendedor", "Dev", "Estado", "Precio", "Comisión", "Desarrollo", "IVA", "Mant.", "Restante"]],
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

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-6 text-foreground pt-2 sm:pt-4 relative">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-azul-kore/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none">
            RESUMEN DE <br className="hidden sm:block" />
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

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-4">
            {/* Bar Chart */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl shadow-black/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30 shrink-0">
                    <CircleDollarSign size={14} className="text-celeste-kore" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest flex flex-wrap items-center gap-2">
                    <span>Ingreso</span>
                    {chartTab === "MES" && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="bg-muted border border-border rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px] font-bold outline-none focus:border-celeste-kore/50 transition-colors uppercase tracking-wider cursor-pointer text-foreground"
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
                          className="bg-muted border border-border rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px] font-bold outline-none focus:border-celeste-kore/50 transition-colors uppercase tracking-wider cursor-pointer text-foreground"
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
                      <div className="flex items-center gap-1.5 ml-1">
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="bg-muted border border-border rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px] font-bold outline-none focus:border-celeste-kore/50 transition-colors uppercase tracking-wider cursor-pointer text-foreground"
                        >
                          {[2024, 2025, 2026, 2027, 2028].map((y) => (
                            <option key={y} value={y} className="bg-card text-foreground font-bold">
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </h3>
                </div>
                <div className="flex items-center rounded-full bg-muted/30 border border-border/30 p-[2px] self-end sm:self-auto">
                  {["MES", "AÑO", "RANGO"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setChartTab(tab as any)}
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold transition-all ${
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

              {chartTab === "RANGO" && (
                <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl bg-card/40 border border-white/5">
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
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl shadow-black/20 flex flex-col">
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

          {/* TABLE SECTION - Admin only */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-6 shadow-2xl shadow-black/20">
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
                            <th className="pb-2 px-2 font-black text-right">Restante</th>
                          </tr>
                        </thead>
                        <tbody className="before:block before:h-2">
                          {filteredProyectos.map((p) => {
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
                              onClick={() => setDetalleProyecto(p)}
                              className="group border-y border-white/5 bg-card/20 hover:bg-card/40 cursor-pointer transition-all duration-300"
                            >
                              <td className="py-3 px-4 rounded-l-xl border-y border-l border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                              <code className="text-xs font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-2 py-1 rounded border border-celeste-kore/20">{getCode(p.id)}</code>
                            </td>
                            <td className="py-4 border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                              <p className="font-bold text-sm text-foreground">{p.nombre}</p>
                              <p className="text-[10px] text-muted-foreground">
                                Vendedor: {p.vendedor_nombre || 'N/A'}{p.desarrollador_nombre ? ` · Dev: ${p.desarrollador_nombre}` : ''}
                              </p>
                            </td>
                            <td className="py-4 border-y border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                              <p className="text-sm text-foreground">{p.cliente_nombre || 'N/A'}</p>
                              <p className="text-[10px] text-muted-foreground">{p.cliente_telefono || ''}</p>
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
                            <td className="py-4 text-right rounded-r-xl border-y border-r border-border group-hover:border-celeste-kore/20 transition-all duration-300">
                              <p className="font-black text-sm text-celeste-kore">Q{restante.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS - hidden on desktop */}
                  <div className="lg:hidden flex flex-col gap-2">
                    {filteredProyectos.map((p) => {
                      return (
                        <div 
                          key={p.id} 
                          className="rounded-lg border border-white/5 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-lg p-2.5 flex flex-col gap-1.5 shadow-md hover:border-celeste-kore/20 transition-all duration-300 cursor-pointer"
                          onClick={() => setDetalleProyecto(p)}
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
                            <p className="text-[8px] text-muted-foreground mt-0.5 truncate">
                              Vendedor: <span className="font-semibold text-foreground/80">{p.vendedor_nombre || 'N/A'}</span>{p.desarrollador_nombre ? ` · Dev: ${p.desarrollador_nombre}` : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* ========== NORMAL USER VIEW: Only payment dates ========== */}
      {!isAdmin && (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-6 shadow-2xl shadow-black/20">
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
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/40 hover:bg-card/60 backdrop-blur-sm transition-all duration-300 shadow-sm">
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

      <AnimatePresence>
        {detalleProyecto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setDetalleProyecto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/85 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-900 dark:text-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 backdrop-blur-md sticky top-0 z-10">
                <button 
                  onClick={() => setDetalleProyecto(null)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Volver
                </button>
                
                <span className="hidden md:inline text-xs sm:text-sm font-black uppercase tracking-widest text-celeste-kore">
                  Detalle del Proyecto
                </span>
                
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setQrProyecto(detalleProyecto);
                        }}
                        className="p-2 bg-muted/50 hover:bg-[#B7494E]/20 text-muted-foreground hover:text-[#B7494E] rounded-lg transition-colors cursor-pointer"
                        title="Ver QR"
                      >
                        <QrCode size={16} />
                      </button>
                      <button 
                        onClick={() => router.push(`/kore/proyectos/editar/${detalleProyecto.id}`)}
                        className="p-2 bg-muted/50 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg transition-colors cursor-pointer"
                        title="Editar Proyecto"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={async () => {
                          const success = await handleDelete(detalleProyecto.id);
                          if (success) {
                            setDetalleProyecto(null);
                          }
                        }}
                        className="p-2 bg-muted/50 hover:bg-red-500/20 text-muted-foreground hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Proyecto"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    </>
                  )}
                  
                  <button 
                    onClick={() => setDetalleProyecto(null)}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 sm:space-y-5 custom-scrollbar">
                {/* Info General */}
                <div className="space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <code className="text-[10px] sm:text-xs font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-2.5 py-1 rounded-lg border border-celeste-kore/20">
                      {getCode(detalleProyecto.id)}
                    </code>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[8px] sm:text-[10px] font-black uppercase tracking-wider border ${
                      detalleProyecto.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20' :
                      detalleProyecto.estado === 'Finalizados' ? 'bg-muted text-muted-foreground border-border' :
                      'bg-azul-kore/10 text-azul-kore border-azul-kore/20'
                    }`}>
                      {detalleProyecto.estado}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">{detalleProyecto.nombre}</h2>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">Vendedor: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{detalleProyecto.vendedor_nombre || 'N/A'}</span></p>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">Desarrollador: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{detalleProyecto.desarrollador_nombre || 'N/A'}</span></p>
                    {detalleProyecto.fecha_entrega && (
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">Entrega: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatDate(detalleProyecto.fecha_entrega)}</span></p>
                    )}
                  </div>
                </div>

                {/* Info Cliente */}
                <div className="space-y-2.5 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                  <h3 className="text-[10px] sm:text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">Información del Cliente</h3>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                    <p><span className="text-zinc-500 dark:text-zinc-400">Nombre:</span> <span className="font-bold text-zinc-950 dark:text-zinc-50">{detalleProyecto.cliente_nombre || 'N/A'}</span></p>
                    {detalleProyecto.cliente_telefono && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-zinc-500 dark:text-zinc-400">Teléfono:</span> 
                        <a href={`https://wa.me/${detalleProyecto.cliente_telefono.replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-celeste-kore hover:underline flex items-center gap-1">
                          {detalleProyecto.cliente_telefono}
                        </a>
                      </p>
                    )}
                    {detalleProyecto.cliente_correo && (
                      <p><span className="text-zinc-500 dark:text-zinc-400">Correo:</span> <span className="font-bold text-zinc-950 dark:text-zinc-50 break-all">{detalleProyecto.cliente_correo}</span></p>
                    )}
                  </div>
                </div>

                {/* Finanzas & Dona */}
                {(() => {
                  const precio = Number(detalleProyecto.precio) || 0;
                  const mant = Number(detalleProyecto.mantenimiento) || 0;
                  
                  const getDedSum = (tipo: string) => {
                    return (detalleProyecto.deducciones || [])
                      .filter((d: any) => d.tipo.toLowerCase() === tipo.toLowerCase() || (tipo === "Vendedor" && d.tipo === "Comisión") || (tipo === "Desarrollador" && d.tipo === "Desarrollo"))
                      .reduce((acc: number, curr: any) => acc + (precio * (Number(curr.porcentaje) || 0) / 100), 0);
                  };

                  const iva = getDedSum("IVA");
                  const doc = getDedSum("Documentación");
                  const vendedor = getDedSum("Vendedor");
                  const dev = getDedSum("Desarrollador");
                  const kore = getDedSum("Kore");

                  const totalDeducciones = (detalleProyecto.deducciones || []).reduce((acc: number, curr: any) => acc + (precio * (Number(curr.porcentaje) || 0) / 100), 0);
                  const restante = precio - totalDeducciones;

                  const donutData = [
                    { name: "Restante (Resta)", value: restante, color: "#B7494E" },
                    { name: "Vendedor", value: vendedor, color: "#3D3C3C" },
                    { name: "Desarrollo", value: dev, color: "#0ea5e9" },
                    { name: "IVA", value: iva, color: "#52525b" },
                    { name: "Doc", value: doc, color: "#a1a1aa" },
                    { name: "Kore", value: kore, color: "#f59e0b" },
                    { name: "Mantenimiento", value: mant, color: "#14b8a6" },
                  ].filter(d => d.value > 0);

                  return (
                    <div className="space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                      <h3 className="text-[10px] sm:text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">Distribución Financiera</h3>
                      
                      {/* Donut Chart */}
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

                      {/* Donut Legend */}
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

                      {/* Breakdown List */}
                      <div className="space-y-2.5 pt-3.5 border-t border-zinc-200 dark:border-zinc-800/80 text-xs sm:text-sm">
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-zinc-500 dark:text-zinc-400">Precio Total:</span>
                          <span className="font-bold text-zinc-950 dark:text-zinc-50">Q{precio.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>

                        {["IVA", "Documentación", "Kore", "Vendedor", "Desarrollador"].map((tipo) => {
                          const sum = getDedSum(tipo);
                          const pct = precio > 0 ? (sum / precio) * 100 : 0;
                          return (
                            <div key={tipo} className="flex justify-between items-center py-0.5">
                              <span className="text-zinc-500 dark:text-zinc-400">{tipo}:</span>
                              <span className={`font-bold ${sum > 0 ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-650'}`}>
                                {sum > 0 ? `Q${sum.toLocaleString('en-US', {minimumFractionDigits: 2})} (${pct}%)` : '—'}
                              </span>
                            </div>
                          );
                        })}

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-zinc-500 dark:text-zinc-400">Mantenimiento Mensual:</span>
                          <span className={`font-bold ${mant > 0 ? 'text-celeste-kore' : 'text-zinc-400 dark:text-zinc-650'}`}>
                            {mant > 0 ? `Q${mant.toLocaleString('en-US', {minimumFractionDigits: 2})} / mes` : '—'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-t border-zinc-200 dark:border-zinc-800/80 pt-2.5 font-black text-sm sm:text-base text-celeste-kore">
                          <span>Restante (Resta):</span>
                          <span>Q{restante.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QRProyecto
        isOpen={!!qrProyecto}
        proyecto={qrProyecto}
        onClose={() => setQrProyecto(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}



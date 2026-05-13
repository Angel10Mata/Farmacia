"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
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
  Clock
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
import ProyectoModal from "./ProyectoModal";
import Swal from "sweetalert2";

interface DashboardProyectosProps {
  role: string;
}

export default function DashboardProyectos({ role }: DashboardProyectosProps) {
  const isAdmin = ["super", "admin"].includes(role);

  const [chartTab, setChartTab] = useState<"MES" | "TRIM." | "AÑO">("MES");
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProyecto, setSelectedProyecto] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const data = await getProyectos();
    setProyectos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar proyecto?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#27272a',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#18181b',
      color: '#fff',
    });

    if (result.isConfirmed) {
      const res = await deleteProyecto(id);
      if (res.error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.error,
          background: '#18181b',
          color: '#fff',
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          background: '#18181b',
          color: '#fff',
        });
        fetchData();
      }
    }
  };

  // --- DERIVED DATA ---
  const summary = useMemo(() => {
    let totalPrecio = 0;
    let totalIva = 0;
    let totalComisiones = 0;

    proyectos.forEach(p => {
      const precio = Number(p.precio) || 0;
      totalPrecio += precio;
      if (p.aplica_iva) totalIva += precio * (Number(p.porcentaje_iva) || 0) / 100;
      if (p.aplica_vendedor) totalComisiones += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
    });

    return { totalPrecio, totalIva, totalComisiones, count: proyectos.length };
  }, [proyectos]);

  const pieData = useMemo(() => {
    const counts = { "En Progreso": 0, "En pausa": 0, "Finalizados": 0 };
    proyectos.forEach(p => {
      if (p.estado === "En Progreso") counts["En Progreso"]++;
      else if (p.estado === "En pausa") counts["En pausa"]++;
      else counts["Finalizados"]++;
    });

    return [
      { name: "Activos", value: counts["En Progress"] || counts["En Progreso"] || 0, color: "#B7494E" },
      { name: "En pausa", value: counts["En pausa"] || 0, color: "#3D3C3C" },
      { name: "Finalizados", value: counts["Finalizados"] || 0, color: "#a1a1aa" },
    ].filter(d => d.value > 0);
  }, [proyectos]);

  const barData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentYear = new Date().getFullYear();
    const dataByMonth = Array.from({ length: 12 }, (_, i) => ({ name: months[i], precio: 0, comision: 0, iva: 0 }));

    proyectos.forEach(p => {
      const date = new Date(p.created_at);
      if (date.getFullYear() === currentYear) {
        const m = date.getMonth();
        const precio = Number(p.precio) || 0;
        dataByMonth[m].precio += precio;
        if (p.aplica_vendedor) dataByMonth[m].comision += precio * (Number(p.porcentaje_vendedor) || 0) / 100;
        if (p.aplica_iva) dataByMonth[m].iva += precio * (Number(p.porcentaje_iva) || 0) / 100;
      }
    });

    const currentMonth = new Date().getMonth();
    return dataByMonth.slice(0, Math.min(12, currentMonth + 2)).filter(d => d.precio > 0 || d.name === months[currentMonth]);
  }, [proyectos]);

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
    <div className="w-full flex flex-col gap-6 text-foreground">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary/80">
            Módulo Activo
          </h2>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-1 leading-none">
            GESTIÓN DE <br className="hidden sm:block" />
            <span className="text-celeste-kore">PROYECTOS</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={fetchData} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors" title="Recargar">
            <RefreshCw size={18} className={loading ? "animate-spin text-celeste-kore" : ""} />
          </button>
          <button 
            onClick={() => { setSelectedProyecto(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-4 rounded-xl bg-celeste-kore text-black hover:bg-celeste-kore border border-transparent transition-colors font-black"
          >
            <Plus size={18} />
            NUEVO PROYECTO
          </button>
        </div>
      </div>

      {/* ========== ADMIN VIEW: Summary Cards + Charts + Full Table ========== */}
      {isAdmin && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4 border border-red-200 dark:border-red-900/30">
                <Briefcase size={20} className="text-celeste-kore" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Total Proyectos
              </p>
              <h3 className="text-3xl font-black">{summary.count}</h3>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4 border border-red-200 dark:border-red-900/30">
                <CircleDollarSign size={20} className="text-celeste-kore" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Ingresos Totales
              </p>
              <h3 className="text-3xl font-black">Q{summary.totalPrecio.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            </div>
          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-4">
            {/* Bar Chart */}
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-sm font-black uppercase tracking-widest">
                  Ingresos por Mes ({new Date().getFullYear()})
                </h3>
                <div className="flex items-center rounded-full bg-muted/30 border border-border/30 p-1">
                  {["MES", "TRIM.", "AÑO"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setChartTab(tab as any)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
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
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-celeste-kore"></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Precio total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-azul-kore"></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Comisión</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40"></div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">IVA</span>
                </div>
              </div>

              <div className="h-[250px] w-full">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} tickFormatter={(val) => `Q${val/1000}k`} />
                      <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", fontSize: "12px" }} />
                      <Bar dataKey="precio" fill="#B7494E" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="comision" fill="#3D3C3C" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="iva" fill="#a1a1aa" radius={[4, 4, 0, 0]} barSize={12} />
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
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">
                Estado de Proyectos
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                {pieData.length > 0 ? (
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
                      <RechartsTooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "12px", fontSize: "12px", color: "var(--foreground)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-muted-foreground text-sm">No hay proyectos</span>
                )}
              </div>
              
              <div className="w-full space-y-3 mt-6">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="text-xs font-black">
                      {item.value} <span className="text-muted-foreground">— {Math.round((item.value / Math.max(1, summary.count)) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE SECTION - Admin only */}
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h3 className="text-sm font-black uppercase tracking-widest">
                Lista de Proyectos
              </h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="BUSCAR PROYECTO..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-muted/20 border border-border/60 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-celeste-kore/30 w-[240px] transition-all placeholder:text-muted-foreground/40 shadow-inner"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-celeste-kore/30 transition-all text-sm font-bold shadow-sm group">
                    <Download size={16} className="text-celeste-kore group-hover:scale-110 transition-transform" />
                    <span className="uppercase tracking-widest text-[11px]">Exportar</span>
                  </button>
                </div>
              </div>

              <div className="w-full">
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
                            <th className="pb-2 px-2 font-black text-right">IVA</th>
                            <th className="pb-2 px-2 font-black text-right">Doc</th>
                            <th className="pb-2 px-2 font-black text-right">Restante</th>
                            <th className="pb-2 px-4 font-black text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="before:block before:h-2">
                          {filteredProyectos.map((p) => {
                            const precio = Number(p.precio) || 0;
                            const comision = p.aplica_vendedor ? precio * (Number(p.porcentaje_vendedor) || 0) / 100 : 0;
                            const iva = p.aplica_iva ? precio * (Number(p.porcentaje_iva) || 0) / 100 : 0;
                            const doc = p.aplica_doc ? precio * (Number(p.porcentaje_doc) || 0) / 100 : 0;
                            const restante = precio - comision - iva - doc;

                            return (
                            <tr key={p.id} className="group border-y border-border/10 bg-card/30 hover:bg-muted/30 transition-all duration-300">
                              <td className="py-3 px-4 rounded-l-xl border-y border-l border-border/30 group-hover:border-celeste-kore/20">
                              <code className="text-xs font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-2 py-1 rounded border border-celeste-kore/20">{getCode(p.id)}</code>
                            </td>
                            <td className="py-4">
                              <p className="font-bold text-sm text-foreground">{p.nombre}</p>
                              <p className="text-[10px] text-muted-foreground">Vendedor: {p.vendedor_nombre || 'N/A'}</p>
                            </td>
                            <td className="py-4">
                              <p className="text-sm text-foreground">{p.cliente_nombre || 'N/A'}</p>
                              <p className="text-[10px] text-muted-foreground">{p.cliente_telefono || ''}</p>
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                p.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20' :
                                p.estado === 'Finalizados' ? 'bg-muted text-muted-foreground border-border' :
                                'bg-azul-kore/10 text-azul-kore border-azul-kore/20 shadow-sm'
                              }`}>
                                {p.estado}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <p className="font-bold text-sm">Q{precio.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </td>
                            <td className="py-4 text-right">
                              <p className={`text-sm ${comision > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                {comision > 0 ? `Q${comision.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                              </p>
                              {comision > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_vendedor}%</p>}
                            </td>
                            <td className="py-4 text-right">
                              <p className={`text-sm ${iva > 0 ? 'text-azul-kore font-bold' : 'text-muted-foreground'}`}>
                                {iva > 0 ? `Q${iva.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                              </p>
                              {iva > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_iva}%</p>}
                            </td>
                            <td className="py-4 text-right">
                              <p className={`text-sm ${doc > 0 ? 'text-azul-kore font-bold' : 'text-muted-foreground'}`}>
                                {doc > 0 ? `Q${doc.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                              </p>
                              {doc > 0 && <p className="text-[10px] text-muted-foreground">{p.porcentaje_doc}%</p>}
                            </td>
                            <td className="py-4 text-right">
                              <p className="font-black text-sm text-celeste-kore">Q{restante.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => { setSelectedProyecto(p); setIsModalOpen(true); }}
                                  className="p-2 bg-muted/50 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(p.id)}
                                  className="p-2 bg-muted/50 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARDS - hidden on desktop */}
                  <div className="lg:hidden flex flex-col gap-3">
                    {filteredProyectos.map((p) => {
                      const precio = Number(p.precio) || 0;
                      const comision = p.aplica_vendedor ? precio * (Number(p.porcentaje_vendedor) || 0) / 100 : 0;
                      const iva = p.aplica_iva ? precio * (Number(p.porcentaje_iva) || 0) / 100 : 0;
                      const doc = p.aplica_doc ? precio * (Number(p.porcentaje_doc) || 0) / 100 : 0;
                      const restante = precio - comision - iva - doc;

                      return (
                        <div key={p.id} className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-[10px] font-mono font-bold text-celeste-kore bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">{getCode(p.id)}</code>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border border-celeste-kore/20' :
                                  p.estado === 'Finalizados' ? 'bg-celeste-kore/10 text-celeste-kore border border-celeste-kore/20' :
                                  'bg-red-400/10 text-red-400 border border-red-400/20'
                                }`}>
                                  {p.estado}
                                </span>
                              </div>
                              <p className="font-bold text-sm text-foreground truncate">{p.nombre}</p>
                              <p className="text-[10px] text-muted-foreground">{p.cliente_nombre || 'Sin cliente'} · {p.vendedor_nombre || 'Sin vendedor'}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2 shrink-0">
                              <button 
                                onClick={() => { setSelectedProyecto(p); setIsModalOpen(true); }}
                                className="p-2 bg-muted/50 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(p.id)}
                                className="p-2 bg-muted/50 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Card Price */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/20">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Precio Total</span>
                            <span className="font-bold text-sm">Q{precio.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                          </div>

                          {/* Cost Breakdown */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center bg-muted/20 rounded-lg px-3 py-2">
                              <span className="text-muted-foreground">Comisión</span>
                              <span className={comision > 0 ? 'text-red-400 font-bold' : 'text-muted-foreground'}>
                                {comision > 0 ? `Q${comision.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-muted/20 rounded-lg px-3 py-2">
                              <span className="text-muted-foreground">IVA</span>
                              <span className={iva > 0 ? 'text-azul-kore font-bold' : 'text-muted-foreground'}>
                                {iva > 0 ? `Q${iva.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-muted/20 rounded-lg px-3 py-2">
                              <span className="text-muted-foreground">Doc</span>
                              <span className={doc > 0 ? 'text-azul-kore font-bold' : 'text-muted-foreground'}>
                                {doc > 0 ? `Q${doc.toLocaleString('en-US', {minimumFractionDigits: 2})}` : '—'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-celeste-kore/5 border border-celeste-kore/20 rounded-lg px-3 py-2">
                              <span className="text-muted-foreground">Restante</span>
                              <span className="text-celeste-kore font-black">Q{restante.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ========== NORMAL USER VIEW: Only payment dates ========== */}
      {!isAdmin && (
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30">
              <CalendarDays size={20} className="text-celeste-kore" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">
                Fechas de Entrega
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Próximas fechas de pago programadas
              </p>
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
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors">
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

      <ProyectoModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchData();
        }} 
        proyecto={selectedProyecto} 
      />
    </div>
  );
}

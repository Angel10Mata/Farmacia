"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Phone,
  Mail,
  Edit,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  Copy,
  Save,
  Plus,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Swal from "sweetalert2";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { DEPARTAMENTOS_GUATEMALA } from "@/utils/guatemala";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from "@/components/(Kore)/clientes/lib/actions";

interface ClienteProyecto {
  id: string;
  nombre: string;
  estado: string;
  precio: number;
  fecha?: string | null;
}

interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  correo: string;
  departamento: string;
  municipio: string;
  created_at: string;
  proyectosCount: number;
  totalPagado: number;
  proyectosList: ClienteProyecto[];
}


// Helper to generate short code from UUID
const getCode = (id: string) => {
  if (!id) return "N/A";
  const clean = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return clean.slice(0, 3) + "-" + clean.slice(3, 6);
};

// Helper to format WhatsApp link from phone number
const getWhatsAppLink = (phone: string) => {
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 8) return `https://wa.me/502${clean}`;
  return `https://wa.me/${clean}`;
};

const COUNTRIES = [
  { code: "+502", flag: "🇬🇹", name: "Guatemala" },
  { code: "+34",  flag: "🇪🇸", name: "España" },
  { code: "+1",   flag: "🇺🇸", name: "EE.UU." },
  { code: "+52",  flag: "🇲🇽", name: "México" },
  { code: "+503", flag: "🇸🇻", name: "El Salvador" },
  { code: "+504", flag: "🇭🇳", name: "Honduras" },
  { code: "+505", flag: "🇳🇮", name: "Nicaragua" },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica" },
  { code: "+507", flag: "🇵🇦", name: "Panamá" },
  { code: "+57",  flag: "🇨🇴", name: "Colombia" },
];

const parsePhoneNumber = (phone: string) => {
  if (!phone) return { countryCode: "+502", localNumber: "" };
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  const matched = sorted.find((c) => phone.startsWith(c.code));
  if (matched) {
    return {
      countryCode: matched.code,
      localNumber: phone.slice(matched.code.length),
    };
  }
  if (phone.startsWith("+")) {
    return { countryCode: "+502", localNumber: phone };
  }
  return { countryCode: "+502", localNumber: phone };
};

export default function ClientesDashboard() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const showInvestment = effectiveRole !== "proyectos";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    let active = true;
    getClientes()
      .then((data) => {
        if (active) {
          setClientes(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading clients:", err);
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter clients based on search term
  const filteredClients = useMemo<Cliente[]>(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clientes;

    return clientes.filter(
      (c: Cliente) =>
        c.nombre.toLowerCase().includes(term) ||
        c.telefono.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term)
    );
  }, [clientes, searchTerm]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(start, start + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const emptyRowsCount = useMemo(() => {
    return itemsPerPage - paginatedClients.length;
  }, [paginatedClients, itemsPerPage]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const startEdit = (client: Cliente) => {
    sessionStorage.setItem("selectedClienteId", client.id);
    router.push("/kore/clientes/editar");
  };

  const handleDelete = async (client: Cliente) => {
    const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");
    let timerInterval: any;
    const result = await Swal.fire({
      title: "Eliminar Cliente",
      html: `Esta acción eliminará a <strong>${client.nombre}</strong> de forma permanente.<br/><br/>El botón se habilitará en <b class="text-red-500 font-bold">7</b> segundos.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: isDark ? "#27272a" : "#71717a",
      confirmButtonText: "Sí, eliminar (7)",
      cancelButtonText: "Cancelar",
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
      didOpen: () => {
        Swal.disableButtons();
        const b = Swal.getHtmlContainer()?.querySelector('b');
        let secondsLeft = 7;
        if (b) b.textContent = String(secondsLeft);
        timerInterval = setInterval(() => {
          secondsLeft--;
          if (b) b.textContent = String(secondsLeft);
          const confirmBtn = Swal.getConfirmButton();
          if (confirmBtn) {
            confirmBtn.textContent = `Sí, eliminar (${secondsLeft})`;
          }
          if (secondsLeft <= 0) {
            clearInterval(timerInterval);
            Swal.enableButtons();
            if (confirmBtn) {
              confirmBtn.textContent = "Sí, eliminar";
            }
          }
        }, 1000);
      },
      willClose: () => {
        clearInterval(timerInterval);
      }
    });

    if (result.isConfirmed) {
      const res = await deleteCliente(client.id);
      if (res.error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.error,
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
          confirmButtonColor: "#B7494E",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
        if (expandedClient === client.id) {
          setExpandedClient(null);
        }
        getClientes()
          .then((data) => setClientes(data || []))
          .catch((err) => console.error("Error re-fetching clients:", err));
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 text-foreground px-4 pt-32 pb-16 md:px-8 md:pt-24 relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-[#B7494E]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-celeste-kore/10 flex items-center justify-center border border-celeste-kore/20 shrink-0">
              <Users className="text-celeste-kore size-6" />
            </div>
            <div>
              <h2 className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-primary/80">
                Gestión de Contactos
              </h2>
              <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none uppercase">
                Gestión de <span className="text-celeste-kore">Clientes</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Button to open registration modal */}
        <div className="flex items-center w-full sm:w-auto self-end sm:self-center">
          <button
            onClick={() => {
              router.push("/kore/clientes/nuevo");
            }}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl bg-celeste-kore text-black hover:opacity-95 transition-all font-black text-xs sm:text-sm w-full sm:w-auto cursor-pointer"
          >
            Registrar Cliente
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT WITH CARD BACKGROUND */}
      <div className="w-full max-w-5xl mx-auto overflow-visible relative rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 p-6 md:p-10 flex flex-col gap-6">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-10 pr-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-black/5 dark:bg-black/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all text-black dark:text-white outline-none shadow-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-[10px] font-black uppercase tracking-wider transition-all px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Client list */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="animate-spin text-celeste-kore size-8" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border/50 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm shadow-none">
                <Users className="size-14 text-muted-foreground/30 mb-3 animate-pulse" />
                <p className="font-black text-sm uppercase tracking-wide">No se encontraron clientes</p>
                <p className="text-xs text-muted-foreground/70 mt-1.5">
                  Registra un cliente en el panel izquierdo o ajusta los términos de búsqueda.
                </p>
              </div>
            ) : (
              <>
                {paginatedClients.map((client: Cliente) => {
                  const isExpanded = expandedClient === client.id;

                  return (
                    <div
                      key={client.id}
                      className="border border-celeste-kore/55 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900/10 backdrop-blur-md hover:border-celeste-kore/70 dark:hover:border-white/20 transition-all duration-300 overflow-hidden shadow-none dark:shadow-md"
                    >
                      {/* Header Summary */}
                      <div
                        onClick={() => toggleExpand(client.id)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-start">
                          <div>
                            <h3 className="text-sm font-black text-black dark:text-white hover:text-celeste-kore transition-colors">
                              {client.nombre}
                            </h3>
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 mt-1">
                              {client.nit && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                  <span className="text-[9px] font-black text-celeste-kore/70 bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">NIT: {client.nit}</span>
                                </span>
                              )}
                              {client.telefono && (
                                <a
                                  href={getWhatsAppLink(client.telefono)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-emerald-500 font-bold transition-colors cursor-pointer"
                                  title="Abrir chat de WhatsApp"
                                >
                                  <Phone size={10} className="shrink-0 text-celeste-kore hover:text-emerald-500" />
                                  {(() => {
                                    const parsed = parsePhoneNumber(client.telefono || "");
                                    const matched = COUNTRIES.find((c) => c.code === parsed.countryCode);
                                    return (
                                      <>
                                        <span className="text-[12px] shrink-0" title={matched?.name}>{matched?.flag || "🇬🇹"}</span>
                                        <span>{parsed.localNumber}</span>
                                      </>
                                    );
                                  })()}
                                </a>
                              )}
                              {client.correo && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold truncate max-w-[180px] sm:max-w-none">
                                  <Mail size={10} className="shrink-0 text-celeste-kore" />
                                  {client.correo}
                                </span>
                              )}
                              {client.departamento && client.municipio && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                  <MapPin size={10} className="shrink-0 text-celeste-kore" />
                                  {client.municipio}, {client.departamento}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-border/50 dark:border-white/5 pt-2.5 sm:pt-0 sm:border-0 shrink-0">
                          {/* Action buttons */}
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => startEdit(client)}
                              className="flex items-center justify-center p-2.5 bg-black/5 dark:bg-white/5 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg border border-border/50 dark:border-white/5 transition-colors cursor-pointer"
                              title="Editar cliente"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(client)}
                              className="flex items-center justify-center p-2.5 bg-black/5 dark:bg-white/5 hover:bg-[#B7494E]/20 text-muted-foreground hover:text-[#B7494E] rounded-lg border border-border/50 dark:border-white/5 transition-colors cursor-pointer"
                              title="Eliminar cliente"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => toggleExpand(client.id)}
                              className="flex items-center justify-center p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-muted-foreground hover:text-black dark:hover:text-white rounded-lg border border-border/50 dark:border-white/5 transition-colors cursor-pointer ml-1"
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Project Details */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="border-t border-border/50 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              <h4 className="text-[9px] font-black uppercase text-celeste-kore tracking-widest">
                                Desglose de Proyectos
                              </h4>

                              {client.proyectosList.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground italic font-semibold py-1">
                                  Este cliente no tiene ningún proyecto registrado.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="text-[9px] text-muted-foreground uppercase border-b border-border/50 dark:border-white/10 pb-1">
                                        <th className="pb-2 font-black">Código</th>
                                        <th className="pb-2 font-black">Nombre Proyecto</th>
                                        <th className="pb-2 font-black">Estado</th>
                                        {showInvestment && <th className="pb-2 font-black text-right">Monto</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {client.proyectosList.map((proj: ClienteProyecto) => (
                                        <tr
                                          key={proj.id}
                                          className="border-b border-border/50 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        >
                                          <td className="py-2.5 font-mono text-[10px] text-black dark:text-white">
                                            <span className="font-bold text-celeste-kore bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">
                                              {getCode(proj.id)}
                                            </span>
                                          </td>
                                          <td className="py-2.5 font-semibold text-black dark:text-white">
                                            {proj.nombre}
                                          </td>
                                          <td className="py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${
                                              proj.estado === "En Progreso" ? "bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20" :
                                              proj.estado === "Finalizados" ? "bg-muted text-muted-foreground border-border" :
                                              "bg-azul-kore/10 text-azul-kore border-azul-kore/20 shadow-sm"
                                            }`}>
                                              {proj.estado}
                                            </span>
                                          </td>
                                          {showInvestment && (
                                            <td className="py-2.5 text-right font-black text-black dark:text-white">
                                              Q{proj.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                      {showInvestment && (
                                        <tr className="border-t border-border/50 dark:border-white/10 font-bold bg-black/5 dark:bg-white/5">
                                          <td colSpan={3} className="py-3 text-right pr-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                            Total Inversión:
                                          </td>
                                          <td className="py-3 text-right font-black text-celeste-kore text-sm">
                                            Q{client.totalPagado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {emptyRowsCount > 0 && Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <div
                    key={`empty-client-${idx}`}
                    className="opacity-0 pointer-events-none select-none border border-transparent bg-transparent rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-[78px]"
                  >
                    <div className="flex items-start">
                      <div>
                        <h3 className="text-sm font-black leading-none">&nbsp;</h3>
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 mt-1">
                          <span className="text-[10px]">&nbsp;</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
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
        </div>
      </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Search,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Briefcase,
  Users
} from "lucide-react";

interface ClientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: any[];
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

export default function ClientesModal({
  isOpen,
  onClose,
  proyectos,
}: ClientesModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Group projects by client name
  const clientsData = useMemo(() => {
    const clientsMap: { [nombre: string]: any } = {};

    proyectos.forEach((p) => {
      const name = (p.cliente_nombre || "Sin Cliente").trim();
      const price = Number(p.precio) || 0;

      if (!clientsMap[name]) {
        clientsMap[name] = {
          nombre: name,
          nit: p.cliente_nit || "",
          telefono: p.cliente_telefono || "",
          correo: p.cliente_correo || "",
          totalPagado: 0,
          proyectosCount: 0,
          proyectosList: [],
        };
      }

      clientsMap[name].totalPagado += price;
      clientsMap[name].proyectosCount += 1;
      
      // Update contact info if missing and present in other projects
      if (!clientsMap[name].nit && p.cliente_nit) {
        clientsMap[name].nit = p.cliente_nit;
      }
      if (!clientsMap[name].telefono && p.cliente_telefono) {
        clientsMap[name].telefono = p.cliente_telefono;
      }
      if (!clientsMap[name].correo && p.cliente_correo) {
        clientsMap[name].correo = p.cliente_correo;
      }

      clientsMap[name].proyectosList.push({
        id: p.id,
        nombre: p.nombre,
        estado: p.estado,
        precio: price,
        fecha: p.fecha_entrega,
      });
    });

    // Sort projects inside each client by date or price
    Object.values(clientsMap).forEach((client: any) => {
      client.proyectosList.sort((a: any, b: any) => b.precio - a.precio);
    });

    return Object.values(clientsMap).sort((a: any, b: any) => b.totalPagado - a.totalPagado);
  }, [proyectos]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clientsData;

    return clientsData.filter(
      (c: any) =>
        c.nombre.toLowerCase().includes(term) ||
        c.telefono.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term)
    );
  }, [clientsData, searchTerm]);



  const toggleExpand = (clientName: string) => {
    setExpandedClient(expandedClient === clientName ? null : clientName);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-0 md:p-4 overflow-hidden">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-transparent cursor-default"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-4xl h-full md:h-[85vh] bg-background/95 border border-white/10 shadow-2xl rounded-none md:rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Background decorative glows */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/5 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10" />

            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-card/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-celeste-kore/10 flex items-center justify-center border border-celeste-kore/20">
                  <Users className="text-celeste-kore size-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-white uppercase leading-none">
                    Clientes Registrados
                  </h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1 font-bold">
                    Listado de clientes con información de contacto y desglose de sus proyectos.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Section */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-card/5 shrink-0">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, teléfono o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-background/40 text-sm focus:outline-none focus:ring-2 focus:ring-celeste-kore/50 transition-all text-white outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-xs font-bold transition-all px-2 py-1 rounded bg-white/5 border border-white/5"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <Users className="size-12 text-muted-foreground/30 mb-3" />
                  <p className="font-bold text-sm">No se encontraron clientes</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Intenta cambiar los términos de búsqueda.
                  </p>
                </div>
              ) : (
                filteredClients.map((client: any) => {
                  const isExpanded = expandedClient === client.nombre;

                  return (
                    <div
                      key={client.nombre}
                      className="border border-white/10 rounded-xl bg-card/20 hover:border-white/20 transition-all duration-300 overflow-hidden"
                    >
                      {/* Card Header (Client Summary) */}
                      <div
                        onClick={() => toggleExpand(client.nombre)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3">
                          <div>
                            <h3 className="text-sm font-black text-white hover:text-celeste-kore transition-colors">
                              {client.nombre}
                            </h3>
                            {/* Contact Details inline */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
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
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-white/5 pt-2 sm:pt-0 sm:border-0 shrink-0">
                          {/* Chevron */}
                          <div className="text-muted-foreground p-1 hover:text-white rounded-lg bg-white/5 border border-white/5">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Project List */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="border-t border-white/10 bg-white/5 overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              <h4 className="text-[9px] font-black uppercase text-celeste-kore tracking-widest">
                                Desglose de Proyectos
                              </h4>
                              
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="text-[9px] text-muted-foreground uppercase border-b border-white/10 pb-1">
                                      <th className="pb-2 font-black">Código</th>
                                      <th className="pb-2 font-black">Nombre Proyecto</th>
                                      <th className="pb-2 font-black">Estado</th>
                                      <th className="pb-2 font-black text-right">Monto</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {client.proyectosList.map((proj: any) => (
                                      <tr
                                        key={proj.id}
                                        className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                                      >
                                        <td className="py-2.5 font-mono text-[10px] text-white">
                                          <span className="font-bold text-celeste-kore bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">
                                            {getCode(proj.id)}
                                          </span>
                                        </td>
                                        <td className="py-2.5 font-semibold text-white">
                                          {proj.nombre}
                                        </td>
                                        <td className="py-2.5">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${
                                            proj.estado === 'En Progreso' ? 'bg-celeste-kore/10 text-celeste-kore border-celeste-kore/20' :
                                            proj.estado === 'Finalizados' ? 'bg-muted text-muted-foreground border-border' :
                                            'bg-azul-kore/10 text-azul-kore border-azul-kore/20 shadow-sm'
                                          }`}>
                                            {proj.estado}
                                          </span>
                                        </td>
                                        <td className="py-2.5 text-right font-black text-white">
                                          Q{proj.precio.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="border-t border-white/10 font-bold bg-white/5">
                                      <td colSpan={3} className="py-3 text-right pr-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                        Total Inversión:
                                      </td>
                                      <td className="py-3 text-right font-black text-celeste-kore text-sm">
                                        Q{client.totalPagado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-background/50 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-white/10 bg-background hover:bg-white/5 text-white hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

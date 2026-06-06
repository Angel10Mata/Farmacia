"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
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
  Save
} from "lucide-react";
import Swal from "sweetalert2";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
} from "@/app/kore/clientes/actions";

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

export default function ClientesDashboard() {
  const router = useRouter();
  const { effectiveRole } = useUserContext();
  const showInvestment = effectiveRole !== "proyectos";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    telefono: "",
    correo: "",
  });
  const [formErrors, setFormErrors] = useState<{ nombre?: string; correo?: string }>({});

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: typeof formErrors = {};
    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    }
    if (formData.correo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        errors.correo = "Formato de correo inválido";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    let res: { success?: boolean; error?: string; cliente?: unknown };
    if (editingId) {
      res = await updateCliente(editingId, formData);
    } else {
      res = await createCliente(formData);
    }
    setSubmitting(false);

    if (res.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: "#18181b",
        color: "#fff",
        confirmButtonColor: "#B7494E",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: editingId ? "Cliente Actualizado" : "Cliente Registrado",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        background: "#18181b",
        color: "#fff",
      });
      setFormData({ nombre: "", nit: "", telefono: "", correo: "" });
      setEditingId(null);
      setIsFormExpanded(false);
      getClientes()
        .then((data) => setClientes(data || []))
        .catch((err) => console.error("Error re-fetching clients:", err));
    }
  };

  const startEdit = (client: Cliente) => {
    setEditingId(client.id);
    setFormData({
      nombre: client.nombre,
      nit: client.nit,
      telefono: client.telefono,
      correo: client.correo,
    });
    setFormErrors({});
    setIsFormExpanded(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ nombre: "", nit: "", telefono: "", correo: "" });
    setFormErrors({});
    setIsFormExpanded(false);
  };

  const handleDelete = async (client: Cliente) => {
    const result = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: `Se eliminará a "${client.nombre}". Si tiene proyectos asociados, verifica las restricciones de la base de datos.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#27272a",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: "#18181b",
      color: "#fff",
    });

    if (result.isConfirmed) {
      const res = await deleteCliente(client.id);
      if (res.error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.error,
          background: "#18181b",
          color: "#fff",
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
          background: "#18181b",
          color: "#fff",
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
    <div className="w-full flex flex-col gap-6 text-foreground relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-[#B7494E]/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-4">
          {/* Back Button Link */}
          <button
            onClick={() => router.push("/kore/proyectos")}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-celeste-kore hover:text-black dark:hover:text-white transition-colors cursor-pointer w-fit mt-4"
          >
            <ArrowLeft size={14} />
            Volver a Proyectos
          </button>

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

        {/* Project Creation Trigger */}
        <div className="flex items-center w-full sm:w-auto self-end sm:self-center">
          <button
            onClick={() => router.push("/kore/proyectos/nuevo")}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-xl bg-celeste-kore text-black hover:opacity-95 transition-all font-black text-xs sm:text-sm w-full sm:w-auto cursor-pointer"
          >
            Proyecto
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* LEFT COLUMN: Sticky Form Card */}
        <div className="lg:sticky lg:top-24 bg-white dark:bg-zinc-950/40 backdrop-blur-xl border border-border/50 dark:border-white/10 rounded-2xl p-6 shadow-xl shadow-black/5 dark:shadow-2xl transition-all duration-300">
          <div
            onClick={() => {
              if (editingId) {
                cancelEdit();
              } else {
                setIsFormExpanded(!isFormExpanded);
              }
            }}
            className="flex items-center justify-between cursor-pointer select-none group/hdr"
          >
            <div>
              <h3 className="text-base font-black tracking-tight text-black dark:text-white uppercase leading-none group-hover/hdr:text-celeste-kore transition-colors">
                {editingId ? "Editar Cliente" : "Registrar Cliente"}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-widest">
                {editingId ? "Actualizar los datos del contacto" : "Crear un nuevo contacto en el sistema"}
              </p>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-border/50 dark:border-white/10 text-muted-foreground hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0 ml-4 animate-fade-in"
            >
              {isFormExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {isFormExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid gap-1.5">
                    <label htmlFor="nombre" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      Nombre Completo *
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Ej. Oscar Jimenez"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      className={`flex h-10 w-full rounded-lg border bg-black/5 dark:bg-black/40 px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 transition-all outline-none ${
                        formErrors.nombre
                          ? "border-destructive focus:ring-destructive/50"
                          : "border-border/50 dark:border-white/10 focus:ring-red-600/50"
                      }`}
                    />
                    {formErrors.nombre && (
                      <p className="text-[10px] text-destructive font-semibold">{formErrors.nombre}</p>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="nit" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      NIT
                    </label>
                    <input
                      id="nit"
                      name="nit"
                      type="text"
                      placeholder="Ej. 1234567-8 ó CF"
                      value={formData.nit}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-lg border border-border/50 dark:border-white/10 bg-black/5 dark:bg-black/40 px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all outline-none"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="telefono" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      Teléfono de Contacto
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="text"
                      placeholder="Ej. 42140797"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-lg border border-border/50 dark:border-white/10 bg-black/5 dark:bg-black/40 px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all outline-none"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="correo" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      Correo Electrónico
                    </label>
                    <input
                      id="correo"
                      name="correo"
                      type="text"
                      placeholder="Ej. oscar@gmail.com"
                      value={formData.correo}
                      onChange={handleInputChange}
                      className={`flex h-10 w-full rounded-lg border bg-black/5 dark:bg-black/40 px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 transition-all outline-none ${
                        formErrors.correo
                          ? "border-destructive focus:ring-destructive/50"
                          : "border-border/50 dark:border-white/10 focus:ring-red-600/50"
                      }`}
                    />
                    {formErrors.correo && (
                      <p className="text-[10px] text-destructive font-semibold">{formErrors.correo}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingId && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 flex justify-center items-center h-10 rounded-lg border border-border/50 dark:border-white/10 bg-black/5 hover:bg-black/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex justify-center items-center gap-1.5 h-10 rounded-lg bg-celeste-kore text-black hover:bg-celeste-kore/90 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {editingId ? "Actualizar" : "Registrar"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Search + Client List */}
        <div className="space-y-4 w-full">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-10 pr-20 rounded-xl border border-border/50 dark:border-white/10 bg-white dark:bg-zinc-950/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-celeste-kore/50 transition-all text-black dark:text-white outline-none shadow-sm dark:shadow-none"
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
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed border-border/50 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-zinc-950/20 backdrop-blur-sm shadow-sm dark:shadow-none">
                <Users className="size-14 text-muted-foreground/30 mb-3 animate-pulse" />
                <p className="font-black text-sm uppercase tracking-wide">No se encontraron clientes</p>
                <p className="text-xs text-muted-foreground/70 mt-1.5">
                  Registra un cliente en el panel izquierdo o ajusta los términos de búsqueda.
                </p>
              </div>
            ) : (
              filteredClients.map((client: Cliente) => {
                const isExpanded = expandedClient === client.id;

                return (
                  <div
                    key={client.id}
                    className="border border-border/50 dark:border-white/10 rounded-2xl bg-white dark:bg-zinc-900/10 backdrop-blur-md hover:border-border dark:hover:border-white/20 transition-all duration-300 overflow-hidden shadow-sm dark:shadow-md"
                  >
                    {/* Header Summary */}
                    <div
                      onClick={() => toggleExpand(client.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 border border-border/50 dark:border-white/10 text-black dark:text-white font-black text-sm">
                          {client.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-black dark:text-white hover:text-celeste-kore transition-colors">
                            {client.nombre}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            {client.nit && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                <span className="text-[9px] font-black text-celeste-kore/70 bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">NIT: {client.nit}</span>
                              </span>
                            )}
                            {client.telefono && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                <Phone size={10} className="shrink-0 text-celeste-kore" />
                                {client.telefono}
                              </span>
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

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-border/50 dark:border-white/5 pt-2.5 sm:pt-0 sm:border-0 shrink-0">
                        {/* Projects Count */}
                        <div className="text-left sm:text-right">
                          <span className="text-[8px] uppercase tracking-wider text-muted-foreground block font-bold">Proyectos</span>
                          <span className="text-[10px] font-black text-black dark:text-white bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-border/50 dark:border-white/5">
                            {client.proyectosCount} {client.proyectosCount === 1 ? "proyecto" : "proyectos"}
                          </span>
                        </div>

                        {/* Total Paid */}
                        {showInvestment && (
                          <div className="text-right">
                            <span className="text-[8px] uppercase tracking-wider text-muted-foreground block font-bold">Inversión</span>
                            <span className="text-xs md:text-sm font-black text-celeste-kore">
                              Q{client.totalPagado.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => startEdit(client)}
                            className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-celeste-kore/20 text-muted-foreground hover:text-celeste-kore rounded-lg border border-border/50 dark:border-white/5 transition-colors cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-[#B7494E]/20 text-muted-foreground hover:text-[#B7494E] rounded-lg border border-border/50 dark:border-white/5 transition-colors cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => toggleExpand(client.id)}
                            className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 text-muted-foreground hover:text-black dark:hover:text-white rounded-lg border border-border/50 dark:border-white/5 transition-colors cursor-pointer ml-1"
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
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-celeste-kore bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">
                                              {getCode(proj.id)}
                                            </span>
                                            <button
                                              onClick={() => handleCopy(getCode(proj.id), proj.id)}
                                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                              title="Copiar código"
                                            >
                                              {copiedId === proj.id ? (
                                                <Check size={10} className="text-emerald-500" />
                                              ) : (
                                                <Copy size={10} />
                                              )}
                                            </button>
                                          </div>
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

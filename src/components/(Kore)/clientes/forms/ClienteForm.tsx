"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Users,
  Phone,
  Mail,
  Save,
  X,
  ChevronDown,
  MapPin,
  Loader2
} from "lucide-react";
import Swal from "sweetalert2";
import { DEPARTAMENTOS_GUATEMALA } from "@/utils/guatemala";
import {
  getClientes,
  createCliente,
  updateCliente
} from "@/components/(Kore)/clientes/lib/actions";

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

function ClienteFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const paramId = searchParams.get("id");
  const isEditRoute = pathname?.includes("/editar");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    telefono: "",
    correo: "",
    departamento: "",
    municipio: "",
  });
  const [formErrors, setFormErrors] = useState<{ nombre?: string; correo?: string }>({});

  // Dropdown States
  const [selectedCountry, setSelectedCountry] = useState("+502");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showDeptoDropdown, setShowDeptoDropdown] = useState(false);
  const [showMuniDropdown, setShowMuniDropdown] = useState(false);

  // Search Terms
  const [deptoSearchTerm, setDeptoSearchTerm] = useState("");
  const [muniSearchTerm, setMuniSearchTerm] = useState("");

  // Determine ID from URL or sessionStorage
  useEffect(() => {
    if (!isEditRoute) return;
    const id = paramId || sessionStorage.getItem("selectedClienteId");
    if (id) {
      setEditingId(id);
      // Clean up URL parameters if they accessed the page via query string
      if (paramId) {
        sessionStorage.setItem("selectedClienteId", paramId);
        router.replace("/kore/clientes/editar");
      }
    } else {
      router.replace("/kore/clientes");
    }
  }, [paramId, isEditRoute, router]);

  // Load client details if editing
  useEffect(() => {
    if (!editingId) return;
    setLoading(true);
    getClientes()
      .then((data) => {
        const found = data.find((c) => c.id === editingId);
        if (found) {
          const { countryCode, localNumber } = parsePhoneNumber(found.telefono || "");
          setSelectedCountry(countryCode);
          setFormData({
            nombre: found.nombre,
            nit: found.nit || "",
            telefono: localNumber,
            correo: found.correo || "",
            departamento: found.departamento || "",
            municipio: found.municipio || "",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Cliente no encontrado.",
            background: "#18181b",
            color: "#fff",
            confirmButtonColor: "#B7494E",
          });
          router.replace("/kore/clientes");
        }
      })
      .catch((err) => {
        console.error("Error loading client:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [editingId, router]);

  const municipiosDisponibles = useMemo(() => {
    if (!formData.departamento) return [];
    const depto = DEPARTAMENTOS_GUATEMALA.find(
      (d) => d.nombre === formData.departamento
    );
    return depto ? depto.municipios : [];
  }, [formData.departamento]);

  const filteredDeptos = useMemo(() => {
    const term = deptoSearchTerm.toLowerCase().trim();
    if (!term) return DEPARTAMENTOS_GUATEMALA;
    return DEPARTAMENTOS_GUATEMALA.filter((d) =>
      d.nombre.toLowerCase().includes(term)
    );
  }, [deptoSearchTerm]);

  const filteredMunis = useMemo(() => {
    const term = muniSearchTerm.toLowerCase().trim();
    if (!term) return municipiosDisponibles;
    return municipiosDisponibles.filter((m) =>
      m.toLowerCase().includes(term)
    );
  }, [muniSearchTerm, municipiosDisponibles]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectDepartamento = (deptoNombre: string) => {
    setFormData((prev) => ({
      ...prev,
      departamento: deptoNombre,
      municipio: "",
    }));
    setShowDeptoDropdown(false);
    setDeptoSearchTerm("");
  };

  const handleSelectMunicipio = (muniNombre: string) => {
    setFormData((prev) => ({
      ...prev,
      municipio: muniNombre,
    }));
    setShowMuniDropdown(false);
    setMuniSearchTerm("");
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
    const payload = {
      ...formData,
      telefono: selectedCountry + formData.telefono.trim(),
    };

    let res: { success?: boolean; error?: string; cliente?: unknown };
    if (editingId) {
      res = await updateCliente(editingId, payload);
    } else {
      res = await createCliente(payload);
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
      sessionStorage.removeItem("selectedClienteId");
      router.push("/kore/clientes");
    }
  };

  const handleCancel = () => {
    sessionStorage.removeItem("selectedClienteId");
    router.push("/kore/clientes");
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center bg-background text-foreground">
        <Loader2 className="animate-spin text-celeste-kore size-10" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 text-foreground px-4 pt-32 pb-16 md:px-8 md:pt-24 relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-celeste-kore/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      
      {/* CARD WRAPPER CONTAINING HEADER AND FORM */}
      <div className="w-full max-w-5xl mx-auto overflow-visible relative rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 p-6 md:p-10 flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 border-b border-border/40 pb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-celeste-kore/10 flex items-center justify-center border border-celeste-kore/20 shrink-0">
              <Users className="text-celeste-kore size-6" />
            </div>
            <div>
              <h2 className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-primary/80">
                Formulario de Cliente
              </h2>
              <h1 className="text-xl sm:text-4xl font-black tracking-tight mt-0.5 sm:mt-1 leading-none uppercase text-black dark:text-white">
                {editingId ? "Editar" : "Nuevo"} <span className="text-celeste-kore">Cliente</span>
              </h1>
            </div>
          </div>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            
            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="nombre" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Nombre Completo *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Ej. Angel Mata"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`flex h-11 w-full rounded-xl border bg-black/5 dark:bg-black/40 px-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 transition-all outline-none ${
                  formErrors.nombre
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-input dark:border-white/10 focus:ring-red-600/50"
                }`}
              />
              {formErrors.nombre && (
                <p className="text-[10px] text-destructive font-semibold">{formErrors.nombre}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label htmlFor="nit" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                NIT
              </label>
              <input
                id="nit"
                name="nit"
                type="text"
                placeholder="Ej. CF o 1234567-8"
                value={formData.nit}
                onChange={handleInputChange}
                className="flex h-11 w-full rounded-xl border border-input dark:border-white/10 bg-black/5 dark:bg-black/40 px-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all outline-none"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="telefono" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Teléfono de Contacto
              </label>
              <div className="flex gap-2.5 relative" onMouseLeave={() => setShowCountryDropdown(false)}>
                {/* Country Selector Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex h-11 items-center justify-between gap-1.5 rounded-xl border border-input dark:border-white/10 bg-black/5 dark:bg-zinc-900 px-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all cursor-pointer"
                  >
                    <span className="text-base">{COUNTRIES.find(c => c.code === selectedCountry)?.flag || "🇬🇹"}</span>
                    <ChevronDown size={12} className="text-muted-foreground" />
                  </button>

                  {showCountryDropdown && (
                    <div className="absolute left-0 mt-1.5 z-50 w-44 rounded-xl border border-border dark:border-white/10 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c.code);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white transition-colors cursor-pointer rounded-lg font-medium"
                        >
                          <span className="text-base">{c.flag}</span>
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-muted-foreground ml-auto">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  placeholder="40001234"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="flex-1 h-11 rounded-xl border border-input dark:border-white/10 bg-black/5 dark:bg-black/40 px-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <label htmlFor="correo" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.correo}
                  onChange={handleInputChange}
                  className={`flex h-11 w-full rounded-xl border bg-black/5 dark:bg-black/40 pl-11 pr-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 transition-all outline-none ${
                    formErrors.correo
                      ? "border-destructive focus:ring-destructive/50"
                      : "border-input dark:border-white/10 focus:ring-red-600/50"
                  }`}
                />
              </div>
              {formErrors.correo && (
                <p className="text-[10px] text-destructive font-semibold">{formErrors.correo}</p>
              )}
            </div>

            {/* Departamento Selector */}
            <div className="grid gap-2 relative">
              <label htmlFor="departamento" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Departamento
              </label>
              <button
                id="departamento"
                type="button"
                onClick={() => {
                  setShowDeptoDropdown(!showDeptoDropdown);
                  setDeptoSearchTerm("");
                }}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-input dark:border-white/10 bg-black/5 dark:bg-black/40 px-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all cursor-pointer text-left"
              >
                <span className="truncate">{formData.departamento || "Seleccionar..."}</span>
                <ChevronDown size={14} className="text-muted-foreground shrink-0" />
              </button>

              {showDeptoDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-[115] bg-black/50 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none cursor-default"
                    onClick={() => {
                      setShowDeptoDropdown(false);
                      setDeptoSearchTerm("");
                    }}
                  />
                  <div className="fixed inset-x-6 top-[12%] md:absolute md:left-0 md:right-0 md:top-full md:mt-1.5 z-[120] rounded-xl border border-celeste-kore/30 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[35vh] md:max-h-64">
                    <div className="p-1.5 border-b border-border dark:border-white/10 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={deptoSearchTerm}
                        onChange={(e) => setDeptoSearchTerm(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-input dark:border-white/10 bg-black/5 dark:bg-black/20 text-xs focus:outline-none focus:ring-1 focus:ring-red-600/50 text-black dark:text-white outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-1.5 flex-1 max-h-[25vh] md:max-h-48">
                      <button
                        type="button"
                        onClick={() => handleSelectDepartamento("")}
                        className="w-full flex items-center px-4 py-2 text-left text-sm text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer rounded-lg font-medium"
                      >
                        Seleccionar...
                      </button>
                      {filteredDeptos.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-4 font-medium uppercase tracking-wider">Sin resultados</p>
                      ) : (
                        filteredDeptos.map((depto) => (
                          <button
                            key={depto.nombre}
                            type="button"
                            onClick={() => handleSelectDepartamento(depto.nombre)}
                            className={`w-full flex items-center px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-celeste-kore/10 dark:hover:bg-celeste-kore/20 hover:text-celeste-kore dark:hover:text-celeste-kore transition-all duration-150 cursor-pointer rounded-lg ${
                              formData.departamento === depto.nombre ? "text-celeste-kore dark:text-celeste-kore font-bold bg-celeste-kore/10 dark:bg-celeste-kore/20" : ""
                            }`}
                          >
                            {depto.nombre}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Municipio Selector */}
            <div className="grid gap-2 relative">
              <label htmlFor="municipio" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Municipio
              </label>
              <button
                id="municipio"
                type="button"
                disabled={!formData.departamento}
                onClick={() => {
                  setShowMuniDropdown(!showMuniDropdown);
                  setMuniSearchTerm("");
                }}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-input dark:border-white/10 bg-black/5 dark:bg-black/40 px-4 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <span className="truncate">{formData.municipio || "Seleccionar..."}</span>
                <ChevronDown size={14} className="text-muted-foreground shrink-0" />
              </button>

              {showMuniDropdown && formData.departamento && (
                <>
                  <div
                    className="fixed inset-0 z-[115] bg-black/50 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none cursor-default"
                    onClick={() => {
                      setShowMuniDropdown(false);
                      setMuniSearchTerm("");
                    }}
                  />
                  <div className="fixed inset-x-6 top-[12%] md:absolute md:left-0 md:right-0 md:top-full md:mt-1.5 z-[120] rounded-xl border border-celeste-kore/30 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[35vh] md:max-h-64">
                    <div className="p-1.5 border-b border-border dark:border-white/10 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={muniSearchTerm}
                        onChange={(e) => setMuniSearchTerm(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-md border border-input dark:border-white/10 bg-black/5 dark:bg-black/20 text-xs focus:outline-none focus:ring-1 focus:ring-red-600/50 text-black dark:text-white outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-1.5 flex-1 max-h-[25vh] md:max-h-48">
                      <button
                        type="button"
                        onClick={() => handleSelectMunicipio("")}
                        className="w-full flex items-center px-4 py-2 text-left text-sm text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer rounded-lg font-medium"
                      >
                        Seleccionar...
                      </button>
                      {filteredMunis.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground text-center py-4 font-medium uppercase tracking-wider">Sin resultados</p>
                      ) : (
                        filteredMunis.map((muni) => (
                          <button
                            key={muni}
                            type="button"
                            onClick={() => handleSelectMunicipio(muni)}
                            className={`w-full flex items-center px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-celeste-kore/10 dark:hover:bg-celeste-kore/20 hover:text-celeste-kore dark:hover:text-celeste-kore transition-all duration-150 cursor-pointer rounded-lg ${
                              formData.municipio === muni ? "text-celeste-kore dark:text-celeste-kore font-bold bg-celeste-kore/10 dark:bg-celeste-kore/20" : ""
                            }`}
                          >
                            {muni}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Form Footer Buttons */}
          <div className="flex gap-4 pt-6 border-t border-border/40 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl border border-border/50 dark:border-white/10 bg-black/5 hover:bg-black/10 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-black dark:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-celeste-kore text-black hover:bg-celeste-kore/90 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
      </div>
    </div>
  );
}

export default function ClienteForm() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex justify-center items-center bg-background text-foreground">
        <Loader2 className="animate-spin text-celeste-kore size-10" />
      </div>
    }>
      <ClienteFormContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Briefcase, Save, ArrowLeft, Plus, Trash2, Receipt, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import {
  proyectoSchema,
  ProyectoFormValues,
  TIPOS_DEDUCCION,
  TipoDeduccion,
} from "./lib/schemas";
import { createProyecto, updateProyecto } from "@/app/kore/proyectos/actions";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface ProyectoFormProps {
  proyecto?: any | null;
}

// ── Small shared components ──────────────────────────────────────────────────

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    {...props}
    className={cn(
      "text-xs font-semibold leading-none text-foreground/70 uppercase tracking-wider",
      className
    )}
  />
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all outline-none disabled:opacity-50 disabled:bg-muted/30 disabled:cursor-not-allowed",
      className
    )}
  />
);

const SelectWrap = ({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select
      {...props}
      className={cn(
        "flex h-10 w-full appearance-none rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all disabled:opacity-50 disabled:bg-muted/30 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

// ── Color palette por tipo de deducción ──────────────────────────────────────

const TIPO_STYLE: Record<string, { pill: string; dot: string }> = {
  "Vendedor":      { pill: "bg-blue-500/10 text-blue-400 border-blue-500/25",       dot: "bg-blue-400" },
  "Documentación": { pill: "bg-purple-500/10 text-purple-400 border-purple-500/25", dot: "bg-purple-400" },
  "IVA":           { pill: "bg-amber-500/10 text-amber-400 border-amber-500/25",    dot: "bg-amber-400" },
  "Desarrollador": { pill: "bg-celeste-kore/10 text-celeste-kore border-celeste-kore/25", dot: "bg-celeste-kore" },
  "Kore":          { pill: "bg-red-500/10 text-red-400 border-red-500/25",          dot: "bg-red-400" },
};

const DEFAULT_PCT: Record<string, number> = {
  "Kore": 10,
  "Vendedor": 10,
  "Documentación": 10,
  "IVA": 12,
  "Desarrollador": 0,
};

const formatToE164 = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const clean = phone.trim();
  if (!clean) return "";
  if (clean.startsWith("+")) return clean;
  // Si tiene 8 dígitos (formato estándar de Guatemala), anteponer +502
  if (clean.length === 8 && /^\d+$/.test(clean)) {
    return `+502${clean}`;
  }
  // Si solo son dígitos y no tiene +, anteponer +502
  if (/^\d+$/.test(clean)) {
    return `+502${clean}`;
  }
  return clean;
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProyectoForm({ proyecto }: ProyectoFormProps) {
  const isEditing = !!proyecto;
  const { effectiveRole } = useUserContext();
  const isOperator = effectiveRole === "proyectos";
  const router = useRouter();
  const supabase = createClient();

  // ── React Hook Form ──
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProyectoFormValues>({
    resolver: zodResolver(proyectoSchema) as any,
    defaultValues: {
      nombre: "",
      cliente_nombre: "",
      cliente_nit: "",
      cliente_telefono: "",
      cliente_correo: "",
      fecha_entrega: "",
      precio: 0,
      mantenimiento: 0,
      estado: "En Progreso",
      vendedor_id: "",
      deducciones: [],
    },
  });

  // Field array para la lista de deducciones
  const { fields, append, remove } = useFieldArray({
    control,
    name: "deducciones",
  });

  // Estado del formulario de "agregar deducción"
  const [step, setStep] = useState<1 | 2>(1);
  const totalDeduccionesPct = fields.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);

  const [newDed, setNewDed] = useState<{
    tipo: TipoDeduccion;
    porcentaje: number | string;
    descripcion: string;
    usuario_id: string;
  }>({
    tipo: "Vendedor",
    porcentaje: 10,
    descripcion: "",
    usuario_id: "",
  });

  const handleTipoChange = (tipo: string) => {
    setNewDed((p) => ({
      ...p,
      tipo: tipo as TipoDeduccion,
      porcentaje: DEFAULT_PCT[tipo] ?? 0,
    }));
  };

  const handleAddDed = () => {
    append({
      tipo: newDed.tipo,
      porcentaje: Number(newDed.porcentaje) || 0,
      descripcion: newDed.descripcion || "",
      usuario_id: newDed.usuario_id || "",
    });
    setNewDed({
      tipo: "Vendedor",
      porcentaje: DEFAULT_PCT["Vendedor"],
      descripcion: "",
      usuario_id: "",
    });
  };

  // ── Usuarios (para asignación en deducciones y vendedor) ──
  const { data: users } = useQuery({
    queryKey: ["profiles-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre", { ascending: true });
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getUserName = (userId: string): string | null => {
    if (!userId) return null;
    const user = users?.find((u: any) => u.id === userId);
    if (!user) return users ? null : null; // still loading
    return user.nombre || "Usuario";
  };

  // ── Sincronización de Vendedor con Deducción de Comisión ──
  const currentDeducciones = watch("deducciones") || [];
  const vendedorId = watch("vendedor_id");
  const firstComisionUsuarioId = currentDeducciones.find((d: any) => d.tipo === "Comisión")?.usuario_id || "";

  useEffect(() => {
    if (firstComisionUsuarioId !== vendedorId) {
      setValue("vendedor_id", firstComisionUsuarioId);
    }
  }, [firstComisionUsuarioId, vendedorId, setValue]);


  // ── Autocomplete de clientes ──
  const clienteNombreValue = watch("cliente_nombre") || "";
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [justSelected, setJustSelected] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { data: clientesSuggestions } = useQuery({
    queryKey: ["pro-clientes-search", clienteNombreValue],
    queryFn: async () => {
      if (!clienteNombreValue || clienteNombreValue.length < 2) return [];
      const { data, error } = await supabase
        .from("pro_clientes")
        .select("id, nombre, nit, telefono, correo")
        .ilike("nombre", `%${clienteNombreValue}%`)
        .limit(6);
      if (error) return [];
      return data || [];
    },
    enabled: clienteNombreValue.length >= 2 && !justSelected,
    staleTime: 10 * 1000,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCliente = (cliente: {
    nombre: string;
    nit?: string | null;
    telefono: string | null;
    correo: string | null;
  }) => {
    setJustSelected(true);
    setValue("cliente_nombre", cliente.nombre, { shouldValidate: true });
    setValue("cliente_nit", cliente.nit || "");
    setValue("cliente_telefono", formatToE164(cliente.telefono));
    setValue("cliente_correo", cliente.correo || "");
    setShowSuggestions(false);
    setTimeout(() => setJustSelected(false), 500);
  };

  // ── Cargar datos al editar ──
  useEffect(() => {
    if (proyecto) {
      reset({
        nombre:           proyecto.nombre       || "",
        cliente_nombre:   proyecto.cliente_nombre  || "",
        cliente_nit:      proyecto.cliente_nit     || "",
        cliente_telefono: formatToE164(proyecto.cliente_telefono),
        cliente_correo:   proyecto.cliente_correo   || "",
        fecha_entrega:    proyecto.fecha_entrega    || "",
        precio:           proyecto.precio           || 0,
        mantenimiento:    proyecto.mantenimiento    || 0,
        estado:           proyecto.estado           || "En Progreso",
        vendedor_id:      proyecto.vendedor_id      || "",
        deducciones:      proyecto.deducciones      || [],
      });
    }
  }, [proyecto, reset]);

  // ── Submit ──
  const onSubmit = async (data: ProyectoFormValues) => {
    const totalPct = data.deducciones.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0);
    if (totalPct > 100) {
      Swal.fire({
        icon: "error",
        title: "Suma inválida",
        text: "Los porcentajes de deducción superan el 100%. Por favor corrige los montos.",
        background: "#18181b",
        color: "#fff",
      });
      return;
    }
    const res = isEditing
      ? await updateProyecto(proyecto.id, data)
      : await createProyecto(data);

    if (res.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: "#18181b",
        color: "#fff",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: isEditing ? "Proyecto Actualizado" : "Proyecto Creado",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        background: "#18181b",
        color: "#fff",
      });
      router.push("/kore/proyectos");
    }
  };

  const onInvalid = (errs: any) => console.error("❌ Validación fallida:", errs);

  const handleCancel = () => router.push("/kore/proyectos");

  // ── Render ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Volver a Proyectos
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-4 p-6 border-b border-border/50 bg-muted/5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30 shrink-0">
            <Briefcase size={20} className="text-celeste-kore" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
              {isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {isEditing ? "Modificando información" : "Registro de datos"}
            </p>
          </div>
        </div>

        {/* Form body */}
        <div className="p-6">
          <form
            id="proyecto-form"
            onSubmit={handleSubmit(onSubmit as any, onInvalid)}
          >
            <div className={cn("space-y-8", step === 1 ? "block" : "hidden")}>
            {/* ── Información General ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">
                Información General
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                  <Input
                    id="nombre"
                    {...register("nombre")}
                    placeholder="Ej. Sistema de Inventario"
                    className={errors.nombre ? "border-destructive ring-1 ring-destructive" : ""}
                  />
                  {errors.nombre && (
                    <p className="text-[10px] text-destructive">{errors.nombre.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estado">Estado</Label>
                  <SelectWrap id="estado" {...register("estado")}>
                    <option value="En Progreso">En Progreso</option>
                    <option value="En pausa">En Pausa</option>
                    <option value="Finalizados">Finalizado</option>
                  </SelectWrap>
                </div>
              </div>
            </div>

            {/* ── Información del Cliente ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">
                Información del Cliente
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Autocomplete */}
                <div className="grid gap-2 relative" ref={autocompleteRef}>
                  <Label htmlFor="cliente_nombre">Nombre Cliente</Label>
                  <Input
                    id="cliente_nombre"
                    {...register("cliente_nombre")}
                    placeholder="Juan Pérez"
                    autoComplete="off"
                    onFocus={() => {
                      if (clienteNombreValue.length >= 2) setShowSuggestions(true);
                    }}
                    onChange={(e) => {
                      register("cliente_nombre").onChange(e);
                      setJustSelected(false);
                      setShowSuggestions(e.target.value.length >= 2);
                    }}
                  />
                  <AnimatePresence>
                    {showSuggestions &&
                      clientesSuggestions &&
                      clientesSuggestions.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-2xl shadow-black/40 overflow-hidden"
                        >
                          {clientesSuggestions.map((c: any) => (
                            <li
                              key={c.id}
                              onMouseDown={() => handleSelectCliente(c)}
                              className="flex flex-col px-3 py-2.5 cursor-pointer hover:bg-celeste-kore/10 transition-colors border-b border-border/30 last:border-0 group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground group-hover:text-celeste-kore transition-colors">
                                  {c.nombre}
                                </span>
                                {c.nit && (
                                  <span className="text-[9px] font-black text-celeste-kore/70 bg-celeste-kore/10 px-1.5 py-0.5 rounded border border-celeste-kore/20">
                                    NIT: {c.nit}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {[c.telefono, c.correo].filter(Boolean).join(" · ") ||
                                  "Sin datos de contacto"}
                              </span>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                  </AnimatePresence>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cliente_nit">NIT</Label>
                  <Input
                    id="cliente_nit"
                    {...register("cliente_nit")}
                    placeholder="CF"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cliente_telefono">Teléfono</Label>
                  <Controller
                    control={control}
                    name="cliente_telefono"
                    render={({ field }) => (
                      <PhoneInput
                        id="cliente_telefono"
                        placeholder="1234 5678"
                        defaultCountry="GT"
                        value={field.value || ""}
                        onChange={field.onChange}
                        internationalIcon={() => <Globe size={18} className="text-muted-foreground" />}
                        className={cn("flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-within:ring-2 focus-within:ring-red-600/50 transition-all")}
                      />
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cliente_correo">Correo</Label>
                  <Input
                    id="cliente_correo"
                    type="email"
                    {...register("cliente_correo")}
                    placeholder="juan@correo.com"
                  />
                  {errors.cliente_correo && (
                    <p className="text-[10px] text-destructive">
                      {errors.cliente_correo.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Finanzas y Ventas (solo no-operadores) ── */}
            {!isOperator && (
              <div className="space-y-6">
                <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">
                  Finanzas y Ventas
                </h4>

                {/* Precio + Fecha + Vendedor + Desarrollador */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="precio">Precio Total (Q) *</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...register("precio", { valueAsNumber: true })}
                      className={errors.precio ? "border-destructive" : ""}
                    />
                    {errors.precio && (
                      <p className="text-[10px] text-destructive">{errors.precio.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mantenimiento">Mantenimiento (Q/mes)</Label>
                    <Input
                      id="mantenimiento"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...register("mantenimiento", { valueAsNumber: true })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fecha_entrega">Fecha de Entrega</Label>
                    <Input
                      id="fecha_entrega"
                      type="date"
                      className="min-w-0 w-full"
                      {...register("fecha_entrega")}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* ── Botones de Paginación Paso 1 ── */}
            <div className="flex justify-end pt-4">
               <button
                 type="button"
                 onClick={() => setStep(2)}
                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-celeste-kore text-black hover:opacity-90 transition-opacity text-[10px] font-black uppercase tracking-widest cursor-pointer"
               >
                 Siguiente Paso
               </button>
            </div>
            </div>

            {/* ======================= PASO 2 ======================= */}
            <div className={cn("space-y-8", step === 2 ? "block" : "hidden")}>
            
            {!isOperator && (
              <div className="space-y-6">
                {/* ── Sección Deducciones ── */}
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-3">
                      <Receipt size={14} className="text-celeste-kore shrink-0" />
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-foreground/70">
                        Deducciones
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-black px-2 py-1 rounded-lg border", totalDeduccionesPct > 100 ? "text-destructive border-destructive bg-destructive/10" : "text-emerald-500 border-emerald-500/20 bg-emerald-500/10")}>
                        Total: {totalDeduccionesPct}%
                      </span>
                    </div>
                    {fields.length > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-celeste-kore/10 text-celeste-kore border border-celeste-kore/20">
                        {fields.length}
                      </span>
                    )}
                  </div>

                  {/* Lista de deducciones agregadas */}
                  <AnimatePresence mode="popLayout">
                    {fields.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        {/* Table header */}
                        <div className="hidden sm:grid grid-cols-[auto_70px_1fr_130px_36px] gap-2 px-3 py-1">
                          {["Tipo", "%/Monto", "Descripción", "Asignado a", ""].map((h) => (
                            <span
                              key={h}
                              className="text-[9px] font-black uppercase tracking-widest text-muted-foreground"
                            >
                              {h}
                            </span>
                          ))}
                        </div>

                        {fields
    .map((field, index) => ({ ...field, originalIndex: index }))
    .sort((a, b) => {
      const order = ["IVA", "Documentación"];
      const aIdx = order.indexOf(a.tipo);
      const bIdx = order.indexOf(b.tipo);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    })
    .map((field) => {
      const idx = field.originalIndex;
                          const style =
                            TIPO_STYLE[field.tipo] || TIPO_STYLE["Vendedor"] || { pill: "bg-gray-500/10 text-gray-400 border-gray-500/25", dot: "bg-gray-400" };
                          const userName = getUserName(field.usuario_id || "");

                          return (
                            <motion.div
                              key={field.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 12 }}
                              layout
                              className="grid grid-cols-[auto_auto_1fr_36px] sm:grid-cols-[auto_70px_1fr_130px_36px] gap-2 items-center px-3 py-2.5 rounded-xl bg-muted/10 border border-border/30 group hover:border-border/60 transition-all"
                            >
                              {/* Tipo pill */}
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0",
                                  style.pill
                                )}
                              >
                                {field.tipo}
                              </span>

                              {/* Porcentaje Edit */}
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  inputMode="decimal"
                                  {...register(`deducciones.${idx}.porcentaje`, { valueAsNumber: true })}
                                  className="w-14 bg-transparent border-b border-border/50 focus:border-celeste-kore/50 outline-none text-sm font-black tabular-nums text-foreground"
                                />
                                <span className="text-[10px] font-bold text-muted-foreground">%</span>
                              </div>

                              {/* Descripción */}
                              <span className="text-xs text-muted-foreground truncate hidden sm:block">
                                {field.tipo === "IVA" ? "" : field.descripcion || <span className="italic opacity-40">—</span>}
                              </span>

                              {/* Usuario - siempre visible */}
                              <div className="flex items-center sm:col-auto">
                                {field.tipo === "IVA" ? null : userName ? (
                                  <span className="text-[10px] font-bold text-celeste-kore bg-celeste-kore/10 px-2 py-0.5 rounded-lg border border-celeste-kore/20 truncate max-w-[120px] sm:max-w-full">
                                    {userName}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/30 italic hidden sm:inline">
                                    —
                                  </span>
                                )}
                              </div>

                              {/* Eliminar */}
                              <button
                                type="button"
                                onClick={() => remove(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground/30 group-hover:text-muted-foreground transition-all cursor-pointer shrink-0"
                                title="Eliminar"
                              >
                                <Trash2 size={13} />
                              </button>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Agregar nueva deducción ── */}
                  <div className="rounded-xl border border-dashed border-border/40 bg-muted/5 p-4 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Agregar Deducción
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Tipo y Porcentaje layout 80/20 */}
                      <div className="col-span-1 md:col-span-5 grid grid-cols-[1fr_100px] gap-3">
                        <div className="grid gap-1.5">
                          <Label>Tipo</Label>
                          <SelectWrap
                            value={newDed.tipo}
                            onChange={(e) => handleTipoChange(e.target.value)}
                          >
                            {TIPOS_DEDUCCION.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </SelectWrap>
                        </div>
                        <div className="grid gap-1.5">
                          <Label>% / Monto</Label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              inputMode="decimal"
                              value={newDed.porcentaje}
                              onChange={(e) =>
                                setNewDed((p) => ({
                                  ...p,
                                  porcentaje: e.target.value === "" ? "" : Number(e.target.value),
                                }))
                              }
                              className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 pr-7 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Conditional Desc/User based on type */}
                      {newDed.tipo !== "IVA" && (
                        <>
                          <div className="col-span-1 md:col-span-3 grid gap-1.5">
                            <Label>Descripción</Label>
                            <textarea
                              placeholder="Opcional..."
                              value={newDed.descripcion}
                              onChange={(e) =>
                                setNewDed((p) => ({ ...p, descripcion: e.target.value }))
                              }
                              rows={1}
                              className="flex min-h-[40px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all resize-y"
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2 grid gap-1.5">
                            <Label>Asignar a</Label>
                            <SelectWrap
                              value={newDed.usuario_id}
                              onChange={(e) =>
                                setNewDed((p) => ({ ...p, usuario_id: e.target.value }))
                              }
                            >
                              <option value="">Sin asignar</option>
                              {users?.map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  {u.nombre || "Sin nombre"}
                                </option>
                              ))}
                            </SelectWrap>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddDed}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-celeste-kore/30 bg-celeste-kore/5 text-celeste-kore hover:bg-celeste-kore/10 active:scale-95 transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                    >
                      <Plus size={13} />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-border/50 bg-muted/5 flex flex-wrap justify-end gap-2 md:gap-3">
          {step === 2 && (
             <button
               type="button"
               onClick={() => setStep(1)}
               className="px-4 py-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"
             >
               Paso Anterior
             </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"
          >
            Cancelar
          </button>
          <button
            form="proyecto-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-celeste-kore text-black hover:opacity-90 transition-opacity text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {isEditing ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

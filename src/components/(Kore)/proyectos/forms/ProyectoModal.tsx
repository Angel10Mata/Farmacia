"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Briefcase, Save, Plus, Trash2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import {
  proyectoSchema,
  ProyectoFormValues,
  TIPOS_DEDUCCION,
  TipoDeduccion,
} from "../lib/zod";
import {
  createProyecto,
  updateProyecto,
} from "@/components/(Kore)/proyectos/lib/actions";
import { useUserContext } from "@/components/(base)/providers/UserProvider";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { KorePhoneInput } from "@/components/ui/KorePhoneInput";

interface ProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto?: any | null;
}

// ── Shared micro-components ──────────────────────────────────────────────────

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

const SelectWrap = ({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
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

const TIPO_STYLE: Record<string, { pill: string }> = {
  "Vendedor":      { pill: "bg-blue-500/10 text-blue-400 border-blue-500/25" },
  "Documentación": { pill: "bg-purple-500/10 text-purple-400 border-purple-500/25" },
  "IVA":           { pill: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
  "Mantenimiento": { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
  "Desarrollo":    { pill: "bg-celeste-kore/10 text-celeste-kore border-celeste-kore/25" },
};

const DEFAULT_PCT: Record<string, number> = {
  "Vendedor": 10,
  "Documentación": 10,
  "IVA": 12,
  "Mantenimiento": 0,
  "Desarrollo": 0,
};

const formatToE164 = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const clean = phone.trim().replace(/\s+/g, "");
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

const stripCountryCode = (phone: string | null | undefined): string => {
  if (!phone) return "";
  const clean = phone.trim().replace(/\s+/g, "");
  if (clean.startsWith("+502")) return clean.slice(4).trim();
  if (clean.startsWith("502") && clean.length === 11) return clean.slice(3).trim();
  return clean;
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProyectoModal({ isOpen, onClose, proyecto }: ProyectoModalProps) {
  const isEditing = !!proyecto;
  const { effectiveRole } = useUserContext();
  const isDeveloper = effectiveRole === "proyectos";
  const supabase = createClient();

  // ── Usuarios registrados ──
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
    if (!user) return null;
    return user.nombre || "Usuario";
  };

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
      monto_mensual_fijo: 0,
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

  // ── Sincronización de Vendedor con Deducción de Comisión ──
  const currentDeducciones = watch("deducciones") || [];
  const vendedorId = watch("vendedor_id");
  const firstComision = currentDeducciones.find((d: any) => 
    (d.tipo === "Vendedor" || d.tipo === "Comisión" || d.tipo === "vendedor") && d.usuario_id
  ) || currentDeducciones.find((d: any) => 
    d.tipo === "Vendedor" || d.tipo === "Comisión" || d.tipo === "vendedor"
  );
  const firstComisionUsuarioId = firstComision?.usuario_id || "";

  useEffect(() => {
    if (firstComisionUsuarioId !== vendedorId) {
      setValue("vendedor_id", firstComisionUsuarioId);
    }
  }, [firstComisionUsuarioId, vendedorId, setValue]);


  // Estado del formulario de "agregar deducción"
  const [newDed, setNewDed] = useState({
    tipo: "Vendedor" as TipoDeduccion,
    porcentaje: 10,
    descripcion: "",
    usuario_id: "",
  });

  const handleTipoChange = (tipo: string) => {
    setNewDed((p) => ({ ...p, tipo: tipo as TipoDeduccion, porcentaje: DEFAULT_PCT[tipo] ?? 0 }));
  };

  const handleAddDed = () => {
    append({
      tipo: newDed.tipo,
      porcentaje: Number(newDed.porcentaje) || 0,
      descripcion: newDed.descripcion || "",
      usuario_id: newDed.usuario_id || "",
    });
    setNewDed({ tipo: "Vendedor", porcentaje: DEFAULT_PCT["Vendedor"], descripcion: "", usuario_id: "" });
    setUserSearchQuery("");
  };

  // ── Autocomplete de usuarios ──
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [justSelectedUser, setJustSelectedUser] = useState(false);
  const userAutocompleteRef = useRef<HTMLDivElement>(null);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery || userSearchQuery.trim().length < 1) return [];
    return (users || []).filter((u: any) =>
      u.nombre?.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [users, userSearchQuery]);

  // ── Lista de clientes ──
  const { data: clientes } = useQuery({
    queryKey: ["pro-clientes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_clientes")
        .select("id, nombre, nit, telefono, correo")
        .order("nombre", { ascending: true });
      if (error) return [];
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Autocomplete de clientes ──
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [justSelectedClient, setJustSelectedClient] = useState(false);
  const clientAutocompleteRef = useRef<HTMLDivElement>(null);
  
  const clientSearchQuery = watch("cliente_nombre") || "";

  const filteredClientes = useMemo(() => {
    if (!clientSearchQuery || clientSearchQuery.trim().length < 2) return [];
    return (clientes || []).filter((c: any) =>
      c.nombre?.toLowerCase().includes(clientSearchQuery.toLowerCase())
    );
  }, [clientes, clientSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userAutocompleteRef.current && !userAutocompleteRef.current.contains(e.target as Node)) {
        setShowUserSuggestions(false);
      }
      if (clientAutocompleteRef.current && !clientAutocompleteRef.current.contains(e.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Cargar / resetear al abrir ──
  useEffect(() => {
    if (isOpen) {
      if (proyecto) {
        reset({
          nombre:           proyecto.nombre           || "",
          cliente_nombre:   proyecto.cliente_nombre   || "",
          cliente_nit:      proyecto.cliente_nit      || "",
          cliente_telefono: proyecto.cliente_telefono || "",
          cliente_correo:   proyecto.cliente_correo   || "",
          fecha_entrega:    proyecto.fecha_entrega     || "",
          precio:           proyecto.precio            || 0,
          monto_mensual_fijo: proyecto.monto_mensual_fijo || 0,
          estado:           proyecto.estado            || "En Progreso",
          vendedor_id:      proyecto.vendedor_id       || "",
          deducciones:      proyecto.deducciones       || [],
        });
      } else {
        reset({
          nombre: "", cliente_nombre: "", cliente_nit: "",
          cliente_telefono: "", cliente_correo: "",
          fecha_entrega: "", precio: 0, monto_mensual_fijo: 0, estado: "En Progreso",
          vendedor_id: "",
          deducciones: [],
        });
        setNewDed({ tipo: "Vendedor", porcentaje: 10, descripcion: "", usuario_id: "" });
      }
      setUserSearchQuery("");
    }
  }, [isOpen, proyecto, reset]);

  // ── Submit ──
  const onSubmit = async (data: ProyectoFormValues) => {
    // Phone number is already formatted as E164 from KorePhoneInput
    const res = isEditing
      ? await updateProyecto(proyecto.id, data)
      : await createProyecto(data);

    if (res.error) {
      Swal.fire({ icon: "error", title: "Error", text: res.error, background: "#18181b", color: "#fff" });
    } else {
      Swal.fire({
        icon: "success",
        title: isEditing ? "Proyecto Actualizado" : "Proyecto Creado",
        toast: true, position: "top-end", showConfirmButton: false,
        timer: 3000, background: "#18181b", color: "#fff",
      });
      onClose();
    }
  };

  const onInvalid = (errs: any) => console.error("❌ Validación fallida:", errs);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] bg-background md:bg-background/60 md:backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4 md:overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full h-full flex flex-col bg-card overflow-hidden
            md:h-auto md:max-w-2xl md:rounded-3xl md:shadow-none dark:md:shadow-2xl md:border md:border-celeste-kore/55 dark:md:border-border/50 md:my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/5 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center border border-red-200 dark:border-red-900/30">
                <Briefcase size={20} className="text-celeste-kore" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-foreground uppercase">
                  {isEditing ? "Editar Proyecto" : "Nuevo Proyecto"}
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {isEditing ? "Modificando información" : "Registro de datos"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar md:max-h-[70vh]">
            <form
              id="proyecto-form"
              onSubmit={handleSubmit(onSubmit as any, onInvalid)}
              className="space-y-6"
            >
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2 relative" ref={clientAutocompleteRef}>
                    <Label htmlFor="cliente_nombre">Nombre Cliente</Label>
                    <Input
                      id="cliente_nombre"
                      type="text"
                      placeholder="Escribe el nombre del cliente..."
                      autoComplete="off"
                      value={clientSearchQuery}
                      onFocus={() => {
                        if (clientSearchQuery.trim().length >= 2 && !justSelectedClient) {
                          setShowClientSuggestions(true);
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setValue("cliente_nombre", val, { shouldValidate: true });
                        setJustSelectedClient(false);
                        setShowClientSuggestions(val.trim().length >= 2);
                        
                        // Si el nombre no coincide exactamente con un cliente existente, vaciar los campos auto-completados
                        const matched = (clientes || []).find((c: any) => c.nombre?.toLowerCase() === val.trim().toLowerCase());
                        if (matched) {
                          setValue("cliente_nit", matched.nit || "");
                          setValue("cliente_telefono", matched.telefono || "");
                          setValue("cliente_correo", matched.correo || "");
                        } else {
                          setValue("cliente_nit", "");
                          setValue("cliente_telefono", "");
                          setValue("cliente_correo", "");
                        }
                      }}
                      className={errors.cliente_nombre ? "border-destructive ring-1 ring-destructive" : ""}
                    />
                    <AnimatePresence>
                      {showClientSuggestions && filteredClientes.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-2xl shadow-black/40 overflow-hidden max-h-48 overflow-y-auto"
                        >
                          {filteredClientes.map((c: any) => (
                            <li
                              key={c.id}
                              onMouseDown={() => {
                                setJustSelectedClient(true);
                                setValue("cliente_nombre", c.nombre, { shouldValidate: true });
                                setValue("cliente_nit", c.nit || "");
                                setValue("cliente_telefono", c.telefono || "");
                                setValue("cliente_correo", c.correo || "");
                                setShowClientSuggestions(false);
                              }}
                              className="px-4 py-2 text-sm hover:bg-muted cursor-pointer transition-colors text-left"
                            >
                              <p className="font-bold text-foreground">{c.nombre}</p>
                              {c.nit && (
                                <p className="text-[10px] text-muted-foreground">NIT: {c.nit}</p>
                              )}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                    {errors.cliente_nombre && (
                      <p className="text-[10px] text-destructive">{errors.cliente_nombre.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cliente_nit">NIT</Label>
                    <Input
                      id="cliente_nit"
                      {...register("cliente_nit")}
                      placeholder="CF"
                      readOnly
                      className="bg-muted/30 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cliente_telefono">Teléfono</Label>
                    <KorePhoneInput
                      id="cliente_telefono"
                      value={watch("cliente_telefono") || ""}
                      onChange={(val) => setValue("cliente_telefono", val, { shouldValidate: true })}
                      placeholder="1234 5678"
                      disabled={true}
                    />
                  </div>
                  <div className="grid gap-2 md:col-span-3">
                    <Label htmlFor="cliente_correo">Correo</Label>
                    <Input
                      id="cliente_correo"
                      type="email"
                      {...register("cliente_correo")}
                      placeholder="juan@correo.com"
                      readOnly
                      className="bg-muted/30 cursor-not-allowed text-muted-foreground"
                    />
                    {errors.cliente_correo && (
                      <p className="text-[10px] text-destructive">{errors.cliente_correo.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Finanzas y Ventas ── */}
              {!isDeveloper && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">
                    Finanzas y Ventas
                  </h4>

                  {/* Precio + Fecha + Vendedor */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="precio">Precio Total (Q)</Label>
                      <Input
                        id="precio"
                        type="number"
                        step="0.01"
                        {...register("precio", { valueAsNumber: true })}
                        className={errors.precio ? "border-destructive" : ""}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fecha_entrega">Fecha de Entrega</Label>
                      <Input id="fecha_entrega" type="date" {...register("fecha_entrega")} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vendedor_id">Vendedor</Label>
                      <SelectWrap
                        id="vendedor_id"
                        value={vendedorId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue("vendedor_id", val);
                          
                          const comisionIdx = currentDeducciones.findIndex((d: any) => d.tipo === "Vendedor");
                          if (val) {
                            if (comisionIdx >= 0) {
                              setValue(`deducciones.${comisionIdx}.usuario_id`, val);
                            } else {
                              append({
                                tipo: "Vendedor",
                                porcentaje: 10,
                                descripcion: "Comisión Vendedor",
                                usuario_id: val,
                              });
                            }
                          } else {
                            if (comisionIdx >= 0) {
                              setValue(`deducciones.${comisionIdx}.usuario_id`, "");
                            }
                          }
                        }}
                      >
                        <option value="">Seleccione un vendedor...</option>
                        {users?.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre || "Sin nombre"}
                          </option>
                        ))}
                      </SelectWrap>
                    </div>
                  </div>

                  {/* ── Deducciones ── */}
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <Receipt size={13} className="text-celeste-kore shrink-0" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground/70">
                        Deducciones
                      </span>
                      {fields.length > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-celeste-kore/10 text-celeste-kore border border-celeste-kore/20">
                          {fields.length}
                        </span>
                      )}
                    </div>

                    {/* Lista */}
                    <AnimatePresence mode="popLayout">
                      {fields
                        .map((field, index) => ({ ...field, originalIndex: index }))
                        .sort((a, b) => {
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
                        })
                        .map((field) => {
                          const idx = field.originalIndex;
                          const style = TIPO_STYLE[field.tipo] || TIPO_STYLE["Vendedor"];
                          const userName = getUserName(field.usuario_id || "");
                          return (
                            <motion.div
                              key={field.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              layout
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/10 border border-border/30 group hover:border-border/60 transition-all"
                            >
                              <span
                                className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0",
                                  style.pill
                                )}
                              >
                                {field.tipo}
                              </span>
                              <span className="text-sm font-black text-foreground tabular-nums min-w-[38px]">
                                {field.porcentaje}
                                <span className="text-[10px] font-bold text-muted-foreground ml-0.5">%</span>
                              </span>
                              {field.descripcion && (
                                <span className="text-xs text-muted-foreground flex-1 truncate">
                                  {field.descripcion}
                                </span>
                              )}
                              {userName && (
                                <span className="text-[10px] font-bold text-celeste-kore bg-celeste-kore/10 px-2 py-0.5 rounded-lg border border-celeste-kore/20 shrink-0 max-w-[110px] truncate">
                                  {userName}
                                </span>
                              )}
                              <div className="flex-1" />
                              <button
                                type="button"
                                onClick={() => remove(idx)}
                                className="opacity-0 group-hover:opacity-100 flex items-center justify-center p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-all cursor-pointer shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>

                    {/* Formulario de agregar */}
                    <div className="rounded-xl border border-dashed border-border/40 bg-muted/5 p-3 space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Agregar Deducción
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Tipo */}
                        <div className="grid gap-1.5">
                          <Label>Tipo</Label>
                          <SelectWrap
                            value={newDed.tipo}
                            onChange={(e) => handleTipoChange(e.target.value)}
                          >
                            {TIPOS_DEDUCCION.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </SelectWrap>
                        </div>
                        {/* % */}
                        <div className="grid gap-1.5">
                          <Label>% / Monto</Label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newDed.porcentaje}
                              onChange={(e) => setNewDed((p) => ({ ...p, porcentaje: Number(e.target.value) }))}
                              className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 pr-7 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all"
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                              %
                            </span>
                          </div>
                        </div>
                        {/* Descripción */}
                        <div className="grid gap-1.5">
                          <Label>Descripción</Label>
                          <input
                            type="text"
                            placeholder="Opcional..."
                            value={newDed.descripcion}
                            onChange={(e) => setNewDed((p) => ({ ...p, descripcion: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDed(); } }}
                            className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all"
                          />
                        </div>
                        {/* Usuario */}
                        <div className="grid gap-1.5 relative" ref={userAutocompleteRef}>
                          <Label>Asignar a</Label>
                          <Input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={userSearchQuery}
                            autoComplete="off"
                            onFocus={() => {
                              if (userSearchQuery.length >= 1 && !justSelectedUser) {
                                setShowUserSuggestions(true);
                              }
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserSearchQuery(val);
                              setJustSelectedUser(false);
                              setShowUserSuggestions(val.length >= 1);
                              if (val.trim() === "") {
                                setNewDed((p) => ({ ...p, usuario_id: "" }));
                              }
                            }}
                          />
                          <AnimatePresence>
                            {showUserSuggestions && filteredUsers.length > 0 && (
                              <motion.ul
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-2xl shadow-black/40 overflow-hidden max-h-48 overflow-y-auto"
                              >
                                {filteredUsers.map((u: any) => (
                                  <li
                                    key={u.id}
                                    onMouseDown={() => {
                                      setJustSelectedUser(true);
                                      setNewDed((p) => ({ ...p, usuario_id: u.id }));
                                      setUserSearchQuery(u.nombre || "");
                                      setShowUserSuggestions(false);
                                      setTimeout(() => setJustSelectedUser(false), 500);
                                    }}
                                    className="flex flex-col px-3 py-2 cursor-pointer hover:bg-celeste-kore/10 transition-colors border-b border-border/30 last:border-0 group"
                                  >
                                    <span className="text-sm font-bold text-foreground group-hover:text-celeste-kore transition-colors">
                                      {u.nombre || "Sin nombre"}
                                    </span>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDed}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-celeste-kore/30 bg-celeste-kore/5 text-celeste-kore hover:bg-celeste-kore/10 active:scale-95 transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                      >
                        <Plus size={12} />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-border/50 bg-card md:bg-muted/5 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer"
            >
              Cancelar
            </button>
            <button
              form="proyecto-form"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-celeste-kore text-black hover:opacity-90 transition-opacity text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? "Guardar" : "Crear"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X, Briefcase, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import { proyectoSchema, ProyectoFormValues } from "./lib/schemas";
import { createProyecto, updateProyecto } from "@/app/kore/proyectos/actions";
import { useUserContext } from "@/components/(base)/providers/UserProvider";

interface ProyectoModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto?: any | null; // The existing project if editing
}

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label {...props} className={cn("text-xs font-semibold leading-none text-foreground/70 uppercase tracking-wider", className)} />
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={cn("flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all outline-none disabled:opacity-50 disabled:bg-muted/30 disabled:cursor-not-allowed", className)} />
);

const Select = ({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select {...props} className={cn("flex h-10 w-full appearance-none rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-red-600/50 transition-all disabled:opacity-50 disabled:bg-muted/30 disabled:cursor-not-allowed", className)} />
    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

export default function ProyectoModal({ isOpen, onClose, proyecto }: ProyectoModalProps) {
  const isEditing = !!proyecto;
  const { effectiveRole } = useUserContext();
  const isOperator = effectiveRole === "proyectos";

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProyectoFormValues>({
    resolver: zodResolver(proyectoSchema) as any,
    defaultValues: {
      nombre: "",
      cliente_nombre: "",
      cliente_telefono: "",
      cliente_correo: "",
      vendedor_nombre: "",
      fecha_entrega: "",
      precio: 0,
      aplica_vendedor: true,
      porcentaje_vendedor: 10,
      aplica_iva: true,
      porcentaje_iva: 12,
      aplica_doc: true,
      porcentaje_doc: 10,
      estado: "En Progreso",
      mantenimiento_fecha: "",
      mantenimiento_categoria: "",
      aplica_mantenimiento: false,
      monto_mantenimiento: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (proyecto) {
        reset({
          ...proyecto,
          fecha_entrega: proyecto.fecha_entrega || "",
          mantenimiento_fecha: proyecto.mantenimiento_fecha || "",
        });
      } else {
        reset({
          nombre: "",
          cliente_nombre: "",
          cliente_telefono: "",
          cliente_correo: "",
          vendedor_nombre: "",
          fecha_entrega: "",
          precio: 0,
          aplica_vendedor: true,
          porcentaje_vendedor: 10,
          aplica_iva: true,
          porcentaje_iva: 12,
          aplica_doc: true,
          porcentaje_doc: 10,
          estado: "En Progreso",
          mantenimiento_fecha: "",
          mantenimiento_categoria: "",
          aplica_mantenimiento: false,
          monto_mantenimiento: 0,
        });
      }
    }
  }, [isOpen, proyecto, reset]);


  const onSubmit = async (data: ProyectoFormValues) => {
    let res;
    if (isEditing) {
      res = await updateProyecto(proyecto.id, data);
    } else {
      res = await createProyecto(data);
    }

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
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl relative my-auto bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
        >
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

          <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <form id="proyecto-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
              {/* Información General */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">Información General</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                    <Input id="nombre" {...register("nombre")} placeholder="Ej. Sistema de Inventario" className={errors.nombre ? "border-destructive ring-1 ring-destructive" : ""} />
                    {errors.nombre && <p className="text-[10px] text-destructive">{errors.nombre.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select id="estado" {...register("estado")}>
                      <option value="En Progreso">En Progreso</option>
                      <option value="En pausa">En Pausa</option>
                      <option value="Finalizados">Finalizado</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">Información del Cliente</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cliente_nombre">Nombre Cliente</Label>
                    <Input id="cliente_nombre" {...register("cliente_nombre")} placeholder="Juan Pérez" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cliente_telefono">Teléfono</Label>
                    <Input id="cliente_telefono" {...register("cliente_telefono")} placeholder="12345678" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cliente_correo">Correo</Label>
                    <Input id="cliente_correo" type="email" {...register("cliente_correo")} placeholder="juan@correo.com" />
                    {errors.cliente_correo && <p className="text-[10px] text-destructive">{errors.cliente_correo.message}</p>}
                  </div>
                </div>
              </div>

              {/* Finanzas - Hidden for operators */}
              {!isOperator && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-celeste-kore uppercase tracking-widest border-b border-border/50 pb-2">Finanzas y Ventas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="precio">Precio Total (Q)</Label>
                      <Input id="precio" type="number" step="0.01" {...register("precio", { valueAsNumber: true })} className={errors.precio ? "border-destructive" : ""} disabled={isOperator} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="vendedor_nombre">Vendedor</Label>
                      <Input id="vendedor_nombre" {...register("vendedor_nombre")} placeholder="Nombre Vendedor" disabled={isOperator} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fecha_entrega">Fecha de Entrega</Label>
                      <Input id="fecha_entrega" type="date" {...register("fecha_entrega")} disabled={isOperator} />
                    </div>
                  </div>

                  {/* Configuraciones de Porcentajes */}
                  <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/30", isOperator && "opacity-60 pointer-events-none")}>
                    <div className={`flex flex-col gap-2 transition-opacity ${!watch('aplica_vendedor') ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="aplica_vendedor" className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" id="aplica_vendedor" {...register("aplica_vendedor")} className="rounded bg-background border-border text-celeste-kore focus:ring-red-600" disabled={isOperator} />
                          <span className={!watch('aplica_vendedor') ? 'line-through' : ''}>Comisión Vendedor</span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.1" {...register("porcentaje_vendedor", { valueAsNumber: true })} className={`w-20 text-center ${!watch('aplica_vendedor') ? 'pointer-events-none opacity-50' : ''}`} disabled={isOperator} />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-2 transition-opacity ${!watch('aplica_iva') ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="aplica_iva" className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" id="aplica_iva" {...register("aplica_iva")} className="rounded bg-background border-border text-celeste-kore focus:ring-red-600" disabled={isOperator} />
                          <span className={!watch('aplica_iva') ? 'line-through' : ''}>Aplica IVA</span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.1" {...register("porcentaje_iva", { valueAsNumber: true })} className={`w-20 text-center ${!watch('aplica_iva') ? 'pointer-events-none opacity-50' : ''}`} disabled={isOperator} />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-2 transition-opacity ${!watch('aplica_doc') ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="aplica_doc" className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" id="aplica_doc" {...register("aplica_doc")} className="rounded bg-background border-border text-celeste-kore focus:ring-red-600" disabled={isOperator} />
                          <span className={!watch('aplica_doc') ? 'line-through' : ''}>Fondo Documentación</span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.1" {...register("porcentaje_doc", { valueAsNumber: true })} className={`w-20 text-center ${!watch('aplica_doc') ? 'pointer-events-none opacity-50' : ''}`} disabled={isOperator} />
                        <span className="text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-2 transition-opacity ${!watch('aplica_mantenimiento') ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="aplica_mantenimiento" className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" id="aplica_mantenimiento" {...register("aplica_mantenimiento")} className="rounded bg-background border-border text-celeste-kore focus:ring-red-600" disabled={isOperator} />
                          <span className={!watch('aplica_mantenimiento') ? 'line-through' : ''}>Cuota Mantenimiento</span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" step="0.01" {...register("monto_mantenimiento", { valueAsNumber: true })} className={`w-24 text-center ${!watch('aplica_mantenimiento') ? 'pointer-events-none opacity-50' : ''}`} disabled={isOperator} />
                        <span className="text-xs font-bold text-muted-foreground">Q (Mes)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="p-6 border-t border-border/50 bg-muted/5 flex justify-end gap-3 sticky bottom-0">
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-celeste-kore text-black hover:bg-celeste-kore transition-colors text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50"
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

import { z } from "zod";

export const TIPOS_DEDUCCION = [
  "Kore",
  "Documentación",
  "Vendedor",
  "Desarrollador",
  "IVA",
] as const;

export type TipoDeduccion = (typeof TIPOS_DEDUCCION)[number];

export const deduccionItemSchema = z.object({
  tipo: z.string().min(1),
  porcentaje: z.coerce.number().min(0).default(0),
  descripcion: z.string().optional().or(z.literal("")),
  usuario_id: z.string().optional().or(z.literal("")),
});

export type DeduccionItem = z.infer<typeof deduccionItemSchema>;

export const proyectoSchema = z.object({
  nombre: z.string().min(1, "El nombre del proyecto es requerido"),
  // Cliente
  cliente_nombre: z.string().optional(),
  cliente_nit: z.string().optional(),
  cliente_telefono: z.string().optional(),
  cliente_correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  // Proyecto
  fecha_entrega: z.string().optional().or(z.literal("")),
  precio: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || (typeof val === "number" && Number.isNaN(val)) ? 0 : val),
    z.coerce.number().min(0, "El precio no puede ser negativo")
  ),
  mantenimiento_activo: z.boolean().default(false),
  estado: z.string().default("En Progreso"),
  // Vendedor (usuario registrado que lleva la comisión principal) - Opcional, pero lo mantenemos para backward compat si se necesita o lo usamos de primer vendedor
  vendedor_id: z.string().optional().or(z.literal("")).default(""),
  // Deducciones: lista dinámica
  deducciones: z.array(deduccionItemSchema).default([]),
});

export type ProyectoFormValues = z.infer<typeof proyectoSchema>;

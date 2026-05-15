import { z } from "zod";

export const proyectoSchema = z.object({
  nombre: z.string().min(1, "El nombre del proyecto es requerido"),
  cliente_nombre: z.string().optional(),
  cliente_telefono: z.string().optional(),
  cliente_correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  vendedor_nombre: z.string().optional(),
  fecha_entrega: z.string().optional().or(z.literal("")),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  aplica_vendedor: z.coerce.boolean().default(true),
  porcentaje_vendedor: z.coerce.number().min(0).max(100).default(10),
  aplica_iva: z.coerce.boolean().default(true),
  porcentaje_iva: z.coerce.number().min(0).max(100).default(12),
  aplica_doc: z.coerce.boolean().default(true),
  porcentaje_doc: z.coerce.number().min(0).max(100).default(10),
  estado: z.string().default("En Progreso"),
  mantenimiento_fecha: z.string().optional().or(z.literal("")),
  mantenimiento_categoria: z.string().optional(),
  aplica_mantenimiento: z.coerce.boolean().default(false),
  monto_mantenimiento: z.coerce.number().min(0).default(0),
});

export type ProyectoFormValues = z.infer<typeof proyectoSchema>;

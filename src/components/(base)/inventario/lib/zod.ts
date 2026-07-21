import { z } from "zod";

export const productSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  codigo: z.string().optional(),
  descripcion: z.string().optional(),
  precio_base: z.number().nonnegative("El precio debe ser un número positivo"),
  stock_actual: z.number().int().nonnegative("El stock debe ser un número entero no negativo"),
  stock_minimo: z.number().int().nonnegative("El stock mínimo debe ser un número entero no negativo"),
  activo: z.boolean().default(true),
  imagen_url: z.string().nullable().optional(),
  imagen_url_2: z.string().nullable().optional(),
  imagen_url_3: z.string().nullable().optional(),
  proveedor_id: z.string().nullable().optional(),
  ubicacion: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

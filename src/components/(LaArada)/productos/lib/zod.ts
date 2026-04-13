import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  codigo: z.string().min(1, "El código es requerido"),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  medida: z.string().min(1, "La medida es requerida"),
  precio_base: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  stock_actual: z.coerce.number().default(0),
  stock_minimo: z.coerce
    .number()
    .min(0, "El mínimo no puede ser negativo")
    .default(10),
  activo: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof ProductSchema>;

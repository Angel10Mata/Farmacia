import { z } from "zod";

export const ProveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").trim(),
  descripcion: z.string().nullable().optional().or(z.literal("")),
  nit: z.string().nullable().optional().or(z.literal("")),
  telefono: z.string().nullable().optional().or(z.literal("")),
  correo: z.string().email("Correo inválido").nullable().optional().or(z.literal("")),
});

export type ProveedorInput = z.infer<typeof ProveedorSchema>;

export interface Proveedor {
  id: string;
  nombre: string;
  descripcion?: string | null;
  nit?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

export const ItemCompraSchema = z.object({
  producto_id: z.string().min(1),
  cantidad: z.number().positive(),
  precio_costo: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

export const CompraSchema = z.object({
  proveedor_id: z.string().min(1, "Debe seleccionar un proveedor"),
  total: z.number().nonnegative(),
  estado_pago: z.string().min(1),
  observaciones: z.string().nullable().optional(),
  items: z.array(ItemCompraSchema).min(1, "La compra debe contener al menos un producto"),
});

export type ItemCompraInput = z.infer<typeof ItemCompraSchema>;
export type CompraInput = z.infer<typeof CompraSchema>;

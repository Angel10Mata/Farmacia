import { z } from "zod";

export const ItemVentaSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().positive(),
  precio_aplicado: z.number().min(0),
  subtotal: z.number().min(0),
});

export const CrearVentaSchema = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  tipo_venta: z.enum(["Efectivo", "Tarjeta", "Crédito", "Contado", "Transferencia"]),
  total: z.number().min(0),
  observaciones: z.string().nullable().optional(),
  items: z.array(ItemVentaSchema).min(1, "La venta debe contener al menos un producto"),
});

export type ItemVentaInput = z.infer<typeof ItemVentaSchema>;
export type CrearVentaInput = z.infer<typeof CrearVentaSchema>;

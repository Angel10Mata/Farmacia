import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(3, "El nombre es requerido"),
  nit: z.string().min(1, "El NIT es requerido"),
  direccion: z.string().min(5, "La dirección es requerida"),
  telefono: z.string().min(8, "El teléfono es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;

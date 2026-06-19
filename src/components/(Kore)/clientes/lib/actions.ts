"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface DBProyecto {
  id: string;
  nombre: string;
  estado: string;
  valor: number;
  fecha_entrega?: string | null;
}

interface DBCliente {
  id: string;
  nombre: string;
  nit?: string | null;
  telefono?: string | null;
  correo?: string | null;
  departamento?: string | null;
  municipio?: string | null;
  created_at: string;
  proyectos?: DBProyecto[];
}

interface ClienteProyecto {
  id: string;
  nombre: string;
  estado: string;
  precio: number;
  fecha?: string | null;
}

interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  correo: string;
  departamento: string;
  municipio: string;
  created_at: string;
  proyectosCount: number;
  totalPagado: number;
  proyectosList: ClienteProyecto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// READ — Fetches all clients from pro_clientes with their associated projects
// ─────────────────────────────────────────────────────────────────────────────
export async function getClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_clientes")
    .select(`
      *,
      proyectos(id, nombre, estado, valor, fecha_entrega)
    `)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching clientes:", error);
    return [];
  }

  return ((data as unknown as DBCliente[]) || []).map((c: DBCliente) => {
    const proyectosList = c.proyectos || [];
    const totalPagado = proyectosList.reduce(
      (acc: number, p: DBProyecto) => acc + (Number(p.valor) || 0),
      0
    );
    return {
      id: c.id,
      nombre: c.nombre,
      nit: c.nit || "",
      telefono: c.telefono || "",
      correo: c.correo || "",
      departamento: c.departamento || "",
      municipio: c.municipio || "",
      created_at: c.created_at,
      proyectosCount: proyectosList.length,
      totalPagado,
      proyectosList: proyectosList
        .map((p: DBProyecto) => ({
          id: p.id,
          nombre: p.nombre,
          estado: p.estado,
          precio: Number(p.valor) || 0,
          fecha: p.fecha_entrega,
        }))
        .sort((a: ClienteProyecto, b: ClienteProyecto) => b.precio - a.precio),
    };
  }).sort((a: Cliente, b: Cliente) => b.totalPagado - a.totalPagado);
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — Register a new client in pro_clientes
// ─────────────────────────────────────────────────────────────────────────────
export async function createCliente(data: {
  nombre: string;
  nit?: string;
  telefono?: string;
  correo?: string;
  departamento?: string;
  municipio?: string;
}) {
  const supabase = await createClient();

  const { data: newCliente, error } = await supabase
    .from("pro_clientes")
    .insert([
      {
        nombre: data.nombre.trim(),
        nit: data.nit?.trim() || null,
        telefono: data.telefono?.trim() || null,
        correo: data.correo?.trim() || null,
        departamento: data.departamento?.trim() || null,
        municipio: data.municipio?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating cliente:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/clientes");
  revalidatePath("/kore/proyectos");
  return { success: true, cliente: newCliente };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — Modify existing client details in pro_clientes
// ─────────────────────────────────────────────────────────────────────────────
export async function updateCliente(
  id: string,
  data: {
    nombre: string;
    nit?: string;
    telefono?: string;
    correo?: string;
    departamento?: string;
    municipio?: string;
  }
) {
  const supabase = await createClient();

  const { data: updatedCliente, error } = await supabase
    .from("pro_clientes")
    .update({
      nombre: data.nombre.trim(),
      nit: data.nit?.trim() || null,
      telefono: data.telefono?.trim() || null,
      correo: data.correo?.trim() || null,
      departamento: data.departamento?.trim() || null,
      municipio: data.municipio?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating cliente:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/clientes");
  revalidatePath("/kore/proyectos");
  return { success: true, cliente: updatedCliente };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — Remove a client record from pro_clientes
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteCliente(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("pro_clientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cliente:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/clientes");
  revalidatePath("/kore/proyectos");
  return { success: true };
}

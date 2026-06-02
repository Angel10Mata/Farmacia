"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface DBProyecto {
  id: string;
  nombre: string;
  estado: string;
  precio: number;
  fecha_entrega?: string | null;
}

interface DBCliente {
  id: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
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
  telefono: string;
  correo: string;
  created_at: string;
  proyectosCount: number;
  totalPagado: number;
  proyectosList: ClienteProyecto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// READ - Fetches all clients and their associated projects
// ─────────────────────────────────────────────────────────────────────────────
export async function getClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .select(`
      *,
      proyectos(*)
    `)
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error fetching clientes:", error);
    return [];
  }

  // Calculate stats in JS to keep it simple and reactive
  return ((data as unknown as DBCliente[]) || []).map((c: DBCliente) => {
    const proyectosList = c.proyectos || [];
    const totalPagado = proyectosList.reduce((acc: number, p: DBProyecto) => acc + (Number(p.precio) || 0), 0);
    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono || "",
      correo: c.correo || "",
      created_at: c.created_at,
      proyectosCount: proyectosList.length,
      totalPagado,
      proyectosList: proyectosList.map((p: DBProyecto) => ({
        id: p.id,
        nombre: p.nombre,
        estado: p.estado,
        precio: Number(p.precio) || 0,
        fecha: p.fecha_entrega,
      })).sort((a: ClienteProyecto, b: ClienteProyecto) => b.precio - a.precio)
    };
  }).sort((a: Cliente, b: Cliente) => b.totalPagado - a.totalPagado);
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE - Register a new client
// ─────────────────────────────────────────────────────────────────────────────
export async function createCliente(data: { nombre: string; telefono?: string; correo?: string }) {
  const supabase = await createClient();

  const { data: newCliente, error } = await supabase
    .from("clientes")
    .insert([
      {
        nombre: data.nombre.trim(),
        telefono: data.telefono?.trim() || null,
        correo: data.correo?.trim() || null,
      }
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
// UPDATE - Modify existing client details
// ─────────────────────────────────────────────────────────────────────────────
export async function updateCliente(id: string, data: { nombre: string; telefono?: string; correo?: string }) {
  const supabase = await createClient();

  const { data: updatedCliente, error } = await supabase
    .from("clientes")
    .update({
      nombre: data.nombre.trim(),
      telefono: data.telefono?.trim() || null,
      correo: data.correo?.trim() || null,
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
// DELETE - Remove a client record
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteCliente(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
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

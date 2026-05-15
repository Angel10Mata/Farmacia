"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ProyectoFormValues } from "@/components/(Kore)/proyectos/lib/schemas";

export async function getProyectos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching proyectos:", error);
    return [];
  }
  return data;
}

export async function createProyecto(data: ProyectoFormValues) {
  const supabase = await createClient();
  
  // Transform empty string to null for date fields
  const payload = {
    ...data,
    fecha_entrega: data.fecha_entrega || null,
    mantenimiento_fecha: data.mantenimiento_fecha || null,
  };
  
  const { error } = await supabase.from("proyectos").insert(payload);

  if (error) {
    console.error("Error creating proyecto:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

export async function updateProyecto(id: string, data: Partial<ProyectoFormValues>) {
  const supabase = await createClient();
  
  // Only send editable fields — exclude generated/read-only columns
  const payload = {
    nombre: data.nombre,
    cliente_nombre: data.cliente_nombre,
    cliente_telefono: data.cliente_telefono,
    cliente_correo: data.cliente_correo,
    vendedor_nombre: data.vendedor_nombre,
    fecha_entrega: data.fecha_entrega || null,
    precio: data.precio,
    aplica_vendedor: data.aplica_vendedor,
    porcentaje_vendedor: data.porcentaje_vendedor,
    aplica_iva: data.aplica_iva,
    porcentaje_iva: data.porcentaje_iva,
    aplica_doc: data.aplica_doc,
    porcentaje_doc: data.porcentaje_doc,
    estado: data.estado,
    mantenimiento_fecha: data.mantenimiento_fecha || null,
    mantenimiento_categoria: data.mantenimiento_categoria,
    aplica_mantenimiento: data.aplica_mantenimiento,
    monto_mantenimiento: data.monto_mantenimiento,
  };
  
  const { data: result, error } = await supabase.from("proyectos").update(payload).eq("id", id).select();

  if (error) {
    console.error("Error updating proyecto:", error);
    return { error: error.message };
  }

  if (!result || result.length === 0) {
    return { error: "No se actualizó ninguna fila. Verifica permisos RLS." };
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

export async function deleteProyecto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("proyectos").delete().eq("id", id);

  if (error) {
    console.error("Error deleting proyecto:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

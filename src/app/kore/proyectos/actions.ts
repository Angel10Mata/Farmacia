"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ProyectoFormValues } from "@/components/(Kore)/proyectos/lib/schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/** Convierte el valor de fecha_entrega / mant_fecha del formulario a Date o null */
function toDateOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value; // Supabase acepta strings en formato YYYY-MM-DD directamente
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getProyectos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyectos")
    .select(`
      *,
      impuestos_comisiones(*),
      clientes(*),
      vendedor:vendedor_id(nombre),
      mantenimientos(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching proyectos:", error);
    return [];
  }

  // Aplanar la estructura para mantener la compatibilidad con el frontend
  return (data || []).map((p: any) => {
    const finanzas = Array.isArray(p.impuestos_comisiones)
      ? (p.impuestos_comisiones[0] || {})
      : (p.impuestos_comisiones || {});
    const cliente = p.clientes || {};
    const vendedor = p.vendedor || {};
    const mant = Array.isArray(p.mantenimientos)
      ? (p.mantenimientos[0] || {})
      : (p.mantenimientos || {});

    return {
      id: p.id,
      nombre: p.nombre,
      cliente_id: p.cliente_id,
      cliente_nombre: cliente.nombre || "",
      cliente_telefono: cliente.telefono || "",
      cliente_correo: cliente.correo || "",
      vendedor_id: p.vendedor_id,
      vendedor_nombre: vendedor.nombre || "",
      fecha_entrega: p.fecha_entrega,
      precio: p.precio,
      resto_desarrollo: p.resto_desarrollo,
      activo: p.activo,
      estado: p.estado,
      otros_campos: p.otros_campos,
      created_at: p.created_at,
      created_by: p.created_by,
      // Comisiones / impuestos
      aplica_vendedor: finanzas.aplica_vendedor ?? false,
      porcentaje_vendedor: Number(finanzas.porcentaje_vendedor ?? 0),
      aplica_iva: finanzas.aplica_iva ?? false,
      porcentaje_iva: Number(finanzas.porcentaje_iva ?? 0),
      aplica_doc: finanzas.aplica_doc ?? false,
      porcentaje_doc: Number(finanzas.porcentaje_doc ?? 0),
      // Mantenimiento
      aplica_mantenimiento: mant.aplica_mantenimiento ?? false,
      monto_mantenimiento: Number(mant.monto_mantenimiento ?? 0),
      mantenimiento_fecha: mant.mantenimiento_fecha ?? null,
      mantenimiento_categoria: mant.mantenimiento_categoria ?? null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — llama la RPC atómica (Puntos B + C)
// ─────────────────────────────────────────────────────────────────────────────

export async function createProyecto(data: ProyectoFormValues) {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("upsert_proyecto", {
    // proyecto_id = null → modo CREATE
    p_proyecto_id: null,

    // Proyecto
    p_nombre: data.nombre,
    p_fecha_entrega: toDateOrNull(data.fecha_entrega),
    p_precio: Number(data.precio) || 0,
    p_estado: data.estado || "En Progreso",

    // Cliente
    p_cliente_nombre: data.cliente_nombre || null,
    p_cliente_telefono: data.cliente_telefono || null,
    p_cliente_correo: data.cliente_correo || null,

    // Vendedor
    p_vendedor_nombre: data.vendedor_nombre || null,

    // Impuestos / comisiones
    p_aplica_vendedor: data.aplica_vendedor ?? false,
    p_porcentaje_vendedor: Number(data.porcentaje_vendedor) || 10,
    p_aplica_iva: data.aplica_iva ?? false,
    p_porcentaje_iva: Number(data.porcentaje_iva) || 12,
    p_aplica_doc: data.aplica_doc ?? false,
    p_porcentaje_doc: Number(data.porcentaje_doc) || 10,

    // Mantenimiento
    p_aplica_mantenimiento: data.aplica_mantenimiento ?? false,
    p_monto_mantenimiento: Number(data.monto_mantenimiento) || 0,
    p_mant_fecha: toDateOrNull(data.mantenimiento_fecha),
    p_mant_categoria: data.mantenimiento_categoria || null,
  });

  if (error) {
    console.error("RPC upsert_proyecto (create) error:", error);
    return { error: error.message };
  }

  // La RPC devuelve un JSON: { success: bool, error?: string, proyecto_id?: uuid }
  if (!result?.success) {
    console.error("RPC upsert_proyecto (create) failure:", result);
    return { error: result?.error || "Error desconocido al crear el proyecto" };
  }

  revalidatePath("/kore/proyectos");
  return { success: true, proyecto_id: result.proyecto_id };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — llama la misma RPC pasando el proyecto_id (Puntos B + C)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProyecto(id: string, data: Partial<ProyectoFormValues>) {
  const supabase = await createClient();

  const { data: result, error } = await supabase.rpc("upsert_proyecto", {
    // proyecto_id presente → modo UPDATE
    p_proyecto_id: id,

    // Proyecto (se pasa undefined → la función usará COALESCE y conservará el valor actual)
    p_nombre: data.nombre ?? null,
    p_fecha_entrega: toDateOrNull(data.fecha_entrega),
    p_precio: data.precio !== undefined ? Number(data.precio) : null,
    p_estado: data.estado ?? null,

    // Cliente
    p_cliente_nombre: data.cliente_nombre ?? null,
    p_cliente_telefono: data.cliente_telefono ?? null,
    p_cliente_correo: data.cliente_correo ?? null,

    // Vendedor
    p_vendedor_nombre: data.vendedor_nombre ?? null,

    // Impuestos / comisiones
    p_aplica_vendedor: data.aplica_vendedor ?? null,
    p_porcentaje_vendedor: data.porcentaje_vendedor !== undefined ? Number(data.porcentaje_vendedor) : null,
    p_aplica_iva: data.aplica_iva ?? null,
    p_porcentaje_iva: data.porcentaje_iva !== undefined ? Number(data.porcentaje_iva) : null,
    p_aplica_doc: data.aplica_doc ?? null,
    p_porcentaje_doc: data.porcentaje_doc !== undefined ? Number(data.porcentaje_doc) : null,

    // Mantenimiento
    p_aplica_mantenimiento: data.aplica_mantenimiento ?? null,
    p_monto_mantenimiento: data.monto_mantenimiento !== undefined ? Number(data.monto_mantenimiento) : null,
    p_mant_fecha: toDateOrNull(data.mantenimiento_fecha),
    p_mant_categoria: data.mantenimiento_categoria ?? null,
  });

  console.log("🔍 RPC upsert_proyecto (update) raw response:", JSON.stringify({ error, result }, null, 2));

  if (error) {
    console.error("RPC upsert_proyecto (update) error:", error);
    return { error: error.message };
  }

  if (!result?.success) {
    console.error("RPC upsert_proyecto (update) failure:", result);
    return { error: result?.error || "Error desconocido al actualizar el proyecto" };
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — beneficia del CASCADE definido en los constraints (Punto D)
// Solo necesita borrar el proyecto; las tablas hijas se eliminan solas.
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteProyecto(id: string) {
  const supabase = await createClient();

  // Con ON DELETE CASCADE en BD, este único delete es suficiente.
  // Si el cascade aún no está activo, las líneas comentadas hacen
  // la eliminación manual como respaldo.
  //
  // await supabase.from("impuestos_comisiones").delete().eq("proyecto_id", id);
  // await supabase.from("mantenimientos").delete().eq("proyecto_id", id);

  const { error } = await supabase
    .from("proyectos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting proyecto:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE otros_campos (QR credentials, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProyectoOtrosCampos(id: string, otrosCampos: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("proyectos")
    .update({ otros_campos: otrosCampos })
    .eq("id", id);

  if (error) {
    console.error("Error updating otros_campos:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

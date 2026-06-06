"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ProyectoFormValues, DeduccionItem } from "@/components/(Kore)/proyectos/lib/schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

function toDateOrNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}

/**
 * Convierte el array de deducciones del formulario a filas para pro_deducciones.
 */
function buildDeducciones(deducciones: DeduccionItem[], proyectoId: string) {
  return deducciones.map((d) => ({
    proyecto_id: proyectoId,
    tipo: d.tipo,
    porcentaje: Number(d.porcentaje) || 0,
    descripcion: d.descripcion || null,
    usuario_id: d.usuario_id || null,
  }));
}

/**
 * Encuentra un cliente en pro_clientes por nombre (case-insensitive).
 * Si no existe, lo crea. Devuelve el ID del cliente o null.
 */
async function findOrCreateCliente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: Partial<ProyectoFormValues>
): Promise<string | null> {
  if (!data.cliente_nombre?.trim()) return null;

  const { data: existing } = await supabase
    .from("pro_clientes")
    .select("id")
    .ilike("nombre", data.cliente_nombre.trim())
    .maybeSingle();

  if (existing?.id) {
    // Actualizar datos de contacto si se proporcionaron
    const patch: Record<string, string> = {};
    if (data.cliente_telefono) patch.telefono = data.cliente_telefono.trim();
    if (data.cliente_correo)   patch.correo   = data.cliente_correo.trim();
    if (data.cliente_nit)      patch.nit      = data.cliente_nit.trim();
    if (Object.keys(patch).length > 0) {
      await supabase.from("pro_clientes").update(patch).eq("id", existing.id);
    }
    return existing.id;
  }

  const { data: newCliente, error } = await supabase
    .from("pro_clientes")
    .insert([{
      nombre:   data.cliente_nombre.trim(),
      nit:      data.cliente_nit?.trim()      || null,
      telefono: data.cliente_telefono?.trim() || null,
      correo:   data.cliente_correo?.trim()   || null,
    }])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating cliente on project save:", error);
    return null;
  }
  return newCliente?.id ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────────────────────

export async function getProyectos() {
  const supabase = await createClient();

  const [{ data, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("proyectos")
      .select(`*, pro_clientes(*), pro_deducciones(*)`)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nombre"),
  ]);

  if (error) {
    console.error("Error fetching proyectos:", error);
    return [];
  }

  // Mapa rápido id → nombre para resolver vendedor
  const profilesMap = new Map(
    (profiles || []).map((p: any) => [p.id, p.nombre || "Usuario"])
  );

  return (data || []).map((p: any) => {
    const cliente     = p.pro_clientes || {};
    const rawDeds: any[] = p.pro_deducciones || [];

    // Deducciones en formato de formulario
    const deducciones: DeduccionItem[] = rawDeds.map((d: any) => ({
      tipo:       d.tipo,
      porcentaje: Number(d.porcentaje) || 0,
      descripcion: d.descripcion || "",
      usuario_id:  d.usuario_id  || "",
    }));

    // ── Legacy aggregates para el dashboard (compatibilidad sin tocar DashboardProyectos) ──
    const comisionDeds = rawDeds.filter((d: any) =>
      d.tipo === "Comisión" || d.tipo === "vendedor"
    );
    const ivaDeds = rawDeds.filter((d: any) =>
      d.tipo === "IVA" || d.tipo === "iva"
    );
    const docDeds = rawDeds.filter((d: any) =>
      d.tipo === "Documentación" || d.tipo === "doc"
    );
    const mantDeds = rawDeds.filter((d: any) =>
      d.tipo === "Mantenimiento" || d.tipo === "mantenimiento"
    );
    const desarrolloDeds = rawDeds.filter((d: any) =>
      d.tipo === "Desarrollo" || d.tipo === "desarrollo"
    );

    const sumPct = (arr: any[]) =>
      arr.reduce((acc, d) => acc + (Number(d.porcentaje) || 0), 0);

    return {
      id:           p.id,
      nombre:       p.nombre,
      valor:        Number(p.valor) || 0,
      precio:       Number(p.valor) || 0, // alias legacy
      fecha_entrega: p.fecha_entrega,
      estado:       p.estado,
      activo:       p.activo,
      created_at:   p.created_at,
      created_by:   p.created_by,
      // Cliente
      cliente_id:       p.cliente_id,
      cliente_nombre:   cliente.nombre   || "",
      cliente_nit:      cliente.nit      || "",
      cliente_telefono: cliente.telefono || "",
      cliente_correo:   cliente.correo   || "",
      // Vendedor: usa usuario_id de la primera comisión para resolver el nombre real
      vendedor_id:     comisionDeds[0]?.usuario_id || "",
      vendedor_nombre: comisionDeds[0]?.usuario_id
        ? (profilesMap.get(comisionDeds[0].usuario_id) || comisionDeds[0]?.descripcion || "")
        : (comisionDeds[0]?.descripcion || ""),
      // Desarrollador: usa usuario_id de la primera deducción de desarrollo para resolver el nombre real
      desarrollador_id:     desarrolloDeds[0]?.usuario_id || "",
      desarrollador_nombre: desarrolloDeds[0]?.usuario_id
        ? (profilesMap.get(desarrolloDeds[0].usuario_id) || desarrolloDeds[0]?.descripcion || "")
        : (desarrolloDeds[0]?.descripcion || ""),
      // Deducciones en formato array para el formulario de edición
      deducciones,
      // ── Legacy fields para DashboardProyectos ──
      aplica_vendedor:    comisionDeds.length > 0,
      porcentaje_vendedor: sumPct(comisionDeds),
      aplica_iva:         ivaDeds.length > 0,
      porcentaje_iva:     sumPct(ivaDeds),
      aplica_doc:         docDeds.length > 0,
      porcentaje_doc:     sumPct(docDeds),
      aplica_mantenimiento: mantDeds.length > 0,
      monto_mantenimiento:  sumPct(mantDeds),
      aplica_desarrollo:    desarrolloDeds.length > 0,
      porcentaje_desarrollo: sumPct(desarrolloDeds),
      mantenimiento_categoria: mantDeds[0]?.descripcion ?? null,
      mantenimiento_fecha: null,
      resto_desarrollo:    null,
      otros_campos:        null,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

export async function createProyecto(data: ProyectoFormValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const clienteId = await findOrCreateCliente(supabase, data);

  const { data: proyecto, error: proyectoError } = await supabase
    .from("proyectos")
    .insert([{
      nombre:        data.nombre,
      valor:         Number(data.precio) || 0,
      fecha_entrega: toDateOrNull(data.fecha_entrega),
      estado:        data.estado || "En Progreso",
      cliente_id:    clienteId,
      created_by:    user?.id ?? null,
      activo:        true,
    }])
    .select("id")
    .single();

  if (proyectoError || !proyecto) {
    console.error("Error creating proyecto:", proyectoError);
    return { error: proyectoError?.message || "Error desconocido al crear el proyecto" };
  }

  const deducciones = buildDeducciones(data.deducciones || [], proyecto.id);
  if (deducciones.length > 0) {
    const { error: dedError } = await supabase
      .from("pro_deducciones")
      .insert(deducciones);
    if (dedError) console.error("Error inserting deducciones:", dedError);
  }

  revalidatePath("/kore/proyectos");
  return { success: true, proyecto_id: proyecto.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProyecto(id: string, data: Partial<ProyectoFormValues>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let clienteId: string | null | undefined = undefined;
  if (data.cliente_nombre !== undefined) {
    clienteId = await findOrCreateCliente(supabase, data);
  }

  const patch: any = {};
  if (data.nombre    !== undefined) patch.nombre        = data.nombre;
  if (data.precio    !== undefined) patch.valor         = Number(data.precio);
  if (data.fecha_entrega !== undefined) patch.fecha_entrega = toDateOrNull(data.fecha_entrega);
  if (data.estado    !== undefined) patch.estado        = data.estado;
  if (clienteId      !== undefined) patch.cliente_id    = clienteId;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("proyectos").update(patch).eq("id", id);
    if (error) {
      console.error("Error updating proyecto:", error);
      return { error: error.message };
    }
  }

  // Reemplazar deducciones (delete → insert)
  if (data.deducciones !== undefined) {
    const { error: deleteError } = await supabase
      .from("pro_deducciones")
      .delete()
      .eq("proyecto_id", id);

    if (deleteError) {
      console.error("Error deleting old deducciones:", deleteError);
      return { error: deleteError.message };
    }

    const deducciones = buildDeducciones(data.deducciones, id);
    if (deducciones.length > 0) {
      const { error: dedError } = await supabase
        .from("pro_deducciones")
        .insert(deducciones);
      if (dedError) console.error("Error inserting new deducciones:", dedError);
    }
  }

  revalidatePath("/kore/proyectos");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE otros_campos (compatibilidad con QR si la columna existe)
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

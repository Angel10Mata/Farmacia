"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ProyectoFormValues, DeduccionItem } from "@/components/(Kore)/proyectos/lib/zod";

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
    const deducciones = rawDeds.map((d: any) => ({
      tipo:          d.tipo,
      porcentaje:    Number(d.porcentaje) || 0,
      descripcion:   d.descripcion || "",
      usuario_id:    d.usuario_id  || "",
      usuario_nombre: d.usuario_id ? (profilesMap.get(d.usuario_id) || "") : "",
    }));

    // ── Legacy aggregates para el dashboard (compatibilidad sin tocar DashboardProyectos) ──
    const comisionDeds = rawDeds.filter((d: any) =>
      d.tipo === "Comisión" || d.tipo === "vendedor" || d.tipo === "Vendedor"
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
      d.tipo === "Desarrollo" || d.tipo === "desarrollo" || d.tipo === "Desarrollador"
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
      // Vendedor: usa usuario_id de las comisiones con usuario asignado para resolver el nombre real (divididos por coma si son varios)
      vendedor_id:     (comisionDeds.find((d: any) => d.usuario_id) || comisionDeds[0])?.usuario_id || "",
      vendedor_nombre: (() => {
        const assignedItems = comisionDeds.filter((d: any) => d.usuario_id);
        if (assignedItems.length > 0) {
          const names = assignedItems.map((d: any) => profilesMap.get(d.usuario_id) || d.descripcion || "").filter(Boolean);
          const uniqueNames = Array.from(new Set(names));
          if (uniqueNames.length > 0) return uniqueNames.join(", ");
        }
        const item = comisionDeds[0];
        if (!item) return "";
        return item.descripcion || "";
      })(),
      // Desarrollador: usa usuario_id de las deducciones de desarrollo con usuario asignado para resolver el nombre real (divididos por coma si son varios)
      desarrollador_id:     (desarrolloDeds.find((d: any) => d.usuario_id) || desarrolloDeds[0])?.usuario_id || "",
      desarrollador_nombre: (() => {
        const assignedItems = desarrolloDeds.filter((d: any) => d.usuario_id);
        if (assignedItems.length > 0) {
          const names = assignedItems.map((d: any) => profilesMap.get(d.usuario_id) || d.descripcion || "").filter(Boolean);
          const uniqueNames = Array.from(new Set(names));
          if (uniqueNames.length > 0) return uniqueNames.join(", ");
        }
        const item = desarrolloDeds[0];
        if (!item) return "";
        return item.descripcion || "";
      })(),
      // Mantenimiento (Step 1)
      mantenimiento: sumPct(mantDeds),
      // Deducciones en formato array para el formulario de edición (excluye mantenimiento)
      deducciones: deducciones.filter(d => d.tipo !== "Mantenimiento" && d.tipo !== "mantenimiento"),
      // ── Legacy fields para DashboardProyectos ──
      aplica_vendedor:    comisionDeds.length > 0,
      porcentaje_vendedor: sumPct(comisionDeds),
      aplica_iva:         ivaDeds.length > 0,
      porcentaje_iva:     sumPct(ivaDeds),
      aplica_doc:         docDeds.length > 0,
      porcentaje_doc:     sumPct(docDeds),
      aplica_mantenimiento: mantDeds.length > 0 || (p.otros_campos?.mantenimiento_activo === true),
      monto_mantenimiento:  sumPct(mantDeds),
      aplica_desarrollo:    desarrolloDeds.length > 0,
      porcentaje_desarrollo: sumPct(desarrolloDeds),
      mantenimiento_categoria: mantDeds[0]?.descripcion ?? null,
      mantenimiento_fecha: null,
      resto_desarrollo:    null,
      otros_campos:        p.otros_campos,
      // Nuevos campos de mantenimiento (almacenados en otros_campos por falta de columna en BD)
      mantenimiento_activo:       p.otros_campos?.mantenimiento_activo ?? false,
      mantenimiento_fecha_cobro:  p.otros_campos?.mantenimiento_fecha_cobro ?? null,
      monto_mensual_fijo:         p.otros_campos?.monto_mensual_fijo ?? null,
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
      otros_campos:  { 
        mantenimiento_activo: (data.monto_mensual_fijo && data.monto_mensual_fijo > 0) ? true : false,
        monto_mensual_fijo: data.monto_mensual_fijo || 0,
        mantenimiento_fecha_cobro: toDateOrNull(data.mantenimiento_fecha_cobro)
      },
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

  if (data.monto_mensual_fijo !== undefined || data.mantenimiento_fecha_cobro !== undefined) {
    const { data: currentProyecto } = await supabase.from("proyectos").select("otros_campos").eq("id", id).single();
    const otrosCampos = currentProyecto?.otros_campos || {};
    patch.otros_campos = { 
      ...otrosCampos, 
      mantenimiento_activo: (data.monto_mensual_fijo && data.monto_mensual_fijo > 0) ? true : false,
      monto_mensual_fijo: data.monto_mensual_fijo !== undefined ? (data.monto_mensual_fijo || 0) : (otrosCampos.monto_mensual_fijo || 0),
      mantenimiento_fecha_cobro: data.mantenimiento_fecha_cobro !== undefined ? toDateOrNull(data.mantenimiento_fecha_cobro) : (otrosCampos.mantenimiento_fecha_cobro || null)
    };
  }

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

    const deducciones = buildDeducciones(data.deducciones || [], id);

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

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE mantenimiento_activo + mantenimiento_fecha_cobro
// ─────────────────────────────────────────────────────────────────────────────

export async function updateMantenimientoProyecto(
  id: string,
  activo: boolean,
  fechaCobro: string | null
) {
  const supabase = await createClient();

  const { data: currentProyecto } = await supabase.from("proyectos").select("otros_campos").eq("id", id).single();
  const otrosCampos = currentProyecto?.otros_campos || {};
  const updatedOtrosCampos = {
    ...otrosCampos,
    mantenimiento_activo: activo,
    mantenimiento_fecha_cobro: fechaCobro || null,
  };

  const { error } = await supabase
    .from("proyectos")
    .update({ otros_campos: updatedOtrosCampos })
    .eq("id", id);

  if (error) {
    console.error("Error updating mantenimiento:", error);
    return { error: error.message };
  }

  revalidatePath("/kore/proyectos");
  revalidatePath("/kore/proyectos/mantenimiento");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET Historial de Mantenimientos
// ─────────────────────────────────────────────────────────────────────────────

export async function getMantenimientoHistorial(proyectoId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pro_mantenimientos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("fecha_pago", { ascending: false });

  if (error) {
    console.error("Error fetching mantenimiento historial:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRAR Pago de Mantenimiento
// ─────────────────────────────────────────────────────────────────────────────

export async function registrarPagoMantenimiento(
  proyectoId: string,
  montoCobrado: number,
  fechaPago: string,
  periodoPagado: string,
  descripcion: string,
  proximaFechaCobro: string | null
) {
  const supabase = await createClient();
  
  // 1. Insertar el registro del pago
  const { error: insertError } = await supabase
    .from("pro_mantenimientos")
    .insert([{
      proyecto_id: proyectoId,
      monto_cobrado: montoCobrado,
      fecha_pago: fechaPago,
      periodo_pagado: periodoPagado,
      descripcion: descripcion
    }]);

  if (insertError) {
    console.error("Error inserting pago mantenimiento:", insertError);
    return { error: insertError.message };
  }

  // 2. Actualizar la próxima fecha de cobro y la mensualidad fija (si aplica)
  const { data: currentProyecto } = await supabase.from("proyectos").select("otros_campos").eq("id", proyectoId).single();
  const otrosCampos = currentProyecto?.otros_campos || {};
  const updatedOtrosCampos = { ...otrosCampos };
  let needsUpdate = false;

  if (proximaFechaCobro) {
    updatedOtrosCampos.mantenimiento_fecha_cobro = proximaFechaCobro;
    needsUpdate = true;
  }

  // Si no hay monto_mensual_fijo, revisamos si tiene porcentaje de mantenimiento
  if (!otrosCampos.monto_mensual_fijo && montoCobrado > 0) {
    const { data: mantDeds } = await supabase
      .from("pro_deducciones")
      .select("id")
      .eq("proyecto_id", proyectoId)
      .in("tipo", ["Mantenimiento", "mantenimiento"]);
      
    if (!mantDeds || mantDeds.length === 0) {
      // El proyecto no tiene mensualidad configurada, el primer pago establece el monto fijo
      updatedOtrosCampos.monto_mensual_fijo = montoCobrado;
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    const { error: updateError } = await supabase
      .from("proyectos")
      .update({ otros_campos: updatedOtrosCampos })
      .eq("id", proyectoId);

    if (updateError) {
      console.error("Error updating proyecto otros_campos:", updateError);
    }
  }

  revalidatePath("/kore/proyectos");
  revalidatePath("/kore/proyectos/mantenimiento");
  return { success: true };
}

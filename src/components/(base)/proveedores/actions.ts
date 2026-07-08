"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface ItemCompraInput {
  producto_id: string;
  cantidad: number;
  precio_costo: number;
  subtotal: number;
}

export async function obtenerProveedores() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inv_proveedores")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerProveedores:", error);
    throw new Error("No se pudieron cargar los proveedores.");
  }
}

export async function guardarProveedor(params: {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  nit?: string | null;
  telefono?: string | null;
  correo?: string | null;
}) {
  try {
    const supabase = await createClient();
    const { id, nombre, descripcion, nit, telefono, correo } = params;

    if (!nombre.trim()) {
      throw new Error("El nombre del proveedor es obligatorio.");
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      nit: nit?.trim() || null,
      telefono: telefono?.trim() || null,
      correo: correo?.trim() || null,
    };

    if (id) {
      // Editar existente
      const { error } = await supabase
        .from("inv_proveedores")
        .update(payload)
        .eq("id", id);

      if (error) throw new Error(error.message);
    } else {
      // Crear nuevo
      const { error } = await supabase
        .from("inv_proveedores")
        .insert(payload);

      if (error) throw new Error(error.message);
    }

    revalidatePath("/kore/proveedores");
    return { success: true };
  } catch (error: any) {
    console.error("Error en guardarProveedor:", error);
    return { success: false, error: error.message || "Error al guardar el proveedor." };
  }
}

export async function eliminarProveedor(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("inv_proveedores")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/kore/proveedores");
    return { success: true };
  } catch (error: any) {
    console.error("Error en eliminarProveedor:", error);
    return { success: false, error: error.message || "No se pudo eliminar el proveedor." };
  }
}

export async function obtenerProveedoresYProductos() {
  try {
    const supabase = await createClient();

    // Obtener proveedores
    const { data: proveedores, error: provError } = await supabase
      .from("inv_proveedores")
      .select("*")
      .order("nombre", { ascending: true });

    if (provError) throw new Error(provError.message);

    // Obtener productos activos (incluye proveedor_id para autoselección en compras)
    const { data: productos, error: prodError } = await supabase
      .from("inv_productos")
      .select("id, codigo, nombre, precio_base, stock_actual, activo, proveedor_id")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (prodError) throw new Error(prodError.message);

    return {
      proveedores: proveedores || [],
      productos: productos || [],
    };
  } catch (error: any) {
    console.error("Error en obtenerProveedoresYProductos:", error);
    throw new Error("No se pudieron cargar los datos iniciales de compras.");
  }
}

export async function crearCompra(params: {
  proveedor_id: string;
  total: number;
  estado_pago: string;
  observaciones: string | null;
  items: ItemCompraInput[];
}) {
  try {
    const supabase = await createClient();
    const { proveedor_id, total, estado_pago, observaciones, items } = params;

    if (!proveedor_id) {
      throw new Error("Debe seleccionar un proveedor.");
    }
    if (!items || items.length === 0) {
      throw new Error("La compra debe contener al menos un producto.");
    }

    // 1. Insertar la compra (cabecera)
    const { data: compra, error: compraError } = await supabase
      .from("inv_compras")
      .insert({
        proveedor_id,
        total,
        estado_pago,
        fecha_pago: estado_pago === "Pagado" ? new Date().toISOString() : null,
        observaciones: observaciones?.trim() || null,
      })
      .select("id")
      .single();

    if (compraError || !compra) {
      throw new Error(`Error al registrar la compra: ${compraError?.message}`);
    }

    // 2. Insertar los detalles de compra
    const detalles = items.map((item) => ({
      compra_id: compra.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_costo: item.precio_costo,
      subtotal: item.subtotal,
    }));

    const { error: detallesError } = await supabase
      .from("inv_compras_detalles")
      .insert(detalles);

    if (detallesError) {
      throw new Error(`Error al registrar los detalles de compra: ${detallesError.message}`);
    }

    // 3. Incrementar las existencias (stock_actual) y sincronizar proveedor_id en inv_productos
    for (const item of items) {
      // Obtener el stock actual
      const { data: prod, error: findError } = await supabase
        .from("inv_productos")
        .select("stock_actual")
        .eq("id", item.producto_id)
        .single();

      if (findError || !prod) {
        throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
      }

      const nuevoStock = (prod.stock_actual || 0) + item.cantidad;

      // Actualizar stock y proveedor_id (vincula el proveedor directamente al producto)
      const { error: stockError } = await supabase
        .from("inv_productos")
        .update({ stock_actual: nuevoStock, proveedor_id: proveedor_id })
        .eq("id", item.producto_id);

      if (stockError) {
        throw new Error(`Error al actualizar stock para producto ID ${item.producto_id}: ${stockError.message}`);
      }
    }

    // 4. Registrar pago inmediato en Finanzas si el estado es Pagado
    if (estado_pago === "Pagado") {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: finError } = await supabase.from("fin_transacciones").insert({
        tipo_movimiento: "egreso",
        categoria: "pago_proveedor",
        monto: total,
        descripcion: `Pago inmediato de compra al registrar`,
        usuario_id: user?.id,
        compra_id: compra.id
      });
      if (finError) {
        console.error("Error al registrar el pago en finanzas:", finError);
        // No lanzamos error para no bloquear la creación de la compra
      }
    }

    // Revalidar rutas para refrescar datos de inventario y compras
    revalidatePath("/kore/inventario");
    revalidatePath("/kore/proveedores");
    revalidatePath("/kore/finanzas");

    return {
      success: true,
      compra_id: compra.id,
    };
  } catch (error: any) {
    console.error("Error en crearCompra:", error);
    return {
      success: false,
      error: error.message || "Error al procesar la compra."
    };
  }
}

export async function obtenerHistorialCompras() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inv_compras")
      .select("*, inv_proveedores(nombre, nit), fin_transacciones(*)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerHistorialCompras:", error);
    throw new Error("No se pudo obtener el historial de compras.");
  }
}

export async function obtenerDetalleCompra(compraId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inv_compras_detalles")
      .select("*, inv_productos(nombre, codigo)")
      .eq("compra_id", compraId);

    if (error) throw new Error(error.message);

    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerDetalleCompra:", error);
    throw new Error("No se pudo obtener el detalle de la compra.");
  }
}

export async function actualizarEstadoPagoCompra(compraId: string, nuevoEstado: "Pagado" | "Pendiente") {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Obtener detalles de la compra para sincronizar finanzas
    const { data: compra, error: compraErr } = await supabase
      .from("inv_compras")
      .select("total, estado_pago")
      .eq("id", compraId)
      .single();

    if (compraErr) throw new Error(compraErr.message);

    // Si se marca como Pagado y antes estaba Pendiente
    if (nuevoEstado === "Pagado" && compra.estado_pago !== "Pagado") {
      // Calcular saldo pendiente
      const { data: pagos } = await supabase
        .from("fin_transacciones")
        .select("monto")
        .eq("compra_id", compraId)
        .eq("categoria", "pago_proveedor");
        
      const pagado = pagos?.reduce((sum, p) => sum + Number(p.monto), 0) || 0;
      const saldo = Number(compra.total) - pagado;

      if (saldo > 0) {
        // Insertar pago por el saldo restante
        const { error: finError } = await supabase.from("fin_transacciones").insert({
          tipo_movimiento: "egreso",
          categoria: "pago_proveedor",
          monto: saldo,
          descripcion: `Pago total de compra marcado desde Proveedores`,
          usuario_id: user?.id,
          compra_id: compraId
        });
        if (finError) throw new Error("No se pudo registrar el pago en finanzas: " + finError.message);
      }
    } 
    // Si se marca como Pendiente y antes estaba Pagado (o tenía algún pago)
    else if (nuevoEstado === "Pendiente" && compra.estado_pago !== "Pendiente") {
      // Revertir pagos asociados insertando anulaciones (Opción A)
      const { data: pagos } = await supabase
        .from("fin_transacciones")
        .select("*")
        .eq("compra_id", compraId)
        .eq("categoria", "pago_proveedor");

      if (pagos && pagos.length > 0) {
        // Filtramos para no volver a anular algo que ya sea negativo (una anulación previa)
        // Aunque si el usuario anula manual en finanzas y luego en proveedores, podría haber duplicados.
        // Pero en principio se anula el neto positivo.
        const saldoNeto = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
        
        if (saldoNeto > 0) {
          const { error: finError } = await supabase.from("fin_transacciones").insert({
            tipo_movimiento: "egreso",
            categoria: "pago_proveedor",
            monto: -Math.abs(saldoNeto),
            descripcion: `Anulación automática al marcar compra como Pendiente`,
            usuario_id: user?.id,
            compra_id: compraId
          });
          if (finError) throw new Error("No se pudo anular los pagos en finanzas: " + finError.message);
        }
      }
    }

    const payload = {
      estado_pago: nuevoEstado,
      fecha_pago: nuevoEstado === "Pagado" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("inv_compras")
      .update(payload)
      .eq("id", compraId);

    if (error) throw new Error(error.message);

    revalidatePath("/kore/proveedores");
    revalidatePath("/kore/finanzas");
    return { success: true };
  } catch (error: any) {
    console.error("Error en actualizarEstadoPagoCompra:", error);
    return {
      success: false,
      error: error.message || "Error al actualizar el estado de pago."
    };
  }
}


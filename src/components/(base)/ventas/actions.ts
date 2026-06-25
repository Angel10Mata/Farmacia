"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface ItemVentaInput {
  producto_id: string;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
}

export async function obtenerProductosYClientes() {
  try {
    const supabase = await createClient();

    // Obtener productos activos
    const { data: productos, error: prodError } = await supabase
      .from("inv_productos")
      .select("*")
      .eq("activo", true)
      .order("nombre", { ascending: true });

    if (prodError) throw new Error(prodError.message);

    // Obtener todos los clientes
    const { data: clientes, error: cliError } = await supabase
      .from("ven_clientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (cliError) throw new Error(cliError.message);

    return {
      productos: productos || [],
      clientes: clientes || [],
    };
  } catch (error: any) {
    console.error("Error en obtenerProductosYClientes:", error);
    throw new Error("No se pudieron cargar los productos o clientes.");
  }
}

export async function crearVenta(params: {
  cliente_id: string | null;
  tipo_venta: string;
  total: number;
  observaciones: string | null;
  items: ItemVentaInput[];
}) {
  try {
    const supabase = await createClient();
    
    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesión no válida o expirada.");

    const { cliente_id, tipo_venta, total, observaciones, items } = params;

    if (!items || items.length === 0) {
      throw new Error("La venta debe contener al menos un producto.");
    }

    // 1. Validar existencias de stock en el servidor para evitar sobreventas
    for (const item of items) {
      const { data: prod, error: findError } = await supabase
        .from("inv_productos")
        .select("nombre, stock_actual")
        .eq("id", item.producto_id)
        .single();
      
      if (findError || !prod) {
        throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
      }

      if (prod.stock_actual < item.cantidad) {
        throw new Error(`Stock insuficiente para ${prod.nombre} (Disponibles: ${prod.stock_actual}, Solicitados: ${item.cantidad}).`);
      }
    }

    // 2. Insertar la venta
    const { data: venta, error: ventaError } = await supabase
      .from("ventas")
      .insert({
        cliente_id: cliente_id || null,
        usuario_id: user.id,
        tipo_venta,
        total,
        observaciones: observaciones || null,
      })
      .select("id, numero_recibo")
      .single();

    if (ventaError || !venta) {
      throw new Error(`Error al registrar la cabecera de venta: ${ventaError?.message}`);
    }

    // 3. Insertar los detalles de venta
    const detalles = items.map((item) => ({
      venta_id: venta.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_aplicado: item.precio_aplicado,
      subtotal: item.subtotal,
    }));

    const { error: detallesError } = await supabase
      .from("ven_detalles")
      .insert(detalles);

    if (detallesError) {
      // Nota: Si esto falla, idealmente querríamos deshacer la inserción anterior, 
      // pero en REST API procedemos a lanzar la excepción para notificar al cliente.
      throw new Error(`Error al registrar los detalles de venta: ${detallesError.message}`);
    }

    // 4. Descontar las existencias del inventario
    for (const item of items) {
      const { data: prod } = await supabase
        .from("inv_productos")
        .select("stock_actual")
        .eq("id", item.producto_id)
        .single();

      const nuevoStock = (prod?.stock_actual || 0) - item.cantidad;

      const { error: stockError } = await supabase
        .from("inv_productos")
        .update({ stock_actual: nuevoStock })
        .eq("id", item.producto_id);

      if (stockError) {
        throw new Error(`Error al actualizar el stock del producto ID ${item.producto_id}: ${stockError.message}`);
      }
    }

    // Revalidar rutas para refrescar cache de inventario y ventas
    revalidatePath("/kore/inventario");
    revalidatePath("/kore/ventas");

    return {
      success: true,
      venta_id: venta.id,
      numero_recibo: venta.numero_recibo,
    };
  } catch (error: any) {
    console.error("Error en crearVenta:", error);
    return {
      success: false,
      error: error.message || "Error desconocido al procesar la venta."
    };
  }
}

export async function obtenerHistorialVentas() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ventas")
      .select("*, ven_clientes(nombre, nit)")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerHistorialVentas:", error);
    throw new Error("No se pudo obtener el historial de ventas.");
  }
}

export async function obtenerDetalleVenta(ventaId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("ven_detalles")
      .select("*, inv_productos(nombre, codigo)")
      .eq("venta_id", ventaId);

    if (error) throw new Error(error.message);

    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerDetalleVenta:", error);
    throw new Error("No se pudo obtener el detalle de la venta.");
  }
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface TransaccionFinanciera {
  id: string;
  created_at: string;
  tipo: "ingreso" | "egreso";
  categoria: "venta" | "abono_cliente" | "pago_proveedor" | "gasto_fijo" | "gasto_vario" | "compra";
  monto: number;
  descripcion: string;
  usuario_id: string;
  referencia_id?: string;
  balance_actual?: number;
}

export async function obtenerMovimientosFinancieros() {
  try {
    const supabase = await createClient();
    
    // Obtener transacciones ordenadas por fecha descendente
    const { data, error } = await supabase
      .from("fin_transacciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al obtener movimientos:", error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error("Error en obtenerMovimientosFinancieros:", error);
    throw new Error(error.message || "No se pudieron cargar los movimientos financieros.");
  }
}

export async function registrarMovimiento(params: {
  tipo: "ingreso" | "egreso";
  categoria: string;
  monto: number;
  descripcion: string;
  referencia_id?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Sesión no válida o expirada.");

    const { tipo, categoria, monto, descripcion, referencia_id } = params;

    // Validación básica
    if (monto <= 0) {
      throw new Error("El monto debe ser mayor a cero.");
    }

    const payload: any = {
      tipo,
      categoria,
      monto,
      descripcion,
      usuario_id: user.id
    };

    if (referencia_id) {
      payload.referencia_id = referencia_id;
    }

    const { data, error } = await supabase
      .from("fin_transacciones")
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/kore/finanzas");
    return { success: true, data };
  } catch (error: any) {
    console.error("Error al registrar movimiento:", error);
    throw new Error(`No se pudo registrar el movimiento: ${error.message}`);
  }
}

export async function eliminarMovimiento(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("fin_transacciones")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/kore/finanzas");
    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar movimiento:", error);
    throw new Error(`No se pudo eliminar el movimiento: ${error.message}`);
  }
}

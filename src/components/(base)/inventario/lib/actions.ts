import { createClient } from "@/utils/supabase/client";

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Fetch all inventory products
export async function getProductos(): Promise<ActionResult<any[]>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("inv_productos")
      .select("*, inv_proveedores(nombre), inv_compras_detalles(inv_compras(inv_proveedores(nombre)))")
      .order("nombre", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Delete product
export async function eliminarProducto(id: string): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("inv_productos")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Update product
export async function updateProducto(id: string, values: any): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("inv_productos")
      .update(values)
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

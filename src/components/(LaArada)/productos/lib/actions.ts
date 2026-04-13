"use server";

import { createClient } from "@/utils/supabase/server";
import { ProductSchema, ProductFormValues } from "./zod";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inv_productos")
    .select("*")
    .order("codigo", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLowStockCount() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inv_productos")
    .select("stock_actual, stock_minimo");

  if (error || !data) return 0;

  return data.filter((p) => p.stock_actual <= p.stock_minimo).length;
}

export async function createProduct(data: ProductFormValues) {
  const result = ProductSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("inv_productos")
    .select("codigo, nombre")
    .or(`codigo.eq.${result.data.codigo},nombre.eq.${result.data.nombre}`)
    .maybeSingle();

  if (existing) {
    if (existing.codigo === result.data.codigo)
      return { error: "El código ya existe." };
    if (existing.nombre === result.data.nombre)
      return { error: "El nombre ya existe." };
  }

  const { error } = await supabase.from("inv_productos").insert(result.data);

  if (error) {
    if (error.code === "23505") {
      return { error: "El código ya está registrado en el sistema." };
    }
    return { error: error.message };
  }

  revalidatePath("/cermadsa/laarada/productos");
  return { success: true };
}

export async function updateProduct(id: string, data: ProductFormValues) {
  const result = ProductSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("inv_productos")
    .select("id, codigo, nombre")
    .or(`codigo.eq.${result.data.codigo},nombre.eq.${result.data.nombre}`)
    .neq("id", id)
    .maybeSingle();

  if (existing) {
    if (existing.codigo === result.data.codigo)
      return { error: "El código ya está en uso por otro producto." };
    if (existing.nombre === result.data.nombre)
      return { error: "El nombre ya está en uso por otro producto." };
  }

  const { error } = await supabase
    .from("inv_productos")
    .update(result.data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/productos");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("inv_productos").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/productos");
  return { success: true };
}

export async function getNextProductCode() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inv_productos")
    .select("codigo")
    .order("codigo", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return "001";

  const lastCode = parseInt(data.codigo, 10);
  if (isNaN(lastCode)) return "001";

  const nextCode = lastCode + 1;
  return nextCode.toString().padStart(3, "0");
}

export async function getStockStats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inv_productos")
    .select("stock_actual, stock_minimo");

  if (error) return { sinStock: 0, stockBajo: 0 };

  let sinStock = 0;
  let stockBajo = 0;

  data.forEach((prod) => {
    if (prod.stock_actual <= 0) {
      sinStock++;
    } else if (prod.stock_actual <= prod.stock_minimo) {
      stockBajo++;
    }
  });

  return { sinStock, stockBajo };
}

export async function getProductStats(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ven_detalle")
    .select(
      `
      cantidad,
      ven_ventas!inner (
        fecha_entrega,
        estado
      )
    `,
    )
    .eq("producto_id", productId)
    .eq("ven_ventas.estado", "Entregado");

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllProductsStats() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ven_detalle")
    .select(`
      producto_id,
      cantidad,
      inv_productos (nombre),
      ven_ventas!inner (fecha_entrega, estado)
    `)
    .eq("ven_ventas.estado", "Entregado");

  if (error) throw new Error(error.message);
  return data;
}


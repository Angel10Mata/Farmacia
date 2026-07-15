"use server";

import { createClient } from "@/utils/supabase/server";

export interface CreditoResumen {
  cliente_id: string;
  nombre: string;
  nit: string;
  limite_credito: string;
  total_consumido: number;
  saldo_pendiente: number;
  estado: "Al día" | "Atrasado" | "Solventado";
  dias_atraso: number;
}

export interface CuentaPorPagar {
  compra_id: string;
  proveedor_nombre: string;
  numero_factura: string | null;
  fecha_compra: string;
  total: number;
  saldo_pendiente: number;
}

export async function obtenerResumenCreditos(): Promise<CreditoResumen[]> {
  try {
    const supabase = await createClient();

    // 1. Get all clients
    const { data: clientesData, error: cliError } = await supabase
      .from("ven_clientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (cliError) throw new Error(cliError.message);

    // 2. Get all credit sales and their payments
    const { data: ventasData, error: ventasError } = await supabase
      .from("ventas")
      .select("id, cliente_id, total, tipo_venta, created_at, fin_transacciones(monto, categoria, fecha_movimiento)")
      .eq("tipo_venta", "Crédito");

    if (ventasError) throw new Error(ventasError.message);

    const clientCreditosMap = new Map<string, CreditoResumen>();

    if (clientesData) {
      clientesData.forEach((row: any) => {
        clientCreditosMap.set(row.id, {
          cliente_id: row.id,
          nombre: row.nombre || "Cliente sin nombre",
          nit: row.nit || "C/F",
          limite_credito: "N/A",
          total_consumido: 0,
          saldo_pendiente: 0,
          estado: "Solventado",
          dias_atraso: 0,
        });
      });
    }

    if (ventasData) {
      const now = new Date().getTime();
      ventasData.forEach((v: any) => {
        if (!v.cliente_id) return;
        const c = clientCreditosMap.get(v.cliente_id);
        if (!c) return;

        c.total_consumido += v.total || 0;

        const abonos = v.fin_transacciones
          ? v.fin_transacciones
              .filter((t: any) => t.categoria === "abono_cliente" || t.categoria === "venta")
              .reduce((sum: number, t: any) => sum + Number(t.monto), 0)
          : 0;

        const saldoVenta = Math.max(0, (v.total || 0) - abonos);
        c.saldo_pendiente += saldoVenta;

        if (saldoVenta > 0) {
          const dias = Math.floor((now - new Date(v.created_at).getTime()) / (1000 * 3600 * 24));
          if (dias > c.dias_atraso) {
             c.dias_atraso = dias;
          }
        }
      });
    }

    const resultado: CreditoResumen[] = [];
    clientCreditosMap.forEach((c) => {
      // Only include clients who have consumed credit at some point
      if (c.total_consumido > 0) {
        if (c.saldo_pendiente <= 0) {
           c.estado = "Solventado";
        } else if (c.dias_atraso > 30) {
           c.estado = "Atrasado";
        } else {
           c.estado = "Al día";
        }
        resultado.push(c);
      }
    });

    return resultado;
  } catch (error: any) {
    console.error("Error en obtenerResumenCreditos:", error);
    throw new Error("No se pudieron cargar los créditos.");
  }
}

export async function obtenerCuentasPorPagar(): Promise<CuentaPorPagar[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("fin_cuentas_por_pagar");

    if (error) throw new Error(error.message);

    return (data ?? []) as CuentaPorPagar[];
  } catch (error: unknown) {
    console.error("Error en obtenerCuentasPorPagar:", error);
    throw new Error("No se pudieron cargar las cuentas por pagar.");
  }
}

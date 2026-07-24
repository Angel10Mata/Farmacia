import { useQuery } from "@tanstack/react-query";
import { obtenerResumenCreditos, obtenerDetalleCredito } from "./actions";
import type { CreditoResumen, VentaCreditoDetalle } from "./zod";

export function useResumenCreditos() {
  return useQuery<CreditoResumen[]>({
    queryKey: ["creditos", "resumen"],
    queryFn: async () => {
      return await obtenerResumenCreditos();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDetalleCredito(clienteId: string | undefined) {
  return useQuery<VentaCreditoDetalle[]>({
    queryKey: ["creditos", "detalle", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      return await obtenerDetalleCredito(clienteId);
    },
    enabled: !!clienteId,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { getSwalThemeOpts } from "@/lib/utils";
import {
  obtenerHistorialVentas,
  obtenerDetalleVenta,
  anularVenta,
  editarDetalleVentaDirecto,
  eliminarDetalleVentaDirecto,
  obtenerProductosYClientes
} from "./actions";

export function usePOSData() {
  return useQuery({
    queryKey: ["ventas", "pos-data"],
    queryFn: async () => await obtenerProductosYClientes(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useHistorialVentas() {
  return useQuery({
    queryKey: ["ventas", "historial"],
    queryFn: async () => await obtenerHistorialVentas(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useDetalleVenta(ventaId: string | null) {
  return useQuery({
    queryKey: ["ventas", "detalle", ventaId],
    queryFn: async () => {
      if (!ventaId) return [];
      return await obtenerDetalleVenta(ventaId);
    },
    enabled: !!ventaId,
  });
}

export function useAnularVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ventaId: string) => {
      return await anularVenta(ventaId);
    },
    onSuccess: () => {
      Swal.fire({ title: "Éxito", text: "Venta anulada correctamente", icon: "success", ...getSwalThemeOpts() });
      queryClient.invalidateQueries({ queryKey: ["ventas", "historial"] });
      // Invalidar dashboard o finanzas si es necesario
      queryClient.invalidateQueries({ queryKey: ["finanzas"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
    },
    onError: (error: any) => {
      Swal.fire({ title: "Error", text: error.message || "Error al anular la venta", icon: "error", ...getSwalThemeOpts() });
    }
  });
}

export function useEditarDetalleVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { 
      detalleId: string, 
      ventaId: string,
      productoId: string,
      nuevaCantidad: number, 
      nuevoPrecio: number
    }) => {
      return await editarDetalleVentaDirecto(params);
    },
    onSuccess: (_, variables) => {
      Swal.fire({ title: "Éxito", text: "Detalle actualizado correctamente", icon: "success", ...getSwalThemeOpts() });
      queryClient.invalidateQueries({ queryKey: ["ventas", "detalle"] });
      queryClient.invalidateQueries({ queryKey: ["ventas", "historial"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
    },
    onError: (error: any) => {
      Swal.fire({ title: "Error", text: error.message || "Error al editar detalle", icon: "error", ...getSwalThemeOpts() });
    }
  });
}

export function useEliminarDetalleVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { detalleId: string, ventaId: string, productoId: string, cantidadADevolver: number }) => {
      return await eliminarDetalleVentaDirecto(params);
    },
    onSuccess: () => {
      Swal.fire({ title: "Éxito", text: "Producto eliminado de la venta", icon: "success", ...getSwalThemeOpts() });
      queryClient.invalidateQueries({ queryKey: ["ventas", "detalle"] });
      queryClient.invalidateQueries({ queryKey: ["ventas", "historial"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
    },
    onError: (error: any) => {
      Swal.fire({ title: "Error", text: error.message || "Error al eliminar detalle", icon: "error", ...getSwalThemeOpts() });
    }
  });
}

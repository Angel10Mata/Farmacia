import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  obtenerProveedores,
  guardarProveedor,
  eliminarProveedor,
  obtenerProveedoresYProductos,
  crearCompra,
  obtenerHistorialCompras,
  obtenerDetalleCompra,
  actualizarEstadoPagoCompra,
  registrarAbonoCompra,
  obtenerComprasProveedor
} from "./actions";
import { ProveedorInput, CompraInput } from "./zod";

export function useProveedores() {
  return useQuery({
    queryKey: ["proveedores"],
    queryFn: async () => {
      const res = await obtenerProveedores();
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
  });
}

export function useProveedoresYProductos() {
  return useQuery({
    queryKey: ["proveedores-productos"],
    queryFn: async () => {
      const res = await obtenerProveedoresYProductos();
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
  });
}

export function useHistorialCompras() {
  return useQuery({
    queryKey: ["compras-historial"],
    queryFn: async () => {
      const res = await obtenerHistorialCompras();
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
  });
}

export function useComprasProveedor(proveedorId: string | null) {
  return useQuery({
    queryKey: ["compras-proveedor", proveedorId],
    queryFn: async () => {
      if (!proveedorId) return [];
      const res = await obtenerComprasProveedor(proveedorId);
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
    enabled: !!proveedorId,
  });
}

export function useDetalleCompra(compraId: string | null) {
  return useQuery({
    queryKey: ["compra-detalle", compraId],
    queryFn: async () => {
      if (!compraId) return [];
      const res = await obtenerDetalleCompra(compraId);
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
    enabled: !!compraId,
  });
}

export function useGuardarProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: ProveedorInput }) => {
      const res = await guardarProveedor(id, data);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      queryClient.invalidateQueries({ queryKey: ["proveedores-productos"] });
    },
  });
}

export function useEliminarProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await eliminarProveedor(id);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      queryClient.invalidateQueries({ queryKey: ["proveedores-productos"] });
    },
  });
}

export function useCrearCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CompraInput) => {
      const res = await crearCompra(data);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores-productos"] });
      queryClient.invalidateQueries({ queryKey: ["compras-historial"] });
    },
  });
}

export function useActualizarEstadoPagoCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: "Pagado" | "Pendiente" }) => {
      const res = await actualizarEstadoPagoCompra(id, estado);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras-historial"] });
    },
  });
}

export function useRegistrarAbonoCompra() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      monto,
      metodo,
      notas,
    }: {
      id: string;
      monto: number;
      metodo: string;
      notas?: string;
    }) => {
      const res = await registrarAbonoCompra(id, monto, metodo, notas);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compras-historial"] });
    },
  });
}

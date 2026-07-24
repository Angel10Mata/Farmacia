import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { obtenerClientes, obtenerVentasCliente, crearCliente, editarCliente } from "./actions";
import { ClienteInput } from "./zod";

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const res = await obtenerClientes();
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
  });
}

export function useVentasCliente(clienteId: string | null) {
  return useQuery({
    queryKey: ["ventas-cliente", clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const res = await obtenerVentasCliente(clienteId);
      if (!res.success) throw new Error(res.code);
      return res.data;
    },
    enabled: !!clienteId,
  });
}

export function useCrearCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClienteInput) => {
      const res = await crearCliente(data);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useEditarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClienteInput }) => {
      const res = await editarCliente(id, data);
      if (!res.success) throw new Error(res.code);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

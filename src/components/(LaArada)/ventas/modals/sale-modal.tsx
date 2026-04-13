"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VentaSchema, VentaFormValues, ClienteCatalogo } from "../lib/zod";
import { useCreateVenta, useUpdateVenta, useCatalogos } from "../lib/hooks";
import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Save,
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Check,
  Package,
  Ban,
} from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import ClientModal from "../../clientes/modals/client-modal";
import AddProductModal from "./add-product-modal";
import { cn } from "@/lib/utils";
import { updateEstadoVenta } from "../lib/actions";
import Swal from "sweetalert2";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaToEdit?: any;
  effectiveRole?: string;
}

export default function SaleModal({
  isOpen,
  onClose,
  ventaToEdit,
  effectiveRole,
}: SaleModalProps) {
  const queryClient = useQueryClient();
  const { data: catalogos, refetch } = useCatalogos();
  const createMutation = useCreateVenta();
  const updateMutation = useUpdateVenta();

  const [modals, setModals] = useState({ client: false, product: false });
  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const form = useForm<VentaFormValues>({
    resolver: zodResolver(VentaSchema) as any,
    defaultValues: {
      cliente_id: "",
      tipo_venta: "Contado",
      tipo_comprobante: "Recibo",
      fecha_entrega: new Date().toISOString().split("T")[0],
      total: 0,
      detalles: [],
      observaciones: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const detalles = watch("detalles");
  const selectedClientId = watch("cliente_id");

  const isAnulado = String(ventaToEdit?.estado || "")
    .trim()
    .toLowerCase() === "anulado";

  const isReadOnly = useMemo(() => {
    if (!ventaToEdit) return false;
    const estado = String(ventaToEdit.estado || "Pendiente")
      .trim()
      .toLowerCase();
    // Always read-only if anulado, regardless of role
    if (estado === "anulado") return true;
    if (effectiveRole === "super") return false;
    return estado === "entregado";
  }, [ventaToEdit, effectiveRole]);

  useEffect(() => {
    if (ventaToEdit) {
      reset({
        cliente_id: ventaToEdit.cliente_id,
        tipo_venta: ventaToEdit.tipo_venta || "Contado",
        tipo_comprobante: ventaToEdit.tipo_comprobante || "Recibo",
        fecha_entrega: ventaToEdit.fecha_entrega
          ? new Date(ventaToEdit.fecha_entrega).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        total: ventaToEdit.total || 0,
        observaciones: ventaToEdit.observaciones || "",
        detalles:
          ventaToEdit.ven_detalle?.map((d: any) => ({
            producto_id: d.producto_id,
            nombre_producto: d.inv_productos?.nombre || "Producto",
            cantidad: d.cantidad,
            precio_unitario: Number(d.precio_aplicado) || 0,
            subtotal: Number(d.subtotal) || 0,
          })) || [],
      });
      setClientSearch(ventaToEdit.ven_clientes?.nombre || "");
    } else {
      reset({
        cliente_id: "",
        tipo_venta: "Contado",
        tipo_comprobante: "Recibo",
        fecha_entrega: new Date().toISOString().split("T")[0],
        total: 0,
        observaciones: "",
        detalles: [],
      });
      setClientSearch("");
    }
  }, [ventaToEdit, reset]);

  useEffect(() => {
    setValue(
      "total",
      detalles.reduce((acc, curr) => acc + (curr.subtotal || 0), 0),
    );
  }, [detalles, setValue]);

  const filteredClients = useMemo(() => {
    if (!catalogos?.clientes || clientSearch.length < 2) return [];
    const search = clientSearch.toLowerCase();
    return catalogos.clientes.filter(
      (c: ClienteCatalogo) =>
        c.nombre.toLowerCase().includes(search) || c.nit.includes(search),
    );
  }, [catalogos, clientSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowClientList(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSubmit = async (data: any) => {
    if (isReadOnly) return;
    const res = ventaToEdit
      ? await updateMutation.mutateAsync({ id: ventaToEdit.id, data })
      : await createMutation.mutateAsync(data);
    if (res?.success) {
      reset();
      setClientSearch("");
      onClose();
    }
  };

  const handleCancelOrder = async () => {
    if (!ventaToEdit?.id || isReadOnly) return;

    const isDark = document.documentElement.classList.contains("dark");

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se anulará la venta y se devolverá el stock.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, anular venta",
      cancelButtonText: "No, volver",
      background: isDark ? "#1c1c1e" : undefined,
      color: isDark ? "#f5f5f5" : undefined,
    });

    if (result.isConfirmed) {
      const res = await updateEstadoVenta(ventaToEdit.id, "Anulado", "");
      if (res?.success) {
        await Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Venta anulada correctamente",
          showConfirmButton: false,
          timer: 1500,
          background: isDark ? "#1c1c1e" : undefined,
          color: isDark ? "#f5f5f5" : undefined,
        });
        onClose();
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
      }
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-foreground">
        <MagicCard className="w-full max-w-4xl p-0 shadow-2xl rounded-xl max-h-[90vh] flex flex-col overflow-hidden bg-background">
          <Header
            title={
              ventaToEdit
                ? isReadOnly
                  ? "Detalle de Venta"
                  : "Editar Venta"
                : "Nueva Venta"
            }
            onClose={onClose}
            estado={ventaToEdit?.estado}
          />

          <div className="flex-1 overflow-y-auto p-6">
            <form
              id="venta-form"
              onSubmit={handleSubmit(onSubmit, (err) =>
                console.error("Validation Errors:", err),
              )}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div
                  className="md:col-span-6 space-y-1.5 relative"
                  ref={dropdownRef}
                >
                  <label className="text-xs font-bold uppercase text-muted-foreground">
                    Cliente
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Nit o nombre del cliente..."
                        disabled={isReadOnly}
                        className={cn(
                          "w-full h-10 pl-9 pr-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed",
                          errors.cliente_id && "border-red-500",
                        )}
                        value={clientSearch}
                        onChange={(e) => {
                          if (isReadOnly) return;
                          setClientSearch(e.target.value);
                          setShowClientList(e.target.value.length >= 3);
                          if (!e.target.value) setValue("cliente_id", "");
                        }}
                        onFocus={() =>
                          !isReadOnly &&
                          clientSearch.length >= 3 &&
                          setShowClientList(true)
                        }
                        autoComplete="off"
                      />
                      {showClientList && !isReadOnly && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-background border rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                          {filteredClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setValue("cliente_id", c.id);
                                setClientSearch(c.nombre);
                                setShowClientList(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex flex-col border-b last:border-0 transition-colors"
                            >
                              <span className="font-bold flex items-center justify-between">
                                {c.nombre}{" "}
                                {selectedClientId === c.id && (
                                  <Check className="size-4 text-green-500" />
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                NIT: {c.nit}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => setModals({ ...modals, client: true })}
                        className="size-10 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0"
                      >
                        <Plus className="size-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground">
                    Tipo Venta
                  </label>
                  <select
                    {...register("tipo_venta")}
                    disabled={isReadOnly}
                    className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <label
                    className={cn(
                      "text-[10px] md:text-xs font-bold uppercase truncate",
                      errors.fecha_entrega
                        ? "text-red-500"
                        : "text-muted-foreground",
                    )}
                  >
                    Entrega
                  </label>
                  <input
                    type="date"
                    min={today}
                    {...register("fecha_entrega", {
                      validate: (value) =>
                        (value || "") >= today || "Fecha pasada",
                    })}
                    disabled={isReadOnly}
                    className={cn(
                      "w-full h-10 px-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                      errors.fecha_entrega
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-border focus:ring-primary/20",
                    )}
                  />
                  {errors.fecha_entrega && (
                    <p className="text-[10px] font-bold text-red-500 uppercase animate-in fade-in slide-in-from-top-1">
                      No se permiten fechas pasadas
                    </p>
                  )}
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <label className="text-[10px] md:text-xs font-bold uppercase text-muted-foreground">
                    Datos adicionales
                  </label>
                  <textarea
                    {...register("observaciones")}
                    disabled={isReadOnly}
                    placeholder="detalles de vehículo o observaciones adicionales..."
                    className="w-full min-h-15 p-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-y transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end border-b pb-2">
                  <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
                    Detalle de la Venta
                  </h3>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setModals({ ...modals, product: true })}
                      className="text-xs font-bold flex items-center gap-1 text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="size-4" /> AGREGAR PRODUCTO
                    </button>
                  )}
                </div>

                <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                  <div className="grid grid-cols-12 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase py-2 px-4 border-b">
                    <div className="col-span-5">Producto</div>
                    <div className="col-span-2 text-center">Cant.</div>
                    <div className="col-span-2 text-right">Precio</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y max-h-62.5 overflow-y-auto">
                    {fields.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-sm opacity-50 flex flex-col items-center gap-2">
                        <Package className="size-8" /> Sin productos
                      </div>
                    ) : (
                      fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="grid grid-cols-12 items-center py-3 px-4 hover:bg-muted/10 transition-colors text-sm"
                        >
                          <div className="col-span-5 font-medium truncate pr-2">
                            {watch(`detalles.${index}.nombre_producto`) ||
                              "Producto"}
                          </div>
                          <div className="col-span-2 text-center font-mono bg-muted/30 rounded py-0.5 mx-2">
                            {watch(`detalles.${index}.cantidad`)}
                          </div>
                          <div className="col-span-2 text-right text-muted-foreground">
                            Q
                            {watch(`detalles.${index}.precio_unitario`).toFixed(
                              2,
                            )}
                          </div>
                          <div className="col-span-2 text-right font-bold">
                            Q{watch(`detalles.${index}.subtotal`).toFixed(2)}
                          </div>
                          <div className="col-span-1 text-right">
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-muted-foreground hover:text-red-500 p-1 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="bg-muted/30 border-t p-4 flex justify-end items-center gap-4">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Total
                    </span>
                    <span className="text-2xl font-black text-primary tracking-tight">
                      Q{watch("total")?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="p-4 border-t bg-muted/30 flex justify-between items-center gap-3">
            <div>
              {ventaToEdit && !isReadOnly && !isAnulado && (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="px-6 py-2 rounded-lg bg-red-500/10 text-red-600 border border-red-500 font-bold text-sm hover:bg-red-500/20 cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Ban className="size-4" /> Anular Venta
                </button>
              )}
            </div>

            {isReadOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2 rounded-lg border bg-background font-bold text-sm hover:bg-muted cursor-pointer transition-colors"
              >
                CERRAR VISTA
              </button>
            ) : (
              <button
                type="submit"
                form="venta-form"
                disabled={isSubmitting || fields.length === 0}
                className="px-8 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
              >
                <Save className="size-4" />{" "}
                {ventaToEdit ? "ACTUALIZAR VENTA" : "REALIZAR VENTA"}
              </button>
            )}
          </div>
        </MagicCard>
      </div>

      <ClientModal
        isOpen={modals.client}
        onClose={() => {
          setModals({ ...modals, client: false });
          refetch();
        }}
      />
      <AddProductModal
        isOpen={modals.product}
        onClose={() => setModals({ ...modals, product: false })}
        onAdd={(prod) => append(prod)}
        catalogos={catalogos}
      />
    </>
  );
}

function Header({
  title,
  onClose,
  estado,
}: {
  title: string;
  onClose: () => void;
  estado?: string;
}) {
  const estadoNormal = String(estado || "")
    .trim()
    .toLowerCase();
  const badgeColor =
    estadoNormal === "pendiente"
      ? "bg-amber-500"
      : estadoNormal === "entregado"
        ? "bg-green-500"
        : estadoNormal === "anulado"
          ? "bg-red-500"
          : "bg-muted";

  return (
    <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="bg-orange-500/10 p-2 rounded-lg">
          <ShoppingCart className="size-6 text-orange-500" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{title}</h2>
            {estado && (
              <span
                className={`px-2 py-0.5 text-[10px] text-white font-black uppercase tracking-widest rounded-full ${badgeColor}`}
              >
                {estado}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Gestión de ventas <span className="text-orange-500">LA ARADA</span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 hover:bg-muted rounded-full cursor-pointer"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

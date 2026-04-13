"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, ProductFormValues } from "../lib/zod";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "../lib/hooks";
import { getNextProductCode } from "../lib/actions";
import { useEffect } from "react";
import { X, Trash2, Save, Package, AlertTriangle } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductFormValues & { id: string };
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
}: ProductModalProps) {
  const { theme } = useTheme();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      medida: "m³",
      precio_base: 90,
      stock_actual: 0,
      stock_minimo: 10,
      activo: true,
    },
  });

  const isActive = watch("activo");

  useEffect(() => {
    const prepareModal = async () => {
      if (!isOpen) return;
      if (productToEdit) {
        reset(productToEdit);
      } else {
        reset({
          codigo: "",
          nombre: "",
          medida: "m³",
          precio_base: 90,
          stock_actual: 0,
          stock_minimo: 10,
          activo: true,
        });
        const code = await getNextProductCode();
        setValue("codigo", code);
      }
    };
    prepareModal();
  }, [productToEdit, reset, isOpen, setValue]);

  const handleDelete = () => {
    const isDark = theme === "dark";
    Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción no se puede deshacer y perdera todos los registros relacionados a este producto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: isDark ? "#18181b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
    }).then((result) => {
      if (result.isConfirmed && productToEdit?.id) {
        deleteMutation.mutate(productToEdit.id);
        onClose();
      }
    });
  };

  const onSubmit = async (data: any) => {
    const res = productToEdit?.id
      ? await updateMutation.mutateAsync({ id: productToEdit.id, data })
      : await createMutation.mutateAsync(data);

    if (res?.error) {
      const msg = res.error.toLowerCase();
      if (msg.includes("código"))
        setError("codigo", { type: "manual", message: res.error });
      else if (msg.includes("nombre"))
        setError("nombre", { type: "manual", message: res.error });
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <MagicCard className="w-full max-w-lg p-6 shadow-2xl rounded-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package
              className={`size-6 ${productToEdit ? "text-blue-500" : "text-green-500"}`}
            />
            <h2
              className={`text-xl font-bold ${productToEdit ? "text-blue-500" : "text-green-500"}`}
            >
              {productToEdit ? "Editar Producto" : "Nuevo Producto"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Código
              </label>
              <input
                {...register("codigo")}
                className={`w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${errors.codigo ? "border-red-500" : "border-input"}`}
              />
              {errors.codigo && (
                <span className="text-[10px] text-red-500 font-bold uppercase">
                  {errors.codigo.message as string}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Nombre
              </label>
              <input
                {...register("nombre")}
                placeholder="Ej. Arena de Río"
                className={`w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${errors.nombre ? "border-red-500" : "border-input"}`}
              />
              {errors.nombre && (
                <span className="text-[10px] text-red-500 font-bold uppercase">
                  {errors.nombre.message as string}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Precio Base (Q)
              </label>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("precio_base")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Medida
              </label>
              <input
                {...register("medida")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/20 border border-dashed border-border/50">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase flex items-center gap-1">
                Stock Mínimo{" "}
                <AlertTriangle className="size-3 text-orange-500" />
              </label>
              <input
                type="number"
                step="0.01"
                {...register("stock_minimo")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Stock Actual
              </label>
              <input
                type="number"
                step="0.01"
                {...register("stock_actual")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
          </div>

          {productToEdit && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/5">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-foreground/70 uppercase">
                  Estado del Producto
                </label>
                <p className="text-[10px] text-muted-foreground italic">
                  {isActive
                    ? "Disponible para la venta"
                    : "No disponible en el catálogo"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("activo")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-red-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            <div>
              {productToEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 border border-red-500/50 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer uppercase active:scale-95"
                >
                  <Trash2 className="size-4" /> Eliminar
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-8 py-2 text-xs font-bold border transition-all cursor-pointer active:scale-95 uppercase tracking-wider rounded-lg
                ${
                  productToEdit
                    ? "text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                    : "text-green-500 border-green-500/50 hover:bg-green-500/10"
                } ${isSubmitting ? "opacity-40" : ""}`}
            >
              <Save className="size-4" />
              {isSubmitting
                ? "Procesando..."
                : productToEdit
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </MagicCard>
    </div>
  );
}

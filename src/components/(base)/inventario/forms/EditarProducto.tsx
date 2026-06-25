"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  created_at?: string;
}

interface EditarProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto | null;
}

export function EditarProducto({ isOpen, onClose, onSuccess, producto }: EditarProductoProps) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioBase, setPrecioBase] = useState("");
  const [stockActual, setStockActual] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [activo, setActivo] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar datos cuando cambie el producto o se abra la modal
  useEffect(() => {
    if (producto) {
      setCodigo(producto.codigo || "");
      setNombre(producto.nombre || "");
      setDescripcion(producto.descripcion || "");
      setPrecioBase(producto.precio_base?.toString() || "0");
      setStockActual(producto.stock_actual?.toString() || "0");
      setStockMinimo(producto.stock_minimo?.toString() || "0");
      setActivo(producto.activo !== false);
    }
  }, [producto, isOpen]);

  // Helper para obtener colores de SweetAlert según el tema activo (claro/oscuro)
  const getSwalThemeOpts = () => {
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return {
      background: isDark ? "#18181b" : "#F5F5F1",
      color: isDark ? "#F5F5F1" : "#525D53",
      confirmButtonColor: "#8DA78E",
      cancelButtonColor: "#525D53",
      customClass: {
        popup: "!rounded-3xl border-0",
      }
    };
  };

  const handleClose = () => {
    setValidationError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return;
    setValidationError(null);

    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
      setValidationError("El nombre del producto es requerido");
      return;
    }

    const priceNum = parseFloat(precioBase);
    if (isNaN(priceNum) || priceNum < 0) {
      setValidationError("El precio base debe ser un número válido mayor o igual a 0");
      return;
    }

    const stockActualNum = parseFloat(stockActual);
    if (isNaN(stockActualNum) || stockActualNum < 0) {
      setValidationError("El stock actual debe ser un número válido mayor o igual a 0");
      return;
    }

    const stockMinimoNum = parseFloat(stockMinimo);
    if (isNaN(stockMinimoNum) || stockMinimoNum < 0) {
      setValidationError("El stock mínimo debe ser un número válido mayor o igual a 0");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("inv_productos")
        .update({
          codigo: codigo.trim() || null,
          nombre: nombreTrimmed,
          descripcion: descripcion.trim() || null,
          precio_base: priceNum,
          stock_actual: stockActualNum,
          stock_minimo: stockMinimoNum,
          activo: activo
        })
        .eq("id", producto.id);

      if (error) {
        throw new Error(error.message);
      }

      Swal.fire({
        title: "¡Guardado!",
        text: "Los datos del producto han sido actualizados exitosamente en Supabase.",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        ...getSwalThemeOpts()
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el producto: " + err.message,
        icon: "error",
        ...getSwalThemeOpts(),
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Editar Producto"
      description="Modifica los detalles técnicos o ajusta los niveles de inventario del producto."
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={false}
      className="max-w-[90%] sm:max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-900 rounded-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex flex-col gap-3 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Código de Barras / ID
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
              placeholder="Ej: D30-4EB"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Nombre Comercial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
            />
            {validationError && validationError.includes("nombre") && (
              <p className="text-xs text-red-500 font-bold mt-1">{validationError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Descripción / Componentes
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Precio de Venta <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precioBase}
                onChange={(e) => setPrecioBase(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Existencias <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Stock Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="edit-activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="size-4 rounded border-slate-200 dark:border-slate-800 text-[#8DA78E] focus:ring-[#8DA78E]"
              />
              <label htmlFor="edit-activo" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase cursor-pointer">
                Producto Activo
              </label>
            </div>
          </div>
        </div>

        {validationError && !validationError.includes("nombre") && (
          <p className="text-xs text-red-500 font-bold mt-1">{validationError}</p>
        )}

        <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] font-bold transition-all text-xs"
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

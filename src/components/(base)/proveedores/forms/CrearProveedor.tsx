"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { guardarProveedor } from "../actions";
import Swal from "sweetalert2";

interface CrearProveedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CrearProveedor({ isOpen, onClose, onSuccess }: CrearProveedorProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nit, setNit] = useState("");
  const [areaCode, setAreaCode] = useState("+502");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleReset = () => {
    setNombre("");
    setDescripcion("");
    setNit("");
    setAreaCode("+502");
    setTelefono("");
    setCorreo("");
    setValidationError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
      setValidationError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const res = await guardarProveedor({
        nombre: nombreTrimmed,
        descripcion: descripcion.trim() || null,
        nit: nit.trim() || null,
        telefono: telefono.trim() ? `${areaCode} ${telefono.trim()}` : null,
        correo: correo.trim() || null,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      Swal.fire({
        title: "¡Guardado!",
        text: "El proveedor ha sido registrado exitosamente.",
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
        text: "No se pudo guardar el proveedor: " + err.message,
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
      title="Nuevo Proveedor"
      description="Registra la información de un nuevo proveedor para compras y facturas."
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={false}
      className="max-w-[90%] sm:max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-900 rounded-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex flex-col gap-3 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Nombre Comercial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
              required
            />
            {validationError && (
              <p className="text-red-500 text-[10px] mt-1 font-bold">{validationError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              NIT / Identificación Fiscal
            </label>
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
              placeholder="1234567-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Teléfono de Contacto
              </label>
              <div className="flex gap-2">
                <select
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  className="px-2 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors w-20 shrink-0"
                >
                  <option value="+502">+502</option>
                  <option value="+503">+503</option>
                  <option value="+504">+504</option>
                  <option value="+505">+505</option>
                  <option value="+506">+506</option>
                  <option value="+507">+507</option>
                  <option value="+52">+52</option>
                  <option value="+1">+1</option>
                </select>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
                  placeholder="5555-1234"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
                placeholder="proveedor@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Descripción / Notas
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors resize-none"
              placeholder="Distribuidora de medicamentos genéricos..."
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-900">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl font-bold cursor-pointer text-xs py-2"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-[#8DA78E] text-[#F5F5F1] rounded-xl font-bold cursor-pointer text-xs py-2"
          >
            {isLoading ? "Guardando..." : "Guardar Proveedor"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

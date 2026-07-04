"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { guardarProveedor } from "../actions";
import Swal from "sweetalert2";

interface Proveedor {
  id: string;
  nombre: string;
  descripcion?: string | null;
  nit?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

interface EditarProveedorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  proveedor: Proveedor | null;
}

export function EditarProveedor({ isOpen, onClose, onSuccess, proveedor }: EditarProveedorProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nit, setNit] = useState("");
  const [areaCode, setAreaCode] = useState("+502");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar datos cuando cambia el proveedor
  useEffect(() => {
    if (proveedor) {
      setNombre(proveedor.nombre || "");
      setDescripcion(proveedor.descripcion || "");
      setNit(proveedor.nit || "");
      if (proveedor.telefono) {
        const telStr = proveedor.telefono.trim();
        const match = telStr.match(/^(\+\d{1,4})\s?(.*)$/);
        if (match) {
          setAreaCode(match[1]);
          setTelefono(match[2]);
        } else {
          setAreaCode("+502");
          setTelefono(telStr);
        }
      } else {
        setAreaCode("+502");
        setTelefono("");
      }
      setCorreo(proveedor.correo || "");
    }
    setValidationError(null);
  }, [proveedor]);

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

    if (!proveedor) return;

    setIsLoading(true);
    try {
      const res = await guardarProveedor({
        id: proveedor.id,
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
        title: "¡Actualizado!",
        text: "La información del proveedor ha sido actualizada con éxito.",
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
        text: "No se pudo actualizar el proveedor: " + err.message,
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
      title="Editar Proveedor"
      description="Modifica la información de contacto y de registro del proveedor seleccionado."
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
            className="bg-[#8DA78E] hover:bg-[#525D53] text-[#F5F5F1] rounded-xl font-bold cursor-pointer text-xs py-2"
          >
            {isLoading ? "Actualizando..." : "Actualizar Proveedor"}
          </Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

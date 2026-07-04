"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  nit: string;
  totalCompras: number;
  ultimaCompra: string;
  saldo: number;
  activo: boolean;
}

interface EditarClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cliente: Cliente | null;
}

export function EditarCliente({ isOpen, onClose, onSuccess, cliente }: EditarClienteProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [areaCode, setAreaCode] = useState("+502");
  const [direccion, setDireccion] = useState("");
  const [nit, setNit] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cargar datos cuando cambie el cliente o se abra la modal
  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre || "");
      setEmail(cliente.email === "No registrado" ? "" : cliente.email || "");
      if (cliente.telefono && cliente.telefono !== "No registrado") {
        const telStr = cliente.telefono.trim();
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
      setDireccion(cliente.direccion === "No registrada" ? "" : cliente.direccion || "");
      setNit(cliente.nit === "C/F" ? "" : cliente.nit || "");
    }
  }, [cliente, isOpen]);

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
    if (!cliente) return;
    setValidationError(null);

    const nombreTrimmed = nombre.trim();
    if (!nombreTrimmed) {
      setValidationError("El nombre es requerido");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("ven_clientes")
        .update({
          nombre: nombreTrimmed,
          email: email.trim() || null,
          telefono: telefono.trim() ? `${areaCode} ${telefono.trim()}` : null,
          direccion: direccion.trim() || null,
          nit: nit.trim() || null,
        })
        .eq("id", cliente.id);

      if (error) {
        throw new Error(error.message);
      }

      Swal.fire({
        title: "¡Guardado!",
        text: "Los datos del cliente han sido actualizados exitosamente en Supabase.",
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
        text: "No se pudo actualizar el cliente: " + err.message,
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
      title="Editar Cliente"
      description="Modifica los datos del cliente seleccionado en el sistema."
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={false}
      className="max-w-[90%] sm:max-w-md bg-white dark:bg-zinc-950 border border-slate-200 dark:border-slate-900 rounded-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex flex-col gap-3 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
            />
            {validationError && (
              <p className="text-xs text-red-500 font-bold mt-1">{validationError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              Teléfono
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
              Dirección
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
              NIT
            </label>
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#8DA78E] focus:outline-none transition-colors"
            />
          </div>
        </div>

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

import { useState } from "react";
import { X } from "lucide-react";
import { updateEstadoVenta } from "../lib/actions";
import { MagicCard } from "@/components/ui/magic-card";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";

export default function StatusModal({ isOpen, onClose, venta }: any) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  if (!isOpen || !venta) return null;

  const handleDeliver = async () => {
    setLoading(true);
    const res = await updateEstadoVenta(venta.id, "Entregado", "");

    if (res?.success) {
      onClose();

      await Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Producto entregado correctamente",
        showConfirmButton: false,
        timer: 1500,
      });

      queryClient.invalidateQueries({ queryKey: ["ventas"] });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <MagicCard className="w-full max-w-2xl p-8 shadow-2xl rounded-2xl relative animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Marcar como entregado
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleDeliver}
            disabled={loading}
            className="w-full h-75 md:h-100 flex flex-col items-center justify-center gap-2 p-8 border-4 rounded-3xl cursor-pointer transition-all border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]"
          >
            <span className="font-black text-4xl md:text-5xl uppercase tracking-tighter text-center">
              {loading ? "..." : "Entregado"}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full py-4 border-2 rounded-xl cursor-pointer transition-all bg-background text-muted-foreground border-border hover:bg-muted/50 disabled:opacity-50 font-black text-xl md:text-2xl uppercase tracking-widest"
          >
            Volver
          </button>
        </div>
      </MagicCard>
    </div>
  );
}

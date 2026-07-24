"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { getSwalThemeOpts } from "@/lib/utils";
import { ModalShell } from "@/components/ui/ModalShell";
import { fmtQ } from "@/lib/utils";
import type { CreditoResumen } from "../lib/zod";
import { useRegistrarMovimiento } from "../../finanzas/lib/hooks";

interface ModalAbonoProps {
  cliente: CreditoResumen;
  ventaId: string;
  saldoRestante: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalAbono({
  cliente,
  ventaId,
  saldoRestante,
  onClose,
  onSuccess
}: ModalAbonoProps) {
  const [monto, setMonto] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  
  const { mutateAsync: registrarMovimiento, isPending } = useRegistrarMovimiento();

  const handleAbonar = async () => {
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) {
      Swal.fire({ title: "Monto inválido", text: "Ingresa un monto válido mayor a 0", icon: "warning", ...getSwalThemeOpts() });
      return;
    }
    if (val > saldoRestante) {
      Swal.fire({ title: "Monto excedido", text: `El monto no puede ser mayor al saldo restante (${fmtQ(saldoRestante)})`, icon: "warning", ...getSwalThemeOpts() });
      return;
    }

    try {
      await registrarMovimiento({
        tipo_movimiento: "ingreso",
        categoria: "abono_cliente",
        venta_id: ventaId,
        monto: val,
        descripcion: descripcion.trim() || `Abono a crédito de ${cliente.nombre}`,
      });
      Swal.fire({ title: "Éxito", text: "Abono registrado correctamente", icon: "success", ...getSwalThemeOpts() });
      onSuccess();
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err.message || "No se pudo registrar el abono", icon: "error", ...getSwalThemeOpts() });
    }
  };

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Registrar Abono"
      description="Ingresa el monto a abonar al crédito seleccionado."
    >
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Saldo Pendiente</label>
          <p className="text-lg font-black text-rose-500">{fmtQ(saldoRestante)}</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Monto a Abonar (Q)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#8DA78E] focus:ring-1 focus:ring-[#8DA78E]"
            placeholder="0.00"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 mb-1 uppercase">Descripción (Opcional)</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-[#8DA78E] focus:ring-1 focus:ring-[#8DA78E] text-sm"
            placeholder={`Abono de ${cliente.nombre}...`}
          />
        </div>
      </div>
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer">Cancelar</button>
        <button onClick={handleAbonar} disabled={isPending} className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8DA78E] text-white disabled:opacity-50 cursor-pointer">
          {isPending ? "Procesando..." : "Confirmar Abono"}
        </button>
      </div>
    </ModalShell>
  );
}

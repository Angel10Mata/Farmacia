"use client";

import { Users, ChevronRight, CreditCard } from "lucide-react";
import { ClienteCredito } from "../lib/zod";

interface CreditosListProps {
  clientes: ClienteCredito[];
  onSelectCliente: (cliente: ClienteCredito) => void;
}

export default function CreditosList({
  clientes,
  onSelectCliente,
}: CreditosListProps) {
  if (clientes.length === 0) {
    return (
      <div className="col-span-full p-12 flex flex-col items-center justify-center text-muted-foreground border-2 rounded-3xl border-dashed">
        <CreditCard className="size-12 mb-4 opacity-20" />
        <p className="font-bold text-lg uppercase tracking-tight">
          Sin créditos activos
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {clientes.map((cliente) => (
        <div
          key={cliente.cliente_id}
          onClick={() => onSelectCliente(cliente)}
          className="bg-card border rounded-2xl md:rounded-3xl p-5 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/5 transition-all cursor-pointer group flex flex-col justify-between h-full"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg shrink-0">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  {cliente.nit}
                </span>
              </div>
              <span className="bg-red-500/10 text-red-500 text-[10px] md:text-xs font-black px-3 py-1.5 rounded-lg uppercase text-center">
                {cliente.cantidadPedidos} Pendientes
              </span>
            </div>

            <h3 className="font-black text-lg md:text-xl leading-tight line-clamp-2">
              {cliente.nombre}
            </h3>
          </div>

          <div className="mt-6 flex items-end justify-between border-t border-border/50 pt-5">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Deuda Acumulada
              </p>
              <p className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">
                Q
                {cliente.totalDeuda.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all group-active:scale-95 shrink-0">
              <ChevronRight className="size-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { formatFechaRecibo, formatMonedaRecibo, obtenerCodigoRecibo } from "./recibo-utils";

export interface ReciboVentaItem {
  cantidad: number;
  nombre: string;
  descripcion?: string | null;
  subtotal: number;
}

export interface ReciboVentaProps {
  codigo: string;
  fecha: string;
  cliente: string;
  nit: string;
  formaPago: string;
  items: ReciboVentaItem[];
  total: number;
  observaciones?: string | null;
  className?: string;
  id?: string;
}

function CampoRecibo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#525D53]">{label}</p>
      <p className="mt-1 border-b border-[#525D53]/35 pb-1 text-[11px] font-medium text-[#1a1a1a] truncate">
        {value}
      </p>
    </div>
  );
}

export function ReciboVenta({
  codigo,
  fecha,
  cliente,
  nit,
  formaPago,
  items,
  total,
  observaciones,
  className,
  id,
}: ReciboVentaProps) {
  return (
    <div
      id={id}
      className={cn(
        "recibo-venta w-[816px] min-h-[528px] mx-auto bg-white text-[#1a1a1a] font-serif px-8 py-7 box-border flex flex-col",
        className,
      )}
    >
      <div className="mb-6 flex flex-row items-center justify-between gap-4">
        {/* Logo y Título a la izquierda */}
        <div className="flex flex-row items-center gap-2 text-left">
          <div className="w-[150px] h-[150px] shrink-0">
            <img src="/farmacia-la-salud/logo.png" alt="Logo Farmacia Salud" className="w-full h-full object-contain object-center" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight leading-none mb-1 text-[#1a1a1a]">
              FARMACIA<br />LA SALUD
            </h1>
            <p className="text-sm italic text-gray-600 font-medium leading-tight">Guatemala • Recibo de venta</p>
          </div>
        </div>

        {/* Número a la derecha */}
        <div className="shrink-0 border border-[#525D53]/40 bg-white px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#1a1a1a]">
          No. {codigo}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4">
        <CampoRecibo label="Fecha" value={fecha} />
        <CampoRecibo label="Cliente" value={cliente?.toLowerCase().trim() === "consumidor final" ? "C/F" : cliente} />
        <CampoRecibo label="NIT" value={nit} />
        <CampoRecibo label="Pago" value={formaPago} />
      </div>

      <div className="mb-4 border-t-2 border-[#1a1a1a] pt-2">
        <div className="grid grid-cols-[52px_1fr_88px] gap-2 text-[10px] font-bold uppercase tracking-wide text-[#525D53]">
          <span>Cant.</span>
          <span>Detalle</span>
          <span className="text-right">Subtotal</span>
        </div>
      </div>

      <div className="flex flex-col">
        {items.map((item, idx) => (
          <div
            key={`${item.nombre}-${idx}`}
            className="grid grid-cols-[52px_1fr_88px] gap-2 border-b border-[#525D53]/12 py-2.5 text-[11px] last:border-b-0"
          >
            <span className="font-semibold text-[#1a1a1a]">{item.cantidad}</span>
            <div className="min-w-0">
              <p className="font-medium leading-snug text-[#1a1a1a]">{item.nombre}</p>
              {item.descripcion && (
                <p className="mt-0.5 text-[10px] italic leading-snug text-[#525D53]">
                  {item.descripcion}
                </p>
              )}
            </div>
            <span className="text-right font-semibold text-[#1a1a1a]">
              {formatMonedaRecibo(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-end justify-between gap-6 border-t border-[#525D53]/20 pt-5">
        <div className="min-w-[120px] flex-1">
          <div className="border-b border-[#525D53]/35 pb-1" />
          <p className="mt-1 text-[10px] italic text-[#525D53]">Firma y sello</p>
        </div>
        <div className="text-right">
          <div className="border-t-2 border-[#1a1a1a] pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#525D53]">
              Total a pagar
            </p>
            <p className="mt-1 text-[22px] font-bold leading-none text-[#1a1a1a]">
              {formatMonedaRecibo(total)}
            </p>
          </div>
        </div>
      </div>

      {observaciones && (
        <p className="mt-4 text-[10px] italic text-[#525D53]">
          <span className="font-semibold not-italic">Notas:</span> {observaciones}
        </p>
      )}

      <div className="mt-auto pt-6">
        <p className="text-center text-[11px] italic text-[#525D53]">
          Gracias por su compra
        </p>

        <div className="mt-4 flex justify-end">
          <div className="border-t border-dashed border-[#525D53]/45 pt-1 text-[9px] italic text-[#525D53]/70">
            línea de corte
          </div>
        </div>
      </div>
    </div>
  );
}

export function mapDetallesToReciboItems(detalles: any[]): ReciboVentaItem[] {
  return detalles.map((d) => ({
    cantidad: d.cantidad,
    nombre: d.inv_productos?.nombre || "Producto",
    descripcion: d.inv_productos?.codigo
      ? `${d.inv_productos.codigo}${d.precio_aplicado ? ` · Q${d.precio_aplicado.toFixed(2)} c/u` : ""}`
      : d.precio_aplicado
        ? `Q${d.precio_aplicado.toFixed(2)} c/u`
        : null,
    subtotal: d.subtotal,
  }));
}

export function buildReciboProps(
  venta: any,
  detalles: any[],
  clienteCompleto?: any,
) {
  return {
    codigo: obtenerCodigoRecibo(venta.id),
    fecha: formatFechaRecibo(venta.created_at),
    cliente:
      clienteCompleto?.nombre || venta.ven_clientes?.nombre || "Consumidor final",
    nit: clienteCompleto?.nit || venta.ven_clientes?.nit || "C/F",
    formaPago: venta.tipo_venta || "Contado",
    items: mapDetallesToReciboItems(detalles),
    total: venta.total,
    observaciones: venta.observaciones,
  };
}

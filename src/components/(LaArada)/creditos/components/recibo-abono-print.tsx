"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ReciboAbonoPrint() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);

    const handlePrint = (e: any) => {
      setData(e.detail);
      setTimeout(() => {
        window.print();
        setTimeout(() => setData(null), 500);
      }, 100);
    };

    window.addEventListener("imprimir-pago-directo", handlePrint);
    return () =>
      window.removeEventListener("imprimir-pago-directo", handlePrint);
  }, []);

  if (!mounted || !data) return null;

  const { pago, venta, cliente } = data;

  return createPortal(
    <div id="ticket-print">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media screen { #ticket-print { display: none; } }
        @media print {
          @page { margin: 0; }
          body * { visibility: hidden; }
          #ticket-print, #ticket-print * { visibility: visible; }
          #ticket-print { 
            position: absolute; left: 0; top: 0; width: 80mm; padding: 5mm; 
            color: black; font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.2;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .my-1 { margin: 4px 0; }
          .border-b { border-bottom: 1px dashed black; }
        }
      `,
        }}
      />
      <div className="text-center font-bold text-[16px] mb-1">La Arada</div>
      <div className="text-center text-[13px] font-bold">
        COMPROBANTE DE PAGO
      </div>
      <div className="text-center text-[10px] mb-3">
        {pago.created_at
          ? new Date(pago.created_at).toLocaleString("es-GT")
          : "N/A"}
      </div>

      <div className="border-b my-1"></div>

      <div>
        <span className="font-bold text-[10px]">RECIBO:</span> #
        {pago.id.slice(0, 6).toUpperCase()}
      </div>
      <div>
        <span className="font-bold text-[10px]">VENTA:</span> #
        {venta.numero_recibo
          ? String(venta.numero_recibo).padStart(5, "0")
          : venta.id.slice(0, 6).toUpperCase()}
      </div>
      <div>
        <span className="font-bold text-[10px]">CLIENTE:</span>{" "}
        {cliente?.nombre}
      </div>
      <div>
        <span className="font-bold text-[10px]">DEUDA:</span> Q
        {Number(venta.total).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}
      </div>
      <div>
        <span className="font-bold text-[10px]">ABONO:</span> Q
        {Number(pago.monto).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}
      </div>
      <div>
        <span className="font-bold text-[10px]">RESTANTE:</span> Q
        {Number(venta.saldo_pendiente ?? 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}
      </div>

      <div className="border-b my-1"></div>

      <div>
        <span className="font-bold text-[10px]">VENDEDOR:</span>{" "}
        {venta.vendedor_nombre}
      </div>
      <div>
        <span className="font-bold text-[10px]">CAJERO:</span>{" "}
        {pago.cajero_nombre}
      </div>

      <div className="border-b my-1"></div>

      <div className="text-center text-[10px] mt-6">¡Gracias por su pago!</div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useState } from "react";
import * as React from "react";
import {
  X,
  Printer,
  FileText,
  Receipt,
  FileCheck2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { getVentaById, updateEstadoVenta } from "../lib/actions";
import { useCertificar, useAnular } from "@/hooks/useInfile";
import type { INFILEResponse } from "@/types/infile";
import { getEmisorConfig, buildXMLFactura } from "@/lib/infile";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { MagicCard } from "@/components/ui/magic-card";
import Swal from "sweetalert2";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaId: string | null;
  isReadonly?: boolean;
}

type Tab = "recibo" | "factura";

/** Renders children at a fixed half-letter size (816×528 at 96dpi) scaled 
 *  to always fit inside the available container width. */
function ScaledDocument({ children }: { children: React.ReactNode }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [scaledHeight, setScaledHeight] = React.useState<number | undefined>(undefined);

  const DOC_W = 816;

  React.useEffect(() => {
    const outer = wrapRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const available = outer.clientWidth;
      const s = available > 0 ? Math.min(1, available / DOC_W) : 1;
      setScale(s);
      setScaledHeight(inner.scrollHeight * s);
    };

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    update();
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: scaledHeight ?? "auto", overflow: "hidden" }}>
      <div ref={innerRef} style={{ transformOrigin: "top left", transform: `scale(${scale})`, width: DOC_W }}>
        {children}
      </div>
    </div>
  );
}

export default function ReceiptModal({
  isOpen,
  onClose,
  ventaId,
  isReadonly = false,
}: ReceiptModalProps) {
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("recibo");

  const { certificar, loading: certificando, error: infileError, respuesta, reset } = useCertificar();
  const { anular, loading: anulando, error: anularError } = useAnular();
  const [nitReceptor, setNitReceptor] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("CONSUMIDOR FINAL");
  const [correoReceptor, setCorreoReceptor] = useState("");
  const [facturaCF, setFacturaCF] = useState(true);
  const [waNumber, setWaNumber] = useState("");
  const [infileResult, setInfileResult] = useState<INFILEResponse | null>(null);

  const user = useUser();

  useEffect(() => {
    if (isOpen && ventaId) {
      setLoading(true);
      setTab("recibo");
      reset();
      setInfileResult(null);
      getVentaById(ventaId).then((data) => {
        setVenta(data);
        if (data?.dte_documentos?.length > 0) {
          const activos = data.dte_documentos.filter((d: any) => d.estado === "certificado");
          if (activos.length > 0) setTab("factura");
          const dte = activos.length > 0 ? activos[0] : data.dte_documentos[data.dte_documentos.length - 1];
          setInfileResult({
            resultado: true,
            serie: dte.serie,
            numero: dte.numero?.toString() || "",
            uuid: dte.uuid_infile,
            fecha: dte.fecha_certificacion,
            alertas_infile: !!dte.alertas_infile?.length,
            descripcion_alertas_infile: dte.alertas_infile ?? [],
          } as INFILEResponse);
          if (dte.id_receptor) setNitReceptor(dte.id_receptor);
          if (dte.nombre_receptor) setNombreReceptor(dte.nombre_receptor);
          if (dte.id_receptor && dte.id_receptor !== "CF") setFacturaCF(false);
        } else {
          if (data?.ven_clientes?.nit && data.ven_clientes.nit !== "C/F") {
            setNitReceptor(data.ven_clientes.nit);
            setFacturaCF(false);
          }
          if (data?.ven_clientes?.nombre) setNombreReceptor(data.ven_clientes.nombre);
        }
        setLoading(false);
      });
    } else {
      setVenta(null);
    }
  }, [isOpen, ventaId, reset]);

  const handlePrint = () => {
    const content = document.getElementById("print-container")?.innerHTML;
    if (!content) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<html><head><title>Recibo_Venta</title><style>
        @page { margin: 0; size: 8.5in 5.5in; }
        @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; width: 100%; margin: 0; padding: 20px 20px 0 20px; color: black; line-height: 1.3; background: white; }
        table { border-collapse: collapse; width: 100%; } th, td { vertical-align: top; }
        p, h1, h2, h3, div { margin: 0; }
      </style></head><body>${content}</body></html>`);
      doc.close();

      const images = Array.from(iframe.contentDocument?.images ?? []) as HTMLImageElement[];
      if (images.length > 0) {
        let loaded = 0;
        const tryPrint = () => { loaded++; if (loaded >= images.length) { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1500); } };
        images.forEach(img => { if (img.complete) { tryPrint(); } else { img.onload = tryPrint; img.onerror = tryPrint; } });
      } else {
        setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 250);
      }
    }
  };


  const handleCertificar = async () => {
    if (!venta) return;

    const nitFinal = facturaCF ? "CF" : (nitReceptor.trim().toUpperCase() || "CF");
    const nombreFinal = facturaCF ? "CONSUMIDOR FINAL" : (nombreReceptor.trim() || "CONSUMIDOR FINAL");

    const granTotal = venta.total ?? 0;
    const montoGravable = parseFloat((granTotal / 1.12).toFixed(2));
    const montoIVA = parseFloat((granTotal - montoGravable).toFixed(2));

    const items = venta.ven_detalle?.map((item: any, idx: number) => {
      const itemTotal = item.subtotal ?? 0;
      const ig = parseFloat((itemTotal / 1.12).toFixed(2));
      const iva = parseFloat((itemTotal - ig).toFixed(2));
      return {
        numeroLinea: idx + 1,
        bienOServicio: "B" as const,
        cantidad: item.cantidad,
        unidadMedida: item.inv_productos?.medida || "UNI",
        descripcion: item.inv_productos?.nombre || "Producto",
        precioUnitario: item.precio_aplicado ?? 0,
        precio: itemTotal,
        descuento: 0,
        impuestos: [
          {
            nombreCorto: "IVA" as const,
            codigoUnidadGravable: 1,
            montoGravable: ig,
            montoImpuesto: iva,
          },
        ],
        total: itemTotal,
      };
    }) ?? [];

    const now = new Date();
    const offset = "-06:00";
    const fechaISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}${offset}`;

    const resultado = await certificar({
      tipo: "FACT",
      codigoMoneda: "GTQ",
      fechaHoraEmision: fechaISO,
      emisor: getEmisorConfig(),
      receptor: {
        idReceptor: nitFinal,
        nombreReceptor: nombreFinal,
        ...(correoReceptor.trim() ? { correoReceptor: correoReceptor.trim() } : {}),
        direccion: {
          direccion: "CIUDAD",
          codigoPostal: "01010",
          municipio: "GUATEMALA",
          departamento: "GUATEMALA",
          pais: "GT",
        },
      },
      fraseTipo: 1,
      fraseEscenario: 1,
      items,
      totales: {
        totalIVA: montoIVA,
        granTotal,
      },
      ventaId: venta.id,
    });

    if (resultado) {
      if (resultado.resultado) {
        setInfileResult(resultado);
        if (ventaId) {
          const updatedVenta = await getVentaById(ventaId);
          setVenta(updatedVenta);
        }
      } else {
        const rawMsjs = resultado.descripcion_errores?.map(e => e.mensaje_error).join("\n") || "";
        const cleanMsjs = rawMsjs.split('\n').map(msg => {
          const parts = msg.split('|');
          let text = parts[parts.length - 1]?.trim() || msg;
          text = text.replace(/^Error\s*-\s*/i, '');
          return text;
        }).join('\n') || "Rechazada por SAT/INFILE.";

        await Swal.fire({
          didOpen: () => {
            const swalContainer = Swal.getContainer();
            if (swalContainer) {
              swalContainer.style.setProperty("z-index", "99999", "important");
            }
          },
          title: "Factura Rechazada",
          text: cleanMsjs,
          icon: "error",
          confirmButtonColor: "#e11d48",
        });
        setInfileResult(null);
      }
    }
  };

  const handleAnular = async () => {
    if (!venta?.dte_documentos?.length || !infileResult?.uuid) return;
    const dte = venta.dte_documentos.find((d: any) => d.uuid_infile === infileResult.uuid);
    if (!dte) return;
    
    if (dte.estado === "anulado") return;

    const result = await Swal.fire({
      didOpen: () => {
        const swalContainer = Swal.getContainer();
        if (swalContainer) {
          swalContainer.style.setProperty("z-index", "99999", "important");
        }
      },
      title: 'Anular Factura Electrónica',
      text: 'Por favor, ingrese el motivo por el cual está anulando este documento.',
      input: 'text',
      inputPlaceholder: 'Ej: Cliente solicitó la devolución del producto',
      showCancelButton: true,
      confirmButtonText: 'Anular ante la SAT',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      icon: 'warning',
      inputValidator: (value) => {
        if (!value || value.length < 5) {
          return 'Debe ingresar un motivo válido (mínimo 5 caracteres).';
        }
      }
    });

    if (!result.isConfirmed) return;
    const motivo = result.value;

    const getGmtMinus6ISO = (dateStr: string) => {
      const d = new Date(dateStr);
      const gtTime = new Date(d.getTime() - 6 * 60 * 60 * 1000);
      return `${gtTime.getUTCFullYear()}-${String(gtTime.getUTCMonth()+1).padStart(2, '0')}-${String(gtTime.getUTCDate()).padStart(2, '0')}T${String(gtTime.getUTCHours()).padStart(2, '0')}:${String(gtTime.getUTCMinutes()).padStart(2, '0')}:${String(gtTime.getUTCSeconds()).padStart(2, '0')}-06:00`;
    };

    const input = {
      uuidAAnular: dte.uuid_infile,
      nitEmisor: getEmisorConfig().nitEmisor,
      idReceptor: dte.id_receptor,
      fechaEmisionDocumento: getGmtMinus6ISO(dte.fecha_emision),
      fechaHoraAnulacion: getGmtMinus6ISO(new Date().toISOString()),
      motivoAnulacion: motivo,
    };

    const resultado = await anular(input);
    if (resultado?.resultado) {
      await Swal.fire({
        didOpen: () => {
          const swalContainer = Swal.getContainer();
          if (swalContainer) {
            swalContainer.style.setProperty("z-index", "99999", "important");
          }
        },
        title: "¡Factura Anulada!",
        text: "La factura fue invalidada exitosamente en la plataforma de la SAT.",
        icon: "success",
        confirmButtonColor: "#059669",
      });

      setVenta({
        ...venta,
        dte_documentos: [{ ...dte, estado: "anulado" }]
      });

      const resVenta = await Swal.fire({
        didOpen: () => {
          const swalContainer = Swal.getContainer();
          if (swalContainer) {
            swalContainer.style.setProperty("z-index", "99999", "important");
          }
        },
        title: "¿Anular también la venta?",
        text: "La factura ya está anulada fiscalmente. ¿Deseas anular también el registro de la venta en el sistema para devolver el inventario?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, anular venta total",
        cancelButtonText: "No, mantener venta interna",
        confirmButtonColor: "#e11d48",
      });

      if (resVenta.isConfirmed) {
        await updateEstadoVenta(venta.id, "Anulado", motivo);
        await Swal.fire({
          didOpen: () => {
            const swalContainer = Swal.getContainer();
            if (swalContainer) {
              swalContainer.style.setProperty("z-index", "99999", "important");
            }
          },
          title: "¡Venta interna anulada!",
          text: "El stock de los productos ha sido devuelto exitosamente.",
          icon: "success",
          confirmButtonColor: "#059669",
        });
      }
    } else if (resultado) {
      const msjs = resultado.descripcion_errores?.map(e => e.mensaje_error).join(", ") || "Rechazada por SAT/INFILE.";
      await Swal.fire({
        didOpen: () => {
          const swalContainer = Swal.getContainer();
          if (swalContainer) {
            swalContainer.style.setProperty("z-index", "99999", "important");
          }
        },
        title: "No se pudo anular",
        text: msjs,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  if (!isOpen) return null;

  const dteActivo = venta?.dte_documentos?.find((d: any) => d.estado === "certificado");
  const tipoComprobante = dteActivo 
    ? (dteActivo.id_receptor === "CF" ? "Factura CF" : "Factura NIT") 
    : (venta?.tipo_comprobante || "Recibo");
  const isFacturaComprobante = tipoComprobante.includes("Factura");
  const nitToPrint = dteActivo ? dteActivo.id_receptor : (isFacturaComprobante && venta?.ven_clientes?.nit ? venta.ven_clientes.nit : "C/F");

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:p-4 text-foreground">
        <MagicCard className="w-full max-w-3xl p-0 shadow-2xl rounded-xl max-h-[98vh] sm:max-h-[95vh] flex flex-col overflow-hidden bg-background">

          <div className="flex flex-col gap-3 p-4 border-b bg-muted/50 shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold flex items-center gap-2">
                <FileText className="size-5" /> Vista Previa de Venta
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

          <div className="flex gap-2">
            {loading ? (
              <>
                <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-lg" />
                <div className="h-9 w-48 bg-gray-200 animate-pulse rounded-lg" />
              </>
            ) : (
              <>
                {!dteActivo && (
                  <button
                    onClick={() => setTab("recibo")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      tab === "recibo"
                        ? "bg-blue-600 text-white shadow"
                        : "bg-background border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Receipt className="size-4" /> Recibo
                  </button>
                )}
                <button
                  onClick={() => setTab("factura")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    tab === "factura"
                      ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow"
                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <FileCheck2 className="size-4" /> Factura Electrónica (INFILE)
                </button>
              </>
            )}
          </div>
          </div>

          {loading ? (
            <div className="flex-1 overflow-y-auto p-8 space-y-6 animate-pulse">
            <div className="h-16 w-48 bg-gray-200 rounded-lg mx-auto mb-6" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/6 bg-gray-100 rounded" />
            </div>
            <div className="border-t-2 border-dashed border-gray-100 my-6" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-gray-50 rounded" />
              <div className="h-32 w-full bg-gray-50 rounded" />
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-xl mt-8" />
          </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {tab === "recibo" && !dteActivo && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="bg-muted/30 border-b px-4 py-4 shrink-0 space-y-3">
                  {!isReadonly && (
                    <div className="px-1">
                      <input
                        type="tel"
                        placeholder="Teléfono para enviar por WhatsApp (opcional)"
                        value={waNumber}
                        onChange={(e) => setWaNumber(e.target.value)}
                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs px-2 py-1.5 outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isReadonly && (
                      <a
                        href={(() => {
                          if (!venta) return "#";
                          const date = new Date(venta.created_at);
                          const formattedDate = `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`;
                          
                          const message = 
                          `¡Hola! 👋\n` +
                          `Aquí tiene su comprobante de compra:\n\n` +
                            `*Cod. Venta:* ${venta?.id?.substring(0, 3).toUpperCase()}-${venta?.id?.substring(3, 6).toUpperCase()}\n` +
                            `*CLIENTE:* ${venta.ven_clientes?.nombre || "Consumidor Final"}\n` +
                            `*TOTAL:* Q${venta?.total?.toFixed(2)}\n\n` +
                            `*VENDEDOR:* ${venta.vendedor?.nombre || "-"}\n` +
                            `*FECHA:* ${formattedDate}\n\n` +
                            `✨¡GRACIAS POR SU COMPRA!✨\n\n` +
                            `*${getEmisorConfig().nombreComercial}*  \n _Construyendo Junto a ti el Futuro_\n` +
                            `Tel: ${getEmisorConfig().telefono}\n\n`                     
                          const encodedMsg = encodeURIComponent(message);
                          const cleanPhone = waNumber.replace(/\D/g, '');
                          if (cleanPhone.length >= 8) {
                            const finalPhone = cleanPhone.startsWith('502') ? cleanPhone : '502' + cleanPhone;
                            return `https://api.whatsapp.com/send/?phone=${finalPhone}&text=${encodedMsg}`;
                          }
                          return `https://api.whatsapp.com/send/?text=${encodedMsg}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-1/2 flex items-center justify-center gap-2 px-3 py-2 bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-400 rounded-lg font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950 transition cursor-pointer"
                      >
                        <MessageCircle className="size-4" /> Enviar
                      </a>
                    )}
                    
                    <button
                      onClick={handlePrint}
                      className={`${isReadonly ? 'w-full' : 'w-1/2'} flex items-center justify-center gap-2 px-3 py-2 bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition cursor-pointer`}
                    >
                      <Printer className="size-4" /> Imprimir
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 sm:p-4">
                  <ScaledDocument>
                  <div
                    id="print-container"
                    style={{ width: 816, minWidth: 816, backgroundColor: "white", color: "black", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", boxSizing: "border-box" as const, border: "1px solid #000", paddingTop: "20px" }}
                  >
                    {venta ? (
                      <>
                        {/* ── HEADER: logo left, Label info right ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, borderBottom: "2px solid #000" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "10px 16px", verticalAlign: "middle", width: "55%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                  <img src="/logos/LaArada.png" alt="Logo" style={{ width: "36px", height: "36px", objectFit: "contain" as const, filter: "brightness(0)", flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontWeight: 900, fontSize: "18px", letterSpacing: "0.04em", textTransform: "uppercase" as const, lineHeight: 1, color: "#000" }}>{getEmisorConfig().nombreComercial}</div>
                                    <div style={{ fontSize: "8px", fontStyle: "italic" as const, marginTop: "2px", color: "#444" }}>Construyendo Junto a ti el Futuro</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: "8px", color: "#333" }}>{getEmisorConfig().direccion.direccion}, {getEmisorConfig().direccion.municipio}, {getEmisorConfig().direccion.departamento} | TEL: {getEmisorConfig().telefono}</div>
                                <div style={{ fontSize: "10px", color: "#333" }}>{getEmisorConfig().nombreEmisor} | NIT: {getEmisorConfig().nitEmisor}</div>
                              </td>
                              <td style={{ padding: "10px 16px", verticalAlign: "middle", textAlign: "right" as const, width: "45%" }}>
                                <div style={{ fontWeight: 900, fontSize: "18px", textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#000" }}>RECIBO DE VENTA</div>
                                <div style={{ fontSize: "11px", marginTop: "8px" }}><strong>Cod. Venta:</strong> {venta?.id?.substring(0, 3).toUpperCase()}-{venta?.id?.substring(3, 6).toUpperCase()}</div>
                                <div style={{ fontSize: "10px", marginTop: "3px" }}><strong>Fecha:</strong> {new Date(venta.created_at).toLocaleDateString("es-GT")}, {new Date(venta.created_at).toLocaleTimeString("es-GT")}</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* ── CUSTOMER ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, borderBottom: "1px solid #000" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "9px 20px", width: "55%", verticalAlign: "top" }}>
                                <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "55px", color: "#444" }}>Cliente:</span>
                                  <span>{venta.ven_clientes?.nombre.trim() || "CONSUMIDOR FINAL"}</span>
                                </div>
                              </td>
                              <td style={{ padding: "9px 20px", width: "45%", verticalAlign: "top" }}>
                                <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "65px", color: "#444" }}>Vendedor:</span>
                                  <span>{venta.vendedor?.nombre || "-"}</span>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* ── ITEMS TABLE ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "11px" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #000", borderTop: "none" }}>
                              <th style={{ padding: "7px 20px", textAlign: "left" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const, width: "60px" }}>Cant</th>
                              <th style={{ padding: "7px 8px", textAlign: "left" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Descripción</th>
                              <th style={{ padding: "7px 8px", textAlign: "right" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const, width: "110px" }}>P. Unitario</th>
                              <th style={{ padding: "7px 20px 7px 8px", textAlign: "right" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const, width: "90px" }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {venta.ven_detalle?.map((item: any, idx: number) => (
                              <tr key={idx} style={{ borderBottom: "1px solid #e5e5e5" }}>
                                <td style={{ padding: "5px 20px" }}>{item.cantidad} {item.inv_productos?.medida || ""}</td>
                                <td style={{ padding: "5px 8px" }}>{item.inv_productos?.nombre}</td>
                                <td style={{ padding: "5px 8px", textAlign: "right" as const }}>Q{item.precio_aplicado?.toFixed(2)}</td>
                                <td style={{ padding: "5px 20px 5px 8px", textAlign: "right" as const, fontWeight: 700 }}>Q{item.subtotal?.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* ── FOOTER ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, borderTop: "2px solid #000" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "20px", textAlign: "center" as const, verticalAlign: "middle" }}>
                                <div style={{ fontWeight: 900, fontSize: "14px", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>¡Gracias por su compra!</div>
                              </td>
                              <td style={{ padding: "12px 20px", verticalAlign: "middle", width: "250px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                                  <tbody>
                                    <tr>
                                      <td style={{ paddingTop: "5px", fontWeight: 900, fontSize: "16px" }}>TOTAL:</td>
                                      <td style={{ paddingTop: "5px", fontWeight: 900, fontSize: "20px", textAlign: "right" as const }}>Q{venta?.total?.toFixed(2)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground italic">
                        Cargando detalle de venta...
                      </div>
                    )}
                  </div>
                  </ScaledDocument>
                </div>
              </div>
              )}

              {tab === "factura" && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {infileResult?.resultado ? (
                  <div className="space-y-4">
                    <div className="space-y-3 shrink-0">
                      {/* Status banner: certificado o anulado */}
                      {(() => {
                        const currentDte = venta?.dte_documentos?.find((d: any) => d.uuid_infile === infileResult?.uuid);
                        if (currentDte?.estado === "anulado") return (
                          <div className="flex items-center gap-2 justify-center py-3 px-4 bg-red-500/10 rounded-xl border border-red-400/50">
                            <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
                            <div className="flex flex-col text-left">
                              <p className="font-bold text-sm text-red-600 dark:text-red-400 leading-none uppercase tracking-wide">Factura Anulada</p>
                              <p className="text-red-500/70 text-[10px] mt-1 leading-none italic">Documento invalidado ante la SAT</p>
                            </div>
                          </div>
                        );
                        return (
                          <div className="flex items-center gap-3 justify-center py-3 px-4 bg-sky-500/10 rounded-xl border border-sky-400/50 ring-1 ring-sky-400/10">
                            <CheckCircle2 className="size-5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <div className="flex flex-col text-left">
                              <p className="font-bold text-sm text-sky-600 dark:text-sky-400 leading-none uppercase tracking-wide">¡Factura Certificada!</p>
                              <p className="text-sky-500/70 dark:text-sky-400/50 text-[10px] mt-1 leading-none">Validada y autorizada por la SAT vía INFILE</p>
                            </div>
                          </div>
                        );
                      })()}

                      {!isReadonly && (
                        <div className="px-1">
                          <input
                             type="tel"
                             placeholder="Teléfono para enviar por WhatsApp (opcional)"
                             value={waNumber}
                             onChange={(e) => setWaNumber(e.target.value)}
                             className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1.5 outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!isReadonly && (
                          <a
                            href={(() => {
                              if (!venta) return "#";
                              const date = new Date(venta.created_at);
                              const formattedDate = `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`;
                              
                              const message = 
                              `¡Hola! 👋\n` +
                              `Aquí tiene su factura electrónica:\n` +
                              `https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=${infileResult.uuid}\n\n` +
                                `*Cod. Venta:* ${venta?.id?.substring(0, 3).toUpperCase()}-${venta?.id?.substring(3, 6).toUpperCase()}\n` +
                                `*CLIENTE:* ${venta.ven_clientes?.nombre || "Consumidor Final"}\n` +
                                `*TOTAL:* Q${venta?.total?.toFixed(2)}\n\n` +
                                `*VENDEDOR:* ${venta.vendedor?.nombre || "-"}\n` +
                                `*FECHA:* ${formattedDate}\n\n` +
                                `✨¡GRACIAS POR SU COMPRA!✨\n\n` +
                                `*${getEmisorConfig().nombreComercial}*  \n _Construyendo Junto a ti el Futuro_\n` +
                                `Tel: ${getEmisorConfig().telefono}\n\n`                         
                              const encodedMsg = encodeURIComponent(message);
                              const cleanPhone = waNumber.replace(/\D/g, '');
                              if (cleanPhone.length >= 8) {
                                const finalPhone = cleanPhone.startsWith('502') ? cleanPhone : '502' + cleanPhone;
                                return `https://api.whatsapp.com/send/?phone=${finalPhone}&text=${encodedMsg}`;
                              }
                              return `https://api.whatsapp.com/send/?text=${encodedMsg}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-1/2 flex items-center justify-center gap-2 px-3 py-2 bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-400 rounded-lg font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950 transition cursor-pointer"
                          >
                            <MessageCircle className="size-4" /> Enviar
                          </a>
                        )}
                        
                        <button
                          onClick={() => {
                          const content = document.getElementById("dte-print-container")?.innerHTML;
                            if (!content) return;
                            const iframe = document.createElement("iframe");
                            iframe.style.display = "none";
                            document.body.appendChild(iframe);
                            const doc = iframe.contentWindow?.document;
                            if (doc) {
                               doc.open();
                               doc.write(`<html><head><title>Factura_DTE</title><style>
                                 @page { margin: 0; size: 8.5in 5.5in; }
                                 @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
                                 * { box-sizing: border-box; }
                                 body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; width: 100%; margin: 0; padding: 20px 20px 0 20px; color: black; line-height: 1.3; background: white; }
                                 table { border-collapse: collapse; width: 100%; } th, td { vertical-align: top; }
                                 p, h1, h2, h3, div { margin: 0; }
                               </style></head><body>${content}</body></html>`);
                               doc.close();
                               const images = Array.from(iframe.contentDocument?.images ?? []) as HTMLImageElement[];
                               if (images.length > 0) {
                                 let loaded = 0;
                                 const tryPrint = () => { loaded++; if (loaded >= images.length) { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1500); } };
                                 images.forEach(img => { if (img.complete) { tryPrint(); } else { img.onload = tryPrint; img.onerror = tryPrint; } });
                               } else {
                                 setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 250);
                               }
                            }
                          }}
                          className={`${isReadonly ? 'w-full' : 'w-1/2'} flex items-center justify-center gap-2 px-3 py-2.5 bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition cursor-pointer`}
                        >
                          <Printer className="size-4" /> Imprimir
                        </button>
                      </div>
                    </div>

                    <div className="bg-muted/10 rounded-xl p-2 sm:p-4 overflow-y-auto">
                      <ScaledDocument>
                      <div
                        id="dte-print-container"
                        style={{ width: 816, minWidth: 816, backgroundColor: "white", color: "black", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", boxSizing: "border-box" as const, border: "1px solid #000", paddingTop: "20px" }}
                      >
                        {/* ── HEADER: logo left, DTE info right, thick bottom border ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, borderBottom: "2px solid #000" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "10px 16px", verticalAlign: "middle", width: "55%" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                  <img src="/logos/LaArada.png" alt="Logo" style={{ width: "36px", height: "36px", objectFit: "contain" as const, filter: "brightness(0)", flexShrink: 0 }} />
                                  <div>
                                    <div style={{ fontWeight: 900, fontSize: "18px", letterSpacing: "0.04em", textTransform: "uppercase" as const, lineHeight: 1, color: "#000" }}>{getEmisorConfig().nombreComercial}</div>
                                    <div style={{ fontSize: "8px", fontStyle: "italic" as const, marginTop: "2px", color: "#444" }}>Construyendo Junto a ti el Futuro</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: "8px", color: "#333" }}>{getEmisorConfig().direccion.direccion}, {getEmisorConfig().direccion.municipio}, {getEmisorConfig().direccion.departamento} | TEL: {getEmisorConfig().telefono}</div>
                                <div style={{ fontSize: "10px", color: "#333" }}>{getEmisorConfig().nombreEmisor} | NIT: {getEmisorConfig().nitEmisor}</div>
                              </td>
                              <td style={{ padding: "10px 16px", verticalAlign: "middle", textAlign: "right" as const, width: "45%" }}>
                                <div style={{ fontWeight: 900, fontSize: "15px", textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#000" }}>FACTURA ELECTRÓNICA</div>
                                <div style={{ fontSize: "8px", marginTop: "3px", color: "#555", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Documento Tributario Electrónico</div>
                                <div style={{ fontSize: "10px", marginTop: "6px" }}><strong>Serie:</strong> {infileResult.serie} &nbsp;&nbsp; <strong>No.:</strong> {infileResult.numero}</div>
                                <div style={{ fontSize: "9px", marginTop: "2px" }}><strong>Fecha de certificación:</strong> {infileResult.fecha ? new Date(infileResult.fecha).toLocaleString("es-GT") : "-"}</div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* ── CUSTOMER ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, borderBottom: "1px solid #000" }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: "9px 20px", width: "55%", verticalAlign: "top" }}>
                                <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "55px", color: "#444" }}>Cliente:</span>
                                  <span>{nombreReceptor.trim() || "CONSUMIDOR FINAL"}</span>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "55px", color: "#444" }}>NIT:</span>
                                  <span>{nitReceptor.trim() || "CF"}</span>
                                </div>
                              </td>
                              <td style={{ padding: "9px 20px", width: "45%", verticalAlign: "top" }}>
                                <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "65px", color: "#444" }}>Vendedor:</span>
                                  <span>{venta?.vendedor?.nombre || "-"}</span>
                                </div>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "10px", minWidth: "65px", color: "#444" }}>Cod. Venta:</span>
                                  <span>{venta?.id?.substring(0, 3).toUpperCase()}-{venta?.id?.substring(3, 6).toUpperCase()}</span>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* ── ITEMS TABLE ── */}
                        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "11px" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid #000", borderTop: "none" }}>
                              <th style={{ padding: "7px 20px", textAlign: "left" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const, width: "60px" }}>Cant</th>
                              <th style={{ padding: "7px 8px", textAlign: "left" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const }}>Descripción</th>
                              <th style={{ padding: "7px 8px", textAlign: "right" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const, width: "110px" }}>P. Unit./IVA</th>
                              <th style={{ padding: "7px 20px 7px 8px", textAlign: "right" as const, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", textTransform: "uppercase" as const, width: "90px" }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {venta?.ven_detalle?.map((item: any, idx: number) => (
                              <tr key={idx} style={{ borderBottom: "1px solid #e5e5e5" }}>
                                <td style={{ padding: "5px 20px" }}>{item.cantidad} {item.inv_productos?.medida || ""}</td>
                                <td style={{ padding: "5px 8px" }}>{item.inv_productos?.nombre}</td>
                                <td style={{ padding: "5px 8px", textAlign: "right" as const }}>Q{item.precio_aplicado?.toFixed(2)}</td>
                                <td style={{ padding: "5px 20px 5px 8px", textAlign: "right" as const, fontWeight: 700 }}>Q{item.subtotal?.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* ── FOOTER ── */}
                        {(() => {
                          const total = venta?.total ?? 0;
                          const gravable = parseFloat((total / 1.12).toFixed(2));
                          const iva = parseFloat((total - gravable).toFixed(2));
                          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://report.feel.com.gt/ingfac/verificar?numero_autorizacion=${infileResult.uuid}`)}`;
                          return (
                            <table style={{ width: "100%", borderCollapse: "collapse" as const, borderTop: "2px solid #000" }}>
                              <tbody>
                                <tr>
                                  {/* Left: auth info + gracias */}
                                  <td style={{ padding: "12px 20px", verticalAlign: "top" }}>
                                    <div style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: "2px", color: "#555" }}>Número de Autorización:</div>
                                    <div style={{ fontSize: "8px", wordBreak: "break-all" as const, color: "#222" }}>{infileResult.uuid}</div>
                                    <div style={{ fontSize: "8px", marginTop: "4px", color: "#777" }}>INFILE, S.A. / NIT: 1252133-7</div>
                                    <div style={{ fontWeight: 900, fontSize: "12px", textAlign: "center" as const, marginTop: "12px", letterSpacing: "0.06em" }}>¡GRACIAS POR SU COMPRA!</div>
                                  </td>
                                  {/* Center: totals */}
                                  <td style={{ padding: "12px 16px", verticalAlign: "top", width: "185px" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "10px" }}>
                                      <tbody>
                                        <tr>
                                          <td style={{ paddingBottom: "3px", color: "#555" }}>Base Gravable:</td>
                                          <td style={{ paddingBottom: "3px", textAlign: "right" as const }}>Q{gravable.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                          <td style={{ paddingBottom: "3px", color: "#555" }}>IVA (12%):</td>
                                          <td style={{ paddingBottom: "3px", textAlign: "right" as const }}>Q{iva.toFixed(2)}</td>
                                        </tr>
                                        <tr style={{ borderTop: "1px solid #000" }}>
                                          <td style={{ paddingTop: "5px", fontWeight: 900, fontSize: "13px" }}>TOTAL:</td>
                                          <td style={{ paddingTop: "5px", fontWeight: 900, fontSize: "15px", textAlign: "right" as const }}>Q{total.toFixed(2)}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                  {/* Right: QR */}
                                  <td style={{ padding: "12px 14px", verticalAlign: "top", textAlign: "center" as const, width: "110px" }}>
                                    <img src={qrUrl} alt="QR SAT" style={{ width: "90px", height: "90px", display: "block" as const, margin: "0 auto" }} />
                                    <div style={{ fontSize: "7px", color: "#888", marginTop: "3px" }}>Verificar en SAT</div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                      </ScaledDocument>
                    </div>

                    <div className="pt-2">

                      {venta?.dte_documentos?.find((d: any) => d.uuid_infile === infileResult?.uuid)?.estado === "anulado" ? (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                          <p className="text-sm font-bold text-destructive uppercase">Factura Anulada</p>
                          <p className="text-xs text-destructive mt-1">Este documento fue invalidado y reportado a la SAT.</p>
                          {!isReadonly && (
                            <button
                              onClick={() => {
                                setInfileResult(null);
                                setVenta({
                                  ...venta,
                                  dte_documentos: venta.dte_documentos.filter((d: any) => d.estado !== "anulado")
                                });
                              }}
                              className="mt-3 w-full py-2 bg-destructive/10 border border-destructive/20 text-destructive dark:text-red-400 rounded-lg text-sm font-bold hover:bg-destructive/20 transition shadow-sm cursor-pointer"
                            >
                              Generar Nueva Factura
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {!isReadonly && venta?.dte_documentos?.some((d: any) => d.estado === "certificado" && d.uuid_infile === infileResult?.uuid) && (
                            <div className="space-y-2">
                              {anularError && <p className="text-destructive text-xs text-center mt-2 font-bold">{anularError}</p>}
                              <button
                                onClick={handleAnular}
                                disabled={anulando}
                                className="w-full py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive dark:text-red-400 hover:bg-destructive/20 transition cursor-pointer font-bold disabled:opacity-50"
                              >
                                {anulando ? "Anulando..." : "Anular Factura"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {venta ? (
                      <div className="space-y-4">
                        <div className="bg-muted/30 rounded-xl border p-4 space-y-2">
                          <p className="text-xs font-bold text-gray-500 uppercase">Resumen de Venta</p>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Venta No.</span>
                            <span className="font-bold">#{venta?.id?.substring(0, 3).toUpperCase()}-${venta?.id?.substring(3, 6).toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cliente</span>
                            <span className="font-bold">{venta.ven_clientes?.nombre || "—"}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total</span>
                            <span className="font-bold text-emerald-700">Q{venta?.total?.toFixed(2)}</span>
                          </div>
                        </div>

                        {!isReadonly && (
                          <div className="space-y-4">
                            <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3 transition-all">
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <p className="text-xs font-bold text-gray-500 uppercase">Facturar a:</p>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold uppercase transition-colors ${facturaCF ? 'text-emerald-600' : 'text-gray-400'}`}>C/F</span>
                                  <button
                                    type="button"
                                    onClick={() => setFacturaCF(!facturaCF)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${!facturaCF ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                  >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!facturaCF ? 'translate-x-[9px]' : '-translate-x-[9px]'}`} />
                                  </button>
                                  <span className={`text-[10px] font-bold uppercase transition-colors ${!facturaCF ? 'text-emerald-600' : 'text-gray-400'}`}>NIT</span>
                                </div>
                              </div>

                              {!facturaCF ? (
                                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 fade-in">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">NIT del Receptor</label>
                                    <input
                                      type="text"
                                      value={nitReceptor}
                                      onChange={e => setNitReceptor(e.target.value)}
                                      placeholder="Ej: 1234567-8"
                                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                                    />
                                    <p className="text-[10px] text-gray-400">Sin guiones o espacios es válido también.</p>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-600">Nombre del Receptor</label>
                                    <input
                                      type="text"
                                      value={nombreReceptor}
                                      onChange={e => setNombreReceptor(e.target.value)}
                                      placeholder="Nombre completo o razón social"
                                      className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="animate-in fade-in py-2">
                                   <p className="text-xs text-center font-bold text-emerald-700 bg-emerald-50 rounded-lg p-2 uppercase">
                                     Generando a Consumidor Final
                                   </p>
                                </div>
                              )}

                              <div className="space-y-1 pt-1">
                                <label className="text-xs font-bold text-gray-600">Correo electrónico <span className="text-gray-400 font-normal">(opcional)</span></label>
                                <input
                                  type="email"
                                  value={correoReceptor}
                                  onChange={e => setCorreoReceptor(e.target.value)}
                                  placeholder="Para envío de PDF por correo automático"
                                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                                />
                              </div>
                            </div>

                            {infileError && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start text-sm text-red-700">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                {infileError}
                              </div>
                            )}

                            <button
                              onClick={handleCertificar}
                              disabled={certificando}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                            >
                              {certificando ? (
                                <><Loader2 className="size-4 animate-spin" /> Certificando con INFILE...</>
                              ) : (
                                <><FileCheck2 className="size-4" /> Generar Factura Electrónica <ChevronRight className="size-4" /></>
                              )}
                            </button>

                            <p className="text-center text-[10px] text-gray-400">
                              La factura será certificada ante la SAT a través de INFILE S.A.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-red-500 text-sm py-10">No se encontró la venta.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

          <div className="p-4 border-t bg-muted/50 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition cursor-pointer border"
            >
              Cerrar
            </button>
          </div>
        </MagicCard>
      </div>
    </>
  );
}

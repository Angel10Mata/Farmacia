import { NextRequest, NextResponse } from "next/server";
import {
  buildXMLFactura,
  buildXMLFacturaCambiaria,
  buildXMLFacturaEspecial,
  buildXMLNota,
  certificarDTE,
} from "@/lib/infile";
import { createAdminClient } from "@/utils/supabase/admin";
import type {
  DTEInput,
  FacturaCambiariaInput,
  FacturaEspecialInput,
  NotaCreditoDebitoInput,
} from "@/types/infile";

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as DTEInput;

    if (!input.tipo) {
      return NextResponse.json(
        { error: "El campo 'tipo' es obligatorio." },
        { status: 400 }
      );
    }

    let xml: string;

    switch (input.tipo) {
      case "FACT":
      case "NABN":
        xml = buildXMLFactura(input);
        break;
      case "FCAM":
        xml = buildXMLFacturaCambiaria(input as FacturaCambiariaInput);
        break;
      case "FESP":
        xml = buildXMLFacturaEspecial(input as FacturaEspecialInput);
        break;
      case "NCRE":
      case "NDEB":
        xml = buildXMLNota(input as NotaCreditoDebitoInput);
        break;
      default:
        return NextResponse.json(
          { error: `Tipo de DTE no soportado: ${(input as DTEInput).tipo}` },
          { status: 400 }
        );
    }

    const respuesta = await certificarDTE(xml);

    // ─── Persistir en Supabase si fue certificado exitosamente ───────────────
    if (respuesta.resultado && respuesta.uuid) {
      const supabase = createAdminClient();

      const { data: dte, error: dteError } = await supabase
        .from("dte_documentos")
        .insert({
          tipo: input.tipo,
          uuid_infile: respuesta.uuid,
          venta_id: input.ventaId ?? null,
          serie: respuesta.serie ?? null,
          numero: respuesta.numero ?? null,
          nit_emisor: input.emisor.nitEmisor,
          id_receptor: input.receptor.idReceptor,
          nombre_receptor: input.receptor.nombreReceptor,
          gran_total: input.totales.granTotal,
          codigo_moneda: input.codigoMoneda,
          fecha_emision: input.fechaHoraEmision,
          fecha_certificacion: respuesta.fecha ?? new Date().toISOString(),
          estado: "certificado",
          xml_certificado: respuesta.xml_certificado ?? null,
          alertas_infile: respuesta.descripcion_alertas_infile ?? [],
          alertas_sat: respuesta.descripcion_alertas_sat ?? [],
        })
        .select("id")
        .single();

      if (dteError) {
        console.error("[INFILE] Error guardando dte_documentos:", dteError);
      } else if (dte?.id) {
        // Guardar los ítems
        const itemsToInsert = input.items.map((item) => ({
          dte_id: dte.id,
          numero_linea: item.numeroLinea,
          bien_o_servicio: item.bienOServicio,
          cantidad: item.cantidad,
          unidad_medida: item.unidadMedida,
          descripcion: item.descripcion,
          precio_unitario: item.precioUnitario,
          precio: item.precio,
          descuento: item.descuento,
          monto_gravable: item.impuestos?.[0]?.montoGravable ?? null,
          monto_iva: item.impuestos?.[0]?.montoImpuesto ?? null,
          total: item.total,
        }));

        const { error: itemsError } = await supabase
          .from("dte_items")
          .insert(itemsToInsert);

        if (itemsError) {
          console.error("[INFILE] Error guardando dte_items:", itemsError);
        }

        if (input.ventaId) {
          const isCF = input.receptor.idReceptor === "CF";
          const tipoComp = isCF ? "Factura CF" : "Factura NIT";
          const { error: updateError } = await supabase
            .from("ven_ventas")
            .update({ tipo_comprobante: tipoComp })
            .eq("id", input.ventaId);
            
          if (updateError) {
            console.error("[INFILE] Error actualizando tipo_comprobante:", updateError);
          }
        }
      }
    }

    return NextResponse.json(respuesta);
  } catch (error) {
    console.error("[INFILE certificar]", error);
    return NextResponse.json(
      { error: "Error al certificar el documento con INFILE." },
      { status: 500 }
    );
  }
}


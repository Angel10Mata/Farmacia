import { randomUUID } from "crypto";
import type {
  DTEInput,
  FacturaCambiariaInput,
  FacturaEspecialInput,
  NotaCreditoDebitoInput,
  AnulacionDTEInput,
  INFILEResponse,
  AfiliacionIVA,
} from "@/types/infile";

// ─── Configuración ────────────────────────────────────────────────────────────

const INFILE_URL = process.env.INFILE_URL!;
const INFILE_URL_ANULACION = process.env.INFILE_URL_ANULACION!;
const INFILE_USUARIO_FIRMA = process.env.INFILE_USUARIO_FIRMA!;
const INFILE_LLAVE_FIRMA = process.env.INFILE_LLAVE_FIRMA!;
const INFILE_USUARIO_API = process.env.INFILE_USUARIO_API!;
const INFILE_LLAVE_API = process.env.INFILE_LLAVE_API!;
const INFILE_NIT_EMISOR = process.env.NEXT_PUBLIC_INFILE_NIT_EMISOR!;
const INFILE_EMISOR_NOMBRE = process.env.NEXT_PUBLIC_INFILE_EMISOR_NOMBRE!;
const INFILE_EMISOR_COMERCIAL = process.env.NEXT_PUBLIC_INFILE_EMISOR_COMERCIAL!;
const INFILE_EMISOR_DIRECCION = process.env.NEXT_PUBLIC_INFILE_EMISOR_DIRECCION!;
const INFILE_EMISOR_MUNICIPIO = process.env.NEXT_PUBLIC_INFILE_EMISOR_MUNICIPIO!;
const INFILE_EMISOR_DEPTO = process.env.NEXT_PUBLIC_INFILE_EMISOR_DEPTO!;
const INFILE_EMISOR_CP = process.env.NEXT_PUBLIC_INFILE_EMISOR_CP!;
const INFILE_EMISOR_AFILIACION = process.env.NEXT_PUBLIC_INFILE_EMISOR_AFILIACION! as AfiliacionIVA;
const INFILE_EMISOR_ESTABLECIMIENTO = process.env.NEXT_PUBLIC_INFILE_EMISOR_ESTABLECIMIENTO!;
const INFILE_EMISOR_TELEFONO = process.env.NEXT_PUBLIC_INFILE_EMISOR_TELEFONO || "";

// ─── Headers comunes ─────────────────────────────────────────────────────────

function buildHeaders(identificador: string): Record<string, string> {
  return {
    "Content-Type": "application/xml",
    UsuarioFirma: INFILE_USUARIO_FIRMA,
    LlaveFirma: INFILE_LLAVE_FIRMA,
    UsuarioApi: INFILE_USUARIO_API,
    LlaveApi: INFILE_LLAVE_API,
    identificador,
  };
}

// ─── Helpers de formato numérico ──────────────────────────────────────────────

function fmt(n: number): string {
  return n.toFixed(2);
}

// ─── Construcción de bloques XML reutilizables ────────────────────────────────

function xmlDireccion(
  tag: "DireccionEmisor" | "DireccionReceptor",
  d: DTEInput["emisor"]["direccion"]
): string {
  return `
          <dte:${tag}>
            <dte:Direccion>${d.direccion}</dte:Direccion>
            <dte:CodigoPostal>${d.codigoPostal}</dte:CodigoPostal>
            <dte:Municipio>${d.municipio}</dte:Municipio>
            <dte:Departamento>${d.departamento}</dte:Departamento>
            <dte:Pais>${d.pais}</dte:Pais>
          </dte:${tag}>`;
}

function xmlEmisor(input: DTEInput): string {
  const e = input.emisor;
  return `
        <dte:Emisor AfiliacionIVA="${e.afiliacionIVA}" CodigoEstablecimiento="${e.codigoEstablecimiento}" NITEmisor="${e.nitEmisor}" NombreComercial="${e.nombreComercial}" NombreEmisor="${e.nombreEmisor}">${xmlDireccion("DireccionEmisor", e.direccion)}
        </dte:Emisor>`;
}

function xmlReceptor(input: DTEInput): string {
  const r = input.receptor;
  const tipoEsp = r.tipoEspecial ? ` TipoEspecial="${r.tipoEspecial}"` : "";
  const correo = r.correoReceptor ? ` CorreoReceptor="${r.correoReceptor}"` : "";
  return `
        <dte:Receptor IDReceptor="${r.idReceptor}" NombreReceptor="${r.nombreReceptor}"${correo}${tipoEsp}>${xmlDireccion("DireccionReceptor", r.direccion)}
        </dte:Receptor>`;
}

function xmlItems(input: DTEInput): string {
  return input.items
    .map((item) => {
      const impuestos =
        item.impuestos && item.impuestos.length > 0
          ? `
              <dte:Impuestos>
                ${item.impuestos
                  .map(
                    (imp) => `<dte:Impuesto>
                  <dte:NombreCorto>${imp.nombreCorto}</dte:NombreCorto>
                  <dte:CodigoUnidadGravable>${imp.codigoUnidadGravable}</dte:CodigoUnidadGravable>
                  <dte:MontoGravable>${fmt(imp.montoGravable)}</dte:MontoGravable>
                  <dte:MontoImpuesto>${fmt(imp.montoImpuesto)}</dte:MontoImpuesto>
                </dte:Impuesto>`
                  )
                  .join("")}
              </dte:Impuestos>`
          : "";
      return `
          <dte:Item BienOServicio="${item.bienOServicio}" NumeroLinea="${item.numeroLinea}">
            <dte:Cantidad>${fmt(item.cantidad)}</dte:Cantidad>
            <dte:UnidadMedida>${item.unidadMedida}</dte:UnidadMedida>
            <dte:Descripcion>${item.descripcion}</dte:Descripcion>
            <dte:PrecioUnitario>${fmt(item.precioUnitario)}</dte:PrecioUnitario>
            <dte:Precio>${fmt(item.precio)}</dte:Precio>
            <dte:Descuento>${fmt(item.descuento)}</dte:Descuento>${impuestos}
            <dte:Total>${fmt(item.total)}</dte:Total>
          </dte:Item>`;
    })
    .join("");
}

function xmlTotales(input: DTEInput): string {
  const totalIVA =
    input.totales.totalIVA !== undefined
      ? `
          <dte:TotalImpuestos>
            <dte:TotalImpuesto NombreCorto="IVA" TotalMontoImpuesto="${fmt(input.totales.totalIVA)}"></dte:TotalImpuesto>
          </dte:TotalImpuestos>`
      : "";
  return `
        <dte:Totales>${totalIVA}
          <dte:GranTotal>${fmt(input.totales.granTotal)}</dte:GranTotal>
        </dte:Totales>`;
}

function xmlFrases(tipo: number, escenario: number): string {
  return `
        <dte:Frases>
          <dte:Frase CodigoEscenario="${escenario}" TipoFrase="${tipo}"></dte:Frase>
        </dte:Frases>`;
}

function xmlAdenda(adenda?: Record<string, string>): string {
  if (!adenda || Object.keys(adenda).length === 0) return "";
  const entries = Object.entries(adenda)
    .map(([k, v]) => `      <${k}>${v}</${k}>`)
    .join("\n");
  return `
    <dte:Adenda>
${entries}
    </dte:Adenda>`;
}

// ─── Constructores de XML por tipo ────────────────────────────────────────────

export function buildXMLFactura(input: DTEInput): string {
  const fraseTipo = input.fraseTipo ?? 1;
  const fraseEscenario = input.fraseEscenario ?? 1;
  const frases =
    input.tipo !== "NABN" ? xmlFrases(fraseTipo, fraseEscenario) : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1" xsi:schemaLocation="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT ClaseDocumento="dte">
    <dte:DTE ID="DatosCertificados">
      <dte:DatosEmision ID="DatosEmision">
        <dte:DatosGenerales CodigoMoneda="${input.codigoMoneda}" FechaHoraEmision="${input.fechaHoraEmision}" Tipo="${input.tipo}"></dte:DatosGenerales>${xmlEmisor(input)}${xmlReceptor(input)}${frases}
        <dte:Items>${xmlItems(input)}
        </dte:Items>${xmlTotales(input)}
      </dte:DatosEmision>
    </dte:DTE>${xmlAdenda(input.adenda)}
  </dte:SAT>
</dte:GTDocumento>`;
}

export function buildXMLFacturaCambiaria(input: FacturaCambiariaInput): string {
  const abonos = input.abonos
    .map(
      (a) => `
              <cfc:Abono>
                <cfc:NumeroAbono>${a.numeroAbono}</cfc:NumeroAbono>
                <cfc:FechaVencimiento>${a.fechaVencimiento}</cfc:FechaVencimiento>
                <cfc:MontoAbono>${fmt(a.montoAbono)}</cfc:MontoAbono>
              </cfc:Abono>`
    )
    .join("");

  const complemento = `
        <dte:Complementos>
          <dte:Complemento IDComplemento="AbonosFacturaCambiaria" NombreComplemento="AbonosFacturaCambiaria" URIComplemento="http://www.sat.gob.gt/dte/fel/CompCambiaria/0.1.0">
            <cfc:AbonosFacturaCambiaria xmlns:cfc="http://www.sat.gob.gt/dte/fel/CompCambiaria/0.1.0" Version="1">
              ${abonos}
            </cfc:AbonosFacturaCambiaria>
          </dte:Complemento>
        </dte:Complementos>`;

  const fraseTipo = input.fraseTipo ?? 1;
  const fraseEscenario = input.fraseEscenario ?? 1;

  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1" xsi:schemaLocation="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT ClaseDocumento="dte">
    <dte:DTE ID="DatosCertificados">
      <dte:DatosEmision ID="DatosEmision">
        <dte:DatosGenerales CodigoMoneda="${input.codigoMoneda}" FechaHoraEmision="${input.fechaHoraEmision}" Tipo="FCAM"></dte:DatosGenerales>${xmlEmisor(input)}${xmlReceptor(input)}${xmlFrases(fraseTipo, fraseEscenario)}
        <dte:Items>${xmlItems(input)}
        </dte:Items>${xmlTotales(input)}${complemento}
      </dte:DatosEmision>
    </dte:DTE>${xmlAdenda(input.adenda)}
  </dte:SAT>
</dte:GTDocumento>`;
}

export function buildXMLFacturaEspecial(input: FacturaEspecialInput): string {
  const r = input.retenciones;
  const complemento = `
        <dte:Complementos>
          <dte:Complemento IDComplemento="RetencionesFacturaEspecial" NombreComplemento="RetencionesFacturaEspecial" URIComplemento="http://www.sat.gob.gt/face2/ComplementoFacturaEspecial/0.1.0">
            <cfe:RetencionesFacturaEspecial xmlns:cfe="http://www.sat.gob.gt/face2/ComplementoFacturaEspecial/0.1.0" Version="1">
              <cfe:RetencionISR>${fmt(r.retencionISR)}</cfe:RetencionISR>
              <cfe:RetencionIVA>${fmt(r.retencionIVA)}</cfe:RetencionIVA>
              <cfe:TotalMenosRetenciones>${fmt(r.totalMenosRetenciones)}</cfe:TotalMenosRetenciones>
            </cfe:RetencionesFacturaEspecial>
          </dte:Complemento>
        </dte:Complementos>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1" xsi:schemaLocation="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT ClaseDocumento="dte">
    <dte:DTE ID="DatosCertificados">
      <dte:DatosEmision ID="DatosEmision">
        <dte:DatosGenerales CodigoMoneda="${input.codigoMoneda}" FechaHoraEmision="${input.fechaHoraEmision}" Tipo="FESP"></dte:DatosGenerales>${xmlEmisor(input)}${xmlReceptor(input)}${xmlFrases(5, 1)}
        <dte:Items>${xmlItems(input)}
        </dte:Items>${xmlTotales(input)}${complemento}
      </dte:DatosEmision>
    </dte:DTE>${xmlAdenda(input.adenda)}
  </dte:SAT>
</dte:GTDocumento>`;
}

export function buildXMLNota(input: NotaCreditoDebitoInput): string {
  const ref = input.referencia;
  const complemento = `
        <dte:Complementos>
          <dte:Complemento IDComplemento="ReferenciasNota" NombreComplemento="ReferenciasNota" URIComplemento="http://www.sat.gob.gt/face2/ComplementoReferenciaNota/0.1.0">
            <cno:ReferenciasNota xmlns:cno="http://www.sat.gob.gt/face2/ComplementoReferenciaNota/0.1.0"
              FechaEmisionDocumentoOrigen="${ref.fechaEmisionDocumentoOrigen}"
              MotivoAjuste="${ref.motivoAjuste}"
              NumeroAutorizacionDocumentoOrigen="${ref.numeroAutorizacionDocumentoOrigen}"
              NumeroDocumentoOrigen="${ref.numeroDocumentoOrigen}"
              SerieDocumentoOrigen="${ref.serieDocumentoOrigen}"
              Version="0.0">
            </cno:ReferenciasNota>
          </dte:Complemento>
        </dte:Complementos>`;

  const fraseTipo = input.fraseTipo ?? 1;
  const fraseEscenario = input.fraseEscenario ?? 1;

  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1" xsi:schemaLocation="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT ClaseDocumento="dte">
    <dte:DTE ID="DatosCertificados">
      <dte:DatosEmision ID="DatosEmision">
        <dte:DatosGenerales CodigoMoneda="${input.codigoMoneda}" FechaHoraEmision="${input.fechaHoraEmision}" Tipo="${input.tipo}"></dte:DatosGenerales>${xmlEmisor(input)}${xmlReceptor(input)}${xmlFrases(fraseTipo, fraseEscenario)}
        <dte:Items>${xmlItems(input)}
        </dte:Items>${xmlTotales(input)}${complemento}
      </dte:DatosEmision>
    </dte:DTE>${xmlAdenda(input.adenda)}
  </dte:SAT>
</dte:GTDocumento>`;
}

export function buildXMLAnulacion(input: AnulacionDTEInput): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTAnulacionDocumento xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:dte="http://www.sat.gob.gt/dte/fel/0.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" Version="0.1">
  <dte:SAT>
    <dte:AnulacionDTE ID="DatosCertificados">
      <dte:DatosGenerales FechaEmisionDocumentoAnular="${input.fechaEmisionDocumento}" FechaHoraAnulacion="${input.fechaHoraAnulacion}" ID="DatosAnulacion" IDReceptor="${input.idReceptor}" MotivoAnulacion="${input.motivoAnulacion}" NITEmisor="${input.nitEmisor}" NumeroDocumentoAAnular="${input.uuidAAnular}"></dte:DatosGenerales>
    </dte:AnulacionDTE>
  </dte:SAT>
</dte:GTAnulacionDocumento>`;
}

// ─── Llamadas a la API de INFILE ──────────────────────────────────────────────

export async function certificarDTE(
  xml: string,
  identificador?: string
): Promise<INFILEResponse> {
  const id = identificador ?? randomUUID();
  const res = await fetch(INFILE_URL, {
    method: "POST",
    headers: buildHeaders(id),
    body: xml,
  });

  if (!res.ok) {
    throw new Error(`INFILE HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as INFILEResponse;
  return data;
}

export async function anularDTE(
  xmlAnulacion: string,
  identificador?: string
): Promise<INFILEResponse> {
  const id = identificador ?? randomUUID();
  const res = await fetch(INFILE_URL_ANULACION, {
    method: "POST",
    headers: buildHeaders(id),
    body: xmlAnulacion,
  });

  if (!res.ok) {
    throw new Error(`INFILE HTTP error (anulacion): ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as INFILEResponse;
  return data;
}

// ─── Helper: obtener el NIT del emisor desde .env ────────────────────────────

export function getEmisorConfig() {
  return {
    nitEmisor: INFILE_NIT_EMISOR,
    nombreEmisor: INFILE_EMISOR_NOMBRE,
    nombreComercial: INFILE_EMISOR_COMERCIAL,
    codigoEstablecimiento: INFILE_EMISOR_ESTABLECIMIENTO,
    afiliacionIVA: INFILE_EMISOR_AFILIACION,
    telefono: INFILE_EMISOR_TELEFONO,
    direccion: {
      direccion: INFILE_EMISOR_DIRECCION,
      codigoPostal: INFILE_EMISOR_CP,
      municipio: INFILE_EMISOR_MUNICIPIO,
      departamento: INFILE_EMISOR_DEPTO,
      pais: "GT",
    },
  };
}

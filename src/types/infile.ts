// ─── Enums ───────────────────────────────────────────────────────────────────

export type TipoDTE =
  | "FACT"  // Factura normal
  | "FCAM"  // Factura cambiaria
  | "FESP"  // Factura especial
  | "NABN"  // Nota de abono (sin IVA)
  | "NCRE"  // Nota de crédito
  | "NDEB"; // Nota de débito

export type CodigoMoneda = "GTQ" | "USD";

export type BienOServicio = "B" | "S";

export type AfiliacionIVA = "GEN" | "EXE" | "PEQ";

// ─── Dirección ───────────────────────────────────────────────────────────────

export interface DireccionDTE {
  direccion: string;
  codigoPostal: string;
  municipio: string;
  departamento: string;
  pais: string;
}

// ─── Emisor ──────────────────────────────────────────────────────────────────

export interface EmisorDTE {
  nitEmisor: string;
  nombreEmisor: string;
  nombreComercial: string;
  codigoEstablecimiento: string;
  afiliacionIVA: AfiliacionIVA;
  direccion: DireccionDTE;
}

// ─── Receptor ────────────────────────────────────────────────────────────────

export interface ReceptorDTE {
  idReceptor: string;       // NIT, CUI, o "CF" para consumidor final
  nombreReceptor: string;
  correoReceptor?: string;
  tipoEspecial?: "CUI";    // Solo para FESP con CUI
  direccion: DireccionDTE;
}

// ─── Impuesto por ítem ───────────────────────────────────────────────────────

export interface ImpuestoDTE {
  nombreCorto: "IVA";
  codigoUnidadGravable: number;
  montoGravable: number;
  montoImpuesto: number;
}

// ─── Ítem de DTE ─────────────────────────────────────────────────────────────

export interface ItemDTE {
  numeroLinea: number;
  bienOServicio: BienOServicio;
  cantidad: number;
  unidadMedida: string;
  descripcion: string;
  precioUnitario: number;
  precio: number;
  descuento: number;
  impuestos?: ImpuestoDTE[]; // NABN no lleva impuestos
  total: number;
}

// ─── Totales ─────────────────────────────────────────────────────────────────

export interface TotalesDTE {
  totalIVA?: number; // Opcional para NABN
  granTotal: number;
}

// ─── Complemento: Factura Cambiaria ──────────────────────────────────────────

export interface AbonoFCam {
  numeroAbono: number;
  fechaVencimiento: string; // YYYY-MM-DD
  montoAbono: number;
}

// ─── Complemento: Factura Especial ───────────────────────────────────────────

export interface RetencionFEsp {
  retencionISR: number;
  retencionIVA: number;
  totalMenosRetenciones: number;
}

// ─── Complemento: Notas de crédito/débito ────────────────────────────────────

export interface ReferenciaNota {
  fechaEmisionDocumentoOrigen: string;  // YYYY-MM-DD
  motivoAjuste: string;
  numeroAutorizacionDocumentoOrigen: string; // UUID del DTE original
  numeroDocumentoOrigen: string;
  serieDocumentoOrigen: string;
}

// ─── Input Factory por tipo ───────────────────────────────────────────────────

export interface FacturaDTEInput {
  tipo: TipoDTE;
  codigoMoneda: CodigoMoneda;
  fechaHoraEmision: string; // ISO 8601: YYYY-MM-DDTHH:mm:ss-06:00
  emisor: EmisorDTE;
  receptor: ReceptorDTE;
  items: ItemDTE[];
  totales: TotalesDTE;
  fraseTipo?: number;
  fraseEscenario?: number;
  adenda?: Record<string, string>;
  ventaId?: string;
}

export interface FacturaCambiariaInput extends Omit<FacturaDTEInput, "tipo"> {
  tipo: "FCAM";
  abonos: AbonoFCam[];
}

export interface FacturaEspecialInput extends Omit<FacturaDTEInput, "tipo"> {
  tipo: "FESP";
  retenciones: RetencionFEsp;
}

export interface NotaCreditoDebitoInput extends Omit<FacturaDTEInput, "tipo"> {
  tipo: "NCRE" | "NDEB";
  referencia: ReferenciaNota;
}

export type DTEInput =
  | FacturaDTEInput
  | FacturaCambiariaInput
  | FacturaEspecialInput
  | NotaCreditoDebitoInput;

// ─── Input de Anulación ───────────────────────────────────────────────────────

export interface AnulacionDTEInput {
  nitEmisor: string;
  idReceptor: string;
  uuidAAnular: string;
  fechaEmisionDocumento: string; // YYYY-MM-DDTHH:mm:ss-06:00
  fechaHoraAnulacion: string;    // YYYY-MM-DDTHH:mm:ss-06:00
  motivoAnulacion: string;
}

// ─── Respuesta de INFILE ──────────────────────────────────────────────────────

export interface ControlEmision {
  saldo: string;
  creditos: string;
}

export interface ErrorDTE {
  resultado: boolean;
  fuente: string;
  categoria?: string;
  numeral?: string;
  validacion?: string;
  mensaje_error?: string;
}

export interface INFILEResponse {
  resultado: boolean;
  fecha?: string;
  descripcion?: string;
  control_emision?: ControlEmision[];
  alertas_infile: boolean;
  descripcion_alertas_infile?: string[];
  alertas_sat: boolean;
  descripcion_alertas_sat?: string[];
  cantidad_errores?: number;
  descripcion_errores?: ErrorDTE[];
  informacion_adicional?: string[];
  uuid?: string;
  serie?: string;
  numero?: string;
  xml_certificado?: string; // base64
}

// ─── Resultado procesado (para guardar en BD) ────────────────────────────────

export interface DTECertificado {
  uuid: string;
  serie: string;
  numero: string;
  tipo: TipoDTE;
  fechaCertificacion: string;
  xmlCertificado: string; // base64 decodificado
  alertas: string[];
}

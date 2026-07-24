export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  stock_actual: number;
  stock_minimo: number;
  imagen_url?: string | null;
  imagen_url_2?: string | null;
  imagen_url_3?: string | null;
  ubicacion?: string;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precio_aplicado: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  created_at: string;
  numero_recibo: number;
  cliente_id: string | null;
  usuario_id: string;
  tipo_venta: string;
  total: number;
  observaciones: string | null;
  ven_clientes?: {
    nombre: string;
    nit: string;
  } | null;
  profiles?: {
    nombre: string;
  } | null;
}

export type OrderType = 'externa' | 'interna';

export type ProductType = 
  | 'diamante' 
  | 'gema' 
  | 'anillo' 
  | 'collar' 
  | 'arete' 
  | 'dije' 
  | 'cadena' 
  | 'componente' 
  | 'otro';

export type InternalOrderStatus = 
  | 'pendiente' 
  | 'en_transito' 
  | 'recibido' 
  | 'cancelado';

export type InternalPaymentStatus = 
  | 'pendiente' 
  | 'anticipo' 
  | 'pagado';

export type Currency = 'MXN' | 'USD' | 'EUR';

export interface InternalOrder {
  id: string;
  tipo_orden: OrderType;
  tipo_producto: ProductType;
  
  // Proveedor
  supplier_id?: string;
  proveedor_nombre: string;
  proveedor_contacto?: string;
  numero_factura: string;
  numero_reporte?: string;
  
  // Relación con supplier
  supplier?: {
    id: string;
    nombre_empresa: string;
    nombre_contacto: string;
    email: string;
    telefono: string;
  };
  
  // Financiero
  precio_compra: number;
  moneda: Currency;
  estatus_pago: InternalPaymentStatus;
  
  // Diamante específico
  quilataje?: number;
  color?: string;
  claridad?: string;
  corte?: string;
  forma?: string;
  certificado?: string;
  
  // Adicional
  cantidad: number;
  descripcion?: string;
  notas_adicionales?: string;
  
  // Fechas
  fecha_compra: string;
  fecha_entrega_esperada?: string;
  
  // Estatus
  estatus: InternalOrderStatus;
  
  // Archivos
  factura_pdf_url: string;
  imagenes_producto: string[];
  
  // Auditoría
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InternalOrderFormData {
  // Step 1
  supplier_id: string;
  proveedor_nombre: string;
  proveedor_contacto: string;
  numero_factura: string;
  fecha_compra: Date | undefined;
  fecha_entrega_esperada: Date | undefined;
  
  // Step 2
  tipo_producto: ProductType | '';
  cantidad: string;
  descripcion: string;
  
  // Step 3 - Diamante
  quilataje: string;
  color: string;
  claridad: string;
  corte: string;
  forma: string;
  numero_reporte: string;
  certificado: string;
  
  // Step 3 - Gema
  tipo_gema: string;
  gema_quilataje: string;
  gema_color: string;
  gema_claridad: string;
  gema_forma: string;
  gema_certificado: string;
  
  // Step 3 - Otros
  material: string;
  talla: string;
  dimensiones: string;
  especificaciones: string;
  
  // Step 4
  factura_pdf: File | null;
  imagenes_producto: File[];
  
  // Step 5
  precio_compra: string;
  moneda: Currency;
  estatus_pago: InternalPaymentStatus;
  notas_adicionales: string;
}

export interface InternalOrderStats {
  totalCompras: number;
  gastoTotal: number;
  enTransito: number;
  recibidas: number;
}

export interface Supplier {
  id: string;
  nombre_empresa: string;
  nombre_contacto: string;
  email: string;
  telefono: string;
  activo: boolean;
}

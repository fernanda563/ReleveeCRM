export type WorkArea = 'diseño' | 'taller';
export type WorkOrderStatus = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';

export interface WorkConcept {
  id: string;
  nombre: string;
  descripcion: string | null;
  area: WorkArea;
  costo_base: number;
  precio_venta_base: number;
  unidad_medida: string;
  es_precio_variable: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  order_id: string | null;
  client_id: string;
  taller_id: string | null;
  workshop_id: string | null;
  designer_id: string | null;
  descripcion: string | null;
  estado: WorkOrderStatus;
  fecha_solicitud: string;
  fecha_entrega_esperada: string | null;
  total_costo: number;
  total_precio: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  client?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  taller?: {
    id: string;
    nombre_empresa: string;
  };
  workshop?: {
    id: string;
    nombre: string;
  };
  designer?: {
    id: string;
    nombre: string;
  };
  order?: {
    id: string;
    custom_id: string | null;
  };
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  work_concept_id: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  notas: string | null;
  created_at: string;
  // Joined data
  work_concept?: WorkConcept;
}

export const WORK_AREA_LABELS: Record<WorkArea, string> = {
  'diseño': 'Diseño',
  'taller': 'Taller',
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  'pendiente': 'Pendiente',
  'en_proceso': 'En proceso',
  'completado': 'Completado',
  'cancelado': 'Cancelado',
};

export const UNIT_MEASURES = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'por_piedra', label: 'Por piedra' },
  { value: 'por_hora', label: 'Por hora' },
  { value: 'por_gramo', label: 'Por gramo' },
  { value: 'servicio', label: 'Servicio' },
];

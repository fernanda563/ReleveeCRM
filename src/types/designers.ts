export interface Designer {
  id: string;
  nombre: string;
  especialidad: string | null;
  email: string | null;
  telefono: string | null;
  telefono_codigo_pais: string | null;
  ubicacion_ciudad: string | null;
  ubicacion_estado: string | null;
  ubicacion_pais: string | null;
  portafolio_url: string | null;
  notas: string | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DesignerProcess {
  id: string;
  designer_id: string;
  work_concept_id: string;
  costo_acordado: number;
  tiempo_estimado_dias: number | null;
  notas: string | null;
  activo: boolean | null;
  created_at: string;
  work_concept?: {
    id: string;
    nombre: string;
    area: string;
  };
}

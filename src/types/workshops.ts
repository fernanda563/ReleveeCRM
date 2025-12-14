export interface Workshop {
  id: string;
  nombre: string;
  responsable_nombre: string;
  responsable_telefono: string | null;
  responsable_telefono_codigo_pais: string | null;
  email: string | null;
  ubicacion_ciudad: string | null;
  ubicacion_estado: string | null;
  ubicacion_pais: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopProcess {
  id: string;
  workshop_id?: string;
  work_concept_id: string;
  costo_acordado: number;
  tiempo_estimado_dias: number | null;
  notas?: string | null;
  activo: boolean;
  created_at?: string;
  // Joined data
  work_concept?: {
    id: string;
    nombre: string;
    area: string;
    unidad_medida: string;
  };
}

export interface WorkshopWithProcesses extends Workshop {
  workshop_processes?: WorkshopProcess[];
}

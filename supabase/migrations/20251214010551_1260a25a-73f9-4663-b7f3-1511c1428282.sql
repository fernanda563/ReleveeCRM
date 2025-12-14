
-- Create workshops table
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  responsable_nombre TEXT NOT NULL,
  responsable_telefono TEXT,
  responsable_telefono_codigo_pais TEXT DEFAULT '+52',
  email TEXT,
  ubicacion_ciudad TEXT,
  ubicacion_estado TEXT,
  ubicacion_pais TEXT DEFAULT 'México',
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workshop_processes table (links workshops to work_concepts with costs)
CREATE TABLE public.workshop_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  work_concept_id UUID NOT NULL REFERENCES public.work_concepts(id) ON DELETE CASCADE,
  costo_acordado NUMERIC NOT NULL DEFAULT 0,
  tiempo_estimado_dias INTEGER,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workshop_id, work_concept_id)
);

-- Add workshop_id to work_orders table
ALTER TABLE public.work_orders 
ADD COLUMN workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL;

-- Enable RLS on workshops
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- RLS policies for workshops
CREATE POLICY "Authenticated users can view active workshops"
ON public.workshops FOR SELECT
USING (true);

CREATE POLICY "Admins can insert workshops"
ON public.workshops FOR INSERT
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update workshops"
ON public.workshops FOR UPDATE
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete workshops"
ON public.workshops FOR DELETE
USING (has_role(auth.uid(), 'administrador'::app_role));

-- Enable RLS on workshop_processes
ALTER TABLE public.workshop_processes ENABLE ROW LEVEL SECURITY;

-- RLS policies for workshop_processes
CREATE POLICY "Authenticated users can view workshop processes"
ON public.workshop_processes FOR SELECT
USING (true);

CREATE POLICY "Admins can insert workshop processes"
ON public.workshop_processes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update workshop processes"
ON public.workshop_processes FOR UPDATE
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete workshop processes"
ON public.workshop_processes FOR DELETE
USING (has_role(auth.uid(), 'administrador'::app_role));

-- Create trigger for updated_at on workshops
CREATE TRIGGER update_workshops_updated_at
BEFORE UPDATE ON public.workshops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Create designers table
CREATE TABLE public.designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  especialidad TEXT,
  email TEXT,
  telefono TEXT,
  telefono_codigo_pais TEXT DEFAULT '+52',
  ubicacion_ciudad TEXT,
  ubicacion_estado TEXT,
  ubicacion_pais TEXT DEFAULT 'México',
  portafolio_url TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create designer_processes table
CREATE TABLE public.designer_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES public.designers(id) ON DELETE CASCADE,
  work_concept_id UUID NOT NULL REFERENCES public.work_concepts(id) ON DELETE CASCADE,
  costo_acordado NUMERIC NOT NULL DEFAULT 0,
  tiempo_estimado_dias INTEGER,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(designer_id, work_concept_id)
);

-- Add designer_id to work_orders
ALTER TABLE public.work_orders ADD COLUMN designer_id UUID REFERENCES public.designers(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designer_processes ENABLE ROW LEVEL SECURITY;

-- RLS policies for designers
CREATE POLICY "Authenticated users can view active designers" ON public.designers
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert designers" ON public.designers
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can update designers" ON public.designers
  FOR UPDATE USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can delete designers" ON public.designers
  FOR DELETE USING (has_role(auth.uid(), 'administrador'));

-- RLS policies for designer_processes
CREATE POLICY "Authenticated users can view designer processes" ON public.designer_processes
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert designer processes" ON public.designer_processes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can update designer processes" ON public.designer_processes
  FOR UPDATE USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can delete designer processes" ON public.designer_processes
  FOR DELETE USING (has_role(auth.uid(), 'administrador'));

-- Trigger for updated_at
CREATE TRIGGER update_designers_updated_at
  BEFORE UPDATE ON public.designers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  categoria text,
  unidad_medida text NOT NULL DEFAULT 'gramo',
  costo_directo numeric NOT NULL DEFAULT 0,
  tipo_margen text NOT NULL DEFAULT 'porcentaje',
  valor_margen numeric NOT NULL DEFAULT 0,
  redondeo text NOT NULL DEFAULT 'ninguno',
  redondeo_multiplo numeric DEFAULT 1,
  activo boolean DEFAULT true,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Admins can insert materials"
  ON public.materials FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update materials"
  ON public.materials FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete materials"
  ON public.materials FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Authenticated users can view materials"
  ON public.materials FOR SELECT TO authenticated
  USING (true);


CREATE TABLE public.prospect_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  referencia_id uuid NOT NULL,
  cantidad numeric NOT NULL DEFAULT 1,
  costo_unitario numeric NOT NULL DEFAULT 0,
  precio_unitario numeric NOT NULL DEFAULT 0,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view prospect items" ON public.prospect_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert prospect items" ON public.prospect_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update prospect items" ON public.prospect_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete prospect items" ON public.prospect_items FOR DELETE TO authenticated USING (true);

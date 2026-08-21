
-- 1. clients: registration channel + privacy consent
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS registration_channel text NOT NULL DEFAULT 'internal_manual',
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text;

-- 2. client_documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'ine',
  document_side text NOT NULL DEFAULT 'front',
  storage_path text NOT NULL,
  mime_type text,
  status text NOT NULL DEFAULT 'uploaded',
  source text NOT NULL DEFAULT 'internal_manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON public.client_documents(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_documents_side
  ON public.client_documents(client_id, document_type, document_side)
  WHERE status <> 'replaced';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_documents TO authenticated;
GRANT ALL ON public.client_documents TO service_role;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view client documents" ON public.client_documents;
CREATE POLICY "Authenticated users can view client documents"
  ON public.client_documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create client documents" ON public.client_documents;
CREATE POLICY "Authenticated users can create client documents"
  ON public.client_documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update client documents" ON public.client_documents;
CREATE POLICY "Authenticated users can update client documents"
  ON public.client_documents FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can delete client documents" ON public.client_documents;
CREATE POLICY "Admins can delete client documents"
  ON public.client_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role));

-- 2b. backfill legacy INE documents (keep documento_id_url intact)
INSERT INTO public.client_documents (client_id, document_type, document_side, storage_path, mime_type, status, source)
SELECT c.id, 'ine', 'legacy',
       regexp_replace(c.documento_id_url, '^.*/ine-documents/', ''),
       'application/pdf', 'uploaded', 'internal_manual'
FROM public.clients c
WHERE c.documento_id_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.client_documents d
    WHERE d.client_id = c.id AND d.document_side = 'legacy'
  );

-- 3. appointments extensions
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'internal_manual',
  ADD COLUMN IF NOT EXISTS folio text,
  ADD COLUMN IF NOT EXISTS duracion_minutos integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS calendar_connection_id uuid REFERENCES public.google_calendar_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS google_event_id text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_public_slot
  ON public.appointments(calendar_connection_id, fecha)
  WHERE calendar_connection_id IS NOT NULL AND estado <> 'cancelada';

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_folio ON public.appointments(folio) WHERE folio IS NOT NULL;

-- 4. public booking settings
CREATE TABLE IF NOT EXISTS public.public_booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT 'Relevée',
  calendar_connection_id uuid REFERENCES public.google_calendar_connections(id) ON DELETE SET NULL,
  timezone text NOT NULL DEFAULT 'America/Mexico_City',
  dias_disponibles integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  hora_inicio text NOT NULL DEFAULT '10:00',
  hora_fin text NOT NULL DEFAULT '19:00',
  duracion_minutos integer NOT NULL DEFAULT 60,
  intervalo_minutos integer NOT NULL DEFAULT 30,
  buffer_minutos integer NOT NULL DEFAULT 0,
  anticipacion_minima_minutos integer NOT NULL DEFAULT 120,
  max_dias_adelante integer NOT NULL DEFAULT 30,
  direccion text,
  modalidad text NOT NULL DEFAULT 'presencial',
  privacy_version text NOT NULL DEFAULT 'v1',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_booking_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.public_booking_settings TO authenticated;
GRANT ALL ON public.public_booking_settings TO service_role;
ALTER TABLE public.public_booking_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active booking settings" ON public.public_booking_settings;
CREATE POLICY "Anyone can view active booking settings"
  ON public.public_booking_settings FOR SELECT TO anon, authenticated USING (activo = true);
DROP POLICY IF EXISTS "Admins manage booking settings insert" ON public.public_booking_settings;
CREATE POLICY "Admins manage booking settings insert"
  ON public.public_booking_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrador'::app_role));
DROP POLICY IF EXISTS "Admins manage booking settings update" ON public.public_booking_settings;
CREATE POLICY "Admins manage booking settings update"
  ON public.public_booking_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role));
DROP POLICY IF EXISTS "Admins manage booking settings delete" ON public.public_booking_settings;
CREATE POLICY "Admins manage booking settings delete"
  ON public.public_booking_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role));

CREATE TRIGGER update_public_booking_settings_updated_at
  BEFORE UPDATE ON public.public_booking_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.public_booking_settings (nombre)
SELECT 'Relevée' WHERE NOT EXISTS (SELECT 1 FROM public.public_booking_settings);

-- 5. public registration sessions (no public access; service role only)
CREATE TABLE IF NOT EXISTS public.public_registration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ip_hash text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_public_registration_token ON public.public_registration_sessions(token);
GRANT SELECT ON public.public_registration_sessions TO authenticated;
GRANT ALL ON public.public_registration_sessions TO service_role;
ALTER TABLE public.public_registration_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view registration sessions" ON public.public_registration_sessions;
CREATE POLICY "Admins can view registration sessions"
  ON public.public_registration_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'administrador'::app_role));

-- 6. duplicate review queue
CREATE TABLE IF NOT EXISTS public.client_duplicate_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  matched_client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  match_reason text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.client_duplicate_reviews TO authenticated;
GRANT ALL ON public.client_duplicate_reviews TO service_role;
ALTER TABLE public.client_duplicate_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view duplicate reviews" ON public.client_duplicate_reviews;
CREATE POLICY "Staff can view duplicate reviews"
  ON public.client_duplicate_reviews FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can resolve duplicate reviews" ON public.client_duplicate_reviews;
CREATE POLICY "Staff can resolve duplicate reviews"
  ON public.client_duplicate_reviews FOR UPDATE TO authenticated USING (true);

-- 7. storage policies for private INE bucket
DROP POLICY IF EXISTS "Staff can read ine documents" ON storage.objects;
CREATE POLICY "Staff can read ine documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ine-documents');
DROP POLICY IF EXISTS "Staff can upload ine documents" ON storage.objects;
CREATE POLICY "Staff can upload ine documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ine-documents');
DROP POLICY IF EXISTS "Staff can update ine documents" ON storage.objects;
CREATE POLICY "Staff can update ine documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ine-documents');

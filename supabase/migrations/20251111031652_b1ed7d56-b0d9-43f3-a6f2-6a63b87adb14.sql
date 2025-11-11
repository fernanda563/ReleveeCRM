-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono_principal TEXT NOT NULL,
  telefono_adicional TEXT,
  fuente_contacto TEXT,
  documento_id_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('presencial', 'virtual')),
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prospects table (for follow-up on clients who didn't purchase)
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo_anillo TEXT,
  fecha_entrega_deseada DATE,
  importe_previsto DECIMAL(10, 2),
  color_oro TEXT CHECK (color_oro IN ('amarillo', 'blanco', 'rosado')),
  pureza_oro TEXT CHECK (pureza_oro IN ('10k', '14k', '18k')),
  tipo_piedra TEXT CHECK (tipo_piedra IN ('diamante', 'gema')),
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'convertido', 'inactivo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminders table (for follow-ups and alerts)
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.prospects(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_recordatorio TIMESTAMP WITH TIME ZONE NOT NULL,
  completado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table (accessible by all authenticated users)
CREATE POLICY "Authenticated users can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (true);

-- Create policies for appointments table
CREATE POLICY "Authenticated users can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (true);

-- Create policies for prospects table
CREATE POLICY "Authenticated users can view all prospects"
ON public.prospects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create prospects"
ON public.prospects
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prospects"
ON public.prospects
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete prospects"
ON public.prospects
FOR DELETE
TO authenticated
USING (true);

-- Create policies for reminders table
CREATE POLICY "Authenticated users can view all reminders"
ON public.reminders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create reminders"
ON public.reminders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update reminders"
ON public.reminders
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete reminders"
ON public.reminders
FOR DELETE
TO authenticated
USING (true);

-- Create storage bucket for INE documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ine-documents',
  'ine-documents',
  false,
  5242880,
  ARRAY['application/pdf']
);

-- Create storage policies for INE documents
CREATE POLICY "Authenticated users can upload INE documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ine-documents');

CREATE POLICY "Authenticated users can view INE documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'ine-documents');

CREATE POLICY "Authenticated users can update INE documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ine-documents');

CREATE POLICY "Authenticated users can delete INE documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ine-documents');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_telefono_principal ON public.clients(telefono_principal);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_fecha ON public.appointments(fecha);
CREATE INDEX idx_prospects_client_id ON public.prospects(client_id);
CREATE INDEX idx_prospects_estado ON public.prospects(estado);
CREATE INDEX idx_reminders_client_id ON public.reminders(client_id);
CREATE INDEX idx_reminders_fecha_recordatorio ON public.reminders(fecha_recordatorio);
CREATE INDEX idx_reminders_completado ON public.reminders(completado);
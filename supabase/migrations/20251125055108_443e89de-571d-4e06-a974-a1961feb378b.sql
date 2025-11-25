-- Crear tabla de proveedores
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa TEXT NOT NULL,
  nombre_contacto TEXT NOT NULL,
  apellido_contacto TEXT,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  telefono_codigo_pais TEXT DEFAULT '+52',
  pais TEXT,
  ciudad TEXT,
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Admins pueden hacer todo
CREATE POLICY "Admins can insert suppliers"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can update suppliers"
ON public.suppliers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'));

-- Usuarios autenticados pueden ver proveedores
CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers
FOR SELECT
TO authenticated
USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Crear bucket para assets de la empresa
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket company-assets
-- Todos pueden ver los assets (público)
CREATE POLICY "Anyone can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Solo administradores pueden subir assets
CREATE POLICY "Admins can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'administrador'::app_role)
);

-- Solo administradores pueden actualizar assets
CREATE POLICY "Admins can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'administrador'::app_role)
);

-- Solo administradores pueden eliminar assets
CREATE POLICY "Admins can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' 
  AND has_role(auth.uid(), 'administrador'::app_role)
);
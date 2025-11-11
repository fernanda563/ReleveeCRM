-- Renombrar la columna tipo_anillo a tipo_accesorio
ALTER TABLE public.prospects 
RENAME COLUMN tipo_anillo TO tipo_accesorio;

-- Agregar nueva columna para subtipo/estilo del accesorio
ALTER TABLE public.prospects 
ADD COLUMN subtipo_accesorio TEXT;

-- Actualizar datos existentes (si hay)
UPDATE public.prospects 
SET tipo_accesorio = 'anillo' 
WHERE tipo_accesorio IS NOT NULL;
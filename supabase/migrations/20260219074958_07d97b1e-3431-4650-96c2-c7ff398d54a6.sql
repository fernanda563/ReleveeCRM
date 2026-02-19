
-- Eliminar el constraint actual
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_piedra_tipo_check;

-- Crear el constraint actualizado con todos los valores válidos del formulario
ALTER TABLE public.orders ADD CONSTRAINT orders_piedra_tipo_check
  CHECK (piedra_tipo = ANY (ARRAY[
    'diamante'::text,
    'diamante_natural'::text,
    'diamante_laboratorio'::text,
    'gema'::text,
    'perla'::text,
    'circonia'::text,
    'moissanita'::text,
    'piedra_semipreciosa'::text,
    'piedra_personalizada'::text
  ]));

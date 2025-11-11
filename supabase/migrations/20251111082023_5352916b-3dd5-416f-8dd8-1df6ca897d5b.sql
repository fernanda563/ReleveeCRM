-- 1. Crear tabla de configuración de tipos de accesorios
CREATE TABLE IF NOT EXISTS public.accessory_type_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_accesorio TEXT NOT NULL UNIQUE,
  codigo TEXT NOT NULL UNIQUE,
  requiere_talla BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Insertar tipos de accesorios iniciales
INSERT INTO public.accessory_type_config (tipo_accesorio, codigo, requiere_talla) VALUES
  ('anillo', 'AN', true),
  ('collar', 'CO', false),
  ('pulsera', 'PU', false),
  ('arete', 'AR', false),
  ('otro', 'OT', false),
  ('dije', 'DJ', false),
  ('cadena', 'CA', false),
  ('toby', 'TB', false),
  ('piercing', 'PI', false),
  ('brazalete', 'BR', false)
ON CONFLICT (tipo_accesorio) DO NOTHING;

-- 3. Agregar columnas a la tabla orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS custom_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tipo_accesorio TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS talla NUMERIC;

-- Agregar constraint de unicidad para custom_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_custom_id_key'
  ) THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_custom_id_key UNIQUE (custom_id);
  END IF;
END $$;

-- 4. Crear índice simple para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_orders_tipo_accesorio ON public.orders(tipo_accesorio);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- 5. Agregar número incremental a clientes
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS numero_incremental INTEGER;

-- Crear secuencia para numero_incremental
CREATE SEQUENCE IF NOT EXISTS clients_numero_incremental_seq;

-- Asignar valores secuenciales a clientes existentes
UPDATE public.clients 
SET numero_incremental = nextval('clients_numero_incremental_seq')
WHERE numero_incremental IS NULL;

-- Establecer la secuencia como default para nuevos clientes
ALTER TABLE public.clients 
ALTER COLUMN numero_incremental SET DEFAULT nextval('clients_numero_incremental_seq');

-- Hacer la columna NOT NULL
ALTER TABLE public.clients 
ALTER COLUMN numero_incremental SET NOT NULL;

-- Crear índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_numero_incremental ON public.clients(numero_incremental);

-- 6. Crear función para generar el ID personalizado
CREATE OR REPLACE FUNCTION public.generate_custom_order_id(
  p_tipo_accesorio TEXT,
  p_talla NUMERIC,
  p_metal_tipo TEXT,
  p_metal_color TEXT,
  p_client_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fecha TEXT;
  v_contador_diario INTEGER;
  v_numero_cliente INTEGER;
  v_tipo_codigo TEXT;
  v_metal_codigo TEXT;
  v_talla_formateada TEXT;
  v_custom_id TEXT;
  v_talla_entera INTEGER;
  v_talla_decimal INTEGER;
BEGIN
  -- 1. Obtener fecha en formato DDMMYY
  v_fecha := TO_CHAR(NOW(), 'DDMMYY');
  
  -- 2. Obtener código del tipo de accesorio desde la tabla de configuración
  SELECT codigo INTO v_tipo_codigo
  FROM accessory_type_config
  WHERE tipo_accesorio = LOWER(TRIM(p_tipo_accesorio));
  
  -- Si no se encuentra el tipo, usar 'XX' como fallback
  IF v_tipo_codigo IS NULL THEN
    v_tipo_codigo := 'XX';
  END IF;
  
  -- 3. Contar productos del mismo tipo creados hoy
  SELECT COUNT(*) + 1 INTO v_contador_diario
  FROM orders
  WHERE tipo_accesorio = LOWER(TRIM(p_tipo_accesorio))
    AND DATE(created_at) = CURRENT_DATE;
  
  -- 4. Obtener número incremental del cliente
  SELECT numero_incremental INTO v_numero_cliente
  FROM clients
  WHERE id = p_client_id;
  
  -- Si el cliente no tiene número, usar 0
  IF v_numero_cliente IS NULL THEN
    v_numero_cliente := 0;
  END IF;
  
  -- 5. Mapear metal a código (manejo robusto)
  v_metal_codigo := CASE
    WHEN p_metal_tipo = 'oro' AND p_metal_color = 'amarillo' THEN 'A'
    WHEN p_metal_tipo = 'oro' AND p_metal_color = 'blanco' THEN 'B'
    WHEN p_metal_tipo = 'platino' THEN 'P'
    WHEN p_metal_tipo = 'oro' AND p_metal_color = 'rosado' THEN 'R'
    WHEN p_metal_tipo = 'plata' THEN 'S'
    WHEN p_metal_tipo = 'acero' THEN 'E'
    WHEN p_metal_tipo = 'titanio' THEN 'T'
    ELSE 'X'
  END;
  
  -- 6. Formatear talla (ej: 6.75 -> 0675, 11.75 -> 1175)
  -- Si talla es NULL o 0, usar '0000'
  IF p_talla IS NULL OR p_talla = 0 THEN
    v_talla_formateada := '0000';
  ELSE
    v_talla_entera := FLOOR(p_talla);
    v_talla_decimal := ROUND((p_talla - v_talla_entera) * 100);
    v_talla_formateada := LPAD(v_talla_entera::TEXT, 2, '0') || LPAD(v_talla_decimal::TEXT, 2, '0');
  END IF;
  
  -- 7. Generar ID personalizado
  v_custom_id := v_tipo_codigo || '-' || 
                 v_fecha || '-' || 
                 LPAD(v_contador_diario::TEXT, 2, '0') || '-' || 
                 LPAD(v_numero_cliente::TEXT, 2, '0') || '-' || 
                 v_talla_formateada || '-' || 
                 v_metal_codigo;
  
  RETURN v_custom_id;
END;
$$;

-- 7. Crear trigger para generar el ID automáticamente
CREATE OR REPLACE FUNCTION public.trigger_generate_custom_order_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo generar si no existe custom_id y tenemos los datos mínimos necesarios
  IF NEW.custom_id IS NULL AND 
     NEW.tipo_accesorio IS NOT NULL AND 
     NEW.metal_tipo IS NOT NULL AND
     NEW.client_id IS NOT NULL THEN
    
    NEW.custom_id := generate_custom_order_id(
      NEW.tipo_accesorio,
      NEW.talla,
      NEW.metal_tipo,
      NEW.metal_color,
      NEW.client_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_generate_custom_id ON public.orders;
CREATE TRIGGER orders_generate_custom_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_custom_order_id();

-- 8. Habilitar RLS en la nueva tabla
ALTER TABLE public.accessory_type_config ENABLE ROW LEVEL SECURITY;

-- 9. Crear políticas RLS para accessory_type_config (solo lectura para usuarios autenticados)
CREATE POLICY "Authenticated users can view accessory types"
ON public.accessory_type_config
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert accessory types"
ON public.accessory_type_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can update accessory types"
ON public.accessory_type_config
FOR UPDATE
USING (has_role(auth.uid(), 'administrador'::app_role));

CREATE POLICY "Admins can delete accessory types"
ON public.accessory_type_config
FOR DELETE
USING (has_role(auth.uid(), 'administrador'::app_role));
-- Eliminar columnas obsoletas
ALTER TABLE suppliers DROP COLUMN IF EXISTS ciudad;
ALTER TABLE suppliers DROP COLUMN IF EXISTS direccion;
ALTER TABLE suppliers DROP COLUMN IF EXISTS apellido_contacto;

-- Agregar nueva columna para tipos de productos
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tipos_productos JSONB DEFAULT '[]'::jsonb;

-- Crear índice en la columna país para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_suppliers_pais ON suppliers(pais);
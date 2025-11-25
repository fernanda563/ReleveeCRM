-- Agregar columna supplier_id como foreign key a suppliers
ALTER TABLE purchase_orders_internal
ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_purchase_orders_internal_supplier_id 
ON purchase_orders_internal(supplier_id);

-- Comentario: Mantener proveedor_nombre para retrocompatibilidad
-- con órdenes históricas que no tienen supplier_id
-- Add new columns for CSV diamond data to purchase_orders_internal table
ALTER TABLE purchase_orders_internal
ADD COLUMN numero_stock text,
ADD COLUMN pulido text,
ADD COLUMN simetria text,
ADD COLUMN medidas text;
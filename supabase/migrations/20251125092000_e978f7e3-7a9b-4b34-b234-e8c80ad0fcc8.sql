-- Add internal_order_id column to orders table to link with purchase orders
ALTER TABLE orders ADD COLUMN internal_order_id UUID REFERENCES purchase_orders_internal(id) ON DELETE SET NULL;
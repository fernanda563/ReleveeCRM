-- Add fecha_entrega_esperada column to orders table
ALTER TABLE public.orders 
ADD COLUMN fecha_entrega_esperada date;
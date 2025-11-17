-- Add referencia_pago column to orders table
ALTER TABLE public.orders ADD COLUMN referencia_pago TEXT;

COMMENT ON COLUMN public.orders.referencia_pago IS 'Referencia alfanumérica de la transacción (para transferencias, tarjetas o cheques)';
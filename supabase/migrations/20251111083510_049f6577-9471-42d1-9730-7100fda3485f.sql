-- Create audit log table for order deletions
CREATE TABLE public.order_deletion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  order_custom_id TEXT,
  deleted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_data JSONB NOT NULL,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view deletion logs
CREATE POLICY "Only admins can view deletion logs"
ON public.order_deletion_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

-- Authenticated users can insert logs (for auditing before deletion)
CREATE POLICY "Authenticated users can insert deletion logs"
ON public.order_deletion_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = deleted_by);

-- Create index for faster queries
CREATE INDEX idx_order_deletion_logs_deleted_by ON public.order_deletion_logs(deleted_by);
CREATE INDEX idx_order_deletion_logs_deleted_at ON public.order_deletion_logs(deleted_at DESC);
CREATE INDEX idx_order_deletion_logs_order_id ON public.order_deletion_logs(order_id);

-- Add comment for documentation
COMMENT ON TABLE public.order_deletion_logs IS 'Audit log for tracking all order deletions with full order data snapshot and user attribution';
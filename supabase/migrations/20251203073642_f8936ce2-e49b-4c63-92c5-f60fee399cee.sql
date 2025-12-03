-- Create enum for work areas
CREATE TYPE public.work_area AS ENUM ('diseño', 'taller');

-- Create enum for work order status
CREATE TYPE public.work_order_status AS ENUM ('pendiente', 'en_proceso', 'completado', 'cancelado');

-- Create work_concepts table (Catalog of work concepts)
CREATE TABLE public.work_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  area public.work_area NOT NULL,
  costo_base NUMERIC NOT NULL DEFAULT 0,
  precio_venta_base NUMERIC NOT NULL DEFAULT 0,
  unidad_medida TEXT NOT NULL DEFAULT 'unidad',
  es_precio_variable BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  taller_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  descripcion TEXT,
  estado public.work_order_status NOT NULL DEFAULT 'pendiente',
  fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_esperada DATE,
  total_costo NUMERIC NOT NULL DEFAULT 0,
  total_precio NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create work_order_items table
CREATE TABLE public.work_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  work_concept_id UUID NOT NULL REFERENCES public.work_concepts(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  costo_unitario NUMERIC NOT NULL DEFAULT 0,
  precio_unitario NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.work_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_concepts
CREATE POLICY "Authenticated users can view active work concepts"
ON public.work_concepts FOR SELECT
USING (true);

CREATE POLICY "Admins can insert work concepts"
ON public.work_concepts FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can update work concepts"
ON public.work_concepts FOR UPDATE
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can delete work concepts"
ON public.work_concepts FOR DELETE
USING (public.has_role(auth.uid(), 'administrador'));

-- RLS Policies for work_orders
CREATE POLICY "Authenticated users can view work orders"
ON public.work_orders FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create work orders"
ON public.work_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update work orders"
ON public.work_orders FOR UPDATE
USING (true);

CREATE POLICY "Only admins can delete work orders"
ON public.work_orders FOR DELETE
USING (public.has_role(auth.uid(), 'administrador'));

-- RLS Policies for work_order_items
CREATE POLICY "Authenticated users can view work order items"
ON public.work_order_items FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create work order items"
ON public.work_order_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update work order items"
ON public.work_order_items FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete work order items"
ON public.work_order_items FOR DELETE
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_work_concepts_updated_at
BEFORE UPDATE ON public.work_concepts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
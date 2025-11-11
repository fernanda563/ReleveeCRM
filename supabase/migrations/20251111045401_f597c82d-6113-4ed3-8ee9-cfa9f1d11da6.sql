-- Agregar foreign keys con ON DELETE CASCADE para eliminación en cascada

-- 1. Agregar foreign key para orders.client_id
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_client_id_fkey,
ADD CONSTRAINT orders_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;

-- 2. Agregar foreign key para appointments.client_id
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_client_id_fkey,
ADD CONSTRAINT appointments_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;

-- 3. Agregar foreign key para prospects.client_id
ALTER TABLE public.prospects
DROP CONSTRAINT IF EXISTS prospects_client_id_fkey,
ADD CONSTRAINT prospects_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;

-- 4. Agregar foreign key para reminders.client_id
ALTER TABLE public.reminders
DROP CONSTRAINT IF EXISTS reminders_client_id_fkey,
ADD CONSTRAINT reminders_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE CASCADE;
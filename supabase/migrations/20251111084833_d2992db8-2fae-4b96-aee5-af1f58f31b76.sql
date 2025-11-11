-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_diamante_forma_check;

-- Add updated check constraint with all valid diamond cuts including new ones
ALTER TABLE public.orders ADD CONSTRAINT orders_diamante_forma_check 
CHECK (
  diamante_forma IS NULL OR 
  diamante_forma = ANY (ARRAY[
    'redondo',
    'princesa', 
    'esmeralda',
    'asscher',
    'marquisa',  -- Fixed from 'marqui' to 'marquisa'
    'oval',
    'radiante',
    'pera',
    'corazon',
    'cojin',
    'baguette',   -- Added
    'trilliant',  -- Added
    'rose'        -- Added
  ])
);
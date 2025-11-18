-- Add embedded signature URL columns to orders table
ALTER TABLE orders 
ADD COLUMN embedded_sign_url TEXT,
ADD COLUMN embedded_sign_url_expires_at TIMESTAMP WITH TIME ZONE;
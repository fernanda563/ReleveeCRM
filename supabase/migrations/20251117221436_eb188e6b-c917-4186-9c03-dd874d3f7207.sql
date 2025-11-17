-- Agregar columna para almacenar URL del PDF enviado a firma
ALTER TABLE orders ADD COLUMN pending_signature_pdf_url TEXT;
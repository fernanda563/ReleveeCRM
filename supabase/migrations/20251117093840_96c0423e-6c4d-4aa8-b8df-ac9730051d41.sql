-- Make reference-images bucket public so images can be displayed in PDF without CORS issues
UPDATE storage.buckets 
SET public = true 
WHERE id = 'reference-images';
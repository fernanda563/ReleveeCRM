-- Drop the current permissive delete policy
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- Create new restrictive policy: only administrators can delete orders
CREATE POLICY "Only admins can delete orders" 
ON orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));
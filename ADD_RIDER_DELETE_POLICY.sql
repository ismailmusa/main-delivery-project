/*
  # Add Rider Delete Policy for Delivered Orders

  1. Purpose
    - Allow riders to delete their own delivered orders from history
    - Only applies to orders with status 'delivered'
    - Riders can only delete orders that are assigned to them

  2. Security
    - Rider must be authenticated
    - Rider can only delete orders where they are the assigned rider
    - Order must be in 'delivered' status (cannot delete active orders)
    - Uses EXISTS check to verify rider ownership
*/

-- Add policy for riders to delete their own delivered orders
CREATE POLICY "Riders can delete own delivered orders"
  ON deliveries FOR DELETE
  TO authenticated
  USING (
    status = 'delivered'
    AND EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id
      AND riders.user_id = auth.uid()
    )
  );

-- Verify all delete policies on deliveries table
SELECT
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'deliveries'
AND cmd = 'DELETE'
ORDER BY policyname;

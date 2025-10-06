/*
  # Add Admin Delete Policies

  1. Changes
    - Add DELETE policy for deliveries table (admin only)
    - Add DELETE policy for delivery_tracking table (admin only)
    - Enable cascade deletion for related records

  2. Security
    - Only admins with is_admin=true can delete deliveries
    - Ensures proper cleanup of related tracking data
*/

-- Add DELETE policy for deliveries (admin only)
DROP POLICY IF EXISTS "Admins can delete deliveries" ON deliveries;
CREATE POLICY "Admins can delete deliveries"
  ON deliveries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Add DELETE policy for delivery_tracking (admin only)
DROP POLICY IF EXISTS "Admins can delete delivery tracking" ON delivery_tracking;
CREATE POLICY "Admins can delete delivery tracking"
  ON delivery_tracking FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

/*
  # Fix Delivery Policies and Permissions

  1. Security Fix
    - Remove overly permissive policy "All authenticated users can view all deliveries"
    - Remove overly permissive policy "All authenticated users can update deliveries"
    - These policies allow ANY logged-in user to see and modify ALL deliveries

  2. New Policies
    - Add policy for riders to view pending/unassigned deliveries (for Available Jobs)
    - Add policy for admins to view all deliveries
    - Add policy for admins to update/delete all deliveries
    - Keep existing customer and rider policies

  3. Important Notes
    - Customers can only see their own deliveries
    - Riders can see:
      * Pending deliveries with no rider assigned (to accept jobs)
      * Deliveries assigned to them
    - Admins can see and manage everything
    - This follows the principle of least privilege
*/

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "All authenticated users can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "All authenticated users can update deliveries" ON deliveries;

-- Add policy for riders to view available (pending) deliveries
CREATE POLICY "Riders can view available pending deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    status = 'pending'
    AND rider_id IS NULL
    AND EXISTS (
      SELECT 1 FROM riders
      WHERE riders.user_id = auth.uid()
      AND riders.approval_status = 'approved'
    )
  );

-- Add policy for admins to view all deliveries
CREATE POLICY "Admins can view all deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for admins to update all deliveries
CREATE POLICY "Admins can update all deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add policy for admins to delete all deliveries
CREATE POLICY "Admins can delete all deliveries"
  ON deliveries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow riders to accept deliveries (update from pending to assigned)
CREATE POLICY "Riders can accept pending deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND rider_id IS NULL
    AND EXISTS (
      SELECT 1 FROM riders
      WHERE riders.user_id = auth.uid()
      AND riders.approval_status = 'approved'
    )
  )
  WITH CHECK (
    status = 'assigned'
    AND EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id
      AND riders.user_id = auth.uid()
    )
  );

-- Verify all policies on deliveries table
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'deliveries'
ORDER BY policyname;

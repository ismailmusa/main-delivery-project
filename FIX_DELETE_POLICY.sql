-- ====================================================================
-- FIX: Add Delete Policies for Admin
-- ====================================================================
-- Run this in your Supabase SQL Editor to enable deletion functionality
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://0ec90b57d6e95fcbda19832f.supabase.co
-- 2. Navigate to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Click Run (or press Ctrl+Enter)
-- ====================================================================

-- Add DELETE policy for deliveries (admin only)
DROP POLICY IF EXISTS "Admins can delete deliveries" ON deliveries;
CREATE POLICY "Admins can delete deliveries"
  ON deliveries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
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
      AND profiles.role = 'admin'
    )
  );

-- Verify policies are created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('deliveries', 'delivery_tracking')
AND cmd = 'DELETE';

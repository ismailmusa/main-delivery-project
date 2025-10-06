/*
  # Complete Migration to Fix All Delivery Policies

  This migration combines all necessary policy fixes in one place:
  1. Remove overly permissive policies
  2. Add proper restrictive policies for riders, customers, and admins
  3. Enable rider delete functionality for delivered orders

  IMPORTANT: Run this in your Supabase SQL Editor
*/

-- =====================================================
-- STEP 1: Clean up all existing delivery policies
-- =====================================================
DROP POLICY IF EXISTS "All authenticated users can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Customers can view own deliveries" ON deliveries;
DROP POLICY IF EXISTS "All authenticated users can update deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can view available pending deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can view assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can accept pending deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can update assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Customers can create deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can update all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can delete all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can delete own delivered orders" ON deliveries;

-- =====================================================
-- STEP 2: Create SELECT policies (who can view what)
-- =====================================================

-- Customers can view their own deliveries
CREATE POLICY "Customers can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Riders can view pending deliveries (to accept jobs)
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

-- Riders can view their assigned deliveries
CREATE POLICY "Riders can view assigned deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id
      AND riders.user_id = auth.uid()
    )
  );

-- Admins can view all deliveries
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

-- =====================================================
-- STEP 3: Create INSERT policies (who can create)
-- =====================================================

-- Customers can create deliveries
CREATE POLICY "Customers can create deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- =====================================================
-- STEP 4: Create UPDATE policies (who can modify)
-- =====================================================

-- Riders can update their assigned deliveries (all status changes)
CREATE POLICY "Riders can update assigned deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id
      AND riders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id
      AND riders.user_id = auth.uid()
    )
  );

-- Riders can accept pending deliveries (assign themselves)
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

-- Admins can update all deliveries
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

-- =====================================================
-- STEP 5: Create DELETE policies (who can delete)
-- =====================================================

-- Riders can delete their own delivered orders
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

-- Admins can delete all deliveries
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

-- =====================================================
-- STEP 6: Verify all policies
-- =====================================================
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'deliveries'
ORDER BY cmd, policyname;

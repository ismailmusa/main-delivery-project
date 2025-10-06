/*
  # Create Admin Check Function and Update All RLS Policies

  1. New Functions
    - `is_admin()` - Safely checks if current user is admin using a CTE
  
  2. Changes
    - Update all RLS policies to use the new is_admin() function
    - Remove infinite recursion issues
    - Ensure proper access control
  
  3. Security
    - All policies now properly check permissions without recursion
    - Admins have full access to all tables
    - Regular users have limited access based on their role
*/

-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles of delivery participants" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update riders policies
DROP POLICY IF EXISTS "Admins can view all riders" ON riders;
DROP POLICY IF EXISTS "Admins can update all riders" ON riders;

CREATE POLICY "Admins can view all riders"
  ON riders FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all riders"
  ON riders FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update deliveries policies
DROP POLICY IF EXISTS "Admins can view all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Admins can update all deliveries" ON deliveries;

CREATE POLICY "Admins can view all deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can insert deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Update wallets policies
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update transactions policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Update support tickets policies
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;

CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
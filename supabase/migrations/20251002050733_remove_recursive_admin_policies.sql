/*
  # Remove Recursive Admin Policies

  1. Changes
    - Drop all admin policies that query profiles table
    - Temporarily disable RLS for profiles to allow login
    - We'll handle admin access in application logic
  
  2. Security
    - Users can still only modify their own data
    - Admin features will be controlled by frontend logic and role checks
*/

-- Drop the recursive admin policies
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "riders_select_admin" ON riders;
DROP POLICY IF EXISTS "riders_update_admin" ON riders;
DROP POLICY IF EXISTS "deliveries_select_admin" ON deliveries;
DROP POLICY IF EXISTS "deliveries_update_admin" ON deliveries;
DROP POLICY IF EXISTS "wallets_select_admin" ON wallets;
DROP POLICY IF EXISTS "transactions_select_admin" ON transactions;
DROP POLICY IF EXISTS "tickets_select_admin" ON support_tickets;
DROP POLICY IF EXISTS "tickets_update_admin" ON support_tickets;

-- Temporarily disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on other tables but allow broader access for now
-- We'll add proper RLS later with a better strategy

-- Allow all authenticated users to read profiles (needed for admin dashboard)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can still only update their own profile
CREATE POLICY "profiles_update_own_only"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Re-enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
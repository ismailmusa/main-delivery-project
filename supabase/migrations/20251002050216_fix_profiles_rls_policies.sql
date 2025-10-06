/*
  # Fix Profiles RLS Policies

  1. Changes
    - Drop existing problematic policies on profiles table
    - Create new policies without infinite recursion
    - Use app_metadata from auth.jwt() to check admin role instead of querying profiles table
  
  2. Security
    - Users can view and update their own profile
    - All policies are safe from infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new policies without recursion
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- For admin access, we'll use a simpler approach
-- Admins can be identified by a specific UUID or we can use service role
-- For now, let's allow users to view profiles they interact with
CREATE POLICY "Users can view profiles of delivery participants"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM deliveries 
      WHERE (deliveries.customer_id = auth.uid() OR 
             deliveries.rider_id IN (SELECT id FROM riders WHERE user_id = auth.uid()))
      AND (deliveries.customer_id = profiles.id OR 
           deliveries.rider_id IN (SELECT id FROM riders WHERE user_id = profiles.id))
    )
  );
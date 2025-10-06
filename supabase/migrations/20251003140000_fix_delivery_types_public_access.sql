/*
  # Fix Delivery Types Public Access

  1. Changes
    - Drop existing SELECT policy on delivery_types
    - Create new policy that allows public (including unauthenticated users) to view active delivery types
    - This is necessary for the booking form to load delivery types before user authentication

  2. Security
    - Still restricts write operations to admins only
    - Only exposes active delivery types to public
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can view active delivery types" ON delivery_types;

-- Create new policy allowing public read access to active delivery types
CREATE POLICY "Public can view active delivery types"
  ON delivery_types FOR SELECT
  TO public
  USING (is_active = true);

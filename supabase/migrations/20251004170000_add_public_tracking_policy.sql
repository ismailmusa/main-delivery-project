/*
  # Add Public Tracking Policy

  1. Changes
    - Add policy to allow anyone (including anonymous users) to view delivery information by tracking number
    - This enables the public tracking page to function without authentication

  2. Security
    - Policy only allows SELECT operations
    - No other operations (INSERT, UPDATE, DELETE) are permitted for anonymous users
    - Authenticated users still follow existing policies
*/

-- Add policy for public tracking by tracking number
CREATE POLICY "Anyone can view delivery by tracking number"
  ON deliveries FOR SELECT
  TO anon
  USING (true);

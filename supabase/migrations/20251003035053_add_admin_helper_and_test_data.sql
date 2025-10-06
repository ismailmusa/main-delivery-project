/*
  # Add Admin Helper Function and Ensure Proper Access

  1. New Functions
    - Helper function to create admin users
  
  2. Changes
    - Ensure profiles table allows proper admin creation
    - Add comment with instructions for creating first admin
  
  3. Security
    - Admin creation should be done carefully
    - Function is for initial setup only
*/

-- Function to manually promote a user to admin (use with caution)
CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin', status = 'active'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Instructions to create an admin user:
-- 1. Register a user through the app
-- 2. Run: SELECT promote_to_admin('admin@example.com');
-- Replace 'admin@example.com' with the actual email address

COMMENT ON FUNCTION promote_to_admin IS 'Promotes a user to admin role. Usage: SELECT promote_to_admin(''user@example.com'');';
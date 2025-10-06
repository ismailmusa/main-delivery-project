-- ====================================================================
-- MANUAL ADMIN CREATION SCRIPT
-- ====================================================================
-- Use this script to promote any user to admin role
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Navigate to SQL Editor
-- 3. Replace 'user@example.com' with the actual email address
-- 4. Run the query (Ctrl+Enter)
-- ====================================================================

-- Replace 'user@example.com' with the email of the user you want to promote
UPDATE profiles
SET role = 'admin', status = 'active'
WHERE email = 'user@example.com';

-- Verify the update worked
SELECT id, email, full_name, role, status, created_at
FROM profiles
WHERE email = 'user@example.com';

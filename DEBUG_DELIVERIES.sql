-- DEBUG: Check deliveries and rider assignments
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Show all riders
SELECT
  id as rider_id,
  user_id,
  is_available,
  approval_status
FROM riders;

-- 2. Show all deliveries with rider assignments
SELECT
  id as delivery_id,
  tracking_number,
  rider_id,
  status,
  created_at,
  updated_at
FROM deliveries
ORDER BY updated_at DESC;

-- 3. Show deliveries with rider info joined
SELECT
  d.id as delivery_id,
  d.tracking_number,
  d.status,
  d.rider_id,
  r.user_id as rider_user_id,
  p.email as rider_email,
  p.full_name as rider_name
FROM deliveries d
LEFT JOIN riders r ON d.rider_id = r.id
LEFT JOIN profiles p ON r.user_id = p.id
WHERE d.rider_id IS NOT NULL
ORDER BY d.updated_at DESC;

-- 4. Check RLS policies on deliveries table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'deliveries'
ORDER BY policyname;

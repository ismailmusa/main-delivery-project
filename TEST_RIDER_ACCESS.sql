-- Test if a rider can see their assigned deliveries
-- Replace <RIDER_USER_ID> with the actual user ID of the rider

-- 1. Find the rider record
SELECT
  id as rider_id,
  user_id,
  is_available,
  approval_status
FROM riders
WHERE user_id = '<RIDER_USER_ID>';
-- Copy the rider_id from above

-- 2. Check deliveries assigned to this rider_id
SELECT
  id,
  tracking_number,
  status,
  rider_id,
  customer_id
FROM deliveries
WHERE rider_id = '<RIDER_ID_FROM_ABOVE>';

-- 3. Test the RLS policy logic manually
-- Replace <RIDER_USER_ID> with the actual auth.uid() value
SELECT
  d.*,
  EXISTS (
    SELECT 1 FROM riders r
    WHERE r.id = d.rider_id
    AND r.user_id = '<RIDER_USER_ID>'
  ) as rider_has_access
FROM deliveries d
WHERE d.status IN ('assigned', 'picked_up', 'in_transit');

-- 4. Check all policies on deliveries table
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'deliveries'
ORDER BY policyname;

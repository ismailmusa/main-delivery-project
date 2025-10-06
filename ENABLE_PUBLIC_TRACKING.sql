-- Run this SQL in your Supabase SQL Editor to enable public tracking
-- This allows anyone to view deliveries by tracking number without authentication

-- Drop existing policies if they exist, then create new ones
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'deliveries'
    AND policyname = 'Anyone can view delivery by tracking number'
  ) THEN
    DROP POLICY "Anyone can view delivery by tracking number" ON deliveries;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'delivery_tracking'
    AND policyname = 'Anyone can view delivery tracking'
  ) THEN
    DROP POLICY "Anyone can view delivery tracking" ON delivery_tracking;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND policyname = 'Anyone can view public profile info'
  ) THEN
    DROP POLICY "Anyone can view public profile info" ON profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'riders'
    AND policyname = 'Anyone can view rider info'
  ) THEN
    DROP POLICY "Anyone can view rider info" ON riders;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'delivery_types'
    AND policyname = 'Anyone can view delivery types'
  ) THEN
    DROP POLICY "Anyone can view delivery types" ON delivery_types;
  END IF;
END $$;

-- Allow anonymous users to view deliveries
CREATE POLICY "Anyone can view delivery by tracking number"
  ON deliveries FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view delivery tracking updates
CREATE POLICY "Anyone can view delivery tracking"
  ON delivery_tracking FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view public profile info (for sender/rider info)
CREATE POLICY "Anyone can view public profile info"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view rider info
CREATE POLICY "Anyone can view rider info"
  ON riders FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view delivery types
CREATE POLICY "Anyone can view delivery types"
  ON delivery_types FOR SELECT
  TO anon
  USING (true);

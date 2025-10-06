/*
  # Create Delivery Types Table

  1. New Tables
    - `delivery_types`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Name of delivery type (e.g., "Express", "Standard", "Same Day")
      - `description` (text) - Description of the delivery type
      - `base_price` (decimal) - Base price for this delivery type
      - `estimated_hours` (integer) - Estimated delivery time in hours
      - `icon` (text) - Icon identifier for UI
      - `is_active` (boolean) - Whether this delivery type is currently available
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to deliveries table
    - Add `delivery_type_id` foreign key column

  3. Security
    - Enable RLS on `delivery_types` table
    - Add policies for public read access
    - Add policies for admin write access

  4. Sample Data
    - Insert default delivery types
*/

-- Create delivery_types table
CREATE TABLE IF NOT EXISTS delivery_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  estimated_hours integer NOT NULL DEFAULT 24,
  icon text NOT NULL DEFAULT 'package',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add delivery_type_id to deliveries table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliveries' AND column_name = 'delivery_type_id'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN delivery_type_id uuid REFERENCES delivery_types(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE delivery_types ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active delivery types
CREATE POLICY "Anyone can view active delivery types"
  ON delivery_types FOR SELECT
  USING (is_active = true);

-- Allow admins to manage delivery types
CREATE POLICY "Admins can insert delivery types"
  ON delivery_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update delivery types"
  ON delivery_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete delivery types"
  ON delivery_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default delivery types
INSERT INTO delivery_types (name, description, base_price, estimated_hours, icon) VALUES
  ('Standard', 'Regular delivery within 24-48 hours', 1500.00, 48, 'package'),
  ('Express', 'Fast delivery within 12 hours', 3000.00, 12, 'zap'),
  ('Same Day', 'Delivery on the same day within 6 hours', 5000.00, 6, 'clock'),
  ('Next Day', 'Guaranteed delivery by next day', 2000.00, 24, 'calendar')
ON CONFLICT (name) DO NOTHING;

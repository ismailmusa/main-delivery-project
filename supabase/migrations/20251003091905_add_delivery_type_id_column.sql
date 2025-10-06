/*
  # Add delivery_type_id to deliveries table

  1. Changes
    - Add delivery_type_id column to deliveries table
    - Add foreign key constraint to delivery_types table
    - Column is optional (nullable) for backward compatibility

  2. Notes
    - Existing deliveries will have NULL delivery_type_id
    - New deliveries can optionally specify a delivery type
*/

-- Add delivery_type_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deliveries' AND column_name = 'delivery_type_id'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN delivery_type_id uuid REFERENCES delivery_types(id);
  END IF;
END $$;
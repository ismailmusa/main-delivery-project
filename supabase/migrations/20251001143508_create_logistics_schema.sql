/*
  # Danhausa Logistics Platform Schema

  ## Overview
  This migration creates the complete database structure for a logistics and delivery platform
  with customer, rider, and admin functionality.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact number
  - `role` (text) - User role: customer, rider, admin
  - `avatar_url` (text) - Profile picture
  - `status` (text) - Account status: active, suspended, pending
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. riders
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to profiles
  - `vehicle_type` (text) - bike, car, van, truck
  - `vehicle_number` (text) - License plate
  - `driver_license` (text) - License number
  - `bank_account` (text) - Payment details
  - `is_available` (boolean) - Current availability
  - `current_lat` (numeric) - Current latitude
  - `current_lng` (numeric) - Current longitude
  - `rating` (numeric) - Average rating
  - `total_deliveries` (integer) - Completed deliveries count
  - `approval_status` (text) - pending, approved, rejected
  - `created_at` (timestamptz)

  ### 3. deliveries
  - `id` (uuid, primary key)
  - `customer_id` (uuid) - Links to profiles
  - `rider_id` (uuid) - Links to riders (nullable)
  - `tracking_number` (text) - Unique tracking ID
  - `pickup_address` (text) - Pickup location
  - `pickup_lat` (numeric) - Pickup latitude
  - `pickup_lng` (numeric) - Pickup longitude
  - `dropoff_address` (text) - Delivery location
  - `dropoff_lat` (numeric) - Delivery latitude
  - `dropoff_lng` (numeric) - Delivery longitude
  - `package_details` (text) - Package description
  - `package_weight` (text) - Weight category
  - `recipient_name` (text) - Receiver's name
  - `recipient_phone` (text) - Receiver's phone
  - `fare_estimate` (numeric) - Calculated fare
  - `final_fare` (numeric) - Actual fare paid
  - `payment_method` (text) - card, transfer, wallet, cash
  - `payment_status` (text) - pending, completed, failed
  - `status` (text) - pending, assigned, picked_up, in_transit, delivered, cancelled
  - `notes` (text) - Special instructions
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### 4. delivery_tracking
  - `id` (uuid, primary key)
  - `delivery_id` (uuid) - Links to deliveries
  - `rider_lat` (numeric) - Rider's latitude
  - `rider_lng` (numeric) - Rider's longitude
  - `status_update` (text) - Status message
  - `timestamp` (timestamptz)

  ### 5. wallets
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to profiles
  - `balance` (numeric) - Current balance
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 6. transactions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to profiles
  - `delivery_id` (uuid) - Links to deliveries (nullable)
  - `type` (text) - credit, debit, refund, payout
  - `amount` (numeric) - Transaction amount
  - `description` (text) - Transaction description
  - `status` (text) - pending, completed, failed
  - `created_at` (timestamptz)

  ### 7. ratings
  - `id` (uuid, primary key)
  - `delivery_id` (uuid) - Links to deliveries
  - `customer_id` (uuid) - Links to profiles
  - `rider_id` (uuid) - Links to riders
  - `rating` (integer) - Rating value (1-5)
  - `comment` (text) - Review comment
  - `created_at` (timestamptz)

  ### 8. support_tickets
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to profiles
  - `delivery_id` (uuid) - Links to deliveries (nullable)
  - `subject` (text) - Issue subject
  - `message` (text) - Issue description
  - `status` (text) - open, in_progress, resolved, closed
  - `priority` (text) - low, medium, high
  - `admin_notes` (text) - Admin response
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 9. notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Links to profiles
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `type` (text) - delivery, payment, system
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Customers can only access their own data
  - Riders can access assigned deliveries
  - Admins have full access
  - Public users can only read their own notifications

  ## Important Notes
  - All monetary values stored as numeric with 2 decimal precision
  - Timestamps use timezone-aware types
  - Foreign key constraints ensure data integrity
  - Indexes on frequently queried columns for performance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'rider', 'admin')),
  avatar_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create riders table
CREATE TABLE IF NOT EXISTS riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bike', 'car', 'van', 'truck')),
  vehicle_number text NOT NULL,
  driver_license text NOT NULL,
  bank_account text,
  is_available boolean DEFAULT false,
  current_lat numeric,
  current_lng numeric,
  rating numeric DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_deliveries integer DEFAULT 0,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rider_id uuid REFERENCES riders(id) ON DELETE SET NULL,
  tracking_number text UNIQUE NOT NULL,
  pickup_address text NOT NULL,
  pickup_lat numeric NOT NULL,
  pickup_lng numeric NOT NULL,
  dropoff_address text NOT NULL,
  dropoff_lat numeric NOT NULL,
  dropoff_lng numeric NOT NULL,
  package_details text NOT NULL,
  package_weight text NOT NULL CHECK (package_weight IN ('light', 'medium', 'heavy')),
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  fare_estimate numeric(10,2) NOT NULL,
  final_fare numeric(10,2),
  payment_method text NOT NULL CHECK (payment_method IN ('card', 'transfer', 'wallet', 'cash')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES deliveries(id) ON DELETE CASCADE NOT NULL,
  rider_lat numeric NOT NULL,
  rider_lng numeric NOT NULL,
  status_update text,
  timestamp timestamptz DEFAULT now()
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  delivery_id uuid REFERENCES deliveries(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'payout')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES deliveries(id) ON DELETE CASCADE UNIQUE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rider_id uuid REFERENCES riders(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  delivery_id uuid REFERENCES deliveries(id) ON DELETE SET NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('delivery', 'payment', 'system')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery ON delivery_tracking(delivery_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_available ON riders(is_available);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Riders policies
CREATE POLICY "Riders can view own data"
  ON riders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Riders can update own data"
  ON riders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create rider profile"
  ON riders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all riders"
  ON riders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all riders"
  ON riders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Deliveries policies
CREATE POLICY "Customers can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Riders can view assigned deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id AND riders.user_id = auth.uid()
    )
  );

CREATE POLICY "Riders can update assigned deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id AND riders.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM riders
      WHERE riders.id = deliveries.rider_id AND riders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Delivery tracking policies
CREATE POLICY "Users can view tracking for their deliveries"
  ON delivery_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_tracking.delivery_id
      AND (deliveries.customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM riders
        WHERE riders.id = deliveries.rider_id AND riders.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Riders can create tracking updates"
  ON delivery_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliveries
      JOIN riders ON riders.id = deliveries.rider_id
      WHERE deliveries.id = delivery_tracking.delivery_id
      AND riders.user_id = auth.uid()
    )
  );

-- Wallets policies
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ratings policies
CREATE POLICY "Users can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create ratings for their deliveries"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Support tickets policies
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS text AS $$
BEGIN
  RETURN 'DL' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking number
CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := generate_tracking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_delivery_tracking_number
  BEFORE INSERT ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_number();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
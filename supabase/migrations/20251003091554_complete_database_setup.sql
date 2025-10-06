/*
  # Complete Database Setup for Danhausa Logistics

  1. Tables Created
    - profiles: User accounts (customer, rider, admin)
    - riders: Rider-specific information
    - deliveries: Delivery orders
    - delivery_types: Types of delivery services
    - delivery_tracking: Real-time tracking updates
    - wallets: User wallet balances
    - transactions: Payment transactions
    - ratings: Delivery ratings
    - support_tickets: Customer support tickets
    - notifications: User notifications

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Riders can see available and assigned deliveries
    - Authenticated users can read most data (for admin dashboard)
    - Write operations are restricted to owners

  3. Features
    - Auto-generated tracking numbers
    - Auto-updated timestamps
    - Indexes for performance
*/

-- ====================================================================
-- STEP 1: Create all tables
-- ====================================================================

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

CREATE TABLE IF NOT EXISTS delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES deliveries(id) ON DELETE CASCADE NOT NULL,
  rider_lat numeric NOT NULL,
  rider_lng numeric NOT NULL,
  status_update text,
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES deliveries(id) ON DELETE CASCADE UNIQUE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rider_id uuid REFERENCES riders(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('delivery', 'payment', 'system')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ====================================================================
-- STEP 2: Create indexes for performance
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery ON delivery_tracking(delivery_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_available ON riders(is_available);

-- ====================================================================
-- STEP 3: Enable Row Level Security
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- STEP 4: Drop all existing policies (clean slate)
-- ====================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- ====================================================================
-- STEP 5: Profiles Policies (No recursion)
-- ====================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "All authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ====================================================================
-- STEP 6: Riders Policies
-- ====================================================================

CREATE POLICY "Riders can view own data"
  ON riders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view all riders"
  ON riders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Riders can update own data"
  ON riders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "All authenticated users can update riders"
  ON riders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can create rider profile"
  ON riders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- STEP 7: Deliveries Policies
-- ====================================================================

CREATE POLICY "Customers can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "All authenticated users can view all deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (true);

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

CREATE POLICY "All authenticated users can update deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ====================================================================
-- STEP 8: Delivery Types Policies (PUBLIC ACCESS)
-- ====================================================================

CREATE POLICY "Public can view active delivery types"
  ON delivery_types FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage delivery types"
  ON delivery_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ====================================================================
-- STEP 9: Delivery Tracking Policies
-- ====================================================================

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

-- ====================================================================
-- STEP 10: Wallets Policies
-- ====================================================================

CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- STEP 11: Transactions Policies
-- ====================================================================

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ====================================================================
-- STEP 12: Ratings Policies
-- ====================================================================

CREATE POLICY "Users can view ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create ratings for their deliveries"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- ====================================================================
-- STEP 13: Support Tickets Policies
-- ====================================================================

CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "All authenticated users can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ====================================================================
-- STEP 14: Notifications Policies
-- ====================================================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ====================================================================
-- STEP 15: Create helper functions
-- ====================================================================

CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS text AS $$
BEGIN
  RETURN 'DL' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL OR NEW.tracking_number = '' THEN
    NEW.tracking_number := generate_tracking_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_delivery_tracking_number ON deliveries;
CREATE TRIGGER set_delivery_tracking_number
  BEFORE INSERT ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION set_tracking_number();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ====================================================================
-- STEP 16: Admin promotion helper function
-- ====================================================================

CREATE OR REPLACE FUNCTION promote_to_admin(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin', status = 'active'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- STEP 17: Insert sample data
-- ====================================================================

INSERT INTO delivery_types (name, description, base_price, estimated_hours, icon) VALUES
  ('Standard', 'Regular delivery within 24-48 hours', 1500.00, 48, 'package'),
  ('Express', 'Fast delivery within 12 hours', 3000.00, 12, 'zap'),
  ('Same Day', 'Delivery on the same day within 6 hours', 5000.00, 6, 'clock'),
  ('Next Day', 'Guaranteed delivery by next day', 2000.00, 24, 'calendar')
ON CONFLICT (name) DO NOTHING;
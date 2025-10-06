import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'customer' | 'rider' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface Rider {
  id: string;
  user_id: string;
  vehicle_type: 'bike' | 'car' | 'van' | 'truck';
  vehicle_number: string;
  driver_license: string;
  bank_account: string | null;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  total_deliveries: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Delivery {
  id: string;
  customer_id: string;
  rider_id: string | null;
  tracking_number: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  package_details: string;
  package_weight: 'light' | 'medium' | 'heavy';
  recipient_name: string;
  recipient_phone: string;
  fare_estimate: number;
  final_fare: number | null;
  payment_method: 'card' | 'transfer' | 'wallet' | 'cash';
  payment_status: 'pending' | 'completed' | 'failed';
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

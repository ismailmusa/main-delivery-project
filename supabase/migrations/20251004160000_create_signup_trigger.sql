/*
  # Create automatic profile creation on signup

  1. Changes
    - Drop existing INSERT policy for profiles
    - Create new INSERT policy that allows anon role (for signup)
    - Create a trigger function to automatically create profile when user signs up
    - Add trigger to auth.users table

  2. Security
    - Policy ensures users can only insert their own profile
    - Trigger runs with security definer (admin privileges)
    - No RLS bypass vulnerabilities
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile during signup" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that allows both authenticated and anon users
CREATE POLICY "Allow profile insert during signup"
  ON profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (auth.uid() = id);

-- Create a function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, phone, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'rider' THEN 'pending'
      ELSE 'active'
    END
  );

  -- Create wallet for customers
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'customer' THEN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

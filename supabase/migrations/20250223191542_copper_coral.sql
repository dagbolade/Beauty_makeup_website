/*
  # Booking System Tables

  1. New Tables
    - `service_types`
      - Stores the different types of services offered
    - `time_slots`
      - Stores available time slots for bookings
    - `bookings`
      - Stores customer booking information
    - `blocked_dates`
      - Stores dates when services are not available

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admin access
*/

-- Create service_types table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  options jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  service_type_id uuid REFERENCES service_types(id),
  service_option text NOT NULL,
  booking_date date NOT NULL,
  time_slot_id uuid REFERENCES time_slots(id),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create blocked_dates table
CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Policies for service_types
CREATE POLICY "Service types are viewable by everyone"
  ON service_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service types are editable by admin"
  ON service_types FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com');

-- Policies for time_slots
CREATE POLICY "Time slots are viewable by everyone"
  ON time_slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Time slots are editable by admin"
  ON time_slots FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com');

-- Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com');

-- Policies for blocked_dates
CREATE POLICY "Blocked dates are viewable by everyone"
  ON blocked_dates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Blocked dates are editable by admin"
  ON blocked_dates FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@yemisiartistry.com');
-- =====================================================
-- CREST-BACKEND: COMPLETE SCHEMA FIXES
-- =====================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- This fixes all critical schema issues identified in the bug report
-- =====================================================

-- =====================================================
-- 1. FIX ORDER TABLE SCHEMA MISMATCH
-- =====================================================
-- Add missing columns to orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS total_amount INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS shipping JSONB,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migrate existing data from 'total' to 'total_amount' (only if 'total' column exists)
DO $$
BEGIN
  -- Check if 'total' column exists and migrate data
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'total'
  ) THEN
    -- Migrate data from 'total' to 'total_amount'
    UPDATE orders 
    SET total_amount = total 
    WHERE total_amount IS NULL AND total IS NOT NULL;
    
    -- Drop old 'total' column after migration
    ALTER TABLE orders DROP COLUMN IF EXISTS total;
  END IF;
END $$;

-- Set default values for NULL columns
UPDATE orders 
SET currency = 'USD' 
WHERE currency IS NULL;

UPDATE orders 
SET total_amount = 0 
WHERE total_amount IS NULL;

-- Make columns NOT NULL after migration
ALTER TABLE orders 
  ALTER COLUMN total_amount SET NOT NULL,
  ALTER COLUMN currency SET NOT NULL;

-- =====================================================
-- 2. CREATE ORDER_ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policy for order_items (allow all for admin dashboard - adjust as needed)
CREATE POLICY "Enable all operations for order_items" 
  ON order_items FOR ALL 
  USING (true);

-- =====================================================
-- 3. CREATE EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title JSONB NOT NULL DEFAULT '{"en": ""}',
  description JSONB DEFAULT '{"en": ""}',
  link TEXT,
  background_color TEXT NOT NULL DEFAULT '#8B5CF6',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active) WHERE is_active = true;

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy for events (allow all for admin dashboard - adjust as needed)
CREATE POLICY "Enable all operations for events" 
  ON events FOR ALL 
  USING (true);

-- Trigger to auto-update updated_at on events table
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on orders table
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. FIX SECURITY: ENABLE RLS ON admin_users
-- =====================================================
-- First, enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (optional)
-- DROP POLICY IF EXISTS "Users can view their own admin record" ON admin_users;
-- DROP POLICY IF EXISTS "Only super_admins can modify admin_users" ON admin_users;

-- Create policy: Users can view their own admin record
CREATE POLICY "Users can view their own admin record" 
  ON admin_users FOR SELECT 
  USING (auth.uid() = id);

-- Create policy: Only super_admins can modify admin_users
CREATE POLICY "Only super_admins can modify admin_users" 
  ON admin_users FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- 5. REMOVE/UPDATE create_admin_user FUNCTION
-- =====================================================
-- Option 1: Remove the function entirely (recommended)
DROP FUNCTION IF EXISTS create_admin_user(TEXT, TEXT, TEXT);

-- Option 2: Or update it to throw a clearer error (if you want to keep it)
-- CREATE OR REPLACE FUNCTION create_admin_user(
--   user_email TEXT,
--   user_password TEXT,
--   user_role TEXT DEFAULT 'viewer'
-- )
-- RETURNS JSON AS $$
-- BEGIN
--   RETURN json_build_object(
--     'success', false,
--     'error', 'This function is deprecated. Use Supabase client-side auth.signUp() instead.'
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES (Optional - run these to verify)
-- =====================================================
-- Check orders table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders';

-- Check if order_items table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'order_items'
-- );

-- Check if events table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_name = 'events'
-- );

-- Check RLS status
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('admin_users', 'order_items', 'events');

-- =====================================================
-- END OF MIGRATION
-- =====================================================


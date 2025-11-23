-- E-Commerce Admin Dashboard Database Schema
-- Run this in your Supabase SQL Editor after connecting

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title JSONB NOT NULL DEFAULT '{"en": ""}',
  description JSONB NOT NULL DEFAULT '{"en": ""}',
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total INTEGER NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users Table (placeholder for admin purposes)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Users Table for dashboard authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for admin dashboard - adjust as needed)
CREATE POLICY "Enable all operations for products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all operations for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Enable all operations for users" ON users FOR ALL USING (true);

-- Temporarily disable RLS on admin_users to test authentication
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for product images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- Create storage bucket for hero images
INSERT INTO storage.buckets (id, name, public)
VALUES ('HeroImage', 'HeroImage', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for hero images
CREATE POLICY "Public Access HeroImage" ON storage.objects FOR SELECT USING (bucket_id = 'HeroImage');
CREATE POLICY "Authenticated users can upload HeroImage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'HeroImage');
CREATE POLICY "Authenticated users can update HeroImage" ON storage.objects FOR UPDATE USING (bucket_id = 'HeroImage');
CREATE POLICY "Authenticated users can delete HeroImage" ON storage.objects FOR DELETE USING (bucket_id = 'HeroImage');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on products table
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Simple function to create admin user (uses Supabase auth.signUp)
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email TEXT,
  user_password TEXT,
  user_role TEXT DEFAULT 'viewer'
)
RETURNS JSON AS $$
BEGIN
  -- This function is kept for compatibility but should use Supabase client-side auth
  -- The actual user creation should happen via supabase.auth.signUp() in the frontend
  RETURN json_build_object(
    'success', false,
    'error', 'Use supabase.auth.signUp() instead of this function'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

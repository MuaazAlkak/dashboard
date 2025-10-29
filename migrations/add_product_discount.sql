-- Migration: Add discount fields to products table
-- This script adds discount_percentage and discount_active columns to the existing products table
-- Run this in your Supabase SQL Editor if you already have an existing products table

-- Add discount_percentage column (0-100)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0 
CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Add discount_active column (boolean to enable/disable discount)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false;

-- Add comment to columns for documentation
COMMENT ON COLUMN products.discount_percentage IS 'Discount percentage for the product (0-100)';
COMMENT ON COLUMN products.discount_active IS 'Whether the discount is currently active';

-- Optional: Update existing products to have 0% discount (inactive) if needed
-- This is safe to run multiple times
UPDATE products 
SET 
  discount_percentage = COALESCE(discount_percentage, 0),
  discount_active = COALESCE(discount_active, false)
WHERE discount_percentage IS NULL OR discount_active IS NULL;


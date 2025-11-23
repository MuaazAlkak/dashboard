-- Migration: Change price column from INTEGER to NUMERIC to support decimal values
-- This script changes the products.price column to support decimal prices (e.g., 29.99 SEK)
-- Run this in your Supabase SQL Editor

-- Change price column from INTEGER to NUMERIC(10,2)
-- NUMERIC(10,2) allows up to 10 digits total with 2 decimal places
ALTER TABLE products 
ALTER COLUMN price TYPE NUMERIC(10,2) USING price::NUMERIC(10,2);

-- Update the check constraint to work with NUMERIC
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_price_check;

ALTER TABLE products 
ADD CONSTRAINT products_price_check CHECK (price >= 0);

-- Add comment to column for documentation
COMMENT ON COLUMN products.price IS 'Product price in SEK, supports decimal values (e.g., 29.99)';


-- =====================================================
-- FIX PRODUCT DELETION FOREIGN KEY CONSTRAINT
-- =====================================================
-- This fixes the foreign key constraint to allow product deletion
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop the existing foreign key constraint if it exists
ALTER TABLE order_items 
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Recreate the foreign key constraint with ON DELETE CASCADE
-- This allows products to be deleted even if they're referenced in order_items
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE CASCADE;

-- Verify the constraint was created correctly
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'order_items'::regclass
  AND conname = 'order_items_product_id_fkey';


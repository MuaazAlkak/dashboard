-- =====================================================
-- FIX AUDIT LOGS USER_ID CONSTRAINT
-- =====================================================
-- The user_id column is NOT NULL but has ON DELETE SET NULL
-- This causes a conflict. We need to allow NULL values.
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop the existing foreign key constraint
ALTER TABLE audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Change user_id to allow NULL
ALTER TABLE audit_logs 
  ALTER COLUMN user_id DROP NOT NULL;

-- Recreate the foreign key constraint with ON DELETE SET NULL
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;


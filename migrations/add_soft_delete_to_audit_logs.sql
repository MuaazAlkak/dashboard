-- =====================================================
-- ADD SOFT DELETE TO AUDIT LOGS TABLE
-- =====================================================
-- This adds soft delete functionality to audit logs
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Add deleted and deleted_at columns
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance on non-deleted logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_deleted ON audit_logs(deleted) WHERE deleted = false;

-- Update the existing index to include deleted filter
DROP INDEX IF EXISTS idx_audit_logs_reverted;
CREATE INDEX IF NOT EXISTS idx_audit_logs_reverted ON audit_logs(reverted) WHERE reverted = false AND deleted = false;


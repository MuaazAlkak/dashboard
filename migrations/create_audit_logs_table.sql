-- =====================================================
-- CREATE AUDIT LOGS TABLE
-- =====================================================
-- This creates a table to track all actions and changes in the dashboard
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  entity_type TEXT NOT NULL, -- 'product', 'order', 'user', 'event', etc.
  entity_id UUID, -- ID of the affected entity
  entity_name TEXT, -- Name/title of the affected entity for easier reference
  changes JSONB, -- Stores before/after values for updates
  metadata JSONB, -- Additional context (IP address, user agent, etc.)
  reverted BOOLEAN DEFAULT false,
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_reverted ON audit_logs(reverted) WHERE reverted = false;

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only super admins can view audit logs
CREATE POLICY "Only super admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Policy: All authenticated users can insert logs (for logging their own actions)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only super admins can update audit logs (for marking as reverted)
CREATE POLICY "Only super admins can update audit logs"
  ON audit_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Function to automatically set user_email when inserting
CREATE OR REPLACE FUNCTION set_audit_log_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT email INTO NEW.user_email
    FROM admin_users
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set user_email automatically
CREATE TRIGGER set_audit_log_user_email_trigger
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_log_user_email();


-- Migration: Add password reset and admin credentials storage
-- Date: 2025-10-28

-- Table for storing password reset codes and verification attempts
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_code_length CHECK (LENGTH(code) = 6),
  CONSTRAINT valid_code_format CHECK (code ~ '^\d{6}$')
);

-- Index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email 
ON public.password_reset_codes(email);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at 
ON public.password_reset_codes(expires_at);

-- Table for storing temporary admin passwords (optional - for audit trail)
CREATE TABLE IF NOT EXISTS public.admin_credential_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT admin_id_not_null CHECK (admin_id IS NOT NULL)
);

-- Index for tracking when passwords were sent
CREATE INDEX IF NOT EXISTS idx_admin_credential_logs_admin_id 
ON public.admin_credential_logs(admin_id);

-- Function to clean up expired reset codes (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_codes()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.password_reset_codes
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Enable RLS for password_reset_codes table
ALTER TABLE IF EXISTS public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own password reset requests
CREATE POLICY "Users can view their own reset codes"
ON public.password_reset_codes FOR SELECT
USING (email = auth.jwt() ->> 'email' OR (SELECT role FROM public.profiles WHERE id = auth.uid())::text = 'admin');

-- Enable RLS for admin_credential_logs
ALTER TABLE IF EXISTS public.admin_credential_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view credential logs
CREATE POLICY "Only admins can view credential logs"
ON public.admin_credential_logs FOR ALL
USING ((SELECT role FROM public.profiles WHERE id = auth.uid())::text = 'admin');

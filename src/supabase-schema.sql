-- ============================================================
-- LeadBlaster Pro — Supabase Database Schema
-- NOTE: This schema is DELIBERATELY INSECURE for training purposes.
-- ============================================================

-- Users table
-- VULNERABILITY: No Row Level Security (RLS) enabled.
-- Anyone with the anon key can read/write ALL rows.
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'free',      -- 'free', 'pro', 'enterprise'
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads table
-- VULNERABILITY: No RLS. Any authenticated user can see ALL leads
-- from ALL users, not just their own.
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT,
  email TEXT,
  phone TEXT,
  owner_id UUID REFERENCES users(id),
  enrichment_data JSONB,         -- Stores raw AI responses (could contain PII)
  created_at TIMESTAMP DEFAULT NOW()
);

-- API usage log
-- VULNERABILITY: Stores full API keys in plaintext for "debugging."
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  api_key_used TEXT,             -- Full API key stored in plaintext!
  endpoint TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY — INTENTIONALLY NOT ENABLED
-- ============================================================
-- The following lines SHOULD exist but are commented out.
-- This is the #1 mistake in vibe-coded Supabase apps.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- These policies SHOULD exist but don't:
-- CREATE POLICY "Users can only read their own data"
--   ON users FOR SELECT USING (auth.uid() = id);
--
-- CREATE POLICY "Users can only see their own leads"
--   ON leads FOR SELECT USING (auth.uid() = owner_id);
--
-- CREATE POLICY "Users can only insert their own leads"
--   ON leads FOR INSERT WITH CHECK (auth.uid() = owner_id);
--
-- CREATE POLICY "Users can only delete their own leads"
--   ON leads FOR DELETE USING (auth.uid() = owner_id);

-- Supabase SQL Setup Script
-- This script sets up the required tables and row-level security policies
-- for the application after migrating to Supabase.

-- Instructions:
-- 1. Navigate to your Supabase project dashboard.
-- 2. In the left-hand menu, go to the "SQL Editor".
-- 3. Click "New query".
-- 4. Copy and paste the entire script below into the editor and click "RUN".

-- 1. ENTRIES TABLE
-- Stores the primary profile for each user who enters the giveaway.
CREATE TABLE public.entries (
  email text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL,
  shipping_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.entries IS 'User profile information for the giveaway.';


-- 2. LEDGER ENTRIES TABLE
-- A transactional log of all points credited to or debited from a user.
CREATE TABLE public.ledger_entries (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  email text NOT NULL REFERENCES public.entries(email) ON DELETE CASCADE,
  type text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'points'::text NOT NULL,
  note text,
  status text DEFAULT 'available'::text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX ON public.ledger_entries (email);
COMMENT ON TABLE public.ledger_entries IS 'Transactional log for user points.';


-- 3. EVENTS TABLE
-- A public feed of recent giveaway-related events.
CREATE TABLE public.events (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  type text NOT NULL,
  text text NOT NULL,
  meta jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX ON public.events (created_at DESC);
COMMENT ON TABLE public.events IS 'Public feed of giveaway events.';


-- 4. ROW LEVEL SECURITY (RLS)
-- These policies are critical for securing your data, ensuring users can only access their own information.

-- First, enable RLS on all tables
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policies for the 'entries' table
CREATE POLICY "Users can manage their own entry"
ON public.entries
FOR ALL
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- Policies for the 'ledger_entries' table
CREATE POLICY "Users can view their own ledger entries"
ON public.ledger_entries
FOR SELECT
USING (auth.email() = email);

-- Policies for the 'events' table
CREATE POLICY "Events are publicly readable"
ON public.events
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create events"
ON public.events
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
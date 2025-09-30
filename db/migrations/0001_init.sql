-- Entries and Ledger schema for HYBE Giveaway
-- Safe to run multiple times (IF NOT EXISTS)

-- Enable pgcrypto for gen_random_uuid if available
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN OTHERS THEN
  -- ignore if extension creation fails
  NULL;
END $$;

CREATE TABLE IF NOT EXISTS entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  birthdate date,
  country text NOT NULL,
  consent_terms boolean NOT NULL DEFAULT false,
  consent_privacy boolean NOT NULL DEFAULT false,
  marketing_opt_in boolean NOT NULL DEFAULT false,

  favorite_artist text,
  bias_member text,
  fan_since_year int,
  favorite_song_album text,

  twitter_handle text,
  instagram_handle text,
  tiktok_handle text,
  fan_message text,
  fan_art_url text,
  trivia_answer text,

  referral_code text,
  preferred_prize text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id bigserial PRIMARY KEY,
  email text NOT NULL REFERENCES entries(email) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit','debit')),
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'points',
  note text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_email_created ON ledger_entries(email, created_at DESC);

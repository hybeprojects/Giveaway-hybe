import { createClient } from '@supabase/supabase-js';

// Prefer standard server environment variable names first, then fallbacks.
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  '';

const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

export default supabase;

import { createClient } from '@supabase/supabase-js';

const meta = (import.meta as any).env || {};

// Support multiple environment variable names depending on deployment/dev setup
const supabaseUrl = (meta.VITE_SUPABASE_URL as string) || (meta.SUPABASE_URL as string) || (meta.SUPABASE_DATABASE_URL as string) || '';
const supabaseAnonKey = (meta.VITE_SUPABASE_ANON_KEY as string) || (meta.SUPABASE_ANON_KEY as string) || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Provide a clear runtime error when misconfigured in development
  // In production builds, these should be injected via VITE_ variables or the hosting platform
  throw new Error('Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or supply SUPABASE_DATABASE_URL and SUPABASE_ANON_KEY)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });

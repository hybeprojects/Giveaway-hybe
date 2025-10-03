import { createClient } from '@supabase/supabase-js';

// Resolve Supabase URL
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  '';

// Resolve keys explicitly
const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL (or VITE_SUPABASE_URL/SUPABASE_DATABASE_URL).');
}

// Prefer least-privilege: anon for auth/magic link/OTP, service role for privileged DB ops only
// Fallbacks exist to avoid hard failures if one key is not present, but a warning is logged.
const shouldWarnAnonFallback = !anonKey && !!serviceRoleKey;
const shouldWarnAdminFallback = !serviceRoleKey && !!anonKey;

if (shouldWarnAnonFallback) {
  console.warn('[supabase] Missing SUPABASE_ANON_KEY; using service role key for anon client as a fallback. This is not recommended.');
}
if (shouldWarnAdminFallback) {
  console.warn('[supabase] Missing SUPABASE_SERVICE_ROLE_KEY; using anon key for admin client as a fallback. Some server operations may fail.');
}

export const supabaseAnon = createClient(supabaseUrl, anonKey || serviceRoleKey, {
  auth: { persistSession: false },
});

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: { persistSession: false },
});

// Back-compat: default export remains the admin client for existing imports
export default supabaseAdmin;

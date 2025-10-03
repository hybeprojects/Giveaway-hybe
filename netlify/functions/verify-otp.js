import supabase from './utils/supabase.js';
import { CORS_HEADERS, preflight } from './utils/cors.js';
import { mintSessionToken } from './utils/jwt.js';

function isEmail(v) { return /.+@.+\..+/.test(v || ''); }

export const handler = async (event) => {
  const pf = preflight(event); if (pf) return pf;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { email, code } = JSON.parse(event.body || '{}');
    if (!isEmail(email)) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }
    if (!/^\d{6}$/.test(code || '')) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Please enter the 6-digit OTP sent to your email.' }) };
    }

    const nowIso = new Date().toISOString();
    const { data: row, error } = await supabase
      .from('form_nonces')
      .select('*')
      .eq('purpose', 'otp')
      .eq('email', email)
      .eq('nonce', code)
      .eq('used', false)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      return { statusCode: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'OTP expired, request a new one.' }) };
    }

    const { error: updErr } = await supabase
      .from('form_nonces')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', row.id);
    if (updErr) throw updErr;

    const token = mintSessionToken(email);
    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: true, session: { access_token: token } }) };
  } catch (e) {
    console.error('Error in verify-otp:', e);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Verification failed' }) };
  }
};

export { handler as default };

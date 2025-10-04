import supabase from './utils/supabase.js';
import crypto from 'crypto';
import { CORS_HEADERS, preflight } from './utils/cors.js';

export const handler = async (event) => {
  const pf = preflight(event); if (pf) return pf;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const authz = event.headers['authorization'] || event.headers['Authorization'];
    if (!authz || !authz.startsWith('Bearer ')) {
      return { statusCode: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }
    const token = authz.slice('Bearer '.length);
    const { verifySessionToken } = await import('./utils/jwt.js');
    const v = verifySessionToken(token);
    if (!v.ok || !v.email) {
      return { statusCode: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }
    const user = { email: v.email };
    const nonce = crypto.randomUUID();
    const now = new Date();
    const expires = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
    const userAgent = event.headers['user-agent'] || '';

    const { error: insertError } = await supabase.from('form_nonces').insert({
      nonce,
      email: user.email,
      token,
      used: false,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      issue_ip: clientIp,
      issue_user_agent: userAgent,
      purpose: 'entry',
    });

    if (insertError) {
      console.error('Failed to store nonce:', insertError);
      return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Form nonce backend not configured' }) };
    }

    return { statusCode: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, nonce, expires_at: expires.toISOString() }) };
  } catch (e) {
    console.error('Error in /issue-form-nonce:', e);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }) };
  }
};

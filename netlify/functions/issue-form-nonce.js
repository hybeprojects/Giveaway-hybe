import supabase from './utils/supabase.js';
import crypto from 'crypto';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const authz = event.headers['authorization'] || event.headers['Authorization'];
    if (!authz || !authz.startsWith('Bearer ')) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }
    const token = authz.slice('Bearer '.length);
    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userRes || !userRes.user) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    const user = userRes.user;
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
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Form nonce backend not configured' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, nonce, expires_at: expires.toISOString() }) };
  } catch (e) {
    console.error('Error in /issue-form-nonce:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }) };
  }
};

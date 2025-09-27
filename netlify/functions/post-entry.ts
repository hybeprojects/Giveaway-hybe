import type { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';

function json(statusCode: number, body: unknown, headers: Record<string, string> = {}) { return { statusCode, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }; }

function authorize(event: any): { ok: true; email?: string } | { ok: false } {
  const adminToken = process.env.ADMIN_TOKEN;
  const authz = event.headers['authorization'] || event.headers['Authorization'];
  if (authz && authz.startsWith('Bearer ')) {
    const token = authz.slice('Bearer '.length);
    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return { ok: false };
    try {
      const payload = jwt.verify(token, secret) as { email?: string };
      if (payload && payload.email) return { ok: true, email: payload.email };
    } catch {}
  }
  const headerToken = event.headers['x-admin-token'];
  if (adminToken && headerToken && headerToken === adminToken) return { ok: true };
  return { ok: false };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return json(500, { ok: false, error: 'Server not configured' });

    const auth = authorize(event);
    if (!auth.ok) return json(401, { ok: false, error: 'Unauthorized' });

    const body = JSON.parse(event.body || '{}');
    const { email, name, country, base = 1, share = 0, invite = 0 } = body || {};
    if (!email || !name || !country) return json(400, { ok: false, error: 'Missing required fields' });

    if (auth.email && auth.email !== email) return json(403, { ok: false, error: 'Email mismatch' });

    const total = Number(base) + Number(share) + Number(invite);

    const res = await fetch(`${supabaseUrl}/rest/v1/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify([{ email, name, country, base, share, invite, total }])
    });

    if (!res.ok) {
      const err = await res.text();
      return json(502, { ok: false, error: `Supabase error: ${err}` });
    }

    return json(200, { ok: true });
  } catch (e: any) {
    return json(500, { ok: false, error: e.message || 'Internal error' });
  }
};

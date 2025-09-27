import type { Handler } from '@netlify/functions';

function json(statusCode: number, body: unknown, headers: Record<string, string> = {}) { return { statusCode, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }; }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!adminToken || !supabaseUrl || !serviceKey) return json(500, { ok: false, error: 'Server not configured' });

    const headerToken = event.headers['x-admin-token'];
    if (!headerToken || headerToken !== adminToken) return json(401, { ok: false, error: 'Unauthorized' });

    const body = JSON.parse(event.body || '{}');
    const { email, name, country, base = 1, share = 0, invite = 0 } = body || {};
    if (!email || !name || !country) return json(400, { ok: false, error: 'Missing required fields' });
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

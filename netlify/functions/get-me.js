import { getPool } from './utils/db.js';
import jwt from 'jsonwebtoken';

const getAuthEmailFromBearer = (event) => {
  const authz = event.headers['authorization'] || event.headers['Authorization'];
  if (authz && authz.startsWith('Bearer ')) {
    const token = authz.slice('Bearer '.length);
    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return null;
    try {
      const payload = jwt.verify(token, secret);
      if (payload && typeof payload === 'object' && payload.email) return payload.email;
    } catch {}
  }
  return null;
}

const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authorizedEmail = getAuthEmailFromBearer(event);
  if (!authorizedEmail) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const pool = getPool();

    const [entryRes, ledgerRes] = await Promise.all([
      pool.query('select * from entries where email = $1 limit 1', [authorizedEmail]),
      pool.query('select * from ledger_entries where email = $1 order by created_at desc', [authorizedEmail])
    ]);

    const entry = entryRes.rows[0] || null;
    const ledger = ledgerRes.rows || [];

    if (!entry) {
        return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'User entry not found' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, entry, ledger }),
    };

  } catch (e) {
    console.error('Error in /get-me function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
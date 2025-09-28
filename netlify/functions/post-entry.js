import { getPool } from './utils/db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authorizedEmail = getAuthEmailFromBearer(event);
  if (!authorizedEmail) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const { email, name, country } = JSON.parse(event.body) || {};

    if (authorizedEmail !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }
    if (!email || !name || !country) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }

    const pool = getPool();
    // Use xmax to determine if a new entry was created (xmax=0) or an existing one was updated.
    const entryRes = await pool.query(
      `insert into entries(email, name, country, base, share, invite, total)
       values ($1, $2, $3, 0, 0, 0, 0)
       on conflict (email) do update set name=excluded.name, country=excluded.country
       returning xmax`,
      [email, name, country]
    );

    const isNewEntry = entryRes.rows[0].xmax === '0';
    if (isNewEntry) {
      // Server-side logic to award a welcome bonus to new users.
      await pool.query(
        `insert into ledger_entries(id, email, type, amount, currency, note, status)
         values ($1, $2, 'credit', 100, 'points', 'Welcome bonus', 'available')`,
        [crypto.randomUUID(), email]
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /post-entry function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
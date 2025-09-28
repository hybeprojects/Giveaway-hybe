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

const isAuthorized = (event) => {
    const bearerEmail = getAuthEmailFromBearer(event);
    const adminToken = process.env.ADMIN_TOKEN;
    // Loosely authorized if they have any valid session token or an admin token
    return Boolean(bearerEmail || (adminToken && event.headers['x-admin-token'] === adminToken));
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!isAuthorized(event)) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const { type, text, meta } = JSON.parse(event.body) || {};

    if (!type || !text) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }

    const pool = getPool();
    await pool.query(
        'insert into events(type, text, meta) values ($1,$2,$3)',
        [type, text, meta ? JSON.stringify(meta) : null]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /post-event function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
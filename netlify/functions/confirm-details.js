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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authorizedEmail = getAuthEmailFromBearer(event);
  if (!authorizedEmail) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const { shipping_address } = JSON.parse(event.body) || {};

    if (!shipping_address || typeof shipping_address !== 'string' || shipping_address.trim().length < 10) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid shipping address provided.' }) };
    }

    const pool = getPool();
    await pool.query(
      'update entries set shipping_address = $1 where email = $2',
      [shipping_address, authorizedEmail]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /confirm-details function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
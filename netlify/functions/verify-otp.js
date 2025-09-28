import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, code, token } = JSON.parse(event.body) || {};

    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }
    if (!/^\d{6}$/.test(code || '')) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid code' }) };
    }
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing token' }) };
    }

    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) {
      console.error('OTP_JWT_SECRET not set');
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Server not configured' }) };
    }

    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload !== 'object' || payload.email !== email) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid token' }) };
    }

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== payload.codeHash) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Incorrect code' }) };
    }

    const session = jwt.sign({ email }, secret, { expiresIn: '30d' });
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, session }),
    };

  } catch (e) {
    console.error('Error in /verify-otp function:', e);
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: e?.message || 'Invalid or expired code' }),
    };
  }
};

export { handler };
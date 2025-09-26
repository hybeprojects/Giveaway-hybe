import type { Handler } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function json(statusCode: number, body: unknown) { return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  try {
    const { email, code, token } = JSON.parse(event.body || '{}');
    if (!email || !/.+@.+\..+/.test(email)) return json(400, { ok: false, error: 'Invalid email' });
    if (!/^\d{6}$/.test(code || '')) return json(400, { ok: false, error: 'Invalid code' });
    if (!token) return json(400, { ok: false, error: 'Missing token' });

    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return json(500, { ok: false, error: 'Server not configured' });

    const payload = jwt.verify(token, secret) as { email: string; codeHash: string; iat: number; exp: number };
    if (!payload || payload.email !== email) return json(400, { ok: false, error: 'Invalid token' });

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== payload.codeHash) return json(401, { ok: false, error: 'Incorrect code' });

    const session = jwt.sign({ email }, secret, { expiresIn: '30d' });
    return json(200, { ok: true, session });
  } catch (e: any) {
    return json(400, { ok: false, error: e.message || 'Invalid or expired code' });
  }
};

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

    // --- Rate limit verification attempts by email+device ---
    const cookies = parseCookies(event.headers.cookie);
    let rl = null;
    try { if (cookies.otp_verify_rl) rl = jwt.verify(cookies.otp_verify_rl, secret); } catch {}
    const now = Date.now();
    const device = getDeviceHash(event);
    const vKey = `${email}:${device}`;
    let last = 0, count = 0, resetAt = now + 3600_000;
    if (rl && rl[vKey]) {
      last = rl[vKey].last || 0;
      count = rl[vKey].count || 0;
      resetAt = rl[vKey].resetAt || resetAt;
      if (now < resetAt && count >= MAX_VERIFY_PER_HOUR) {
        return { statusCode: 429, body: JSON.stringify({ ok: false, error: 'Too many attempts. Please wait and try again.' }) };
      }
      if (now - last < MIN_VERIFY_RETRY_SECONDS * 1000) {
        return { statusCode: 429, body: JSON.stringify({ ok: false, error: 'Please wait a moment before retrying.' }) };
      }
    }

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== payload.codeHash) {
      // update RL cookie on failure
      const next = rl || {};
      const hourly = now > (rl?.[vKey]?.resetAt || 0) ? 0 : (count || 0);
      next[vKey] = { last: now, count: hourly + 1, resetAt: now > resetAt ? now + 3600_000 : resetAt };
      const cookie = `otp_verify_rl=${encodeURIComponent(jwt.sign(next, secret, { expiresIn: '2h' }))}; Max-Age=7200; Path=/; HttpOnly; SameSite=Lax; Secure`;
      return { statusCode: 401, headers: { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: false, error: 'Incorrect code' }) };
    }

    const session = jwt.sign({ email }, secret, { expiresIn: '30d' });
    // on success, also record attempt but do not penalize count excessively
    const next = rl || {};
    next[vKey] = { last: now, count: count, resetAt };
    const cookie = `otp_verify_rl=${encodeURIComponent(jwt.sign(next, secret, { expiresIn: '2h' }))}; Max-Age=7200; Path=/; HttpOnly; SameSite=Lax; Secure`;
    return { statusCode: 200, headers: { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' }, body: JSON.stringify({ ok: true, session }) };

  } catch (e) {
    console.error('Error in /verify-otp function:', e);
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: e?.message || 'Invalid or expired code' }),
    };
  }
};

export { handler };

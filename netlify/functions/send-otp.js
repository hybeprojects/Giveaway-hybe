import { getPool } from './utils/db.js';
import { renderEmail, sendEmail, classifyEmailError, makeIdempotencyKey, validateEmailEnvOrThrow } from './utils/email.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const OTP_EXP_SECONDS = 600; // 10 minutes
const MIN_RETRY_SECONDS = 60; // per device throttle
const MAX_PER_HOUR = 5;


function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.substring(0, i).trim()] = decodeURIComponent(p.substring(i + 1));
  });
  return out;
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, purpose: purposeRaw } = JSON.parse(event.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }

    const { OTP_JWT_SECRET, URL } = process.env;
    try { validateEmailEnvOrThrow(); } catch (e) { console.error(e); return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Server not configured' }) }; }
    if (!OTP_JWT_SECRET) {
      console.error('Server not configured: Missing OTP secret.');
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Server not configured' }) };
    }

    // Rate limiting logic
    const ua = event.headers['user-agent'] || 'unknown';
    const device = crypto.createHash('sha256').update(String(ua)).digest('hex').slice(0, 16);
    const cookies = parseCookies(event.headers.cookie);
    let rlPayload = null;
    try { if (cookies.otp_rl) rlPayload = jwt.verify(cookies.otp_rl, OTP_JWT_SECRET); } catch {}

    const now = Date.now();
    const key = `${email}:${device}`;
    let lastSent = 0, hourlyCount = 0, resetAt = now + 3600_000;
    if (rlPayload && rlPayload[key]) {
      lastSent = rlPayload[key].lastSent || 0;
      hourlyCount = rlPayload[key].hourlyCount || 0;
      resetAt = rlPayload[key].resetAt || resetAt;
      if (now < resetAt && hourlyCount >= MAX_PER_HOUR) {
        const secs = Math.max(1, Math.floor((resetAt - now) / 1000));
        return { statusCode: 429, body: JSON.stringify({ ok: false, error: `Too many requests. Try again in ${secs}s` }) };
      }
      if (now - lastSent < MIN_RETRY_SECONDS * 1000) {
        const secs = MIN_RETRY_SECONDS - Math.floor((now - lastSent) / 1000);
        return { statusCode: 429, body: JSON.stringify({ ok: false, error: `Please wait ${secs}s before requesting another code` }) };
      }
    }

    // Email existence check
    const pool = getPool();
    const r = await pool.query('select 1 from entries where email = $1 limit 1', [email]);
    const exists = Boolean(r.rowCount && r.rowCount > 0);
    const purpose = purposeRaw === 'signup' ? 'signup' : 'login';
    if (purpose === 'signup' && exists) {
      return { statusCode: 409, body: JSON.stringify({ ok: false, error: 'This email is already registered.' }) };
    }
    if (purpose === 'login' && !exists) {
      return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'Email not found. Please sign up first.' }) };
    }

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const token = jwt.sign({ email, codeHash }, OTP_JWT_SECRET, { expiresIn: OTP_EXP_SECONDS });

    const textBody = `Your code is ${code} (expires in 10 minutes)`;
    const htmlBody = `
      <p style="margin:0 0 16px 0;font-size:14px;color:#666">Your one-time code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:12px 16px;border:1px dashed #111;display:inline-block">${code}</div>
      <p style="margin:16px 0 0 0;font-size:14px;color:#666">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
    `;

    const idk = makeIdempotencyKey(event, `otp:${email}`);
    try {
      await sendEmail(event, {
        to: email,
        subject: 'Your HYBE Giveaway code',
        text: textBody,
        html: renderEmail(URL || 'https://hybe.com', 'HYBE Giveaway verification code', htmlBody),
        idempotencyKey: idk,
      });
    } catch (err) {
      const code = err.status || classifyEmailError(err);
      return { statusCode: code, body: JSON.stringify({ ok: false, error: code === 429 ? 'Too many requests' : 'Failed to send code' }) };
    }

    // --- Set Rate Limit Cookie ---
    const newPayload = rlPayload || {};
    const newHourly = (now > (rlPayload?.[key]?.resetAt || 0)) ? 0 : (hourlyCount || 0);
    newPayload[key] = { lastSent: now, hourlyCount: newHourly + 1, resetAt: now > resetAt ? now + 3600_000 : resetAt };
    const rlToken = jwt.sign(newPayload, OTP_JWT_SECRET, { expiresIn: '2h' });
    const cookie = `otp_rl=${encodeURIComponent(rlToken)}; Max-Age=7200; Path=/; HttpOnly; SameSite=Lax; Secure`;

    return {
      statusCode: 200,
      headers: { 'Set-Cookie': cookie, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true, token }),
    };

  } catch (e) {
    console.error('Error in /send-otp function:', e);
    const status = typeof e.status === 'number' ? e.status : 500;
    return { statusCode: status, body: JSON.stringify({ ok: false, error: status === 429 ? 'Too many requests' : 'Internal server error' }) };
  }
};

export { handler };

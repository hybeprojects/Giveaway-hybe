import type { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function json(statusCode: number, body: unknown, headers: Record<string, string> = {}) { return { statusCode, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }; }

function parseCookies(header: string | undefined) {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(';').forEach(p => { const i = p.indexOf('='); if (i > -1) out[p.substring(0, i).trim()] = decodeURIComponent(p.substring(i + 1)); });
  return out;
}

const OTP_EXP_SECONDS = 600; // 10 minutes
const MIN_RETRY_SECONDS = 60; // per device throttle
const MAX_PER_HOUR = 5;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email || !/.+@.+\..+/.test(email)) return json(400, { ok: false, error: 'Invalid email' });

    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return json(500, { ok: false, error: 'Server not configured' });

    const ip = (event.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
    const ua = event.headers['user-agent'] || 'unknown';
    const device = crypto.createHash('sha256').update(ua).digest('hex').slice(0, 16);

    const cookies = parseCookies(event.headers.cookie);
    let rlPayload: any = null;
    try { if (cookies.otp_rl) rlPayload = jwt.verify(cookies.otp_rl, secret); } catch {}

    const now = Date.now();
    const key = `${email}:${device}`;
    let lastSent = 0, hourlyCount = 0, resetAt = now + 3600_000;
    if (rlPayload && rlPayload[key]) {
      lastSent = rlPayload[key].lastSent || 0;
      hourlyCount = rlPayload[key].hourlyCount || 0;
      resetAt = rlPayload[key].resetAt || resetAt;
      if (now < resetAt && hourlyCount >= MAX_PER_HOUR) {
        const secs = Math.max(1, Math.floor((resetAt - now) / 1000));
        return json(429, { ok: false, error: `Too many requests. Try again in ${secs}s` });
      }
      if (now - lastSent < MIN_RETRY_SECONDS * 1000) {
        const secs = MIN_RETRY_SECONDS - Math.floor((now - lastSent) / 1000);
        return json(429, { ok: false, error: `Please wait ${secs}s before requesting another code` });
      }
    }

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const token = jwt.sign({ email, codeHash }, secret, { expiresIn: OTP_EXP_SECONDS });

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '465');
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || user;
    if (!host || !user || !pass) return json(500, { ok: false, error: 'SMTP not configured' });

    const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    const html = `
      <div style="font-family:Arial,sans-serif;">
        <h2>HYBE Giveaway verification code</h2>
        <p>Your one-time code is:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</div>
        <p>This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>`;

    await transport.sendMail({ from, to: email, subject: 'Your HYBE Giveaway code', text: `Your code is ${code} (expires in 10 minutes)`, html });

    // update and set rate limit cookie
    const newPayload: any = rlPayload || {};
    const newHourly = (now > (rlPayload?.[key]?.resetAt || 0)) ? 0 : (hourlyCount || 0);
    newPayload[key] = { lastSent: now, hourlyCount: newHourly + 1, resetAt: now > resetAt ? now + 3600_000 : resetAt };
    const rlToken = jwt.sign(newPayload, secret, { expiresIn: '2h' });
    const cookie = `otp_rl=${encodeURIComponent(rlToken)}; Max-Age=7200; Path=/; HttpOnly; SameSite=Lax; Secure`;

    return json(200, { ok: true, token }, { 'Set-Cookie': cookie, 'Cache-Control': 'no-store' });
  } catch (e: any) {
    return json(500, { ok: false, error: e.message || 'Internal error' });
  }
};

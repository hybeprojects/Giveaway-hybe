import { getPool } from './utils/db.js';
import sgMail from '@sendgrid/mail';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const OTP_EXP_SECONDS = 600; // 10 minutes
const MIN_RETRY_SECONDS = 60; // per device throttle
const MAX_PER_HOUR = 5;

// This function is adapted from server.js and is used for consistent email branding
function renderEmail(origin, heading, innerHtml) {
  const logoSrc = `${origin}/hybe-logo.svg`;
  const hybeBlack = '#111';
  const hybeYellow = '#f5ff00';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fff;margin:0;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="width:560px;max-width:100%;border:1px solid ${hybeBlack};border-radius:12px;overflow:hidden">
            <tr>
              <td style="background:${hybeYellow};padding:16px 24px">
                <img src="${logoSrc}" alt="HYBE" width="100" style="display:block" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px;font-family:'Noto Sans KR', Arial, sans-serif;color:${hybeBlack}">
                <h2 style="margin:0 0 8px 0;font-family:'Big Hit 201110', Arial, sans-serif;text-transform:uppercase;font-size:20px;line-height:24px">${heading}</h2>
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #eee;padding:16px 24px;font-family:'Noto Sans KR', Arial, sans-serif;color:#999;font-size:12px">
                <div style="margin-bottom:8px">
                  <a href="#" style="color:#999;text-decoration:none;margin-right:16px">Terms of Service</a>
                  <a href="#" style="color:#999;text-decoration:none;margin-right:16px">Privacy Policy</a>
                  <a href="#" style="color:#999;text-decoration:none">Contact Us</a>
                </div>
                © HYBE Corporation. All Rights Reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

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

    const { OTP_JWT_SECRET, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, URL } = process.env;
    if (!OTP_JWT_SECRET || !SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      console.error('Server not configured: Missing critical environment variables (JWT Secret or SendGrid).');
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

    // --- SendGrid Email Logic ---
    sgMail.setApiKey(SENDGRID_API_KEY);
    const textBody = `Your code is ${code} (expires in 10 minutes)`;
    const htmlBody = `
      <p style="margin:0 0 16px 0;font-size:14px;color:#666">Your one-time code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:12px 16px;border:1px dashed #111;display:inline-block">${code}</div>
      <p style="margin:16px 0 0 0;font-size:14px;color:#666">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
    `;

    const msg = {
      to: email,
      from: SENDGRID_FROM_EMAIL,
      subject: 'Your HYBE Giveaway code',
      text: textBody,
      html: renderEmail(URL || 'https://hybe.com', 'HYBE Giveaway verification code', htmlBody),
    };

    await sgMail.send(msg);

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
    console.error('Error in /send-otp function:', e.response?.body || e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
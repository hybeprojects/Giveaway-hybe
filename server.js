import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic CORS support (configurable)
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '1mb' }));

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.substring(0, i).trim()] = decodeURIComponent(p.substring(i + 1));
  });
  return out;
}

function getAuthEmailFromBearer(req) {
  const authz = req.headers['authorization'] || req.headers['Authorization'];
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

function isAuthorized(req, claimedEmail) {
  const adminToken = process.env.ADMIN_TOKEN;
  const bearerEmail = getAuthEmailFromBearer(req);
  if (!claimedEmail) return Boolean(bearerEmail || (adminToken && req.headers['x-admin-token'] === adminToken));
  if (bearerEmail && bearerEmail === claimedEmail) return true;
  return Boolean(adminToken && req.headers['x-admin-token'] === adminToken);
}

// --- API endpoints (matching existing frontend calls) ---
const OTP_EXP_SECONDS = 600; // 10 minutes
const MIN_RETRY_SECONDS = 60; // per device throttle
const MAX_PER_HOUR = 5;

app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });

    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return res.status(500).json({ ok: false, error: 'Server not configured' });

    const ua = req.headers['user-agent'] || 'unknown';
    const device = crypto.createHash('sha256').update(String(ua)).digest('hex').slice(0, 16);

    const cookies = parseCookies(req.headers.cookie);
    let rlPayload = null;
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
        return res.status(429).json({ ok: false, error: `Too many requests. Try again in ${secs}s` });
      }
      if (now - lastSent < MIN_RETRY_SECONDS * 1000) {
        const secs = MIN_RETRY_SECONDS - Math.floor((now - lastSent) / 1000);
        return res.status(429).json({ ok: false, error: `Please wait ${secs}s before requesting another code` });
      }
    }

    // Optional duplicate email check (if Supabase env present)
    try {
      const supabaseUrlEnv = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrlEnv && serviceKey) {
        const r = await fetch(`${supabaseUrlEnv}/rest/v1/entries?email=eq.${encodeURIComponent(email)}&select=email`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }
        });
        if (r.ok) {
          const arr = await r.json();
          if (arr && arr.length > 0) return res.status(409).json({ ok: false, error: 'This email is already registered.' });
        }
      }
    } catch {}

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const token = jwt.sign({ email, codeHash }, secret, { expiresIn: OTP_EXP_SECONDS });

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '465');
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || user;
    if (!host || !user || !pass) return res.status(500).json({ ok: false, error: 'SMTP not configured' });

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
    const newPayload = rlPayload || {};
    const newHourly = (now > (rlPayload?.[key]?.resetAt || 0)) ? 0 : (hourlyCount || 0);
    newPayload[key] = { lastSent: now, hourlyCount: newHourly + 1, resetAt: now > resetAt ? now + 3600_000 : resetAt };
    const rlToken = jwt.sign(newPayload, secret, { expiresIn: '2h' });
    const cookie = `otp_rl=${encodeURIComponent(rlToken)}; Max-Age=7200; Path=/; HttpOnly; SameSite=Lax; Secure`;
    res.setHeader('Set-Cookie', cookie);
    res.setHeader('Cache-Control', 'no-store');

    return res.json({ ok: true, token });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

app.post('/verify-otp', async (req, res) => {
  try {
    const { email, code, token } = req.body || {};
    if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });
    if (!/^\d{6}$/.test(code || '')) return res.status(400).json({ ok: false, error: 'Invalid code' });
    if (!token) return res.status(400).json({ ok: false, error: 'Missing token' });

    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return res.status(500).json({ ok: false, error: 'Server not configured' });

    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload !== 'object' || payload.email !== email) return res.status(400).json({ ok: false, error: 'Invalid token' });

    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== payload.codeHash) return res.status(401).json({ ok: false, error: 'Incorrect code' });

    const session = jwt.sign({ email }, secret, { expiresIn: '30d' });
    return res.json({ ok: true, session });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'Invalid or expired code' });
  }
});

app.post('/post-entry', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ ok: false, error: 'Server not configured' });

    const { email, name, country, base = 1, share = 0, invite = 0 } = req.body || {};
    if (!isAuthorized(req, email)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (!email || !name || !country) return res.status(400).json({ ok: false, error: 'Missing required fields' });

    const total = Number(base) + Number(share) + Number(invite);

    const r = await fetch(`${supabaseUrl}/rest/v1/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify([{ email, name, country, base, share, invite, total }])
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ ok: false, error: `Supabase error: ${err}` });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

app.post('/post-event', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return res.status(500).json({ ok: false, error: 'Server not configured' });

    if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { type, text, meta } = req.body || {};
    if (!type || !text) return res.status(400).json({ ok: false, error: 'Missing required fields' });

    const r = await fetch(`${supabaseUrl}/rest/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify([{ type, text, meta }])
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(502).json({ ok: false, error: `Supabase error: ${err}` });
    }

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

app.post('/activity-email', async (req, res) => {
  try {
    const { email, type, detail } = req.body || {};
    if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });
    if (!isAuthorized(req, email)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const subjects = {
      entry_verified: 'You are entered into the HYBE Giveaway',
      credit_added: 'A credit was added to your giveaway balance',
      withdrawal: 'Your withdrawal request was received'
    };
    const subject = subjects[type] || 'HYBE Giveaway update';

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '465');
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || user;
    if (!host || !user || !pass) return res.status(500).json({ ok: false, error: 'SMTP not configured' });

    const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const html = `<div style=\"font-family:Arial,sans-serif;\"><h2>${subject}</h2><p>${(detail || '').toString()}</p></div>`;
    await transport.sendMail({ from, to: email, subject, text: (detail || '').toString(), html });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true }));

// --- Static file hosting for SPA ---
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir, { maxAge: '1h', extensions: ['html'] }));

app.get('*', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not built yet');
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
import fs from 'fs';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isDev = process.env.NODE_ENV !== 'production';
const DEV_SMTP_DEFAULTS = { host: 'smtp.aol.com', port: 465, secure: true, user: 'hybe.corp@aol.com', pass: 'gktpwoejsaaogauz', from: 'hybe.corp@aol.com' };

// Database pool (Render Postgres)
const databaseUrl = process.env.DATABASE_URL || '';
const sslConfig = (() => {
  try {
    if (process.env.DATABASE_SSL === 'true') return true;
    if (process.env.DATABASE_SSL === 'false') return false;
    if (!databaseUrl) return false;
    const hasRequire = databaseUrl.includes('sslmode=require');
    if (hasRequire || process.env.NODE_ENV === 'production') {
      return { rejectUnauthorized: false };
    }
    return false;
  } catch {
    return false;
  }
})();
let pool = null;
if (databaseUrl) {

  pool = new Pool({ connectionString: databaseUrl, ssl: sslConfig });
  (async () => {
    try {
      // Ensure schema exists
      await pool.query(`
        create table if not exists entries (
          email text primary key,
          name text not null,
          country text not null,
          base integer not null default 1,
          share integer not null default 0,
          invite integer not null default 0,
          total integer not null default 1,
          is_winner boolean not null default false,
          prize_details text,
          shipping_address text,
          created_at timestamptz not null default now()
        );
        create table if not exists events (
          id bigserial primary key,
          type text not null,
          text text not null,
          meta jsonb,
          created_at timestamptz not null default now()
        );
        create index if not exists events_created_at_idx on events (created_at desc);

        create table if not exists ledger_entries (
          id text primary key,
          email text not null,
          type text not null,
          amount integer not null,
          currency text not null,
          note text,
          status text,
          created_at timestamptz not null default now()
        );
        create index if not exists ledger_entries_email_idx on ledger_entries (email, created_at desc);
      `);
      console.log('Database ready');
    } catch (e) {
      console.error('DB init failed:', e?.message || e);
    }
  })();
} else {
  console.warn('DATABASE_URL not set. Data endpoints will be disabled.');
}

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

function getSmtpConfig() {
  if (isDev) {
    return { ...DEV_SMTP_DEFAULTS };
  }
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '465');
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user;
  if (!host || !user || !pass) return null;
  return { host, port, secure, user, pass, from };
}

// Brand-consistent, table-based email template
function renderEmail(req, heading, innerHtml) {
  const origin = `${req.protocol}://${req.get('host')}`;
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

let transport = null;
(async () => {
  const conf = getSmtpConfig();
  if (!conf) {
    console.warn('SMTP not configured');
    return;
  }
  try {
    const baseOpts = { host: conf.host, port: conf.port, secure: conf.secure, auth: { user: conf.user, pass: conf.pass }, connectionTimeout: 30000, greetingTimeout: 30000, socketTimeout: 30000, family: 4, logger: true, debug: true };
    transport = nodemailer.createTransport(baseOpts);
    await transport.verify();
    console.log('SMTP ready:', conf.host, conf.port, conf.secure ? 'secure' : 'starttls');
  } catch (e) {
    const msg = e?.message || '';
    console.error('SMTP verify failed:', msg);
    // Fallback: try STARTTLS on 587 if SSL:465 timed out or connection failed
    try {
      const fallback = { host: conf.host, port: 587, secure: false, auth: { user: conf.user, pass: conf.pass }, connectionTimeout: 30000, greetingTimeout: 30000, socketTimeout: 30000, family: 4, logger: true, debug: true };
      transport = nodemailer.createTransport(fallback);
      await transport.verify();
      console.log('SMTP ready (fallback):', conf.host, 587, 'starttls');
    } catch (e2) {
      console.error('SMTP verify failed (fallback):', e2?.message || e2);
    }
  }
})();

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

// --- API endpoints ---
const OTP_EXP_SECONDS = 600; // 10 minutes
const MIN_RETRY_SECONDS = 60; // per device throttle
const MAX_PER_HOUR = 5;

app.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose: purposeRaw } = req.body || {};
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

    // Email existence checks based on purpose
    try {
      if (pool) {
        const r = await pool.query('select 1 from entries where email = $1 limit 1', [email]);
        const exists = Boolean(r.rowCount && r.rowCount > 0);
        const purpose = purposeRaw === 'signup' ? 'signup' : 'login';
        if (purpose === 'signup' && exists) return res.status(409).json({ ok: false, error: 'This email is already registered.' });
        if (purpose === 'login' && !exists) return res.status(404).json({ ok: false, error: 'Email not found. Please sign up first.' });
      }
    } catch {}

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const token = jwt.sign({ email, codeHash }, secret, { expiresIn: OTP_EXP_SECONDS });

    const conf = getSmtpConfig();
    if (!conf || !transport) return res.status(500).json({ ok: false, error: 'SMTP not configured' });

    const bodyHtml = `
      <p style="margin:0 0 16px 0;font-size:14px;color:#666">Your one-time code is:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:12px 16px;border:1px dashed #111;display:inline-block">${code}</div>
      <p style="margin:16px 0 0 0;font-size:14px;color:#666">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
    `;
    const html = renderEmail(req, 'HYBE Giveaway verification code', bodyHtml);

    await transport.sendMail({ from: conf.from, to: email, subject: 'Your HYBE Giveaway code', text: `Your code is ${code} (expires in 10 minutes)`, html });

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

app.get('/me', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: 'Database not configured' });
    const email = getAuthEmailFromBearer(req);
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const [entryRes, ledgerRes] = await Promise.all([
      pool.query('select * from entries where email = $1 limit 1', [email]),
      pool.query('select * from ledger_entries where email = $1 order by created_at desc', [email])
    ]);

    const entry = entryRes.rows[0] || null;
    const ledger = ledgerRes.rows || [];

    return res.json({ ok: true, entry, ledger });
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
    if (!pool) return res.status(500).json({ ok: false, error: 'Database not configured' });
    const { email, name, country } = req.body || {};
    if (!isAuthorized(req, email)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (!email || !name || !country) return res.status(400).json({ ok: false, error: 'Missing required fields' });

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

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

app.post('/confirm-details', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: 'Database not configured' });
    const email = getAuthEmailFromBearer(req);
    if (!email) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { shipping_address } = req.body;
    if (!shipping_address || typeof shipping_address !== 'string' || shipping_address.trim().length < 10) {
      return res.status(400).json({ ok: false, error: 'Invalid shipping address provided.' });
    }

    await pool.query(
      'update entries set shipping_address = $1 where email = $2',
      [shipping_address, email]
    );

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

app.post('/post-event', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ ok: false, error: 'Database not configured' });
    if (!isAuthorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { type, text, meta } = req.body || {};
    if (!type || !text) return res.status(400).json({ ok: false, error: 'Missing required fields' });

    await pool.query('insert into events(type, text, meta) values ($1,$2,$3)', [type, text, meta ? JSON.stringify(meta) : null]);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

// Recent events feed (public)
app.get('/events', async (_req, res) => {
  try {
    if (!pool) return res.json([]);
    const r = await pool.query('select text, created_at from events order by created_at desc limit 10');
    return res.json(r.rows || []);
  } catch (e) {
    return res.json([]);
  }
});

// Helper function to calculate balance from the server-side ledger
async function calculateBalance(pool, email) {
  const res = await pool.query(
    `select
      coalesce(sum(case when type = 'credit' then amount else 0 end), 0) as credits,
      coalesce(sum(case when type = 'debit' then amount else 0 end), 0) as debits
     from ledger_entries where email = $1 and status = 'available'`,
    [email]
  );
  if (res.rows.length === 0) return 0;
  const { credits, debits } = res.rows[0];
  return Number(credits) - Number(debits);
}

app.post('/activity-email', async (req, res) => {
  try {
    const { email, type, detail, amount: amountFromDetail } = req.body || {};
    if (!email || !/.+@.+\..+/.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });
    if (!isAuthorized(req, email)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    // --- Server-side withdrawal logic ---
    if (type === 'withdrawal') {
      if (!pool) return res.status(500).json({ ok: false, error: 'Database not configured' });
      // The request should ideally have an 'amount' field. We'll use 'detail' as a fallback for now.
      const amount = Number(amountFromDetail || detail);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ ok: false, error: 'Invalid withdrawal amount' });
      }

      const availableBalance = await calculateBalance(pool, email);

      if (availableBalance < amount) {
        return res.status(400).json({ ok: false, error: 'Insufficient balance' });
      }

      // Record the debit in the ledger as the source of truth
      await pool.query(
        `insert into ledger_entries(id, email, type, amount, currency, note, status)
         values ($1, $2, 'debit', $3, 'points', 'Withdrawal request', 'completed')`,
        [crypto.randomUUID(), email, amount]
      );
    }

    const subjects = {
      entry_verified: 'You are entered into the HYBE Giveaway',
      credit_added: 'A credit was added to your giveaway balance',
      withdrawal: 'Your withdrawal request was received'
    };
    const subject = subjects[type] || 'HYBE Giveaway update';

    const conf = getSmtpConfig();
    if (!conf || !transport) {
      console.warn('SMTP not configured, skipping email for', type);
      return res.json({ ok: true, message: 'Action processed, email skipped.' });
    }

    const bodyHtml = `<p style="margin:0;font-size:14px;color:#666">${(detail || '').toString()}</p>`;
    const html = renderEmail(req, subject, bodyHtml);

    // Fire-and-forget email sending
    transport.sendMail({ from: conf.from, to: email, subject, text: (detail || '').toString(), html }).catch(err => {
      console.error('Failed to send activity email:', err);
    });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

// Health check
app.get('/healthz', (req, res) => res.json({ ok: true }));

app.get('/smtp-verify', async (req, res) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const conf = getSmtpConfig();
    if (!conf || !transport) return res.status(500).json({ ok: false, error: 'SMTP not configured' });
    await transport.verify();
    return res.json({ ok: true, host: conf.host, port: conf.port, secure: conf.secure });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Verify failed' });
  }
});

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

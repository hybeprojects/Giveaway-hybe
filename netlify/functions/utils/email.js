import nodemailer from 'nodemailer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

export function validateEmailEnvOrThrow() {
  const host = process.env.SMTP_HOST || '';
  const portStr = process.env.SMTP_PORT || '';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || '';
  const port = Number(portStr || 587);
  if (!host || !from) throw new Error('Missing SMTP configuration. Ensure SMTP_HOST and SMTP_FROM are set.');
  return { host, port, auth: user && pass ? { user, pass } : undefined, from };
}

export function classifyEmailError(e) {
  const msg = String(e?.message || '').toLowerCase();
  if (msg.includes('invalid recipient') || msg.includes('mailbox') || msg.includes('address')) return 400;
  if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) return 429;
  return 500;
}

export function makeIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function renderEmail(origin, heading, innerHtml) {
  const safeOrigin = origin || '';
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#0b0f14; color:#fff; padding:24px; }
    .card { background:#121826; border-radius:12px; padding:24px; border:1px solid rgba(255,255,255,0.1); max-width:560px; margin:0 auto; }
    h1 { font-size:20px; margin:0 0 12px; }
    .code { font-size:28px; letter-spacing:6px; font-weight:700; background:rgba(255,255,255,0.08); padding:12px 16px; border-radius:8px; text-align:center; }
    .muted { color: #aab1c5; font-size:14px; }
    a { color:#39FF14; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${heading}</h1>
    ${innerHtml}
    <p class="muted" style="margin-top:16px;">Requested from ${safeOrigin || 'your site'}.</p>
  </div>
</body>
</html>`;
}

function readOtpTemplate() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tplPath = path.resolve(__dirname, '../templates/otp.html');
    return fs.readFileSync(tplPath, 'utf8');
  } catch {
    return null;
  }
}

export function renderOtpEmail({ origin, code, ttl }) {
  const subject = 'Your HYBE Giveaway verification code';
  const template = readOtpTemplate();
  if (template) {
    const html = template
      .replace(/{{\s*ttl\s*}}/g, String(ttl))
      .replace(/{{\s*\.Token\s*}}/g, String(code));
    const text = `Your HYBE Giveaway verification code is ${code}. It expires in ${ttl} minutes.`;
    return { subject, text, html };
  }
  const html = renderEmail(origin, 'Confirm Your Giveaway Entry', `
    <p>Use the one-time password below to verify your email:</p>
    <div class="code">${code}</div>
    <p>This code expires in <strong>${ttl} minutes</strong>.</p>
  `);
  const text = `Your HYBE Giveaway verification code is ${code}. It expires in ${ttl} minutes.`;
  return { subject, text, html };
}

export async function sendEmail(event, { to, subject, text, html }) {
  const cfg = validateEmailEnvOrThrow();
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: cfg.auth,
  });

  const idk = makeIdempotencyKey();
  const headers = { 'Idempotency-Key': idk };
  const info = await transporter.sendMail({ from: cfg.from, to, subject, text, html, headers });
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
}

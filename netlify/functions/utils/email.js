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
  return { host, port, auth: (user && pass) ? { user, pass } : undefined, from };
}

export function classifyEmailError(e) {
  const msg = String(e?.message || '').toLowerCase();
  if (msg.includes('invalid recipient') || msg.includes('mailbox') || msg.includes('address')) return 400;
  if (msg.includes('rate') || msg.includes('limit') || msg.includes('too many')) return 429;
  return 500;
}

export function makeIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
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

export function renderOtpEmail(vars) {
  try {
    const fileUrl = new URL('../templates/otp.html', import.meta.url);
    const filePath = fileURLToPath(fileUrl);
    let tpl = fs.readFileSync(filePath, 'utf8');
    const replacements = [
      ['{{ .Token }}', vars.code],
      ['{{.Token}}', vars.code],
      ['{{code}}', vars.code],
      ['{{ ttl }}', String(vars.ttl ?? vars.ttlMinutes ?? '')],
      ['{{ttl}}', String(vars.ttl ?? vars.ttlMinutes ?? '')],
      ['{{ origin }}', String(vars.origin || '')],
      ['{{origin}}', String(vars.origin || '')],
      ['{{ email }}', String(vars.email || '')],
      ['{{email}}', String(vars.email || '')],
      ['{{ heading }}', String(vars.heading || 'Verify your email')],
      ['{{heading}}', String(vars.heading || 'Verify your email')],
    ];
    for (const [k, v] of replacements) tpl = tpl.split(k).join(v);
    return tpl;
  } catch (e) {
    const ttl = Number(vars.ttl ?? vars.ttlMinutes ?? 10);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Confirm Your Giveaway Entry</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f9; font-family:Arial, Helvetica, sans-serif; color:#111111;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; font-size:1px; line-height:1px; mso-hide:all;">
    Use this code to complete your HYBE Giveaway signup. Expires in ${ttl} minutes.
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px; margin:20px auto; background:#ffffff; border:1px solid #e9e9e9; border-radius:12px;">
    <tr>
      <td style="padding:20px; text-align:center; border-bottom:1px solid #e9e9e9;">
        <img src="https://res.cloudinary.com/dgqhyz67g/image/upload/0f22d319-d299-465c-af1a-c5261c935f9a_removalai_preview_hzdvg2.png" alt="HYBE Logo" width="120" style="display:block; margin:0 auto;">
      </td>
    </tr>
    <tr>
      <td style="padding:28px 24px; text-align:center; color:#444444;">
        <h2 style="font-size:20px; margin:0 0 16px; font-weight:bold; color:#111111;">Confirm Your Giveaway Entry</h2>
        <p style="font-size:15px; line-height:1.6; margin:0 0 20px;">Welcome to <strong>HYBE MEGA GIVEAWAYS 🎉</strong>! To complete your entry, please use the one-time password (OTP) below:</p>
        <div style="display:inline-block; padding:16px 28px; background:#f7f7f7; border:1px solid #cccccc; border-radius:6px; font-size:28px; font-weight:bold; letter-spacing:6px; color:#111111; margin:20px 0;">${vars.code}</div>
        <p style="font-size:15px; line-height:1.6; margin:20px 0 10px;">This code is valid for <strong>${ttl} minutes</strong>. Enter it on the verification screen to activate your account.</p>
        <p style="font-size:14px; line-height:1.6; margin:0 0 20px;">If you did not sign up, you can safely ignore this email.</p>
        <p style="font-size:14px; font-style:italic; margin:0;">– HYBE MANAGEMENT</p>
      </td>
    </tr>
    <tr>
      <td style="background:#fafafa; border-top:1px solid #e9e9e9; padding:14px 20px; text-align:center; font-size:11px; color:#888888; line-height:1.5;">
        <p style="margin:0;">© HYBE Corporation. All rights reserved.</p>
        <p style="margin:5px 0 0;">Need help? Contact <a href="mailto:support@hybe.corp" style="color:#555555; text-decoration:none;">support@hybe.corp</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
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

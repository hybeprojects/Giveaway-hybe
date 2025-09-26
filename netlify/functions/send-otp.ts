import type { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function json(statusCode: number, body: unknown) { return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }

const OTP_EXP_SECONDS = 600; // 10 minutes

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email || !/.+@.+\..+/.test(email)) return json(400, { ok: false, error: 'Invalid email' });

    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const secret = process.env.OTP_JWT_SECRET;
    if (!secret) return json(500, { ok: false, error: 'Server not configured' });

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

    return json(200, { ok: true, token });
  } catch (e: any) {
    return json(500, { ok: false, error: e.message || 'Internal error' });
  }
};

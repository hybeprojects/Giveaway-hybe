import type { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';

function json(statusCode: number, body: unknown) { return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }

const subjects: Record<string, string> = {
  entry_verified: 'You are entered into the HYBE Giveaway',
  credit_added: 'A credit was added to your giveaway balance',
  withdrawal: 'Your withdrawal request was received'
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { ok: false, error: 'Method not allowed' });
  try {
    const { email, type, detail } = JSON.parse(event.body || '{}');
    if (!email || !/.+@.+\..+/.test(email)) return json(400, { ok: false, error: 'Invalid email' });
    const subject = subjects[type] || 'HYBE Giveaway update';

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '465');
    const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.FROM_EMAIL || user;
    if (!host || !user || !pass) return json(500, { ok: false, error: 'SMTP not configured' });

    const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const html = `<div style=\"font-family:Arial,sans-serif;\"><h2>${subject}</h2><p>${detail || ''}</p></div>`;
    await transport.sendMail({ from, to: email, subject, text: (detail || '').toString(), html });

    return json(200, { ok: true });
  } catch (e: any) {
    return json(500, { ok: false, error: e.message || 'Internal error' });
  }
};

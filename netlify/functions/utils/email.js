import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { getPool } from './db.js';

const BACKOFF_MS = [250, 750, 1500];

function jitter(ms) {
  const half = ms / 2;
  return half + Math.floor(Math.random() * half);
}

function getIp(event) {
  const xf = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'] || '';
  const ip = (xf.split(',')[0] || '').trim();
  return ip || '0.0.0.0';
}

export function renderEmail(origin, heading, innerHtml) {
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

function providerConfig() {
  const {
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL,
    SMTP_DKIM_DOMAIN,
    SMTP_DKIM_SELECTOR,
    SMTP_DKIM_PRIVATE_KEY,
  } = process.env;

  if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
    return {
      provider: 'sendgrid',
      from: SENDGRID_FROM_EMAIL,
      sendgrid: { apiKey: SENDGRID_API_KEY },
    };
  }

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    const secure = String(SMTP_SECURE || 'true') === 'true';
    return {
      provider: 'smtp',
      from: FROM_EMAIL || SMTP_USER,
      smtp: {
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      },
      dkim: SMTP_DKIM_DOMAIN && SMTP_DKIM_SELECTOR && SMTP_DKIM_PRIVATE_KEY
        ? {
            domainName: SMTP_DKIM_DOMAIN,
            keySelector: SMTP_DKIM_SELECTOR,
            privateKey: SMTP_DKIM_PRIVATE_KEY,
          }
        : null,
    };
  }

  return { provider: null };
}

export function validateEmailEnvOrThrow() {
  const cfg = providerConfig();
  if (!cfg.provider) {
    const hint = 'Configure SENDGRID_API_KEY/SENDGRID_FROM_EMAIL or SMTP_* env vars.';
    const err = new Error(`Email provider not configured. ${hint}`);
    err.code = 'EMAIL_CONFIG_MISSING';
    throw err;
  }
  return cfg;
}

export function classifyEmailError(error) {
  const msg = String(error && (error.message || error.toString() || ''));
  if ((error && (error.statusCode === 429 || error.code === 429)) || /rate.?limit/i.test(msg)) return 429;
  if (error && (error.response && error.response.statusCode)) {
    const sc = Number(error.response.statusCode);
    if (sc >= 400 && sc < 500) return sc;
  }
  return 502;
}

async function logEmailEventSafe(event) {
  try {
    const pool = getPool();
    await pool.query(
      `create table if not exists email_events (
        id uuid primary key,
        to_email text not null,
        subject text,
        provider text,
        status text,
        error text,
        created_at timestamptz default now()
      )`
    );
    await pool.query(
      'insert into email_events(id, to_email, subject, provider, status, error) values ($1, $2, $3, $4, $5, $6)',
      [crypto.randomUUID(), event.to, event.subject || null, event.provider, event.status, event.error || null]
    );
  } catch {}
}

async function sendViaSendGrid({ to, from, subject, text, html, replyTo, idempotencyKey }) {
  const { sendgrid } = validateEmailEnvOrThrow();
  sgMail.setApiKey(sendgrid.apiKey);
  const msg = { to, from, subject, text, html };
  if (replyTo) msg.replyTo = replyTo;
  // SendGrid supports idempotency via an Idempotency-Key header per request
  const headers = {};
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return sgMail.send(msg, false, headers);
}

async function createSmtpTransport(cfg) {
  let transport = nodemailer.createTransport(cfg.smtp);
  if (cfg.dkim) {
    transport = nodemailer.createTransport({ ...cfg.smtp, dkim: cfg.dkim });
  }
  try {
    await transport.verify();
    return transport;
  } catch (err) {
    const fallback = nodemailer.createTransport({
      ...cfg.smtp,
      port: 587,
      secure: false,
    });
    await fallback.verify();
    return fallback;
  }
}

async function sendViaSmtp({ to, from, subject, text, html, replyTo }) {
  const cfg = validateEmailEnvOrThrow();
  const transport = await createSmtpTransport(cfg);
  const mail = { from, to, subject, text, html };
  if (replyTo) mail.replyTo = replyTo;
  return transport.sendMail(mail);
}

async function trySend(provider, args) {
  if (provider === 'sendgrid') return sendViaSendGrid(args);
  if (provider === 'smtp') return sendViaSmtp(args);
  throw new Error('Unsupported email provider');
}

export async function sendEmail(event, { to, subject, text, html, replyTo, idempotencyKey, queue = false }) {
  const cfg = validateEmailEnvOrThrow();
  const from = (cfg.from);
  const args = { to, from, subject, text, html, replyTo, idempotencyKey };

  const attempt = async () => {
    try {
      const res = await trySend(cfg.provider, args);
      await logEmailEventSafe({ to, subject, provider: cfg.provider, status: 'sent' });
      return res;
    } catch (err) {
      const code = classifyEmailError(err);
      await logEmailEventSafe({ to, subject, provider: cfg.provider, status: 'error', error: String(err && (err.message || err)) });
      const e = new Error('Email send failed');
      e.status = code;
      e.cause = err;
      throw e;
    }
  };

  const exec = async () => {
    for (let i = 0; i < BACKOFF_MS.length; i++) {
      try {
        return await attempt();
      } catch (err) {
        if (i === BACKOFF_MS.length - 1) throw err;
        await new Promise(r => setTimeout(r, jitter(BACKOFF_MS[i])));
      }
    }
  };

  if (queue) {
    // Fire-and-forget within the same invocation; errors logged internally
    exec().catch(() => {});
    return { queued: true };
  }

  return exec();
}

export function makeIdempotencyKey(event, extra = '') {
  const ip = getIp(event);
  const ua = event.headers['user-agent'] || '';
  return crypto.createHash('sha256').update(`${ip}|${ua}|${extra}|${Date.now()}`).digest('hex');
}

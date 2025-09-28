import { getPool } from './utils/db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// --- Authorization and Helper Functions ---

const getAuthEmailFromBearer = (event) => {
  const authz = event.headers['authorization'] || event.headers['Authorization'];
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

// --- Main Handler ---

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const authorizedEmail = getAuthEmailFromBearer(event);
  if (!authorizedEmail) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const { email, type, detail, amount: amountFromDetail } = JSON.parse(event.body) || {};

    if (authorizedEmail !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }
    if (!email || !type) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields: email, type' }) };
    }

    const pool = getPool();

    // --- Server-side withdrawal logic ---
    if (type === 'withdrawal') {
      const amount = Number(amountFromDetail || detail);
      if (isNaN(amount) || amount <= 0) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid withdrawal amount' }) };
      }

      const availableBalance = await calculateBalance(pool, email);
      if (availableBalance < amount) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Insufficient balance' }) };
      }

      // Record the debit in the ledger as the source of truth
      await pool.query(
        `insert into ledger_entries(id, email, type, amount, currency, note, status)
         values ($1, $2, 'debit', $3, 'points', 'Withdrawal request', 'completed')`,
        [crypto.randomUUID(), email, amount]
      );
    }

    // --- Email Sending Logic ---
    const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_SECURE, FROM_EMAIL, URL } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        // Send email, but don't block the response on it
        const emailPromise = (async () => {
            const secure = String(SMTP_SECURE || 'true') === 'true';
            const from = FROM_EMAIL || SMTP_USER;
            let transport = nodemailer.createTransport({
                host: SMTP_HOST, port: Number(SMTP_PORT || '465'), secure, auth: { user: SMTP_USER, pass: SMTP_PASS },
            });
            try { await transport.verify(); } catch {
                transport = nodemailer.createTransport({ host: SMTP_HOST, port: 587, secure: false, auth: { user: SMTP_USER, pass: SMTP_PASS } });
            }
            const subjects = { withdrawal: 'Your withdrawal request was received' };
            const subject = subjects[type] || 'HYBE Giveaway update';
            const html = `<p>${(detail || '').toString()}</p>`; // Simplified for this handler
            await transport.sendMail({ from, to: email, subject, html, text: (detail || '').toString() });
        })();
        emailPromise.catch(e => console.error("Activity email failed to send:", e));
    }


    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /activity-handler function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
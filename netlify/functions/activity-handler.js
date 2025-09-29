import { getPool } from './utils/db.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail, validateEmailEnvOrThrow, renderEmail } from './utils/email.js';

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

    try { validateEmailEnvOrThrow(); } catch { /* no email provider configured, skip */ }
    const subjects = { withdrawal: 'Your withdrawal request was received' };
    const subject = subjects[type] || 'HYBE Giveaway update';
    const html = `<p>${(detail || '').toString()}</p>`;
    sendEmail(event, { to: email, subject, text: (detail || '').toString(), html, queue: true }).catch(() => {});

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

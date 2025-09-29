import jwt from 'jsonwebtoken';
import { renderEmail, sendEmail, validateEmailEnvOrThrow, classifyEmailError } from './utils/email.js';



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

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const authorizedEmail = getAuthEmailFromBearer(event);
  if (!authorizedEmail) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const { email, type, detail } = JSON.parse(event.body);

  if (authorizedEmail !== email) {
    return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
    };
  }

  if (!email || !type || !detail) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: email, type, detail' }),
    };
  }

  const { URL } = process.env;
  try { validateEmailEnvOrThrow(); } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Email server is not configured.' }) };
  }

  const subjects = {
    entry_verified: 'You are entered into the HYBE Giveaway',
    credit_added: 'A credit was added to your giveaway balance',
    withdrawal: 'Your withdrawal request was received'
  };
  const subject = subjects[type] || 'HYBE Giveaway update';

  const bodyHtml = `<p style="margin:0;font-size:14px;color:#666">${(detail || '').toString()}</p>`;
  // Use Netlify's URL env var for the origin
  const html = renderEmail(URL || 'https://hybe.com', subject, bodyHtml);
  const text = (detail || '').toString();

  try {
    await sendEmail(event, { to: email, subject, text, html, replyTo: undefined });
    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully' }) };
  } catch (error) {
    const status = classifyEmailError(error);
    console.error('Failed to send email:', error);
    return { statusCode: status, body: JSON.stringify({ error: status === 429 ? 'Rate limited' : 'Failed to send email.' }) };
  }
};

export { handler };

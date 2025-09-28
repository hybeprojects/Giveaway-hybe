import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

// This function is adapted from server.js
function renderEmail(origin, heading, innerHtml) {
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

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    FROM_EMAIL,
    URL, // Netlify provides this
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP environment variables not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Email server is not configured.' }),
    };
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

  const secure = String(SMTP_SECURE || 'true') === 'true';
  const from = FROM_EMAIL || SMTP_USER;

  let transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    await transport.verify();
  } catch (error) {
    console.error('SMTP verify failed:', error);
    console.log('Attempting SMTP fallback to STARTTLS on port 587...');
    const fallbackTransport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: 587,
        secure: false, // For STARTTLS
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
    try {
        await fallbackTransport.verify();
        transport = fallbackTransport;
    } catch (fallbackError) {
        console.error('SMTP verify failed (fallback):', fallbackError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to connect to email server.' }),
        };
    }
  }

  try {
    await transport.sendMail({ from, to: email, subject, text, html });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email.' }),
    };
  }
};

export { handler };
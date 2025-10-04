
const OTP_TTL_MINUTES = 10;

function makeCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
function isEmail(v) { return /.+@.+\..+/.test(v || ''); }

export const handler = async (event) => {
  const pf = preflight(event); if (pf) return pf;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!isEmail(email)) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }

    const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
    const userAgent = event.headers['user-agent'] || '';

    const code = makeCode();
    const now = new Date();
    const expires = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

    const { error: insertError } = await supabase.from('form_nonces').insert({
      nonce: code,
      email,
      token: null,
      used: false,
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
      issue_ip: clientIp,
      issue_user_agent: userAgent,
      purpose: 'otp',
    });
    if (insertError) {
      console.error('Failed to store OTP:', insertError);
      return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Backend storage unavailable' }) };
    }

    const origin = event.headers['origin'] || event.headers['referer'] || '';
    const { subject, text, html } = renderOtpEmail({ origin, code, ttl: OTP_TTL_MINUTES });

    try {
      await sendEmail(event, { to: email, subject, text, html });
    } catch (e) {
      const status = classifyEmailError(e);
      console.error('SMTP send failed:', e);
      return { statusCode: status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Failed to send email' }) };
    }

    console.log('Successfully sent OTP request to Supabase for:', email, 'Response data:', data);

    // Optional: also issue an app-managed 6-digit OTP and persist it to form_nonces for custom verification flows.
    // This block is best-effort and will not affect the primary response.
    try {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const nonce = crypto.randomUUID();
      const now = new Date();
      const expires = new Date(now.getTime() + 5 * 60 * 1000);
      const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
      const userAgent = event.headers['user-agent'] || '';

      if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
        await supabaseAdmin.from('form_nonces').insert({
          nonce,
          email,
          token: otp,
          purpose: purpose || 'entry',
          issue_ip: clientIp,
          issue_user_agent: userAgent,
          used: false,
          created_at: now.toISOString(),
          expires_at: expires.toISOString(),
        });

        try {
          const html = renderEmail('send-otp', 'Your One-Time Password', `<p>Your one-time password is:</p><h2>${otp}</h2><p>This code expires in 5 minutes.</p>`);
          await sendEmail(event, {
            to: email,
            subject: 'Your OTP Code',
            text: `Your one-time password is: ${otp}. It expires in 5 minutes.`,
            html,
          });
        } catch (emailErr) {
          console.warn('OTP email send skipped/failed:', emailErr?.message || emailErr);
        }
      }
    } catch (persistErr) {
      console.warn('OTP persistence skipped/failed:', persistErr?.message || persistErr);
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in send-otp:', e);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler as default };

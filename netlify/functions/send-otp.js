import supabaseAdmin, { supabaseAnon as supabase } from './utils/supabase.js';
import { CORS_HEADERS, preflight } from './utils/cors.js';
import crypto from 'crypto';
import { sendEmail, renderEmail } from './utils/email.mock.js';

// IMPORTANT: Supabase email template customization
// This function relies on the email templates configured in your Supabase project dashboard.
// To send a 6-digit OTP, you MUST customize the "Confirm signup" template.
// Ensure the template includes the `{{ .Token }}` variable.
//
// Example template:
// <h2>Your One-Time Password</h2>
// <p>Your one-time password is: <strong>{{ .Token }}</strong></p>
//
// A misconfigured template will prevent users from receiving the code.
// For more information, visit the Supabase documentation on email templates.

const DEFAULT_RETRY_AFTER_SECONDS = 60;

const handler = async (event) => {
  const pf = preflight(event); if (pf) return pf;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, purpose } = JSON.parse(event.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }

    // Default: don't create user for 'login'. We'll fallback to creating on user-not-found.
    const shouldCreateUser = purpose !== 'login';

    let { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser },
    });

    // If user doesn't exist and we were in login mode, retry creating the user to keep OTP-only flow unified.
    if (error && /user.*not.*found/i.test(error.message || '') && purpose === 'login') {
      console.warn('User not found on OTP send; retrying with shouldCreateUser=true for', email);
      const retry = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      data = retry.data; error = retry.error;
    }

    if (error) {
      console.error('Supabase OTP error:', {
        message: error.message,
        status: error.status,
        details: error.stack,
      });

      const isRateLimited = error.status === 429 || /rate limit/i.test(error.message || '');
      if (isRateLimited) {
        return {
          statusCode: 429,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Retry-After': String(DEFAULT_RETRY_AFTER_SECONDS) },
          body: JSON.stringify({ ok: false, error: `Too many code requests. Please wait ${DEFAULT_RETRY_AFTER_SECONDS} seconds and try again.`, detail: error.message }),
        };
      }

      const isUserNotFound = /user.*not.*found/i.test(error.message || '');
      const statusCode = isUserNotFound ? 404 : 400;
      const errorMessage = isUserNotFound
        ? 'Email not found.'
        : 'Failed to send OTP. This is likely due to a misconfigured "Confirm signup" template in Supabase. Please check your Supabase dashboard and ensure the template includes the {{ .Token }} variable.';
      return { statusCode, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: errorMessage, detail: error.message }) };
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
    console.error('Critical error in /send-otp function:', e);
    return { statusCode: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler };

import { supabaseAnon as supabase, supabaseAdmin } from './utils/supabase.js';
import { CORS_HEADERS, preflight } from './utils/cors.js';

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

    // Default: don't create user for 'login'. We'll fallback to admin-provision when signups are disabled.
    const shouldCreateUser = purpose !== 'login';

    let { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser },
    });

    const msg = (error && (error.message || '')) || '';
    const isUserNotFound = /user.*not.*found/i.test(msg);
    const isSignupsDisabled = error && (error.status === 422 || /signups.*not.*allowed.*otp/i.test(msg));

    // If user doesn't exist or signups are disabled during login, auto-provision with service role then send login OTP.
    if (error && purpose === 'login' && (isUserNotFound || isSignupsDisabled)) {
      try {
        const created = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: false });
        if (created.error && !/exist/i.test(created.error.message || '')) {
          // If creation failed for a reason other than already exists, surface the error
          throw created.error;
        }
      } catch (provisionErr) {
        console.error('Failed to provision user with service role:', provisionErr);
        return { statusCode: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Unable to provision account for OTP login', detail: provisionErr.message || String(provisionErr) }) };
      }

      // Try again to send OTP as a login (no signup)
      const retry = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
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

      const stillUserNotFound = /user.*not.*found/i.test(error.message || '');
      const statusCode = stillUserNotFound ? 404 : 400;
      const errorMessage = stillUserNotFound
        ? 'Email not found.'
        : 'Failed to send OTP. This is likely due to a misconfigured "Confirm signup" template in Supabase. Please check your Supabase dashboard and ensure the template includes the {{ .Token }} variable.';
      return { statusCode, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: errorMessage, detail: error.message }) };
    }

    console.log('Successfully sent OTP request to Supabase for:', email, 'Response data:', data);

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

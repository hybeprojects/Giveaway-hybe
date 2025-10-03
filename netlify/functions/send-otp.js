import { supabaseAnon as supabase } from './utils/supabase.js';

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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, purpose } = JSON.parse(event.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
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
          headers: { 'Content-Type': 'application/json', 'Retry-After': String(DEFAULT_RETRY_AFTER_SECONDS) },
          body: JSON.stringify({ ok: false, error: `Too many code requests. Please wait ${DEFAULT_RETRY_AFTER_SECONDS} seconds and try again.`, detail: error.message }),
        };
      }

      const isUserNotFound = /user.*not.*found/i.test(error.message || '');
      const statusCode = isUserNotFound ? 404 : 400;
      const errorMessage = isUserNotFound
        ? 'Email not found.'
        : 'Failed to send OTP. This is likely due to a misconfigured "Confirm signup" template in Supabase. Please check your Supabase dashboard and ensure the template includes the {{ .Token }} variable.';
      return { statusCode, body: JSON.stringify({ ok: false, error: errorMessage, detail: error.message }) };
    }

    console.log('Successfully sent OTP request to Supabase for:', email, 'Response data:', data);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Critical error in /send-otp function:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler };

import supabase from './utils/supabase.js';

// IMPORTANT: Supabase email template customization
// This function relies on the email templates configured in your Supabase project dashboard.
// To ensure that users receive a one-time password (OTP), you MUST customize the "Magic Link"
// email template to include the `{{ .Token }}` variable.
//
// Example template:
// <h2>Your One-Time Password</h2>
// <p>Your one-time password is: <strong>{{ .Token }}</strong></p>
//
// If the `{{ .Token }}` variable is not present, users may receive a blank or incomplete email.
// For more information, visit the Supabase documentation on email templates.

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, purpose } = JSON.parse(event.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }

    // For 'login', we don't want to create a new user if they don't exist.
    // For 'signup', we let Supabase create the user (default behavior).
    const shouldCreateUser = purpose !== 'login';

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
      },
    });

    if (error) {
      console.error('Supabase OTP error:', {
        message: error.message,
        status: error.status,
        details: error.stack,
      });
      const isUserNotFound = /user.*not.*found/i.test(error.message);
      const statusCode = isUserNotFound ? 404 : 400;
      const errorMessage = isUserNotFound ? 'Email not found. Please sign up first.' : 'Failed to send OTP.';
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

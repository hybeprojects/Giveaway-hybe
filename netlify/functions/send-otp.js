import supabase from './utils/supabase.js';

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
      const errorMessage = isUserNotFound
        ? 'Email not found. Please sign up first.'
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

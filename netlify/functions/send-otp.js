import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, purpose } = JSON.parse(event.body) || {};
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }

    // Supabase handles rate limiting and email sending.
    // For 'login', we don't want to create a new user if they don't exist.
    // For 'signup', we let Supabase create the user (default behavior).
    const shouldCreateUser = purpose !== 'login';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
      },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      // Provide a generic error message but log the specific one.
      // Supabase will prevent users from being created if they already exist,
      // but it's handled gracefully and a login link is sent.
      // If shouldCreateUser is false and the user doesn't exist, an error is returned.
      const isUserNotFound = /user.*not.*found/i.test(error.message);
      const statusCode = isUserNotFound ? 404 : 400;
      const errorMessage = isUserNotFound ? 'Email not found. Please sign up first.' : 'Failed to send OTP.';
      return { statusCode, body: JSON.stringify({ ok: false, error: errorMessage, detail: error.message }) };
    }

    // The client no longer needs a token from this function.
    // It will use the email and the code from the user to verify.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /send-otp function:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler };

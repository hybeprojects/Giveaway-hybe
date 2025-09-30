import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, code, purpose } = JSON.parse(event.body) || {};

    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }
    if (!/^\d{6}$/.test(code || '')) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid code' }) };
    }

    // Supabase handles verification and rate limiting.
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: purpose === 'signup' ? 'signup' : 'email',
    });

    if (error) {
      console.error('Supabase verify OTP error:', error);
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Incorrect or expired code.', detail: error.message }) };
    }

    // On success, `data` contains the session object (access_token, refresh_token, user).
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true, session: data.session }),
    };

  } catch (e) {
    console.error('Error in /verify-otp function:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Verification failed' }) };
  }
};

export { handler };

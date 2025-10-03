import { supabaseAnon as supabase } from './utils/supabase.js';

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

    // Try verifying as a login email OTP first; if that fails, try signup OTP.
    let first = await supabase.auth.verifyOtp({ email, token: code, type: purpose === 'signup' ? 'signup' : 'email' });
    let { data, error } = first;

    if (error) {
      console.warn('Primary verify failed, trying alternate type for OTP:', error?.message);
      const alternateType = (purpose === 'signup') ? 'email' : 'signup';
      const second = await supabase.auth.verifyOtp({ email, token: code, type: alternateType });
      data = second.data; error = second.error;
    }

    if (error) {
      console.error('Supabase verify OTP error:', error);
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Incorrect or expired code.', detail: error.message }) };
    }

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

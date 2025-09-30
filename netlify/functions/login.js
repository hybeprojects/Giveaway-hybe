import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }
    if (typeof password !== 'string' || password.length < 6) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid credentials' }) };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session?.access_token) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Invalid email or password' }) };
    }

    // Return access_token for frontend session storage (already used by OTP flow)
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true, session: { access_token: data.session.access_token } }) };
  } catch (e) {
    console.error('Error in /login', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler };

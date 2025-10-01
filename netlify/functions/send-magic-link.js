import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { email, redirectPath } = JSON.parse(event.body || '{}');
    if (!email || !/.+@.+\..+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    }

    const site = process.env.NETLIFY_SITE_URL || process.env.URL || '';
    const redirectTo = `${site}${redirectPath || '/signup'}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      const isRateLimited = error.status === 429 || /rate limit/i.test(error.message || '');
      if (isRateLimited) {
        return { statusCode: 429, headers: { 'Retry-After': '60' }, body: JSON.stringify({ ok: false, error: 'Too many requests. Try again later.' }) };
      }
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Failed to send magic link', detail: error.message }) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Error in /send-magic-link', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Internal server error' }) };
  }
};

export { handler };

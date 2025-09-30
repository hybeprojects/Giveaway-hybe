import supabase from './utils/supabase.js';

function isEmail(v) { return /.+@.+\..+/.test(v || ''); }
function nonEmpty(v) { return typeof v === 'string' && v.trim().length > 0; }
function isISODate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }
function isYear(v) { const n = Number(v); return Number.isInteger(n) && n >= 1900 && n <= 2100; }

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Authenticate via Supabase access token (OTP or password session)
  const authz = event.headers['authorization'] || event.headers['Authorization'];
  if (!authz || !authz.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }
  const token = authz.slice('Bearer '.length);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    const {
      email,
      full_name,
      phone,
      birthdate,
      country,
      consent_terms,
      consent_privacy,
      marketing_opt_in,
      favorite_artist,
      bias_member,
      fan_since_year,
      favorite_song_album,
      twitter_handle,
      instagram_handle,
      tiktok_handle,
      fan_message,
      fan_art_url,
      trivia_answer,
      referral_code,
      preferred_prize
    } = body;

    if (user.email !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }

    // Required validations
    if (!isEmail(email)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    if (!nonEmpty(full_name)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Full name is required' }) };
    if (!nonEmpty(country)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Country is required' }) };
    if (birthdate && !isISODate(birthdate)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Birthdate must be YYYY-MM-DD' }) };
    if (fan_since_year && !isYear(fan_since_year)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Fan since year must be a valid year' }) };
    if (consent_terms !== true || consent_privacy !== true) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'You must accept terms and privacy' }) };

    // Prevent duplicate entries by email
    const { data: existingEntry, error: selectError } = await supabase
      .from('entries')
      .select('email')
      .eq('email', email)
      .maybeSingle();
    if (selectError) throw selectError;
    if (existingEntry) {
      return { statusCode: 409, body: JSON.stringify({ ok: false, error: 'Entry already exists for this email' }) };
    }

    // Insert new entry
    const payload = {
      email,
      full_name,
      phone: phone || null,
      birthdate: birthdate || null,
      country,
      consent_terms: !!consent_terms,
      consent_privacy: !!consent_privacy,
      marketing_opt_in: !!marketing_opt_in,
      favorite_artist: favorite_artist || null,
      bias_member: bias_member || null,
      fan_since_year: fan_since_year || null,
      favorite_song_album: favorite_song_album || null,
      twitter_handle: twitter_handle || null,
      instagram_handle: instagram_handle || null,
      tiktok_handle: tiktok_handle || null,
      fan_message: fan_message || null,
      fan_art_url: fan_art_url || null,
      trivia_answer: trivia_answer || null,
      referral_code: referral_code || null,
      preferred_prize: preferred_prize || null,
    };

    const { error: insertError } = await supabase.from('entries').insert(payload);
    if (insertError) throw insertError;

    // Welcome bonus ledger credit
    const { error: ledgerError } = await supabase.from('ledger_entries').insert({
      email,
      type: 'credit',
      amount: 100,
      currency: 'points',
      note: 'Welcome bonus',
      status: 'available'
    });
    if (ledgerError) console.error('Ledger bonus failed', ledgerError);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Error in /post-entry function:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }) };
  }
};

export { handler };

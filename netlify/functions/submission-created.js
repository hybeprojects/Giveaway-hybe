import supabase from './utils/supabase.js';

function isEmail(v) { return /.+@.+\..+/.test(v || ''); }
function nonEmpty(v) { return typeof v === 'string' && v.trim().length > 0; }
function isISODate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }
function isYear(v) { const n = Number(v); return Number.isInteger(n) && n >= 1900 && n <= 2100; }

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const payload = body && body.payload ? body.payload : null;
    if (!payload) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing payload' }) };
    }

    const formName = payload.form_name || payload.formName || '';
    if (formName !== 'entry') {
      // Ignore other forms, acknowledge success
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const data = payload.data || {};

    // Honeypot check
    if (data['bot-field']) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // OTP session token passed as a hidden field in the form payload
    const token = data['supabase_token'] || '';
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    // Authenticate user via Supabase access token
    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userRes || !userRes.user) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    const user = userRes.user;

    // Extract and normalize fields coming from Netlify Forms (strings)
    const email = String(data.email || '').trim();
    const full_name = String(data.fullName || '').trim();
    const phone = String(data.phone || '').trim() || null;
    const birthdate = String(data.dob || '').trim() || null;
    const country = String(data.country || '').trim();

    const referral_code = (data.referralCode || '').trim() || null;
    const favorite_artist = (data.favoriteArtist || '').trim() || null;
    const favorite_group = (data.favoriteGroup || '').trim() || null; // not stored directly unless schema has it
    const fan_preference_branch = (data.fanPreferenceBranch || '').trim() || null; // not stored directly unless schema has it

    const consent_terms = String(data.consentTerms || '').toLowerCase() === 'true';
    const consent_privacy = String(data.consentPrivacy || '').toLowerCase() === 'true';
    const marketing_opt_in = String(data.marketingOptIn || '').toLowerCase() === 'true';

    const address_line1 = (data.addressLine1 || '').trim() || null;
    const address_line2 = (data.addressLine2 || '').trim() || null;
    const city = (data.city || '').trim() || null;
    const state = (data.state || '').trim() || null;
    const postal_code = (data.postalCode || '').trim() || null;
    const use_as_mailing = String(data.useAsMailingAddress || '').toLowerCase() === 'true';

    // Ensure token email matches submitted email
    if (user.email !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }

    // Required validations (align with previous post-entry function)
    if (!isEmail(email)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
    if (!nonEmpty(full_name)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Full name is required' }) };
    if (!nonEmpty(country)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Country is required' }) };
    if (birthdate && !isISODate(birthdate)) return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Birthdate must be YYYY-MM-DD' }) };
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

    // Validate referral code
    const validReferralCode = '#BTS2026';
    let welcomeBonus = 100;
    let bonusNote = 'Welcome bonus';

    if (referral_code) {
      if (referral_code === validReferralCode) {
        welcomeBonus = 200;
        bonusNote = 'Welcome bonus (with valid referral code)';
      } else {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid referral code' }) };
      }
    }

    // Insert new entry (align field names to DB schema used by other functions)
    const entryPayload = {
      email,
      full_name,
      phone: phone || null,
      birthdate: birthdate || null,
      country,
      consent_terms: !!consent_terms,
      consent_privacy: !!consent_privacy,
      marketing_opt_in: !!marketing_opt_in,
      favorite_artist: favorite_artist || null,
      favorite_group: favorite_group || null,
      fan_preference_branch: fan_preference_branch || null,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      use_as_mailing,
      referral_code: referral_code || null,
    };

    const { error: insertError } = await supabase.from('entries').insert(entryPayload);
    if (insertError) throw insertError;

    // Welcome bonus ledger credit
    const { error: ledgerError } = await supabase.from('ledger_entries').insert({
      email,
      type: 'credit',
      amount: welcomeBonus,
      currency: 'points',
      note: bonusNote,
      status: 'available'
    });
    if (ledgerError) console.error('Ledger bonus failed', ledgerError);

    // Fire-and-forget event log
    try {
      await supabase.from('events').insert({ type: 'entry', text: `${full_name || email} entered the giveaway`, meta: { email, country, referral_code: referral_code || null } });
    } catch (e) {
      console.warn('Event insert failed', e);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Error in submission-created bridge:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }) };
  }
};

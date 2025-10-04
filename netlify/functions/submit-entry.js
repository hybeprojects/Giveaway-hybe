import supabase from './utils/supabase.js';

function isEmail(v) { return /.+@.+\..+/.test(v || ''); }
function nonEmpty(v) { return typeof v === 'string' && v.trim().length > 0; }
function isISODate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const raw = event.body ? JSON.parse(event.body) : {};
    // Support both Netlify form payloads and direct JSON payloads
    const data = raw && raw.payload && raw.payload.data ? raw.payload.data : raw;

    // Honeypot check
    if (data && data['bot-field']) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const email = String(data.email || '').trim();
    const full_name = String(data.fullName || '').trim();
    const phone = String(data.phone || '').trim() || null;
    const birthdate = String(data.dob || '').trim() || null;
    const country = String(data.country || '').trim();

    const referral_code = (data.referralCode || '').trim() || null;
    const favorite_artist = (data.favoriteArtist || '').trim() || null;
    const favorite_group = (data.favoriteGroup || '').trim() || null;
    const fan_preference_branch = (data.fanPreferenceBranch || '').trim() || null;

    const consent_terms = String(data.consentTerms || '').toLowerCase() === 'true' || data.consentTerms === true;
    const consent_privacy = String(data.consentPrivacy || '').toLowerCase() === 'true' || data.consentPrivacy === true;
    const marketing_opt_in = String(data.marketingOptIn || '').toLowerCase() === 'true' || data.marketingOptIn === true;

    const address_line1 = (data.addressLine1 || '').trim() || null;
    const address_line2 = (data.addressLine2 || '').trim() || null;
    const city = (data.city || '').trim() || null;
    const state = (data.state || '').trim() || null;
    const postal_code = (data.postalCode || '').trim() || null;
    const use_as_mailing = String(data.useAsMailingAddress || '').toLowerCase() === 'true' || data.useAsMailingAddress === true;

    // Required validations
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

    // Referral logic
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

    const shippingParts = [address_line1, address_line2, city, state, postal_code].filter(Boolean);
    const shipping_address = shippingParts.length ? shippingParts.join(', ') : null;

    const entryPayload = {
      email,
      name: full_name,
      country,
      shipping_address,
    };

    const { error: insertError } = await supabase.from('entries').insert(entryPayload);
    if (insertError) throw insertError;

    try {
      await supabase.from('ledger_entries').insert({
        email,
        type: 'credit',
        amount: welcomeBonus,
        currency: 'points',
        note: bonusNote,
        status: 'available',
      });
    } catch {}

    try {
      const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
      const userAgent = event.headers['user-agent'] || '';
      await supabase.from('events').insert({ type: 'entry', text: `${full_name || email} entered the giveaway`, meta: { email, country, referral_code: referral_code || null, ip: clientIp, user_agent: userAgent } });
    } catch {}

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Error in /submit-entry:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }) };
  }
};

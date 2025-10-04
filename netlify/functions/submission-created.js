import supabase from './utils/supabase.js';

function isEmail(v) { return /.+@.+\..+/.test(v || ''); }
function nonEmpty(v) { return typeof v === 'string' && v.trim().length > 0; }
function isISODate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const payload = body && body.payload ? body.payload : null;

    if (!payload) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing payload' }) };
    }

    const formName = payload.form_name || payload.formName || '';
    if (formName !== 'entry') {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const data = payload.data || {};

    // Honeypot check
    if (data['bot-field']) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // Extract and normalize fields from Netlify Forms (strings)
    const email = String(data.email || '').trim();
    const full_name = String(data.fullName || '').trim();
    const phone = String(data.phone || '').trim() || null;
    const birthdate = String(data.dob || '').trim() || null;
    const country = String(data.country || '').trim();

    const referral_code = (data.referralCode || '').trim() || null;
    const favorite_artist = (data.favoriteArtist || '').trim() || null;
    const favorite_group = (data.favoriteGroup || '').trim() || null;
    const fan_preference_branch = (data.fanPreferenceBranch || '').trim() || null;

    const consent_terms = String(data.consentTerms || '').toLowerCase() === 'true';
    const consent_privacy = String(data.consentPrivacy || '').toLowerCase() === 'true';
    const marketing_opt_in = String(data.marketingOptIn || '').toLowerCase() === 'true';

    const address_line1 = (data.addressLine1 || '').trim() || null;
    const address_line2 = (data.addressLine2 || '').trim() || null;
    const city = (data.city || '').trim() || null;
    const state = (data.state || '').trim() || null;
    const postal_code = (data.postalCode || '').trim() || null;
    const use_as_mailing = String(data.useAsMailingAddress || '').toLowerCase() === 'true';

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

    // Insert new entry
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

    // Welcome bonus ledger credit (best-effort)
    try {
      await supabase.from('ledger_entries').insert({
        email,
        type: 'credit',
        amount: welcomeBonus,
        currency: 'points',
        note: bonusNote,
        status: 'available',
      });
    } catch (e) {
      console.warn('Ledger bonus failed', e);
    }

    // Fire-and-forget event log
    try {
      const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
      const userAgent = event.headers['user-agent'] || '';
      await supabase.from('events').insert({ type: 'entry', text: `${full_name || email} entered the giveaway`, meta: { email, country, referral_code: referral_code || null, ip: clientIp, user_agent: userAgent } });
    } catch (e) {
      console.warn('Event insert failed', e);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Error in submission-created bridge:', e);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }) };
  }
};

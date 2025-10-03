import supabase from './utils/supabase.js';

function isEmail(v) { return /.+@.+\..+/.test(v || ''); }
function nonEmpty(v) { return typeof v === 'string' && v.trim().length > 0; }
function isISODate(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || ''); }
function isYear(v) { const n = Number(v); return Number.isInteger(n) && n >= 1900 && n <= 2100; }

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const payload = body && body.payload ? body.payload : null;

    // Direct API mode: simple JSON { email, otp }
    if (!payload && body && body.email && body.otp) {
      const email = String(body.email || '').trim();
      const otp = String(body.otp || '').trim();

      if (!isEmail(email)) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
      }
      if (!/^\d{6}$/.test(otp)) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid or expired OTP' }) };
      }

      const nowIso = new Date().toISOString();
      const { data: nonce, error } = await supabase
        .from('form_nonces')
        .select('*')
        .eq('email', email)
        .eq('token', otp)
        .eq('used', false)
        .gt('expires_at', nowIso)
        .maybeSingle();

      if (error || !nonce) {
        return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid or expired OTP' }) };
      }

      await supabase
        .from('form_nonces')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('nonce', nonce.nonce);

      // Minimal entry creation
      try {
        await supabase.from('entries').insert({ email });
      } catch (e) {
        // If duplicate or schema mismatch, surface as 409
        if ((e && e.code === '23505') || /duplicate/i.test(e?.message || '')) {
          return { statusCode: 409, body: JSON.stringify({ ok: false, error: 'Entry already exists for this email' }) };
        }
        console.warn('entries insert warning:', e);
      }

      // Credit ledger_entries (preferred schema)
      try {
        await supabase.from('ledger_entries').insert({
          email,
          type: 'credit',
          amount: 100,
          currency: 'points',
          note: 'Welcome bonus',
          status: 'available',
        });
      } catch (e) {
        console.warn('ledger_entries insert warning:', e);
        // Fallback: legacy table name "ledger" if present
        try {
          await supabase.from('ledger').insert({ email, bonus: 100 });
        } catch (e2) {
          console.warn('ledger insert warning:', e2);
        }
      }

      return { statusCode: 200, body: JSON.stringify({ success: true, redirect: '/success.html' }) };
    }

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

    // Anti-replay: short-lived nonce + client timestamp
    const supabase_nonce = data['supabase_nonce'] || '';
    const tsStr = data['ts'] || '';
    const ts = Number(tsStr);
    const nowMs = Date.now();
    const MAX_SKEW_MS = 5 * 60 * 1000;
    if (!supabase_nonce || !Number.isFinite(ts) || Math.abs(nowMs - ts) > MAX_SKEW_MS) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid or expired submission context' }) };
    }

    // Look up nonce in DB
    const { data: nonceRow, error: nonceError } = await supabase
      .from('form_nonces')
      .select('*')
      .eq('nonce', supabase_nonce)
      .maybeSingle();
    if (nonceError) throw nonceError;
    if (!nonceRow) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }
    if (nonceRow.used) {
      return { statusCode: 409, body: JSON.stringify({ ok: false, error: 'Token already consumed' }) };
    }
    if (nonceRow.expires_at && new Date(nonceRow.expires_at).getTime() < nowMs) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Expired token' }) };
    }

    const token = nonceRow.token;
    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userRes || !userRes.user) {
      return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    const user = userRes.user;

    // Mark nonce as used and capture submit IP/UA
    const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
    const userAgent = event.headers['user-agent'] || '';
    await supabase
      .from('form_nonces')
      .update({ used: true, used_at: new Date().toISOString(), submit_ip: clientIp, submit_user_agent: userAgent })
      .eq('nonce', supabase_nonce);

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

    // Fire-and-forget event log with metadata
    try {
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

import supabase from './utils/supabase.js';
import supabaseAdmin from './utils/supabaseAdmin.js';
import crypto from 'crypto';

// Function to generate a unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex'); // Creates an 8-character hex string
};

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 1. Authenticate user with Supabase from the Authorization header
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
    const { email, name, country, referred_by_code } = JSON.parse(event.body) || {};

    if (user.email !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }
    if (!email || !name || !country) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }

    // 2. Check if the user entry already exists
    const { data: existingEntry, error: selectError } = await supabase
      .from('entries')
      .select('email, referral_code')
      .eq('email', email)
      .maybeSingle();

    if (selectError) throw selectError;

    const isNewEntry = !existingEntry;
    const referralCode = existingEntry?.referral_code || generateReferralCode();

    // 3. Upsert the public user entry in the 'entries' table
    const { error: upsertError } = await supabase
      .from('entries')
      .upsert({ email, name, country, referral_code: referralCode }, { onConflict: 'email' });

    if (upsertError) throw upsertError;

    // 4. If it's a new user, perform additional actions
    if (isNewEntry) {
      // 4a. Update the user's auth metadata with the referral code using the admin client
      const { error: adminUserError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { user_metadata: { referral_code: referralCode } }
      );
      if (adminUserError) {
        // Log the error but don't fail the entire transaction, as the primary entry was created.
        console.error(`Failed to update user metadata for ${user.email}:`, adminUserError);
      }

      // 4b. Award a welcome bonus to the new user
      await supabase.from('ledger_entries').insert({
        email,
        type: 'credit',
        amount: 100,
        currency: 'points',
        note: 'Welcome bonus',
        status: 'available',
      });

      // 4c. If referred, reward the referrer
      if (referred_by_code) {
        const { data: referrer } = await supabase
          .from('entries')
          .select('email')
          .eq('referral_code', referred_by_code)
          .single();

        if (referrer) {
          await supabase.from('ledger_entries').insert({
            email: referrer.email,
            type: 'credit',
            amount: 200,
            currency: 'points',
            note: `Referred new user: ${email}`,
            status: 'available',
          });
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /post-entry function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
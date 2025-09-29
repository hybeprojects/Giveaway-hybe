import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // 1. Authenticate user with Supabase
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
    const { email, name, country } = JSON.parse(event.body) || {};

    if (user.email !== email) {
      return { statusCode: 403, body: JSON.stringify({ ok: false, error: 'Forbidden' }) };
    }
    if (!email || !name || !country) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }

    // 2. Check if the entry already exists to determine if it's a new user.
    const { data: existingEntry, error: selectError } = await supabase
      .from('entries')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const isNewEntry = !existingEntry;

    // 3. Upsert the entry (create or update).
    const { error: upsertError } = await supabase
      .from('entries')
      .upsert({ email, name, country }, { onConflict: 'email' });

    if (upsertError) {
      throw upsertError;
    }

    // 4. If it's a new entry, award a welcome bonus.
    if (isNewEntry) {
      const { error: ledgerError } = await supabase.from('ledger_entries').insert({
        email,
        type: 'credit',
        amount: 100,
        currency: 'points',
        note: 'Welcome bonus',
        status: 'available',
      });
      if (ledgerError) {
        // Log this error but don't fail the whole request, as the main entry was created.
        console.error('Failed to add welcome bonus:', ledgerError);
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
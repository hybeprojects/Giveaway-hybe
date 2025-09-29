import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Authenticate user with Supabase
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
    const [entryRes, ledgerRes] = await Promise.all([
      supabase.from('entries').select('*').eq('email', user.email).single(),
      supabase.from('ledger_entries').select('*').eq('email', user.email).order('created_at', { ascending: false })
    ]);

    if (entryRes.error) {
      if (entryRes.error.code === 'PGRST116') { // PostgREST error for "Not a single row"
        return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'User entry not found' }) };
      }
      throw entryRes.error;
    }
    if (ledgerRes.error) {
      throw ledgerRes.error;
    }

    const entry = entryRes.data || null;
    const ledger = ledgerRes.data || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, entry, ledger }),
    };

  } catch (e) {
    console.error('Error in /get-me function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
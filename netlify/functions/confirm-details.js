import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
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
    const { shipping_address } = JSON.parse(event.body) || {};

    if (!shipping_address || typeof shipping_address !== 'string' || shipping_address.trim().length < 10) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid shipping address provided.' }) };
    }

    const { error } = await supabase
      .from('entries')
      .update({ shipping_address: shipping_address.trim() })
      .eq('email', user.email);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /confirm-details function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
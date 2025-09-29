import supabase from './utils/supabase.js';

async function isAuthorized(event) {
  // 1. Check for admin token
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken && event.headers['x-admin-token'] === adminToken) {
    return true;
  }

  // 2. Check for standard user auth
  const authz = event.headers['authorization'] || event.headers['Authorization'];
  if (authz && authz.startsWith('Bearer ')) {
    const token = authz.slice('Bearer '.length);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return true;
    }
  }

  return false;
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!(await isAuthorized(event))) {
    return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
  }

  try {
    const { type, text, meta } = JSON.parse(event.body) || {};

    if (!type || !text) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }

    const { error } = await supabase
      .from('events')
      .insert({ type, text, meta: meta || null });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };

  } catch (e) {
    console.error('Error in /post-event function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: e?.message || 'Internal server error' }),
    };
  }
};

export { handler };
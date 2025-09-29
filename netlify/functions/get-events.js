import supabase from './utils/supabase.js';

const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('text, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || []),
    };

  } catch (e) {
    console.error('Error in /get-events function:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    };
  }
};

export { handler };
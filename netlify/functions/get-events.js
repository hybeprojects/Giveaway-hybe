import { getPool } from './utils/db.js';

const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const pool = getPool();
    const r = await pool.query('select text, created_at from events order by created_at desc limit 10');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r.rows || []),
    };

  } catch (e) {
    console.error('Error in /get-events function:', e);
    return {
      statusCode: 500,
      body: JSON.stringify([]), // Return empty array on error, as the original did
    };
  }
};

export { handler };
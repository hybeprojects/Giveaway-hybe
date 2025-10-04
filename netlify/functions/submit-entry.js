export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  // This endpoint is disabled to ensure submissions go through Netlify Forms only.
  // Frontend will fall back to Netlify Forms when this returns non-2xx.
  return { statusCode: 501, body: JSON.stringify({ ok: false, error: 'Disabled. Use Netlify Forms submission.' }) };
};

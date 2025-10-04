export const handler = async (event) => {
  return { statusCode: 501, body: JSON.stringify({ ok: false, error: 'Disabled in Netlify Forms only mode' }) };
};

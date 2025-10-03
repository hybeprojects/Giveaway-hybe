export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Max-Age': '86400'
};

export function preflight(event) {
  if (event && event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...CORS_HEADERS } };
  }
  return null;
}

export function withCors(res) {
  const headers = { 'Content-Type': 'application/json', ...(res.headers || {}), ...CORS_HEADERS };
  return { ...res, headers };
}

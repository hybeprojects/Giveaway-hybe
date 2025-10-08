// netlify/functions/post-event.js
var handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  return { statusCode: 501, body: JSON.stringify({ ok: false, error: "Disabled in Netlify Forms only mode" }) };
};
export {
  handler
};

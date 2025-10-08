// netlify/functions/submission-created.js
var handler = async (event) => {
  try {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }
};
export {
  handler
};

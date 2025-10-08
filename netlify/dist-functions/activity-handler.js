// netlify/functions/activity-handler.js
var handler = async (event) => {
  return { statusCode: 501, body: JSON.stringify({ ok: false, error: "Disabled in Netlify Forms only mode" }) };
};
export {
  handler
};

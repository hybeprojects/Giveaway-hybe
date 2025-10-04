export const handler = async (event) => {
  // Netlify Forms only mode: acknowledge the submission-created event without side effects
  try {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }
};

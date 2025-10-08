// netlify/functions/utils/email.mock.js
function renderEmail(origin, heading, innerHtml) {
  return `<div data-origin="${origin}" data-heading="${heading}">${innerHtml}</div>`;
}
async function sendEmail(_event, { to, subject, text, html }) {
  if (!to) throw new Error("Missing to");
  const payload = { to, subject, text, html };
  await new Promise((r) => setTimeout(r, 5));
  return { mocked: true, payload };
}
function validateEmailEnvOrThrow() {
  return { provider: "mock", from: "mock@example.com" };
}
function classifyEmailError() {
  return 500;
}
function makeIdempotencyKey() {
  return "mock-idk";
}
export {
  classifyEmailError,
  makeIdempotencyKey,
  renderEmail,
  sendEmail,
  validateEmailEnvOrThrow
};

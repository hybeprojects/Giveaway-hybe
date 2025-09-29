// Mock utilities for testing email flows without hitting providers
export function renderEmail(origin, heading, innerHtml) {
  return `<div data-origin="${origin}" data-heading="${heading}">${innerHtml}</div>`;
}

export async function sendEmail(_event, { to, subject, text, html }) {
  if (!to) throw new Error('Missing to');
  const payload = { to, subject, text, html };
  // Simulate async send
  await new Promise(r => setTimeout(r, 5));
  return { mocked: true, payload };
}

export function validateEmailEnvOrThrow() { return { provider: 'mock', from: 'mock@example.com' }; }
export function classifyEmailError() { return 500; }
export function makeIdempotencyKey() { return 'mock-idk'; }

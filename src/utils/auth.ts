export type SendOtpResponse = { ok: true; token: string } | { ok: false; error: string };
export type VerifyOtpResponse = { ok: true; session: string } | { ok: false; error: string };

export const apiBase: string = (import.meta as any).env?.VITE_API_BASE || '/.netlify/functions';

export async function requestOtp(email: string): Promise<string> {
  const res = await fetch(`${apiBase}/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
  if (!res.ok) throw new Error('Failed to send code');
  const data = (await res.json()) as SendOtpResponse;
  if (!data.ok) throw new Error(data.error);
  return data.token;
}

export async function verifyOtp(email: string, code: string, token: string): Promise<string> {
  const res = await fetch(`${apiBase}/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, token }) });
  if (!res.ok) throw new Error('Verification failed');
  const data = (await res.json()) as VerifyOtpResponse;
  if (!data.ok) throw new Error(data.error);
  return data.session;
}

export function saveLocalSession(session: string) {
  localStorage.setItem('local_session', session);
}

export function getLocalSession(): { email: string } | null {
  const t = localStorage.getItem('local_session');
  if (!t) return null;
  try {
    const [, payload] = t.split('.');
    const json = JSON.parse(atob(payload));
    if (json && json.email) return { email: json.email };
  } catch {}
  return null;
}

export function clearLocalSession() { localStorage.removeItem('local_session'); }

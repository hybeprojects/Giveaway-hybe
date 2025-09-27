export type SendOtpResponse = { ok: true; token: string } | { ok: false; error: string };
export type VerifyOtpResponse = { ok: true; session: string } | { ok: false; error: string };

export const apiBase: string = (import.meta as any).env?.VITE_API_BASE || '/.netlify/functions';

async function tryFetch(url: string, opts: RequestInit) {
  try {
    const res = await fetch(url, opts);
    return res;
  } catch (e) {
    // Network-level failure
    return null as unknown as Response;
  }
}

function buildHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function parseJsonOrThrow(res: Response, fallbackMessage: string) {
  if (!res) throw new Error(fallbackMessage);
  if (!res.ok) {
    try {
      const body = await res.json();
      if (body && body.error) throw new Error(body.error);
    } catch {
      throw new Error(fallbackMessage);
    }
  }
  try {
    return await res.json();
  } catch (e) {
    throw new Error('Invalid server response');
  }
}

export async function requestOtp(email: string): Promise<string> {
  const body = JSON.stringify({ email });
  const primary = `${apiBase.replace(/\/$/, '')}/send-otp`;
  const fallback = '/.netlify/functions/send-otp';

  let res = await tryFetch(primary, { method: 'POST', headers: buildHeaders(), body });

  // Only try fallback on network error, not on HTTP error like 429
  if (!res) {
    res = await tryFetch(fallback, { method: 'POST', headers: buildHeaders(), body });
  }

  const data = await parseJsonOrThrow(res, 'Failed to send code');
  const typed = data as SendOtpResponse;
  if (!typed.ok) throw new Error(typed.error || 'Failed to send code');
  return typed.token;
}

export async function verifyOtp(email: string, code: string, token: string): Promise<string> {
  const body = JSON.stringify({ email, code, token });
  const primary = `${apiBase.replace(/\/$/, '')}/verify-otp`;
  const fallback = '/.netlify/functions/verify-otp';

  let res = await tryFetch(primary, { method: 'POST', headers: buildHeaders(), body });

  // Only try fallback on network error, not on HTTP error like 429
  if (!res) {
    res = await tryFetch(fallback, { method: 'POST', headers: buildHeaders(), body });
  }

  const data = await parseJsonOrThrow(res, 'Verification failed');
  const typed = data as VerifyOtpResponse;
  if (!typed.ok) throw new Error(typed.error || 'Verification failed');
  return typed.session;
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

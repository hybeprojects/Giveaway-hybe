export type SendOtpResponse = { ok: true; token: string } | { ok: false; error: string };
export type VerifyOtpResponse = { ok: true; session: string } | { ok: false; error: string };

export type UserEntry = {
  email: string;
  name: string;
  country: string;
  base: number;
  share: number;
  invite: number;
  total: number;
  created_at: string;
  is_winner?: boolean;
  prize_details?: string | null;
  shipping_address?: string | null;
};
export type LedgerEntry = { id: string; type: 'credit' | 'debit'; amount: number; currency: string; note: string; createdAt: string; status?: 'pending' | 'available' };
export type GetMeResponse = { ok: true; entry: UserEntry; ledger: LedgerEntry[] } | { ok: false; error: string };

const rawApiBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
export const apiBase: string = rawApiBase ? rawApiBase.replace(/\/$/, '') : '';

export async function tryFetch(url: string, opts: RequestInit) {
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

export async function requestOtp(email: string, purpose: 'login' | 'signup' = 'login'): Promise<string> {
  const body = JSON.stringify({ email, purpose });
  const primary = `${apiBase}/send-otp`;
  const fallback = '/send-otp';

  let res = await tryFetch(primary, { method: 'POST', headers: buildHeaders(), body });

  if (!res || !res.ok) {
    // attempt fallback to local functions path
    res = await tryFetch(fallback, { method: 'POST', headers: buildHeaders(), body });
  }

  const data = await parseJsonOrThrow(res, 'Failed to send code');
  const typed = data as SendOtpResponse;
  if (!typed.ok) throw new Error(typed.error || 'Failed to send code');
  return typed.token;
}

export async function verifyOtp(email: string, code: string, token: string): Promise<string> {
  const body = JSON.stringify({ email, code, token });
  const primary = `${apiBase}/verify-otp`;
  const fallback = '/verify-otp';

  let res = await tryFetch(primary, { method: 'POST', headers: buildHeaders(), body });

  if (!res || !res.ok) {
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
    const parts = t.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = JSON.parse(atob(b64));
    if (json && json.email) return { email: json.email };
  } catch {}
  return null;
}

export function clearLocalSession() { localStorage.removeItem('local_session'); }

export async function getMe(): Promise<GetMeResponse> {
  const sessionToken = localStorage.getItem('local_session') || '';
  if (!sessionToken) return { ok: false, error: 'Not logged in' };

  const headers = { 'Authorization': `Bearer ${sessionToken}` };
  const primary = `${apiBase}/me`;
  const fallback = '/me';

  let res = await tryFetch(primary, { method: 'GET', headers });
  if (!res) {
    res = await tryFetch(fallback, { method: 'GET', headers });
  }

  const data = await parseJsonOrThrow(res, 'Failed to load user data');
  return data as GetMeResponse;
}

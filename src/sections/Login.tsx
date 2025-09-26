import { useEffect, useState } from 'react';
import { getSession, sendEmailOtp, verifyEmailOtp, isSupabaseConfigured } from '../utils/supabaseClient';
import { requestOtp, verifyOtp as verifyOtpFn, saveLocalSession } from '../utils/auth';

function validateEmail(v: string) { return /.+@.+\..+/.test(v); }

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { (async () => { const s = await getSession(); if (s) window.location.href = '/dashboard'; })(); }, []);

  const send = async () => {
    setError(null);
    if (!validateEmail(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await sendEmailOtp(email);
        (window as any).__otpToken = undefined;
      } else {
        const token = await requestOtp(email);
        (window as any).__otpToken = token;
      }
      setSent(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const verify = async () => {
    setError(null);
    if (code.trim().length !== 6 || !/^\d{6}$/.test(code)) { setError('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await verifyEmailOtp(email, code.trim());
      } else {
        const token = (window as any).__otpToken as string | undefined;
        if (!token) throw new Error('Missing verification token. Resend code.');
        const session = await verifyOtpFn(email, code.trim(), token);
        saveLocalSession(session);
      }
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  return (
    <section className="section" aria-label="Login">
      <div className="container">
        <h2 className="section-title">Sign in to your Giveaway</h2>
        <div className="card" style={{ padding: 16, marginTop: 12 }}>
          {!sent ? (
            <div>
              <label className="label">Email</label>
              <input className="input" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <div className="button-row" style={{ marginTop: 14 }}>
                <button className="button-primary" onClick={send} disabled={loading}>{loading ? 'Sending…' : 'Send 6‑digit code'}</button>
              </div>
              <p className="subtle" style={{ marginTop: 8 }}>One-time code expires in 10 minutes.</p>
            </div>
          ) : (
            <div>
              <label className="label">Enter 6‑digit code</label>
              <input className="input" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} />
              <div className="button-row" style={{ marginTop: 14 }}>
                <button className="button-primary" onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify & Continue'}</button>
                <button className="button-secondary" onClick={() => setSent(false)} disabled={loading}>Change email</button>
              </div>
            </div>
          )}
          {error && <p className="subtle" style={{ color: 'var(--danger)', marginTop: 10 }}>{error}</p>}
        </div>
      </div>
    </section>
  );
}

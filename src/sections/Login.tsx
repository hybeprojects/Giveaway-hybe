import { useEffect, useState } from 'react';
import { getSession, sendEmailOtp, verifyEmailOtp, isSupabaseConfigured } from '../utils/supabaseClient';
import { requestOtp, verifyOtp as verifyOtpFn, saveLocalSession } from '../utils/auth';
import { useToast } from '../components/Toast';

function validateEmail(v: string) { return /.+@.+\..+/.test(v); }

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { (async () => { const s = await getSession(); if (s) window.location.href = '/dashboard'; })(); }, []);

  const send = async () => {
    if (!validateEmail(email)) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      const useCustom = Boolean((import.meta as any).env?.VITE_API_BASE);
      if (useCustom) {
        const token = await requestOtp(email);
        (window as any).__otpToken = token;
      } else if (isSupabaseConfigured()) {
        await sendEmailOtp(email);
        (window as any).__otpToken = undefined;
      } else {
        const token = await requestOtp(email);
        (window as any).__otpToken = token;
      }
      setSent(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const verify = async () => {
    if (code.trim().length !== 6 || !/^\d{6}$/.test(code)) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const useCustom = Boolean((import.meta as any).env?.VITE_API_BASE);
      if (useCustom || !isSupabaseConfigured()) {
        const token = (window as any).__otpToken as string | undefined;
        if (!token) throw new Error('Missing verification token. Resend code.');
        const session = await verifyOtpFn(email, code.trim(), token);
        saveLocalSession(session);
      } else {
        await verifyEmailOtp(email, code.trim());
      }
      window.location.href = '/dashboard';
    } catch (e: any) {
      toast.error(e.message || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  return (
    <section className="section" aria-label="Login">
      <div className="container">
        <h2 className="section-title">Sign in to your Giveaway</h2>
        <div className="card card-pad mt-12">
          {!sent ? (
            <div>
              <label className="label">Email</label>
              <input className="input" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              <div className="button-row mt-14">
                <button className="button-primary" onClick={send} disabled={loading}>{loading ? 'Sending…' : 'Send 6‑digit code'}</button>
              </div>
              <p className="subtle mt-8">One-time code expires in 10 minutes.</p>
            </div>
          ) : (
            <div>
              <label className="label">Enter 6‑digit code</label>
              <input className="input" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} />
              <div className="button-row mt-14">
                <button className="button-primary" onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify & Continue'}</button>
                <button className="button-secondary" onClick={() => setSent(false)} disabled={loading}>Change email</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

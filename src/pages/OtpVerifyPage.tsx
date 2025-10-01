import React, { useEffect, useState } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { requestOtp, verifyOtp } from '../utils/auth';

export default function OtpVerifyPage() {
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const e = url.searchParams.get('email');
    if (e) setEmail(e);
  }, []);

  const send = async () => {
    setError(null); setMessage(null);
    if (!/.+@.+\..+/.test(email)) { setError('Enter a valid email'); return; }
    setLoading(true);
    try {
      await requestOtp(email, 'signup');
      setSent(true);
      setMessage('Code sent. Check your inbox.');
    } catch (e: any) {
      setError(e?.message || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const confirm = async () => {
    setError(null); setMessage(null);
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6‑digit code'); return; }
    setLoading(true);
    try {
      await verifyOtp(email, code, 'signup');
      const res = await fetch('/.netlify/functions/send-magic-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to send magic link');
      setMessage('Verified! A magic link has been sent. Open it to create your password.');
    } catch (e: any) {
      setError(e?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5" style={{ maxWidth: 560 }}>
        <h1 className="mb-3">Verify your email</h1>
        {!sent ? (
          <div className="card card-pad">
            <label className="label" htmlFor="v-email">Email</label>
            <input id="v-email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
            <div className="button-row mt-12">
              <button className="button-primary" onClick={send} disabled={loading}>{loading ? 'Sending…' : 'Send code'}</button>
            </div>
          </div>
        ) : (
          <div className="card card-pad">
            <p>Enter the 6‑digit code sent to <strong>{email}</strong>.</p>
            <input className="input" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} maxLength={6} inputMode="numeric" placeholder="000000" />
            <div className="button-row mt-12">
              <button className="button-primary" onClick={confirm} disabled={loading}>{loading ? 'Verifying…' : 'Verify'}</button>
              <button className="button-secondary" onClick={() => setSent(false)} disabled={loading}>Change email</button>
            </div>
          </div>
        )}
        {error && <div className="alert alert-danger mt-4" role="alert">{error}</div>}
        {message && <div className="alert alert-success mt-4" role="status">{message}</div>}
      </div>
      <Footer />
    </>
  );
}

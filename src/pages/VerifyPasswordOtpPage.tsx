import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { requestOtp, verifyOtp as verifyOtpFn, saveLocalSession } from '../utils/auth';

function getJwtPayload(t: string | null): any | null {
  if (!t) return null;
  try {
    const p = t.split('.')[1];
    const b = p.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(p.length/4)*4, '=');
    return JSON.parse(atob(b));
  } catch { return null; }
}

export default function VerifyPasswordOtpPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const e = url.searchParams.get('email');
    if (e) setEmail(e);
    else {
      const payload = getJwtPayload(localStorage.getItem('local_session'));
      if (payload?.email) setEmail(payload.email);
    }
  }, []);

  useEffect(() => {
    if (!email) return;
    const send = async () => {
      setLoading(true); setError(null);
      try {
        await requestOtp(email, 'login');
        setSent(true);
        setResendIn(60);
      } catch (e: any) {
        setError(e?.message || 'Failed to send code');
      } finally { setLoading(false); }
    };
    send();
  }, [email]);

  useEffect(() => {
    if (!sent || resendIn <= 0) return;
    const id = setInterval(() => setResendIn(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [sent, resendIn]);

  const verify = async () => {
    setLoading(true); setError(null);
    try {
      const token = await verifyOtpFn(email, code.trim(), 'login');
      saveLocalSession(token);
      const payload = getJwtPayload(token);
      const userId = payload?.sub || 'me';
      window.location.assign(`/dashboard/${encodeURIComponent(userId)}`);
    } catch (e: any) {
      setError(e?.message || 'Incorrect or expired code');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setLoading(true); setError(null);
    try {
      await requestOtp(email, 'login');
      setResendIn(60);
    } catch (e: any) {
      setError(e?.message || 'Failed to resend');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5" style={{ maxWidth: 560 }}>
        <h1 className="mb-3">Verify to finish signup</h1>
        <div className="card card-pad">
          <p>We sent a 6‑digit code to <strong>{email}</strong>. Enter it to finish setting up your account.</p>
          <input className="input" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" />
          <div className="button-row mt-12">
            <button className="button-primary" onClick={verify} disabled={loading || code.length !== 6}>{loading ? 'Verifying…' : 'Verify'}</button>
            <button className="button-secondary" onClick={resend} disabled={loading || resendIn > 0}>{resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}</button>
          </div>
          {error && <div className="alert alert-danger mt-4" role="alert">{error}</div>}
        </div>
      </div>
      <Footer />
    </>
  );
}

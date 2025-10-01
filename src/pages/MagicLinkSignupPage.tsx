import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';
import { supabase } from '../utils/supabase';
import { saveLocalSession } from '../utils/auth';

function parseHash(): Record<string, string> {
  const h = window.location.hash.replace(/^#/, '');
  return h.split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    if (k) acc[decodeURIComponent(k)] = decodeURIComponent(v || '');
    return acc;
  }, {} as Record<string, string>);
}

export default function MagicLinkSignupPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const hash = parseHash();
        const access_token = hash['access_token'];
        const refresh_token = hash['refresh_token'];
        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
          saveLocalSession(access_token);
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) setEmail(user.email);
      } catch (e: any) {
        setError(e?.message || 'Failed to initialize session');
      } finally { setLoading(false); }
    };
    run();
  }, []);

  const valid = useMemo(() => {
    if (password.length < 8) return false;
    if (password !== confirm) return false;
    return true;
  }, [password, confirm]);

  const submit = async () => {
    setError(null); setMessage(null);
    if (!valid) { setError('Check your password fields.'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('local_session') || '';
      const res = await fetch('/.netlify/functions/set-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to set password');
      setMessage('Password set. Redirecting…');
      setTimeout(() => { window.location.assign('/dashboard'); }, 800);
    } catch (e: any) {
      setError(e?.message || 'Failed to set password');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5" style={{ maxWidth: 560 }}>
        <h1 className="mb-3">Create your password</h1>
        <div className="card card-pad">
          <label className="label" htmlFor="su-email">Email</label>
          <input id="su-email" className="input" value={email} readOnly />
          <label className="label mt-6" htmlFor="su-pw">Password</label>
          <input id="su-pw" className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" />
          <label className="label mt-6" htmlFor="su-pw2">Confirm Password</label>
          <input id="su-pw2" className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <div className="button-row mt-12">
            <button className="button-primary" onClick={submit} disabled={loading || !valid}>{loading ? 'Saving…' : 'Create account'}</button>
          </div>
        </div>
        {error && <div className="alert alert-danger mt-4" role="alert">{error}</div>}
        {message && <div className="alert alert-success mt-4" role="status">{message}</div>}
      </div>
      <Footer />
    </>
  );
}

import React from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';

import { useEffect, useState } from 'react';
import { sendMagicLink } from '../utils/auth';

export default function EntrySuccessPage() {
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const email = (localStorage.getItem('local_session') && (() => {
      try {
        const t = localStorage.getItem('local_session')!;
        const p = t.split('.')[1];
        const b = p.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(p.length/4)*4, '=');
        const j = JSON.parse(atob(b));
        return j?.email || '';
      } catch { return ''; }
    })()) as unknown as string;

    if (!email) return;
    setStatus('sending');
    sendMagicLink(email, '/MagicLinkSignupPage')
      .then(() => setStatus('sent'))
      .catch((e: any) => { setErr(e?.message || 'Failed to send magic link'); setStatus('error'); });
  }, []);

  return (
    <>
      <Navbar />
      <div className="entry-form-page container mt-5 text-center">
        <div className="alert alert-success" role="alert" aria-live="polite">
          <h1 className="mb-3">You’re in! 🎉</h1>
          <p className="mb-3">Congratulations on joining the HYBE Mega Giveaway.</p>
          <p className="mb-3">Your information has been securely sent to HYBE's giveaway system. Your entry is being processed.</p>
          <p className="mb-4">We just sent a secure link to your email. Open it to set your password.</p>
          {status === 'sending' && <p className="subtle">Sending magic link…</p>}
          {status === 'sent' && <p className="subtle">Magic link sent. Check your inbox.</p>}
          {status === 'error' && <p className="text-danger">{err}</p>}
          <a className="button-primary mt-3" href="https://hybecorp.com" rel="noopener">Go to HYBE Home</a>
        </div>
      </div>
      <Footer />
    </>
  );
}

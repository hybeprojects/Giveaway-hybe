import { useEffect, useMemo, useRef, useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import { getNumber, setNumber, getString, setString } from '../utils/storage';
import { useToast } from '../components/Toast';

function validateEmail(v: string) { return /.+@.+\..+/.test(v); }

function burstConfetti() {
  const count = 60;
  const root = document.body;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = `hsl(${Math.floor(Math.random()*360)},80%,60%)`;
    el.style.setProperty('--tx', (Math.random()*2-1).toFixed(2));
    el.style.setProperty('--dur', (0.8 + Math.random()*0.8).toFixed(2) + 's');
    root.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

export default function Entry() {
  const [name, setName] = useState(getString('name'));
  const [email, setEmail] = useState(getString('email'));
  const [country, setCountry] = useState(getString('country'));
  const [base, setBase] = useState(getNumber('base', 0));
  const [share, setShare] = useState(getNumber('share', 0));
  const [invite, setInvite] = useState(getNumber('invite', 0));
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const lastMilestone = useRef<number>(0);
  const total = useMemo(() => base + share + invite, [base, share, invite]);

  useEffect(() => { setString('name', name); }, [name]);
  useEffect(() => { setString('email', email); }, [email]);
  useEffect(() => { setString('country', country); }, [country]);
  useEffect(() => { setNumber('base', base); }, [base]);
  useEffect(() => { setNumber('share', share); }, [share]);
  useEffect(() => { setNumber('invite', invite); }, [invite]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      const supa = await import('../utils/supabaseClient');
      const useCustom = Boolean((import.meta as any).env?.VITE_API_BASE);
      if (useCustom || !supa.isSupabaseConfigured()) {
        const auth = await import('../utils/auth');
        const token = await auth.requestOtp(email);
        (window as any).__otpToken = token;
      } else {
        await supa.sendEmailOtp(email);
        (window as any).__otpToken = undefined;
      }
      setSent(true);
      toast.info('We sent a 6‑digit code to your email.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not send code.');
    } finally { setLoading(false); }
  };

  const shareNow = async () => {
    const url = window.location.href;
    const text = 'I just entered the HYBE Ultimate Mega Giveaway!';
    try {
      if (navigator.share) await navigator.share({ title: 'HYBE Giveaway', text, url });
      else await navigator.clipboard.writeText(url);
      setShare((v) => v + 3);
      toast.success('Shared! +3 entries');
    } catch {}
  };

  const inviteFriend = async () => {
    const friend = prompt('Enter your friend\'s email to send an invite:');
    if (friend && validateEmail(friend)) {
      setInvite(v => v + 5);
      toast.success('Invite sent! +5 entries');
    }
  };

  const googleLogin = () => alert('Google sign-in can be connected.');
  const weverseLogin = () => alert('Weverse sign-in can be connected.');

  useEffect(() => {
    const milestones = [5, 10, 20];
    for (const m of milestones) {
      if (lastMilestone.current < m && total >= m) {
        burstConfetti();
        lastMilestone.current = m;
      }
    }
  }, [total]);

  return (
    <section id="enter" className="section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Enter the Giveaway</h2>
        <p className="subtle">Complete the form and boost your odds with shares and invites.</p>
        <form className="card card-pad mt-12" onSubmit={submit}>
          {!sent ? (
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
              <div className="button-row mt-14">
                <button className="button-primary" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send 6‑digit code'}</button>
                <a className="button-secondary" href="/login">Login / Dashboard</a>
              </div>
              <p className="subtle mt-8">We’ll send a one-time 6‑digit code (expires in 10 minutes).</p>
            </div>
          ) : (
            <div>
              <div className="form-row">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="">Select country</option>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>South Korea</option>
                    <option>Japan</option>
                    <option>Germany</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>
              <div className="mt-12">
                <label className="label">Enter 6‑digit code</label>
                <input className="input" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="000000" />
              </div>
              <div className="button-row mt-14">
                <button type="button" className="button-primary" onClick={async () => {
                  if (!name.trim()) { toast.error('Name is required'); return; }
                  if (!country) { toast.error('Select a country'); return; }
                  if (code.length !== 6) { toast.error('Enter the 6‑digit code'); return; }
                  setLoading(true);
                  try {
                    const supa = await import('../utils/supabaseClient');
                    if (supa.isSupabaseConfigured() && !(import.meta as any).env?.VITE_API_BASE) {
                      await supa.verifyEmailOtp(email, code);
                      const client = supa.getSupabase();
                      if (client) {
                        await client.from('entries').upsert({ email, name, country, base, share, invite, total: 1 + share + invite }, { onConflict: 'email' });
                        await client.from('events').insert({ type: 'entry_verified', text: `${name || email} entered`, meta: { email } });
                      }
                    } else {
                      const auth = await import('../utils/auth');
                      const token = (window as any).__otpToken as string | undefined;
                      if (!token) throw new Error('Missing verification token. Resend code.');
                      const session = await auth.verifyOtp(email, code, token);
                      auth.saveLocalSession(session);
                      try {
                        const { apiBase } = await import('../utils/auth');
                        const session = localStorage.getItem('local_session') || '';
                        await fetch(`${apiBase}/post-entry`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session}` }, body: JSON.stringify({ email, name, country, base: 1, share, invite }) });
                        await fetch(`${apiBase}/post-event`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session}` }, body: JSON.stringify({ type: 'entry_verified', text: `${name || email} entered`, meta: { email } }) });
                      } catch {}
                    }
                    setBase(1);
                    try { const { apiBase } = await import('../utils/auth'); const session = localStorage.getItem('local_session') || ''; await fetch(`${apiBase}/activity-email`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session}` }, body: JSON.stringify({ email, type: 'entry_verified', detail: 'Your entry is confirmed. Good luck!' }) }); } catch {}
                    toast.success('Verified and entered. Welcome!');
                  } catch (e: any) {
                    toast.error(e?.message || 'Invalid or expired code');
                  } finally { setLoading(false); }
                }}>Verify & Submit Entry</button>
                <button type="button" className="button-secondary" onClick={() => { setSent(false); }}>Change email</button>
              </div>
            </div>
          )}

          <div className="card card-pad mt-14">
            <strong>Gamified Extra Entries</strong>
            <p className="subtle">Share on social = +3 entries • Invite a friend = +5 entries</p>
            <div className="button-row">
              <button type="button" className="button-secondary" onClick={shareNow}>Share Now</button>
              <button type="button" className="button-secondary" onClick={inviteFriend}>Invite a Friend</button>
            </div>
            <div className="mt-10">
              <ProgressBar value={total} max={20} />
              <div className="subtle mt-6">{total} entries earned</div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

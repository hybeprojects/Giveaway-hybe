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

const COOLDOWN_SECONDS = 60;
const LS_KEY_OTP_UNTIL = 'otp_cooldown_until';

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
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_KEY_OTP_UNTIL) || '0', 10);
    return Number.isFinite(v) ? v : 0;
  });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const toast = useToast();
  const lastMilestone = useRef<number>(0);
  const total = useMemo(() => base + share + invite, [base, share, invite]);

  useEffect(() => { setString('name', name); }, [name]);
  useEffect(() => { setString('email', email); }, [email]);
  useEffect(() => { setString('country', country); }, [country]);
  useEffect(() => { setNumber('base', base); }, [base]);
  useEffect(() => { setNumber('share', share); }, [share]);
  useEffect(() => { setNumber('invite', invite); }, [invite]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const armCooldown = () => {
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    setCooldownUntil(until);
    localStorage.setItem(LS_KEY_OTP_UNTIL, String(until));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) { toast.error('Enter a valid email'); return; }
    if (secondsLeft > 0) { toast.info(`Please wait ${secondsLeft}s before requesting a new code.`); return; }
    setLoading(true);
    try {
      const auth = await import('../utils/auth');
      await auth.requestOtp(email, 'signup');
      armCooldown();
      setSent(true);
      toast.info('We sent a 6‑digit code to your email.');
    } catch (err: any) {
      const msg = String(err?.message || 'Could not send code.');
      if (/too many|rate limit|429/i.test(msg)) {
        armCooldown();
        toast.error(`Too many requests. Please wait ${COOLDOWN_SECONDS}s and try again.`);
      } else {
        toast.error(msg);
      }
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (secondsLeft > 0) { toast.info(`Please wait ${secondsLeft}s before resending.`); return; }
    if (!validateEmail(email)) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      const auth = await import('../utils/auth');
      await auth.requestOtp(email, 'signup');
      armCooldown();
      toast.success('Code resent. Check your email.');
    } catch (err: any) {
      const msg = String(err?.message || 'Could not resend code.');
      if (/too many|rate limit|429/i.test(msg)) {
        armCooldown();
        toast.error(`Too many requests. Please wait ${COOLDOWN_SECONDS}s and try again.`);
      } else {
        toast.error(msg);
      }
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
    <section id="enter" className="section entry-section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Join the Ultimate Giveaway</h2>
        <p className="section-subtitle">Complete the form to enter and boost your chances by sharing with friends.</p>
        <form className="entry-form" onSubmit={submit}>
          {!sent ? (
            <div className="form-step">
              <label className="label">Enter Your Email Address</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
              <div className="button-row">
                <button className="button-primary" type="submit" disabled={loading || secondsLeft > 0}>{loading ? 'Sending Code...' : (secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Send Verification Code')}</button>
                <a className="button-secondary" href="/login">Login to Dashboard</a>
              </div>
              <p className="form-note">A 6-digit code will be sent to your email for verification.</p>
            </div>
          ) : (
            <div className="form-step">
              <div className="form-row">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" />
                </div>
                <div>
                  <label className="label">Country of Residence</label>
                  <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="">Select your country</option>
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
              <div className="form-group">
                <label className="label">Verification Code</label>
                <input className="input" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="123456" />
              </div>
              <div className="button-row">
                <button type="button" className="button-primary" onClick={async () => {
                  if (!name.trim()) { toast.error('Name is required'); return; }
                  if (!country) { toast.error('Select a country'); return; }
                  if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
                  setLoading(true);
                  try {
                    const auth = await import('../utils/auth');
                    const session = await auth.verifyOtp(email, code, 'signup');
                    auth.saveLocalSession(session);
                    try {
                      const sessionToken = localStorage.getItem('local_session') || '';
                      await fetch(`/.netlify/functions/post-entry`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ email, name, country, base: 1, share, invite }) });
                      await fetch(`/.netlify/functions/post-event`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` }, body: JSON.stringify({ type: 'entry_verified', text: `${name || email} entered`, meta: { email } }) });
                    } catch (e) { console.warn('Failed to post entry/event', e); }
                    setBase(1);
                    toast.success('Verified and entered. Welcome!');
                  } catch (e: any) {
                    toast.error(e?.message || 'Invalid or expired code');
                  } finally { setLoading(false); }
                }}>Verify & Submit</button>
                <button type="button" className="button-secondary" onClick={resend} disabled={loading || secondsLeft > 0}>{secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend Code'}</button>
                <button type="button" className="button-secondary" onClick={() => { setSent(false); }}>Change Email</button>
              </div>
            </div>
          )}

          <div className="gamify-box mt-14">
            <h3>Boost Your Entries</h3>
            <p className="subtle">Share on social media for +3 entries, and invite a friend for +5 entries.</p>
            <div className="button-row">
              <button type="button" className="button-secondary" onClick={shareNow}>Share on Social</button>
              <button type="button" className="button-secondary" onClick={inviteFriend}>Invite a Friend</button>
            </div>
            <div className="mt-10">
              <ProgressBar value={total} max={20} />
              <div className="subtle mt-6">Total Entries: {total}</div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

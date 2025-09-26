import { useEffect, useMemo, useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import { getNumber, setNumber, getString, setString } from '../utils/storage';

function validateEmail(v: string) { return /.+@.+\..+/.test(v); }

export default function Entry() {
  const [name, setName] = useState(getString('name'));
  const [email, setEmail] = useState(getString('email'));
  const [country, setCountry] = useState(getString('country'));
  const [base, setBase] = useState(getNumber('base', 0));
  const [share, setShare] = useState(getNumber('share', 0));
  const [invite, setInvite] = useState(getNumber('invite', 0));
  const total = useMemo(() => base + share + invite, [base, share, invite]);

  useEffect(() => { setString('name', name); }, [name]);
  useEffect(() => { setString('email', email); }, [email]);
  useEffect(() => { setString('country', country); }, [country]);
  useEffect(() => { setNumber('base', base); }, [base]);
  useEffect(() => { setNumber('share', share); }, [share]);
  useEffect(() => { setNumber('invite', invite); }, [invite]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');
    if (!validateEmail(email)) return alert('Enter a valid email');
    if (!country) return alert('Select a country');
    setBase(1);
    alert('Entry submitted. Boost your odds with shares and invites!');
  };

  const shareNow = async () => {
    const url = window.location.href;
    const text = 'I just entered the HYBE Ultimate Mega Giveaway!';
    try {
      if (navigator.share) await navigator.share({ title: 'HYBE Giveaway', text, url });
      else await navigator.clipboard.writeText(url);
      setShare((v) => v + 3);
    } catch {}
  };

  const inviteFriend = async () => {
    const friend = prompt('Enter your friend\'s email to send an invite:');
    if (friend && validateEmail(friend)) {
      setInvite(v => v + 5);
      alert('Invite sent. +5 entries!');
    }
  };

  const googleLogin = () => alert('Google sign-in can be connected.');
  const weverseLogin = () => alert('Weverse sign-in can be connected.');

  return (
    <section id="enter" className="section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Enter the Giveaway</h2>
        <p className="subtle">Complete the form and boost your odds with shares and invites.</p>
        <form className="card" style={{ padding: 16, marginTop: 12 }} onSubmit={submit}>
          <div className="form-row">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
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

          <div className="button-row" style={{ marginTop: 14 }}>
            <button className="button-primary" type="submit">Submit Entry</button>
            <button type="button" className="button-secondary" onClick={googleLogin}>Continue with Google</button>
            <button type="button" className="button-secondary" onClick={weverseLogin}>Continue with Weverse ID</button>
          </div>

          <div className="card" style={{ padding: 16, marginTop: 14 }}>
            <strong>Gamified Extra Entries</strong>
            <p className="subtle">Share on social = +3 entries • Invite a friend = +5 entries</p>
            <div className="button-row">
              <button type="button" className="button-secondary" onClick={shareNow}>Share Now</button>
              <button type="button" className="button-secondary" onClick={inviteFriend}>Invite a Friend</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <ProgressBar value={total} max={20} />
              <div className="subtle" style={{ marginTop: 6 }}>{total} entries earned</div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

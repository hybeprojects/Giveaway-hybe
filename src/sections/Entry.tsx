import { useEffect, useMemo, useRef, useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import { useToast } from '../components/Toast';
import * as auth from '../utils/auth';

function validateEmail(v: string) { return /.+@.+\..+/.test(v); }
function isStrongPassword(pw: string) {
  if (!pw || pw.length < 8) return false;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^\w\s]/.test(pw);
  return hasLower && hasUpper && (hasNum || hasSym);
}
function passwordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^\w\s]/.test(pw)) s++;
  return Math.min(5, s);
}

const COOLDOWN_SECONDS = 60;
const LS_KEY_OTP_UNTIL = 'otp_cooldown_until';

function burstConfetti() {
  const count = 80;
  const root = document.body;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = `hsl(${Math.floor(Math.random()*360)},80%,60%)`;
    el.style.setProperty('--tx', (Math.random()*2-1).toFixed(2));
    el.style.setProperty('--dur', (0.8 + Math.random()*0.8).toFixed(2) + 's');
    root.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}

export default function Entry() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Eligibility
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [country, setCountry] = useState('');
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Step 2: Fan Info
  const [favoriteArtist, setFavoriteArtist] = useState('');
  const [biasMember, setBiasMember] = useState('');
  const [fanSinceYear, setFanSinceYear] = useState('');
  const [favoriteSongAlbum, setFavoriteSongAlbum] = useState('');

  // Step 3: Engagement
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [fanMessage, setFanMessage] = useState('');
  const [fanArtUrl, setFanArtUrl] = useState('');
  const [triviaAnswer, setTriviaAnswer] = useState('');

  // Step 4: Bonus
  const [referralCode, setReferralCode] = useState('');
  const [preferredPrize, setPreferredPrize] = useState('');

  // OTP Modal
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = Array.from({ length: 6 }, () => useRef<HTMLInputElement | null>(null));
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_KEY_OTP_UNTIL) || '0', 10);
    return Number.isFinite(v) ? v : 0;
  });
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      setSecondsLeft(left);
      if (left <= 0) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [cooldownUntil]);
  const armCooldown = () => {
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    setCooldownUntil(until);
    localStorage.setItem(LS_KEY_OTP_UNTIL, String(until));
  };

  // Password Modal
  const [pwOpen, setPwOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [pwShow, setPwShow] = useState(false);

  const stepValid = useMemo(() => {
    if (step === 1) {
      return fullName.trim() && validateEmail(email) && country && consentTerms && consentPrivacy;
    }
    if (step === 2) {
      return favoriteArtist.trim() && fanSinceYear.trim();
    }
    if (step === 3) {
      return true; // optional fields
    }
    if (step === 4) {
      return true; // all optional here too
    }
    return false;
  }, [step, fullName, email, country, consentTerms, consentPrivacy, favoriteArtist, fanSinceYear]);

  const goNext = async () => {
    if (!stepValid) return;
    if (step < totalSteps) {
      setStep(s => s + 1);
      return;
    }
    // Final submit → trigger OTP
    if (!validateEmail(email)) { toast.error('Enter a valid email'); return; }
    try {
      await auth.requestOtp(email, 'signup');
      armCooldown();
      setOtp(['','','','','','']);
      setOtpOpen(true);
      setTimeout(() => otpRefs[0].current?.focus(), 50);
      toast.info('We sent a 6‑digit code to your email.');
    } catch (e: any) {
      const msg = String(e?.message || 'Could not send code.');
      if (/too many|rate limit|429/i.test(msg)) { armCooldown(); }
      toast.error(msg);
    }
  };

  const handleOtpInput = (i: number, v: string) => {
    const d = v.replace(/[^0-9]/g, '').slice(-1);
    setOtp(prev => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) otpRefs[i+1].current?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length) {
      e.preventDefault();
      setOtp(text.split('').concat(Array(6 - text.length).fill('')));
      const idx = Math.min(5, text.length);
      otpRefs[idx]?.current?.focus();
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    try {
      const token = await auth.verifyOtp(email, code, 'signup');
      auth.saveLocalSession(token);
      setOtpOpen(false);
      setPwOpen(true);
      toast.success('Email verified');
    } catch (e: any) {
      toast.error(e?.message || 'Invalid or expired code');
    }
  };

  const resendOtp = async () => {
    if (secondsLeft > 0) { toast.info(`Please wait ${secondsLeft}s`); return; }
    try {
      await auth.requestOtp(email, 'signup');
      armCooldown();
      toast.success('Code resent');
    } catch (e: any) {
      const msg = String(e?.message || 'Could not resend code.');
      if (/too many|rate limit|429/i.test(msg)) armCooldown();
      toast.error(msg);
    }
  };

  const setUserPassword = async () => {
    if (!isStrongPassword(password)) { toast.error('Use a stronger password'); return; }
    try {
      await auth.setPassword(password);
      // Submit entry payload
      const sessionToken = localStorage.getItem('local_session') || '';
      const res = await fetch('/.netlify/functions/post-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({
          email,
          full_name: fullName,
          phone,
          birthdate: birthdate || null,
          country,
          consent_terms: consentTerms,
          consent_privacy: consentPrivacy,
          marketing_opt_in: marketingOptIn,
          favorite_artist: favoriteArtist,
          bias_member: biasMember,
          fan_since_year: fanSinceYear ? Number(fanSinceYear) : null,
          favorite_song_album: favoriteSongAlbum,
          twitter_handle: twitter,
          instagram_handle: instagram,
          tiktok_handle: tiktok,
          fan_message: fanMessage,
          fan_art_url: fanArtUrl,
          trivia_answer: triviaAnswer,
          referral_code: referralCode,
          preferred_prize: preferredPrize,
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Submission failed');
      setPwOpen(false);
      burstConfetti();
      toast.success('You\'re in!');
      setTimeout(() => { window.location.href = '/dashboard'; }, 800);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to finish sign-up');
    }
  };

  const pct = Math.round((step / totalSteps) * 100);
  const pwStrength = passwordStrength(password);

  return (
    <section id="enter" className="section entry-section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Join the Ultimate Giveaway</h2>
        <p className="section-subtitle">Complete the form to enter and boost your chances by sharing with friends.</p>

        <div className="card card-pad mb-12">
          <div className="row-between mb-8">
            <div className="subtle">Step {step} of {totalSteps}</div>
            <div style={{ width: '40%' }}><ProgressBar value={pct} max={100} /></div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="form-step">
              <div className="form-row">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
                </div>
                <div>
                  <label className="label">Birthdate</label>
                  <input className="input" type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label">Country/Region</label>
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
                <div />
              </div>
              <div className="form-group mt-6">
                <label className="checkbox">
                  <input type="checkbox" checked={consentTerms} onChange={e => setConsentTerms(e.target.checked)} />
                  <span>I agree to the Official Rules</span>
                </label>
                <label className="checkbox mt-4">
                  <input type="checkbox" checked={consentPrivacy} onChange={e => setConsentPrivacy(e.target.checked)} />
                  <span>I agree to the Privacy Policy</span>
                </label>
                <label className="checkbox mt-4">
                  <input type="checkbox" checked={marketingOptIn} onChange={e => setMarketingOptIn(e.target.checked)} />
                  <span>Send me updates and promotions (optional)</span>
                </label>
              </div>
              <div className="button-row mt-10">
                <button className="button-primary" type="button" onClick={goNext} disabled={!stepValid}>Next</button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="form-step">
              <div className="form-row">
                <div>
                  <label className="label">Favorite HYBE Artist/Group</label>
                  <input className="input" value={favoriteArtist} onChange={e => setFavoriteArtist(e.target.value)} placeholder="e.g., BTS, NewJeans" />
                </div>
                <div>
                  <label className="label">Bias Member</label>
                  <input className="input" value={biasMember} onChange={e => setBiasMember(e.target.value)} placeholder="Member name" />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label">Fan Since (Year)</label>
                  <input className="input" inputMode="numeric" value={fanSinceYear} onChange={e => setFanSinceYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2016" />
                </div>
                <div>
                  <label className="label">Favorite Song/Album</label>
                  <input className="input" value={favoriteSongAlbum} onChange={e => setFavoriteSongAlbum(e.target.value)} placeholder="Song or album" />
                </div>
              </div>
              <div className="button-row mt-10">
                <button className="button-secondary" type="button" onClick={() => setStep(1)}>Back</button>
                <button className="button-primary" type="button" onClick={goNext} disabled={!stepValid}>Next</button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="form-step">
              <div className="form-row">
                <div>
                  <label className="label">X (Twitter) Handle</label>
                  <input className="input" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" />
                </div>
                <div>
                  <label className="label">Instagram Handle</label>
                  <input className="input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label">TikTok Handle</label>
                  <input className="input" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" />
                </div>
                <div>
                  <label className="label">Fan Message</label>
                  <input className="input" value={fanMessage} onChange={e => setFanMessage(e.target.value)} placeholder="Share a short message" />
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label">Fan Art URL (optional)</label>
                  <input className="input" value={fanArtUrl} onChange={e => setFanArtUrl(e.target.value)} placeholder="https://example.com/my-art.jpg" />
                </div>
                <div>
                  <label className="label">Trivia (optional)</label>
                  <input className="input" value={triviaAnswer} onChange={e => setTriviaAnswer(e.target.value)} placeholder="Answer a fun trivia" />
                </div>
              </div>
              <div className="button-row mt-10">
                <button className="button-secondary" type="button" onClick={() => setStep(2)}>Back</button>
                <button className="button-primary" type="button" onClick={goNext}>Next</button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="form-step">
              <div className="form-row">
                <div>
                  <label className="label">Referral Code (optional)</label>
                  <input className="input" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Your friend\'s code" />
                </div>
                <div>
                  <label className="label">Preferred Prize</label>
                  <select className="input" value={preferredPrize} onChange={e => setPreferredPrize(e.target.value)}>
                    <option value="">Select a prize</option>
                    <option value="tesla">Tesla</option>
                    <option value="crypto">$700k in Crypto</option>
                    <option value="vip">VIP HYBE Experience</option>
                  </select>
                </div>
              </div>
              <div className="button-row mt-10">
                <button className="button-secondary" type="button" onClick={() => setStep(3)}>Back</button>
                <button className="button-primary" type="button" onClick={goNext} disabled={!validateEmail(email) || !fullName || !country || !consentTerms || !consentPrivacy}>Enter Giveaway</button>
              </div>
              <p className="form-note">We\'ll send a 6-digit code to verify your email.</p>
            </div>
          )}
        </div>

        {/* OTP Modal */}
        {otpOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Email Verification">
            <div className="modal">
              <h3>Verify your email</h3>
              <p className="subtle">Enter the 6-digit code we sent to {email}</p>
              <div className="otp-grid">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => (otpRefs[i].current = el)}
                    className={`input otp ${d ? 'ok' : ''}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onPaste={handleOtpPaste}
                  />
                ))}
              </div>
              <div className="button-row mt-8">
                <button className="button-primary" onClick={verifyOtp}>Verify OTP</button>
                <button className="button-secondary" onClick={resendOtp} disabled={secondsLeft > 0}>{secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}</button>
                <button className="button-secondary" onClick={() => setOtpOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Password Modal */}
        {pwOpen && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Create Password">
            <div className="modal">
              <h3>Create your password</h3>
              <div className="form-group">
                <label className="label">Password</label>
                <div className="input-with-action">
                  <input className="input" type={pwShow ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password" />
                  <button className="button-secondary" onClick={() => setPwShow(v => !v)} type="button">{pwShow ? 'Hide' : 'Show'}</button>
                </div>
                <div className="mt-4">
                  <ProgressBar value={pwStrength * 20} max={100} />
                  <div className="subtle mt-4">Use 8+ chars with upper/lowercase and a number or symbol.</div>
                </div>
              </div>
              <div className="button-row mt-8">
                <button className="button-primary" onClick={setUserPassword} disabled={!isStrongPassword(password)}>Set Password</button>
                <button className="button-secondary" onClick={() => setPwOpen(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

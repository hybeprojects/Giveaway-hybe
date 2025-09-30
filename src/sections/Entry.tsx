import { useEffect, useMemo, useRef, useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import { useToast } from '../components/Toast';
import * as auth from '../utils/auth';

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
function validatePhone(v: string) {
  const digits = v.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15; // lenient E.164 style
}
function validateBirthdate(v: string) {
  if (!v) return true; // optional
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (d > now) return false;
  const age = now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return age >= 13;
}
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

  // Field errors
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [dobErr, setDobErr] = useState('');
  const [countryErr, setCountryErr] = useState('');

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
      const ok = fullName.trim().length > 1 && validateEmail(email) && (!phone || validatePhone(phone)) && validateBirthdate(birthdate) && country && consentTerms && consentPrivacy;
      return ok;
    }
    if (step === 2) {
      return favoriteArtist.trim() && fanSinceYear.trim();
    }
    if (step === 3) {
      return true;
    }
    if (step === 4) {
      return true;
    }
    return false;
  }, [step, fullName, email, phone, birthdate, country, consentTerms, consentPrivacy, favoriteArtist, fanSinceYear]);

  const goNext = async () => {
    if (!stepValid) {
      if (step === 1) {
        setNameErr(!fullName.trim() ? 'Please enter your full name' : '');
        setEmailErr(!validateEmail(email) ? 'Enter a valid email address' : '');
        setPhoneErr(phone && !validatePhone(phone) ? 'Enter a valid phone number' : '');
        setDobErr(!validateBirthdate(birthdate) ? 'Enter a valid date (13+)' : '');
        setCountryErr(!country ? 'Please select your country/region' : '');
      }
      return;
    }
    if (step < totalSteps) {
      setStep(s => s + 1);
      return;
    }
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
            <div className="form-step" role="group" aria-labelledby="eligibility-head">
              <h3 id="eligibility-head" className="visually-hidden">Eligibility</h3>
              <div className="form-row">
                <div>
                  <label className="label" htmlFor="full-name">Full Name</label>
                  <input id="full-name" className={`input${nameErr ? ' invalid' : ''}`} aria-invalid={!!nameErr} aria-describedby={nameErr ? 'name-error' : undefined} value={fullName} onChange={e => { setFullName(e.target.value); if (e.target.value.trim()) setNameErr(''); }} placeholder="Your full name" />
                  {nameErr && <div id="name-error" className="field-error">{nameErr}</div>}
                </div>
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input id="email" className={`input${emailErr ? ' invalid' : ''}`} aria-invalid={!!emailErr} aria-describedby={emailErr ? 'email-error' : undefined} value={email} onChange={e => { setEmail(e.target.value); if (validateEmail(e.target.value)) setEmailErr(''); }} placeholder="name@example.com" />
                  {emailErr && <div id="email-error" className="field-error">{emailErr}</div>}
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label" htmlFor="phone">Phone</label>
                  <input id="phone" className={`input${phoneErr ? ' invalid' : ''}`} aria-invalid={!!phoneErr} aria-describedby={phoneErr ? 'phone-error' : undefined} value={phone} onChange={e => { setPhone(e.target.value); if (!e.target.value || validatePhone(e.target.value)) setPhoneErr(''); }} placeholder="+1 555 123 4567" />
                  {phoneErr && <div id="phone-error" className="field-error">{phoneErr}</div>}
                </div>
                <div>
                  <label className="label" htmlFor="dob">Birthdate</label>
                  <input id="dob" className={`input${dobErr ? ' invalid' : ''}`} aria-invalid={!!dobErr} aria-describedby={dobErr ? 'dob-error' : undefined} type="date" value={birthdate} onChange={e => { setBirthdate(e.target.value); if (validateBirthdate(e.target.value)) setDobErr(''); }} />
                  {dobErr && <div id="dob-error" className="field-error">{dobErr}</div>}
                </div>
              </div>
              <div className="form-row">
                <div>
                  <label className="label" htmlFor="country">Country/Region</label>
                  <select id="country" className={`input${countryErr ? ' invalid' : ''}`} aria-invalid={!!countryErr} aria-describedby={countryErr ? 'country-error' : undefined} value={country} onChange={e => { setCountry(e.target.value); if (e.target.value) setCountryErr(''); }}>
                    <option value="">Select your country</option>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>South Korea</option>
                    <option>Japan</option>
                    <option>Germany</option>
                    <option>Australia</option>
                  </select>
                  {countryErr && <div id="country-error" className="field-error">{countryErr}</div>}
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

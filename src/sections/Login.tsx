import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOtp, verifyOtp as verifyOtpFn, saveLocalSession, getLocalSession, loginWithPassword } from '../utils/auth';
import { useToast } from '../components/Toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import '../styles/auth.css';

function validateEmail(v: string) { return /.+@.+\..+/.test(v); }

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; code?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => { const s = getLocalSession(); if (s) navigate('/dashboard'); }, [navigate]);

  useEffect(() => {
    if (!sent || resendIn <= 0) return;
    const id = setInterval(() => setResendIn((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [sent, resendIn]);

  const send = async () => {
    if (!validateEmail(email)) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    try {
      await requestOtp(email, 'login');
      setSent(true);
    } catch (e: any) {
      toast.error(e.message || 'Failed to send code');
    } finally { setLoading(false); }
  };

  const verify = async () => {
    if (code.trim().length !== 6 || !/^\d{6}$/.test(code)) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const session = await verifyOtpFn(email, code.trim());
      saveLocalSession(session);
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Invalid or expired code');
    } finally { setLoading(false); }
  };

  const loginPw = async () => {
    if (!validateEmail(email) || password.length < 6) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      const token = await loginWithPassword(email, password);
      saveLocalSession(token);
      navigate('/dashboard');
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <section className="section" aria-label="Login">
      <div className="container auth-wrapper">
        <div className="auth-grid">
          <div className="auth-visual" aria-hidden="true">
            <div className="auth-visual-inner">
              <FiShield size={48} />
              <h3>Secure Access</h3>
              <p>Sign in to view your personal giveaway dashboard.</p>
            </div>
          </div>

          <div>
            <div className="auth-brand">
              <img src="/hybe-logo.svg" alt="HYBE" />
              <div className="auth-tagline">Official Giveaway Portal</div>
            </div>

            <h2 className="section-title mt-10">Sign in to your Giveaway</h2>
            <div className="card card-pad auth-card mt-12" role="region" aria-live="polite">
              <div className="auth-toggle mb-10">
                <button className={`button-secondary${usePassword ? ' active' : ''}`} onClick={() => setUsePassword(true)} type="button">Use password</button>
                <button className={`button-secondary${!usePassword ? ' active' : ''}`} onClick={() => setUsePassword(false)} type="button">Use one-time code</button>
              </div>

              {usePassword ? (
                <div>
                  <label className="label" htmlFor="login-email">Email</label>
                  <div className="auth-field">
                    <FiMail className="auth-icon-left" aria-hidden="true" />
                    <input id="login-email" className="input auth-input" placeholder="name@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>

                  <label className="label mt-6" htmlFor="login-password">Password</label>
                  <div className="auth-field">
                    <FiLock className="auth-icon-left" aria-hidden="true" />
                    <input id="login-password" className="input auth-input" type={showPassword ? 'text' : 'password'} placeholder="Your password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button className="auth-eye" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                  </div>

                  <div className="button-row mt-14">
                    <button className="button-primary" onClick={loginPw} disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
                  </div>
                </div>
              ) : !sent ? (
                <div>
                  <label className="label" htmlFor="otp-email">Email</label>
                  <div className="auth-field">
                    <FiMail className="auth-icon-left" aria-hidden="true" />
                    <input id="otp-email" className="input auth-input" placeholder="name@example.com" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="button-row mt-14">
                    <button className="button-primary" onClick={send} disabled={loading}>{loading ? 'Sending…' : 'Send 6‑digit code'}</button>
                  </div>
                  <p className="subtle mt-8">One-time code expires in 10 minutes.</p>
                </div>
              ) : (
                <div>
                  <label className="label" htmlFor="otp-code">Enter 6‑digit code</label>
                  <input id="otp-code" className="input" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))} />
                  <div className="button-row mt-14">
                    <button className="button-primary" onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify & Continue'}</button>
                    <button className="button-secondary" onClick={() => setSent(false)} disabled={loading}>Change email</button>
                  </div>
                </div>
              )}

              <div className="auth-meta mt-12" aria-hidden="true">
                <span>Protected by industry‑standard security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

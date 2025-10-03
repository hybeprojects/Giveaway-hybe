import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  isOpen: boolean;
  email: string;
  error: string | null;
  code: string;
  isVerifying: boolean;
  verified: boolean;
  resendIn: number; // seconds
  onRequestClose: () => void;
  onCodeChange: (code: string) => void;
  onResend: () => Promise<void>;
  onChangeEmailAndSend: (email: string) => Promise<void>;
};

function maskEmail(email: string): string {
  const [user, domain] = String(email).split('@');
  if (!user || !domain) return email;
  const u = user.length <= 2 ? user[0] + '*' : user[0] + '*'.repeat(Math.max(1, user.length - 2)) + user[user.length - 1];
  const [d1, ...rest] = domain.split('.');
  const dMasked = d1[0] + '*'.repeat(Math.max(1, d1.length - 2)) + (d1.length > 1 ? d1[d1.length - 1] : '');
  return `${u}@${[dMasked, ...rest].join('.')}`;
}

export default function OTPModal({ isOpen, email, error, code, isVerifying, verified, resendIn, onRequestClose, onCodeChange, onResend, onChangeEmailAndSend }: Props) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editValue, setEditValue] = useState(email);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const boxesRef = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // Sync external code -> digits (e.g., paste from parent)
  useEffect(() => {
    const next = (code || '').slice(0, 6).split('');
    const filled = Array.from({ length: 6 }, (_, i) => next[i] || '');
    setDigits(filled);
  }, [code]);

  // Emit joined code to parent whenever digits change
  useEffect(() => {
    const joined = digits.join('');
    if (/^\d{0,6}$/.test(joined)) onCodeChange(joined);
  }, [digits, onCodeChange]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    lastFocused.current = (document.activeElement as HTMLElement) || null;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isVerifying) onRequestClose();
      }
      if (e.key === 'Tab' && contentRef.current) {
        const focusables = Array.from(contentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { last.focus(); e.preventDefault(); }
        } else {
          if (document.activeElement === last) { first.focus(); e.preventDefault(); }
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); };
  }, [isOpen, isVerifying, onRequestClose]);

  // Restore focus when closed
  useEffect(() => {
    if (!isOpen && lastFocused.current) {
      lastFocused.current.focus();
      lastFocused.current = null;
    }
  }, [isOpen]);

  // Auto focus first empty box when opened
  useEffect(() => {
    if (isOpen) {
      const idx = digits.findIndex(d => d === '');
      const target = boxesRef.current[idx >= 0 ? idx : 5];
      requestAnimationFrame(() => target?.focus());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Vibrations
  useEffect(() => {
    if (verified && navigator.vibrate) navigator.vibrate(20);
  }, [verified]);
  useEffect(() => {
    if (error && navigator.vibrate) navigator.vibrate([20, 20]);
  }, [error]);

  const onBoxChange = (i: number, val: string) => {
    const d = val.replace(/[^\d]/g, '').slice(0, 1);
    setDigits(prev => {
      const next = [...prev];
      next[i] = d;
      // move forward when filled
      if (d && i < 5) boxesRef.current[i + 1]?.focus();
      return next;
    });
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      boxesRef.current[i - 1]?.focus();
      setDigits(prev => { const next = [...prev]; next[i - 1] = ''; return next; });
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault(); boxesRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      e.preventDefault(); boxesRef.current[i + 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = (e.clipboardData || (window as any).clipboardData).getData('text');
    const ds = String(text || '').replace(/[^\d]/g, '').slice(0, 6).split('');
    if (ds.length) {
      const next = Array.from({ length: 6 }, (_, j) => ds[j] || '');
      setDigits(next);
      const focusIdx = Math.min(5, ds.length);
      boxesRef.current[focusIdx]?.focus();
    }
  };

  const handleOverlayClick = () => {
    if (!isVerifying) onRequestClose();
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    try {
      setResendStatus('sending');
      await onResend();
      setResendStatus('sent');
      setTimeout(() => setResendStatus('idle'), 2000);
    } catch {
      setResendStatus('idle');
    }
  };

  const handleChangeEmail = async () => {
    const next = editValue.trim();
    if (!/.+@.+\..+/.test(next)) return;
    try {
      setResendStatus('sending');
      await onChangeEmailAndSend(next);
      setResendStatus('sent');
      setEditingEmail(false);
      setTimeout(() => setResendStatus('idle'), 2000);
    } catch {
      setResendStatus('idle');
    }
  };

  const mm = String(Math.floor(resendIn / 60)).padStart(2, '0');
  const ss = String(resendIn % 60).padStart(2, '0');

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="modal-overlay bottom" onClick={handleOverlayClick}>
      <div ref={contentRef} className="modal-content otp-modal" role="dialog" aria-modal="true" aria-labelledby="otp-heading" onClick={e => e.stopPropagation()}>
        <p className="modal-title-label">Email verification</p>
        <h2 id="otp-heading">Confirm your email</h2>
        {!editingEmail ? (
          <p className="subtle mt-10">We sent a 6-digit code to <strong>{maskEmail(email)}</strong>. <button type="button" className="button-secondary btn-sm" onClick={() => { setEditingEmail(true); setEditValue(email); }}>Change email</button></p>
        ) : (
          <div className="two-col-grid mt-10" style={{ gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
            <input type="email" className="form-control" value={editValue} onChange={e => setEditValue(e.target.value)} aria-label="Email address" />
            <button type="button" className={`button-primary btn-sm ${resendStatus === 'sending' ? 'is-loading' : ''}`} onClick={handleChangeEmail} disabled={resendStatus === 'sending'}>Save</button>
          </div>
        )}

        <div className="otp-grid mt-12" onPaste={onPaste} aria-label="Enter 6 digit code" role="group">
          {digits.map((d, i) => (
            <div key={i} className={`otp-cell ${error ? 'is-error' : ''} ${verified ? 'is-success' : ''}`}>
              <input
                ref={(el) => { boxesRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="\\d*"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                className="otp-input"
                value={d}
                onChange={(e) => onBoxChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => { e.currentTarget.select(); if (!reduceMotion) e.currentTarget.scrollIntoView({ block: 'center', behavior: 'auto' }); }}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={!!error}
                maxLength={1}
              />
            </div>
          ))}
          {(isVerifying || verified) && (
            <div className="otp-inline-status" aria-hidden="true">
              {verified ? <div className="otp-check" aria-hidden="true" /> : <div className="loading-spinner" />}
            </div>
          )}
        </div>

        <div className="mt-8" role="alert" aria-live="polite">
          {error ? (
            <div className="text-danger small">{error}</div>
          ) : resendStatus === 'sent' ? (
            <div className="text-success small">Code sent!</div>
          ) : null}
        </div>

        <div className="subtle mt-10">
          <span>Didn’t get a code? Check spam, make sure the email is correct, or request a new code.</span>
        </div>

        <div className="sticky-action-row mt-12">
          <div className="button-row">
            <button type="button" className={`button-secondary ${resendStatus === 'sending' ? 'is-loading' : ''}`} onClick={handleResend} disabled={isVerifying || resendIn > 0 || resendStatus === 'sending'}>
              {resendIn > 0 ? `Resend in ${mm}:${ss}` : 'Resend'}
            </button>
            <button type="button" className="button-secondary" onClick={onRequestClose} disabled={isVerifying}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

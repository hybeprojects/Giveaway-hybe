import { useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function burstPurpleConfetti() {
  const count = 80;
  const root = document.body;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('i');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    const hues = [270, 280, 290, 300];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    el.style.background = `hsl(${hue},85%,65%)`;
    el.style.setProperty('--tx', (Math.random() * 2 - 1).toFixed(2));
    el.style.setProperty('--dur', (0.9 + Math.random() * 0.9).toFixed(2) + 's');
    root.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}

export default function OnboardingModal({ isOpen, onClose }: Props) {
  useEffect(() => {
    if (isOpen) burstPurpleConfetti();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const content = document.getElementById('onboarding-modal-content');
    if (!content) return;
    const focusables = content.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); }
      if (e.key === 'Tab' && focusables.length) {
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); (first as HTMLElement).focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mountedAt = (window as any).__onboard_mount || (Date.now());
  ;(window as any).__onboard_mount = mountedAt;
  const onOverlayClick = () => {
    if (Date.now() - mountedAt < 350) return; // ignore initial navigation click
    onClose();
  };
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-desc" onClick={onOverlayClick}>
      <div id="onboarding-modal-content" className="modal-content modal-appear" onClick={stop}>
        <h2 id="onboarding-title">Welcome to the Ultimate HYBE Giveaway</h2>
        <div id="onboarding-desc" className="subtle mt-10">
          <p>
            This official HYBE/BTS initiative celebrates upcoming BTS shows and global tours. Every ARMY has an equal, fair chance to be selected.
          </p>
          <p className="mt-8">
            Fairness & Compliance: Winners are randomly chosen. Our process follows Korean giveaway and promotional laws to ensure transparency and legitimacy.
          </p>
          <p className="mt-8">
            Monitoring & Security: All entries are securely tracked and auditable to protect participants. Your information is handled with care.
          </p>
          <p className="mt-8">
            For ARMY, with love: Built to strengthen the bond between BTS and fans worldwide as we celebrate upcoming BTS events together in real time.
          </p>
        </div>
        <div className="button-row mt-14">
          <button type="button" className="button-primary" onClick={onClose}>Continue</button>
        </div>
      </div>
    </div>
  );
}

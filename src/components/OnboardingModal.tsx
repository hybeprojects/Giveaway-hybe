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

  if (!isOpen) return null;

  const onOverlayClick = () => onClose();
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-desc" onClick={onOverlayClick}>
      <div className="modal-content modal-appear" onClick={stop}>
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

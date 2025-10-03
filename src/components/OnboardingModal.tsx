import { lazy, Suspense, useEffect, useMemo, useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const LazyConfetti = lazy(() => import('react-confetti'));

export default function OnboardingModal({ isOpen, onClose }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    let timeout: number | undefined;
    if (isOpen && !reduceMotion) {
      timeout = window.setTimeout(() => setShowConfetti(true), 150);
      const stopId = window.setTimeout(() => setShowConfetti(false), 3500);
      return () => { window.clearTimeout(timeout); window.clearTimeout(stopId); };
    } else {
      setShowConfetti(false);
    }
  }, [isOpen, reduceMotion]);

  if (!isOpen) return null;

  return (
    <>
      {showConfetti && (
        <Suspense fallback={null}>
          <LazyConfetti className="confetti-layer" numberOfPieces={120} gravity={0.25} recycle={false} />
        </Suspense>
      )}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="onboard-heading" onClick={e => e.stopPropagation()}>
          <p className="modal-title-label">Onboarding</p>
          <h2 id="onboard-heading">Welcome to the BTS Giveaway!</h2>
          <p className="subtle mt-10">
            This giveaway celebrates BTS’s upcoming shows and tours, bringing ARMY closer to the action.
          </p>
          <p className="subtle mt-8">
            Our system is securely configured and monitored to ensure a fair and transparent experience for everyone. Winners are selected randomly, and the process complies with all Korean giveaway and promotional laws.
          </p>
          <p className="subtle mt-8">
            All entries are tracked and audited to protect every participant. This initiative was created to strengthen the bond between BTS and their fans worldwide.
          </p>
          <div className="button-row mt-14">
            <button type="button" className="button-primary btn-md" onClick={onClose}>Continue</button>
          </div>
        </div>
      </div>
    </>
  );
}

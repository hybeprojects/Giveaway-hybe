import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function OnboardingModal({ isOpen, onClose }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>Welcome to the BTS Giveaway!</h2>
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
            <button type="button" className="button-primary" onClick={onClose}>Continue</button>
          </div>
        </div>
      </div>
    </>
  );
}
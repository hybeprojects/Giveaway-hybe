import { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function OnboardingModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Welcome to the Ultimate HYBE Giveaway!</h2>
        <p className="subtle mt-10">
          Get ready for a chance to win incredible prizes, including a new Tesla, a huge crypto prize, and an exclusive VIP experience with HYBE.
        </p>
        <p className="subtle mt-8">
          Enter now for your chance to win. Good luck!
        </p>
        <div className="button-row mt-14">
          <button type="button" className="button-primary" onClick={onClose}>Let's Go!</button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

interface WinnerWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizeDetails: string;
}

const WinnerWelcomeModal: React.FC<WinnerWelcomeModalProps> = ({ isOpen, onClose, prizeDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content text-center">
        <h1 className="mb-8">🎉 Congratulations! 🎉</h1>
        <p className="section-subtitle" style={{ margin: '0 auto 2rem' }}>
          You are a winner in the HYBE Giveaway! You have won:
        </p>
        <div className="card card-pad mb-16 text-bold">
          {prizeDetails}
        </div>
        <p className="subtle mb-16">
          Your prize claim roadmap is now available on your dashboard. Follow the steps to claim your prize.
        </p>
        <button onClick={onClose} className="button-primary">
          Let's Go!
        </button>
      </div>
    </div>
  );
};

export default WinnerWelcomeModal;
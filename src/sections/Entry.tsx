import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Entry() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnter = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate('/entry'), 600);
  };

  return (
    <section id="enter" className="section entry-section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Join the Ultimate Giveaway</h2>
        <p className="section-subtitle">Complete the form to enter and boost your chances by sharing with friends.</p>
        <div className="entry-cta-group">
          <button onClick={handleEnter} className="button-primary cta-button-wide" aria-label="Enter the giveaway">
            ENTER THE GIVEAWAY
          </button>
          <button onClick={handleEnter} className="button-primary cta-button-wide" aria-label="Enter now for a chance to win">
            ENTER NOW FOR A CHANCE TO WIN
          </button>
          <button onClick={handleEnter} className="button-primary cta-button-wide" aria-label="Enter now">
            ENTER NOW
          </button>
        </div>
      </div>
      {isLoading && (
        <div className="route-loading-overlay" role="dialog" aria-modal="true" aria-label="Loading">
          <div className="loading-dialog">
            <div className="spinner-border text-light" role="status" aria-hidden="true"></div>
            <p className="loading-text">Preparing your entry...</p>
          </div>
        </div>
      )}
    </section>
  );
}

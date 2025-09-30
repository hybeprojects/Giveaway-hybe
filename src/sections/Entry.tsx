import React from 'react';
import { Link } from 'react-router-dom';

export default function Entry() {
  return (
    <section id="enter" className="section entry-section" aria-label="Entry">
      <div className="container">
        <h2 className="section-title">Join the Ultimate Giveaway</h2>
        <p className="section-subtitle">Complete the form to enter and boost your chances by sharing with friends.</p>
        <div className="cta-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <Link to="/entry" className="button-primary" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            ENTER THE GIVEAWAY
          </Link>
          <Link to="/entry" className="button-primary" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            ENTER NOW FOR A CHANCE TO WIN
          </Link>
          <Link to="/entry" className="button-primary" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            ENTER NOW
          </Link>
        </div>
      </div>
    </section>
  );
}
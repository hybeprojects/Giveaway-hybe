import React from 'react';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';

export default function EntrySuccessPage() {
  return (
    <>
      <Navbar />
      <div className="entry-form-page container mt-5 text-center">
        <div className="alert alert-success" role="alert" aria-live="polite">
          <h1 className="mb-3">You’re in! 🎉</h1>
          <p className="mb-3">Congratulations on joining the HYBE Mega Giveaway.</p>
          <p className="mb-3">Your information has been securely sent to HYBE's giveaway system. Your entry is being processed.</p>
          <a className="button-primary mt-3" href="https://hybecorp.com" rel="noopener">Go to HYBE Home</a>
        </div>
      </div>
      <Footer />
    </>
  );
}

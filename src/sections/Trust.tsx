import FAQ from '../components/FAQ';

export default function Trust() {
  return (
    <section className="section" aria-label="Trust">
      <div className="container">
        <h2 className="section-title">Trust & Transparency</h2>
        <div className="two-col-grid">
          <div className="card card-pad">
            <h3>Provable Fairness</h3>
            <p className="subtle">Our selection uses cryptographic commitments to ensure fairness, auditable by anyone.</p>
            <div className="row-center mt-10">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" stroke="var(--accent-blue)" strokeWidth="1.5" fill="rgba(10,132,255,0.15)"/>
                <path d="M8 12l2.5 2.5L16 9" stroke="var(--accent-gold)" strokeWidth="1.5"/>
              </svg>
              <strong>Verified by HYBE Corp</strong>
            </div>
            <div className="row mt-10">
              <span className="nav-link nav-chip">SSL Secure</span>
              <span className="nav-link nav-chip">Fair Draw</span>
              <span className="nav-link nav-chip">Privacy First</span>
            </div>
          </div>
          <div>
            <FAQ />
          </div>
        </div>
      </div>
    </section>
  );
}

import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';

export default function Rules() {
  return (
    <>
      <Navbar />
      <main className="section" aria-label="Giveaway Rules">
        <div className="container page-content">
          <h1 className="section-title">Giveaway Rules &amp; Details</h1>
          <p className="section-subtitle">Please review the rules to ensure a fair and transparent experience for everyone.</p>

          <section aria-label="Eligibility">
            <h2>Eligibility</h2>
            <ul>
              <li>One entry per person.</li>
              <li>Participants must be 18 years of age or older.</li>
              <li>Void where prohibited by law.</li>
            </ul>
          </section>

          <section aria-label="Winner Selection">
            <h2>Winner Selection &amp; Notification</h2>
            <ul>
              <li>Winners will be selected randomly from eligible entries after the giveaway closes.</li>
              <li>Winners will be notified via the email address submitted on the entry form.</li>
              <li>Failure to respond within the specified timeframe may forfeit the prize.</li>
            </ul>
          </section>

          <section aria-label="Prizes">
            <h2>Prizes</h2>
            <ul>
              <li>Grand Prize: Tesla Model 3.</li>
              <li>Second Prize: $700,000 in cryptocurrency.</li>
              <li>Third Prize: Exclusive VIP meet &amp; greet experience with all expenses paid.</li>
            </ul>
          </section>

          <section aria-label="Terms">
            <h2>Terms</h2>
            <ul>
              <li>Full terms and conditions are available on the entry form.</li>
              <li>By entering, you agree to the official rules and privacy policy.</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

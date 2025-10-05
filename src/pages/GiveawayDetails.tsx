import { Link } from 'react-router-dom';
import Navbar from '../sections/Navbar';
import Footer from '../sections/Footer';

export default function GiveawayDetails() {
  return (
    <>
      <Navbar />
      <main className="section" aria-label="Giveaway Details">
        <div className="container">
          <h1 className="section-title">Get Ready for the Giveaway of a Lifetime</h1>
          <p className="section-subtitle">We’re thrilled to offer you the opportunity to enter our exclusive giveaway for a chance to win life‑changing prizes!</p>

          <section aria-label="Prizes">
            <h2>Prizes Up for Grabs</h2>
            <ul>
              <li>
                <strong>🚗 A Brand New Tesla Model 3</strong> — Drive into the future with style and sustainability!
              </li>
              <li>
                <strong>💸 $700,000 in Cryptocurrency</strong> — A massive boost to your financial freedom!
              </li>
              <li>
                <strong>🎟 An Exclusive VIP Meet &amp; Greet Experience</strong> — All expenses paid for an unforgettable moment with your favorite HYBR artist!
              </li>
            </ul>
          </section>

          <section className="mt-4" aria-label="How to Enter">
            <h2 className="h3">How to Enter</h2>
            <ol className="list">
              <li>Click the button below to open the giveaway entry form.</li>
              <li>Complete the simple form with your details.</li>
            </ol>
            <div className="cta-row mt-3">
              <Link className="button-primary btn-lg" to="/entry" aria-label="Enter the Giveaway Now">Enter the Giveaway Now</Link>
              <a className="button-secondary btn-lg" href="#prizes">Explore Prizes</a>
            </div>
          </section>

          <section className="mt-4" aria-label="Why Enter">
            <h2 className="h3">Why You Should Enter</h2>
            <p>This is your shot to win big and experience something extraordinary! Whether it’s cruising in a sleek Tesla, securing a crypto fortune, or rubbing shoulders with VIPs, these prizes are designed to make dreams come true. Don’t miss out.</p>
          </section>

          <section className="mt-4" aria-label="Rules & Details">
            <h2 className="h3">Rules &amp; Details</h2>
            <ul className="list">
              <li>One entry per person.</li>
              <li>Must be 18 or older.</li>
              <li>Winners will be announced via email.</li>
              <li>Full terms and conditions available on the entry form.</li>
            </ul>
          </section>

          <section className="mt-5" aria-label="Final CTA">
            <div className="cta-row">
              <Link className="button-primary btn-lg" to="/entry">Enter Now</Link>
            </div>
          </section>

          <p className="mt-5">Best regards,<br />HYBE CORP LABEL</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

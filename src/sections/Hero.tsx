import Countdown from '../components/Countdown';

const VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-traveling-through-a-tunnel-of-black-cubes-in-3d-31497-large.mp4";

export default function Hero() {
  const target = new Date();
  target.setDate(target.getDate() + 10);
  return (
    <section className="hero-section" aria-label="Hero">
      <video className="hero-video" autoPlay muted loop playsInline preload="auto">
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content container">
        <h1 className="hero-title">The Ultimate HYBE Giveaway</h1>
        <p className="hero-subtitle">Win a Tesla, $700k in Crypto, and a VIP HYBE Experience!</p>
        <div className="countdown-container">
          <p className="countdown-label">Entries close in:</p>
          <Countdown target={target} />
        </div>
        <div className="cta-row">
          <a className="button-primary" href="/enter">Enter the Giveaway</a>
          <a className="button-secondary" href="/enter">Enter Now for a Chance to Win</a>
          <a className="button-secondary" href="/enter">Enter Now</a>
        </div>
      </div>
    </section>
  );
}

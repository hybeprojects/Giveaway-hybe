import Countdown from '../components/Countdown';

const VIDEO_URL = "https://videos.pexels.com/video-files/5057439/5057439-hd_1280_720_25fps.mp4";

export default function Hero() {
  const target = new Date();
  target.setDate(target.getDate() + 10);
  return (
    <section className="hero" aria-label="Hero">
      <video autoPlay muted loop playsInline preload="auto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}>
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content container">
        <h1 className="h1" style={{ fontSize: '56px', lineHeight: 1.05, margin: 0 }}>Win a Tesla Model 3, $700,000 in Crypto & VIP HYBE Experience!</h1>
        <p className="subtle" style={{ marginTop: 10 }}>Entries close in:</p>
        <Countdown target={target} />
        <div className="cta-row">
          <a className="button-primary" href="#enter">Enter Now</a>
          <a className="button-secondary" href="#prizes">See Prizes</a>
        </div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import Countdown from '../components/Countdown';
import { getDisplayDeadline } from '../utils/timing';

const VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-traveling-through-a-tunnel-of-black-cubes-in-3d-31497-large.mp4";

export default function Hero() {
  const target = getDisplayDeadline();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (reduceMotion) { el.pause(); return; }

    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.play().catch(() => {});
          } else {
            el.pause();
          }
        });
      }, { root: null, rootMargin: '0px', threshold: 0.2 });
      observer.observe(el);
    } catch {
      el.play().catch(() => {});
    }
    return () => { if (observer) observer.disconnect(); };
  }, [reduceMotion]);

  return (
    <section className="hero-section" aria-label="Hero">
      <video ref={videoRef} className="hero-video" muted loop playsInline preload="none">
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="hero-overlay"></div>
      <div className="hero-content container">
        <h1 className="hero-title">Giveaway of a Lifetime</h1>
        <p className="hero-subtitle">Enter for a Tesla Model 3, $700,000 in Crypto, and an Exclusive VIP Meet &amp; Greet.</p>
        <div className="countdown-container">
          <p className="countdown-label">Entries close in:</p>
          <Countdown target={target} />
        </div>
        <div className="cta-row">
          <Link className="button-primary btn-lg" to="/entry">Enter the Giveaway</Link>
          <a className="button-secondary btn-lg" href="#prizes">Explore Prizes</a>
        </div>
      </div>
    </section>
  );
}

import React, { useEffect, useRef } from 'react';

type Prize = {
  tier: string;
  title: string;
  detail: string;
  value: string;
  badges?: string[];
};

function PrizeCard({ prize }: { prize: Prize }) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) el.classList.add('in');
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;
    const ry = (px - 0.5) * 8; // rotateY
    const rx = (0.5 - py) * 8; // rotateX
    el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <article
      className="prize-card prize-tilt"
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-label={prize.title}
    >
      <div className="prize-media" aria-hidden="true" />
      <div className="prize-info">
        <div className="prize-topline">
          <span className="prize-tier">{prize.tier}</span>
          <span className="prize-value">{prize.value}</span>
        </div>
        <h3 className="prize-title">{prize.title}</h3>
        <p className="prize-detail">{prize.detail}</p>
        {prize.badges && prize.badges.length > 0 && (
          <div className="prize-badges" aria-label="Highlights">
            {prize.badges.map((b) => (
              <span key={b} className="prize-chip">{b}</span>
            ))}
          </div>
        )}
        <div className="prize-cta">
          <a className="button-primary btn-md" href="#enter" aria-label={`Enter to win ${prize.title}`}>Enter to Win</a>
          <a className="button-secondary btn-md" href="/giveaway">Details</a>
        </div>
      </div>
    </article>
  );
}

function PrizeHighlights() {
  const items = [
    { label: 'Worldwide Shipping' },
    { label: 'Provably Fair' },
    { label: 'No Purchase Required' },
  ];
  return (
    <div className="prize-highlights" role="list">
      {items.map((it) => (
        <span key={it.label} className="prize-chip" role="listitem">{it.label}</span>
      ))}
    </div>
  );
}

function PrizesUpForGrabs() {
  return (
    <div className="gamify-box" style={{marginBottom: '1.25rem'}} aria-label="Prizes Up for Grabs">
      <strong style={{display:'block', marginBottom: 8}}>Prizes Up for Grabs</strong>
      <ul style={{margin: 0, paddingLeft: '1.1rem', lineHeight: 1.6}}>
        <li>🚗 A Brand New Tesla Model 3 — drive into the future with style and sustainability.</li>
        <li>💸 $700,000 in Cryptocurrency — a massive boost to your financial freedom.</li>
        <li>🎟 An Exclusive VIP Meet &amp; Greet — all expenses paid with your favorite HYBE artist.</li>
      </ul>
    </div>
  );
}

export default function Prizes() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const prizes: Prize[] = [
    {
      tier: 'Grand Prize',
      title: 'Tesla Model 3',
      detail: 'Experience the future of driving with a brand new Tesla Model 3. Performance package included.',
      value: '≈ $46,000',
      badges: ['Performance Pack', 'Long Range', 'Premium Interior'],
    },
    {
      tier: 'Second Prize',
      title: '$700,000 in Crypto',
      detail: 'A life-changing sum of Bitcoin and Ethereum, securely transferred to your wallet.',
      value: '$700,000',
      badges: ['BTC + ETH', 'Cold Storage Ready'],
    },
    {
      tier: 'Third Prize',
      title: 'VIP HYBE Experience',
      detail: 'Fly private, stay in a 5-star hotel, and get exclusive access to a HYBE event.',
      value: 'Priceless',
      badges: ['Private Jet', '5-Star Stay', 'Backstage Access'],
    },
  ];

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section id="prizes" className="section prizes-section" aria-label="Prizes">
      <div className="container">
        <h2 className="section-title">Exclusive Prizes</h2>
        <p className="section-subtitle">A look at what you can win.</p>

        <PrizesUpForGrabs />
        <PrizeHighlights />

        <div className="prize-grid" ref={scrollerRef}>
          {prizes.map((p) => (
            <PrizeCard key={p.title} prize={p} />
          ))}
        </div>

        <div className="prize-arrows" aria-hidden="true">
          <button className="arrow" onClick={() => scrollBy(-1)} aria-label="Scroll prizes left">‹</button>
          <button className="arrow" onClick={() => scrollBy(1)} aria-label="Scroll prizes right">›</button>
        </div>
      </div>
    </section>
  );
}

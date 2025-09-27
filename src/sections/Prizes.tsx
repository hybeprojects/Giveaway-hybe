import { useRef } from 'react';

const CRYPTO_IMG = "https://images.pexels.com/photos/29857218/pexels-photo-29857218.jpeg";
const JET_IMG = "https://images.pexels.com/photos/6700142/pexels-photo-6700142.jpeg";

function PrizeCard({ src, title, detail, tier }: { src: string; title: string; detail: string; tier: 'gold' | 'silver' | 'bronze' }) {
  return (
    <article className="carousel-item card">
      <div className={`badge ${tier}`}>{tier === 'gold' ? '🥇 Grand' : tier === 'silver' ? '🥈 Second' : '🥉 Third'}</div>
      <img src={src} alt={title} />
      <div className="prize-card-body">
        <h3 className="prize-title">{title}</h3>
        <p className="subtle">{detail}</p>
      </div>
    </article>
  );
}

export default function Prizes() {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dx: number) => ref.current?.scrollBy({ left: dx, behavior: 'smooth' });
  return (
    <section id="prizes" className="section" aria-label="Prizes">
      <div className="container">
        <h2 className="section-title">Dynamic Prize Showcase</h2>
        <p className="subtle">Explore each prize and discover the details.</p>
        <div className="button-row justify-end mt-10">
          <button className="button-secondary" onClick={() => scroll(-400)}>◀</button>
          <button className="button-secondary" onClick={() => scroll(400)}>▶</button>
        </div>
        <div ref={ref} className="carousel mt-14">
          <PrizeCard src={JET_IMG} title="Tesla Model 3" detail="Performance package with exclusive delivery experience." tier="gold" />
          <PrizeCard src={CRYPTO_IMG} title="$700,000 in Crypto" detail="Bitcoin and Ethereum split, transferred securely." tier="silver" />
          <PrizeCard src={CRYPTO_IMG} title="VIP HYBE Experience" detail="Private jet travel, 5-star hotel, fine dining, and exclusive access." tier="bronze" />
        </div>
      </div>
    </section>
  );
}

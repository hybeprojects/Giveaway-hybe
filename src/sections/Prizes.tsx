function PrizeCard({ title, detail, tier }: { title: string; detail: string; tier: string }) {
  return (
    <article className="prize-card">
      <div className="prize-info">
        <span className="prize-tier">{tier}</span>
        <h3 className="prize-title">{title}</h3>
        <p className="prize-detail">{detail}</p>
      </div>
    </article>
  );
}

export default function Prizes() {
  return (
    <section id="prizes" className="section prizes-section" aria-label="Prizes">
      <div className="container">
        <h2 className="section-title">Exclusive Prizes</h2>
        <p className="section-subtitle">A look at what you can win.</p>
        <div className="prize-grid">
          <PrizeCard title="Tesla Model 3" detail="Experience the future of driving with a brand new Tesla Model 3. Performance package included." tier="Grand Prize" />
          <PrizeCard title="$700,000 in Crypto" detail="A life-changing sum of Bitcoin and Ethereum, securely transferred to your wallet." tier="Second Prize" />
          <PrizeCard title="VIP HYBE Experience" detail="Fly private, stay in a 5-star hotel, and get exclusive access to a HYBE event." tier="Third Prize" />
        </div>
      </div>
    </section>
  );
}

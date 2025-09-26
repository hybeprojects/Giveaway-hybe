import { useEffect } from 'react';

const DINING_IMG = "https://images.pexels.com/photos/2566037/pexels-photo-2566037.jpeg";

export default function VIPExperience() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.2 });
    document.querySelectorAll('.scroll-reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return (
    <section id="vip" className="section" aria-label="VIP Experience">
      <div className="container">
        <h2 className="section-title">VIP Experience</h2>
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          <div className="grid" style={{ alignContent: 'start' }}>
            <div className="scroll-reveal card" style={{ padding: 16 }}>
              ✈ A private jet takes you to your destination in comfort.
            </div>
            <div className="scroll-reveal card" style={{ padding: 16 }}>
              🏨 A luminous 5-star hotel stay with concierge service.
            </div>
            <div className="scroll-reveal card" style={{ padding: 16 }}>
              🍽 A curated fine-dining experience by top chefs.
            </div>
            <div className="scroll-reveal card" style={{ padding: 16 }}>
              🎁 Exclusive swag and backstage access to HYBE experiences.
            </div>
          </div>
          <div className="scroll-reveal card" style={{ overflow: 'hidden' }}>
            <img src={DINING_IMG} alt="Fine dining" />
          </div>
        </div>
      </div>
    </section>
  );
}

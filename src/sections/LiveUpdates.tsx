import { useEffect, useMemo, useRef, useState } from 'react';
import Countdown from '../components/Countdown';

function useAnimatedCount(start: number) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN(v => v + Math.floor(Math.random() * 7)), 1200);
    return () => clearInterval(id);
  }, []);
  return n;
}

export default function LiveUpdates() {
  const entries = useAnimatedCount(120_000);
  const winnersAt = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d; }, []);
  const [feed, setFeed] = useState<string[]>(['A. Kim boosted odds', 'J. Park entered', 'S. Lee invited 3 friends']);
  const id = useRef<number | null>(null);
  useEffect(() => {
    id.current = window.setInterval(() => {
      const actions = ['entered', 'shared', 'invited 2 friends', 'earned +3 entries'];
      const name = ['A. Kim', 'J. Park', 'S. Lee', 'M. Choi', 'D. Han'][Math.floor(Math.random()*5)];
      const action = actions[Math.floor(Math.random()*actions.length)];
      setFeed(f => [name + ' ' + action, ...f].slice(0, 6));
    }, 2500);
    return () => { if (id.current) clearInterval(id.current); };
  }, []);

  return (
    <section id="updates" className="section" aria-label="Live Updates">
      <div className="container grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card" style={{ padding: 16 }}>
          <h3>Live Entries Count</h3>
          <div className="h1" style={{ marginTop: 6 }}>{entries.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3>Winners Announced Live on Stream</h3>
          <Countdown target={winnersAt} />
        </div>
        <div className="card" style={{ gridColumn: '1 / -1', padding: 16 }}>
          <h3>Recent Activity</h3>
          <ul>
            {feed.map((f, i) => <li key={i} className="subtle">{f}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

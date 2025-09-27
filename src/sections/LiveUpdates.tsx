import { useEffect, useMemo, useState } from 'react';
import Countdown from '../components/Countdown';
import { apiBase } from '../utils/auth';

function useAnimatedCount(start: number) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN(v => v + Math.floor(Math.random() * 7)), 1200);
    return () => clearInterval(id);
  }, []);
  return n;
}

function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return `${days}d ago`;
}

export default function LiveUpdates() {
  const entries = useAnimatedCount(120_000);
  const winnersAt = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d; }, []);
  const [feed, setFeed] = useState<{ text: string; created_at: string }[] | null>(null);

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${apiBase}/events`);
        if (res.ok) {
          const data = await res.json();
          if (active) setFeed(data);
        } else if (active && feed === null) {
          setFeed([
            { text: 'A. Kim boosted odds', created_at: new Date().toISOString() },
            { text: 'J. Park entered', created_at: new Date().toISOString() },
            { text: 'S. Lee invited 3 friends', created_at: new Date().toISOString() }
          ]);
        }
      } catch {
        if (active && feed === null) {
          setFeed([
            { text: 'A. Kim boosted odds', created_at: new Date().toISOString() },
            { text: 'J. Park entered', created_at: new Date().toISOString() },
            { text: 'S. Lee invited 3 friends', created_at: new Date().toISOString() }
          ]);
        }
      }
    };
    fetchEvents();
    const id = setInterval(fetchEvents, 10000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <section id="updates" className="section" aria-label="Live Updates">
      <div className="container two-col-grid">
        <div className="card card-pad">
          <h3>Live Entries Count</h3>
          <div className="h1 mt-6">{entries.toLocaleString()}</div>
        </div>
        <div className="card card-pad">
          <h3>Winners Announced Live on Stream</h3>
          <Countdown target={winnersAt} />
        </div>
        <div className="card card-pad span-all">
          <h3>Recent Activity</h3>
          <ul>
            {feed === null && Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="subtle"><span className="skeleton skeleton-line" /></li>
            ))}
            {feed && feed.map((f, i) => <li key={i} className="subtle">{f.text} <span className="dim">· {timeAgo(f.created_at)}</span></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

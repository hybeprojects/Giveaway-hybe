import { useEffect, useState } from 'react';
import { tryFetch } from '../utils/auth';
import { useLiveEntriesCount } from '../utils/liveMetrics';


function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return `${days}d ago`;
}

export default function LiveUpdates() {
  const entries = useLiveEntriesCount();
  const [feed, setFeed] = useState<{ text: string; created_at: string }[] | null>(null);

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      const url = '/.netlify/functions/get-events';
      try {
        const res = await tryFetch(url, { method: 'GET' });
        if (res && res.ok) {
          const data = await res.json();
          if (active) setFeed(data);
        }
      } catch (e) {
        console.warn('Failed to fetch events', e);
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
      </div>
    </section>
  );
}

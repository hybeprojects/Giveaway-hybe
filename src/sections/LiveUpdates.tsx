import { useEffect, useMemo, useRef, useState } from 'react';
import { tryFetch } from '../utils/auth';
import { useLiveEntriesCount } from '../utils/liveMetrics';
import '../styles/live-updates.css';

function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24); return `${days}d ago`;
}

const FIRST_NAMES = ['Alex','Jordan','Taylor','Sam','Casey','Drew','Riley','Morgan','Jamie','Avery','Quinn','Cameron'];
const CITIES = ['New York','Seoul','Los Angeles','London','Tokyo','Paris','Toronto','Sydney','Chicago','Berlin','Singapore','Mexico City'];

export default function LiveUpdates() {
  const entries = useLiveEntriesCount();
  const [feed, setFeed] = useState<{ text: string; created_at: string }[] | null>(null);
  const [ticker, setTicker] = useState<string>('');
  const [pulsing, setPulsing] = useState(false);
  const prevEntries = useRef<number>(entries);

  const ENABLE_EVENTS = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_ENABLE_EVENTS) === 'true';

  useEffect(() => {
    if (!ENABLE_EVENTS) return;
    let active = true;
    const fetchEvents = async () => {
      const url = '/.netlify/functions/get-events';
      try {
        const res = await tryFetch(url, { method: 'GET' });
        if (res && (res as any).ok) {
          const data = await (res as any).json();
          if (active) setFeed(data);
        }
      } catch (_) {}
    };
    fetchEvents();
    const id = setInterval(fetchEvents, 10000);
    return () => { active = false; clearInterval(id); };
  }, [ENABLE_EVENTS]);

  useEffect(() => {
    if (entries !== prevEntries.current) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 800);
      prevEntries.current = entries;
      return () => clearTimeout(t);
    }
  }, [entries]);

  const lastCity = useMemo(() => {
    const item = feed && feed.length ? feed[0] : null;
    if (item && item.text) {
      const m = item.text.match(/from\s+([^,.!]+)/i);
      if (m && m[1]) return m[1].trim();
    }
    return CITIES[Math.floor(Math.random() * CITIES.length)];
  }, [feed]);

  const lastWhen = useMemo(() => {
    const item = feed && feed.length ? feed[0] : null;
    if (item && item.created_at) return timeAgo(item.created_at);
    const mins = Math.max(1, Math.floor(Math.random() * 5));
    return `${mins}m ago`;
  }, [feed]);

  useEffect(() => {
    const mkName = () => FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const mkCity = () => CITIES[Math.floor(Math.random() * CITIES.length)];
    let i = 0;
    const tick = () => {
      const text = feed && feed.length ? feed[i % feed.length].text : `${mkName()} just entered from ${mkCity()}`;
      setTicker(text);
      i += 1;
    };
    tick();
    const id = setInterval(tick, 7000);
    return () => clearInterval(id);
  }, [feed]);

  return (
    <section id="updates" className="section live-updates-section" aria-label="Live Updates">
      <div className="container">
        <div className="live-card" role="status" aria-live="polite">
          <div className="live-header">
            <span className="live-badge" aria-label="Live updating">
              <span className="dot" aria-hidden="true" />
              <span className="label">Live Updating…</span>
            </span>
            <span className="microcopy">These numbers refresh every few seconds</span>
          </div>

          <div className="live-metric">
            <div className="live-title" aria-hidden="true">LIVE ENTRIES</div>
            <div className={`live-number ${pulsing ? 'pulse' : ''}`}>
              {entries.toLocaleString()}
            </div>
            <div className="live-subline">You’re part of {entries.toLocaleString()} entries worldwide 🌍</div>
            <div className="live-subline subtle">Last entry was {lastWhen} from {lastCity}</div>
          </div>

          <div className="live-feed" aria-live="polite" aria-atomic="true">
            <span className="feed-bullet" aria-hidden>•</span>
            <span className="feed-text">{ticker}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

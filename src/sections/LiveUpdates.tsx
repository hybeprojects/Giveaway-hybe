import { useEffect, useRef, useState } from 'react';
import { useLiveEntriesCount } from '../utils/liveMetrics';
import { FIRST_NAMES, LAST_NAMES, CITIES, VERBS, EMOJIS } from '../utils/liveFeedData';
import '../styles/live-updates.css';

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function LiveUpdates() {
  const entries = useLiveEntriesCount();
  const [ticker, setTicker] = useState<string>('');
  const [tickerKey, setTickerKey] = useState<number>(0);
  const [lastCity, setLastCity] = useState<string>('');
  const [lastWhen, setLastWhen] = useState<string>('just now');
  const [pulsing, setPulsing] = useState(false);
  const prevEntries = useRef<number>(entries);

  // Rolling dedupe of recent names
  const recentQueueRef = useRef<string[]>([]);
  const recentSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (entries !== prevEntries.current) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 800);
      prevEntries.current = entries;
      return () => clearTimeout(t);
    }
  }, [entries]);

  function uniqueFullName(): string {
    const maxAttempts = 1000;
    for (let i = 0; i < maxAttempts; i++) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (!recentSetRef.current.has(name)) {
        recentSetRef.current.add(name);
        recentQueueRef.current.push(name);
        if (recentQueueRef.current.length > 500) {
          const old = recentQueueRef.current.shift()!;
          recentSetRef.current.delete(old);
        }
        return name;
      }
    }
    // If highly unlikely exhaustion occurs, clear oldest 100 and try again
    for (let i = 0; i < 100 && recentQueueRef.current.length; i++) {
      const old = recentQueueRef.current.shift()!;
      recentSetRef.current.delete(old);
    }
    return uniqueFullName();
  }

  function randomWhen(): string {
    const opts = ['just now','moments ago','1 minute ago','2 minutes ago'];
    return pick(opts);
  }

  function maybeEmoji(): string {
    return Math.random() < 0.35 ? ` ${pick(EMOJIS)}` : '';
  }

  useEffect(() => {
    let timeout: number | null = null;
    const run = () => {
      const name = uniqueFullName();
      const city = pick(CITIES);
      const verb = pick(VERBS);
      const when = randomWhen();
      const line = `${name} ${verb} from ${city}${maybeEmoji()} — ${when}`;
      setTicker(line);
      setTickerKey(k => k + 1);
      setLastCity(city);
      setLastWhen(when);
      const delay = randInt(10000, 20000);
      timeout = window.setTimeout(run, delay) as unknown as number;
    };
    run();
    return () => { if (timeout) clearTimeout(timeout); };
  }, []);

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
            <span className="feed-bullet" aria-hidden="true">•</span>
            <span key={tickerKey} className="feed-text fade-in">{ticker}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

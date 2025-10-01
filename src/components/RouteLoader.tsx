import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteLoader() {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  const pollTimer = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip on first mount
    if (prevPath.current === null) {
      prevPath.current = location.pathname + location.search + location.hash;
      return;
    }

    // Show overlay on any route change
    setVisible(true);

    // Clear any previous timers
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (pollTimer.current) window.clearInterval(pollTimer.current);

    const startedAt = Date.now();
    let settled = false;
    let inFlight = false;

    const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T | null> => {
      return new Promise((resolve) => {
        let done = false;
        const t = window.setTimeout(() => { if (!done) resolve(null); }, ms);
        p.then((v) => { done = true; window.clearTimeout(t); resolve(v); })
         .catch(() => { done = true; window.clearTimeout(t); resolve(null as any); });
      });
    };

    const tryPing = async (): Promise<boolean> => {
      const ts = Date.now();
      const cacheBuster = `cb=${ts}`;
      const candidates = [
        `/.netlify/functions/get-events?${cacheBuster}`,
        `/manifest.webmanifest?${cacheBuster}`,
        `/hybe-logo.svg?${cacheBuster}`,
      ];

      for (let i = 0; i < candidates.length; i++) {
        const url = candidates[i];
        const isFunction = url.includes('/.netlify/functions/');
        const opts: RequestInit = isFunction
          ? { method: 'GET', cache: 'no-store', headers: { accept: 'application/json' } }
          : { method: 'HEAD', cache: 'no-cache' };

        const res = await withTimeout(fetch(url, opts), 2000);
        if (res && (res as Response).ok) return true;
      }
      return false;
    };

    // Ping backend repeatedly until healthy (or a reasonable max time)
    const ping = async () => {
      if (settled || inFlight) return;
      inFlight = true;
      const ok = await tryPing();
      inFlight = false;
      if (ok) {
        settled = true;
        hideTimer.current = window.setTimeout(() => setVisible(false), 300);
        if (pollTimer.current) window.clearInterval(pollTimer.current);
        return;
      }
      if (!settled && Date.now() - startedAt > 5000) {
        settled = true;
        hideTimer.current = window.setTimeout(() => setVisible(false), 300);
        if (pollTimer.current) window.clearInterval(pollTimer.current);
      }
    };

    // Initial ping immediately, then poll
    ping();
    pollTimer.current = window.setInterval(ping, 500);

    prevPath.current = location.pathname + location.search + location.hash;

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, [location.pathname, location.search, location.hash]);

  if (!visible) return null;

  return (
    <div className="route-loading-overlay" role="alert" aria-live="polite">
      <div className="loading-dialog" aria-label="Redirecting">
        <div className="loading-spinner" aria-hidden="true" />
        <div className="loading-text">Redirecting…</div>
      </div>
    </div>
  );
}

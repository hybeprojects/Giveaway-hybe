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

    // Ping backend repeatedly until healthy (or a reasonable max time)
    const ping = async () => {
      // Short-circuit if already settled
      if (settled) return;
      const ctrl = new AbortController();
      const timeout = window.setTimeout(() => ctrl.abort(), 2500);
      try {
        const res = await fetch('/.netlify/functions/get-events', {
          method: 'GET',
          cache: 'no-store',
          headers: { 'accept': 'application/json' },
          signal: ctrl.signal,
        });
        if (res.ok) {
          settled = true;
          // Small delay to allow redirect animation feel, then hide
          hideTimer.current = window.setTimeout(() => setVisible(false), 300);
          if (pollTimer.current) window.clearInterval(pollTimer.current);
        }
      } catch (_) {
        // ignore; keep polling
      } finally {
        window.clearTimeout(timeout);
      }

      // Safety: if polling takes too long, stop waiting and hide anyway
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

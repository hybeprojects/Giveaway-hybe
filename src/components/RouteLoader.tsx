import React, { useEffect, useRef, useState } from 'react';
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

    const abortableFetch = async (url: string, opts: RequestInit = {}, ms = 2500): Promise<Response | null> => {
      const controller = new AbortController();
      const id = window.setTimeout(() => controller.abort(), ms);
      try {
        const res = await fetch(url, { signal: controller.signal, ...opts });
        return res;
      } catch (e) {
        return null;
      } finally {
        window.clearTimeout(id);
      }
    };

    const tryPing = async (): Promise<boolean> => {
      const ts = Date.now();
      const cacheBuster = `cb=${ts}`;

      // Prioritize function endpoints that indicate backend readiness
      const candidates = [
        `/.netlify/functions/get-me?${cacheBuster}`,
        `/.netlify/functions/get-events?${cacheBuster}`,
        `/manifest.webmanifest?${cacheBuster}`,
        `/hybe-logo.svg?${cacheBuster}`,
        '/',
      ];

      // Launch fetches in parallel but with short timeouts; succeed if any OK
      const fetches = candidates.map((url) => {
        const isFunction = url.includes('/.netlify/functions/');
        const opts: RequestInit = isFunction
          ? { method: 'GET', cache: 'no-store', headers: { accept: 'application/json' } }
          : { method: 'HEAD', cache: 'no-cache' };
        return abortableFetch(url, opts, 2500);
      });

      const results = await Promise.all(fetches.map((p) => p.catch(() => null)));
      for (const res of results) {
        if (res && (res as Response).ok) return true;
      }
      return false;
    };

    // Ping backend repeatedly until healthy (or a reasonable max time)
    const ping = async () => {
      if (settled || inFlight) return;
      inFlight = true;
      try {
        const ok = await tryPing();
        if (ok) {
          settled = true;
          // Keep spinner visible for a short fade-out to avoid flicker
          hideTimer.current = window.setTimeout(() => setVisible(false), 300);
          if (pollTimer.current) window.clearInterval(pollTimer.current);
          return;
        }
        if (!settled && Date.now() - startedAt > 10000) {
          settled = true;
          hideTimer.current = window.setTimeout(() => setVisible(false), 300);
          if (pollTimer.current) window.clearInterval(pollTimer.current);
        }
      } finally {
        inFlight = false;
      }
    };

    // Initial ping immediately, then poll
    ping();
    pollTimer.current = window.setInterval(ping, 600);

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

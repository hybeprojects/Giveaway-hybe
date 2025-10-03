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
    let cancelled = false;

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
      const candidates = [
        `/.netlify/functions/get-me?${cacheBuster}`,
        `/.netlify/functions/get-events?${cacheBuster}`,
        `/manifest.webmanifest?${cacheBuster}`,
        `/hybe-logo.svg?${cacheBuster}`,
        '/',
      ];

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

    // Utility: wait for images within main content to load
    const waitForImages = () => new Promise<void>((resolve) => {
      try {
        const selector = 'main, .entry-form-page, #root, .section, .route-view';
        const container = document.querySelector(selector) || document.body;
        const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
        if (images.length === 0) return resolve();
        let remaining = images.length;
        const onDone = () => {
          remaining -= 1;
          if (remaining <= 0) resolve();
        };
        images.forEach((img) => {
          if (img.complete) {
            onDone();
            return;
          }
          const onLoad = () => { cleanup(); onDone(); };
          const onError = () => { cleanup(); onDone(); };
          const cleanup = () => { img.removeEventListener('load', onLoad); img.removeEventListener('error', onError); };
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onError);
        });
        // Safety: if images never fire, resolve after timeout
        window.setTimeout(() => resolve(), 8000);
      } catch {
        resolve();
      }
    });

    // Utility: wait for fonts to be ready (if available)
    const waitForFonts = async () => {
      try {
        if ((document as any).fonts && (document as any).fonts.ready) await (document as any).fonts.ready;
      } catch {}
    };

    // Wait for React to mount, images/fonts and backend readiness (or until max timeout)
    (async () => {
      const maxWait = 15000; // 15s hard cap
      const start = Date.now();

      // Start backend polling in parallel
      let backendOk = false;
      const backendPoll = async () => {
        while (!backendOk && Date.now() - start < maxWait && !cancelled) {
          try {
            backendOk = await tryPing();
            if (backendOk) break;
          } catch {}
          await new Promise(r => setTimeout(r, 600));
        }
      };

      const backendPromise = backendPoll();
      const imagesPromise = waitForImages();
      const fontsPromise = waitForFonts();

      // Wait for all critical resources or until timeout
      await Promise.race([
        (async () => {
          await Promise.all([backendPromise, imagesPromise, fontsPromise]);
        })(),
        new Promise<void>(resolve => setTimeout(() => resolve(), maxWait)),
      ]);

      if (cancelled) return;
      // Keep spinner visible for a short fade-out to avoid flicker
      hideTimer.current = window.setTimeout(() => {
        setVisible(false);
        try {
          window.dispatchEvent(new CustomEvent('route-loader-hidden'));
        } catch {}
      }, 300);
    })();

    // Update prevPath and ensure polling reference (kept for cleanup)
    prevPath.current = location.pathname + location.search + location.hash;

    return () => {
      cancelled = true;
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

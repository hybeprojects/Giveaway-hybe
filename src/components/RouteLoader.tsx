import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteLoader() {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);
  const hideTimer = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip on first mount
    if (prevPath.current === null) {
      prevPath.current = location.pathname + location.search + location.hash;
      return;
    }

    // Show overlay on any route change
    setVisible(true);

    // Hide after a short duration to allow redirect animation
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), 600);

    prevPath.current = location.pathname + location.search + location.hash;

    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
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

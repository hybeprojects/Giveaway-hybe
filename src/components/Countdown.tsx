import { useEffect, useMemo, useState } from 'react';

type Props = { target: string | Date };

// Shared synchronized ticker to keep all countdowns consistent across the app
const subscribers = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;
let isStarting = false;

function startTicker() {
  if (intervalId || isStarting) return;
  isStarting = true;
  const align = () => {
    const delay = 1000 - (Date.now() % 1000);
    setTimeout(() => {
      // fire first tick immediately to sync UI
      subscribers.forEach((fn) => fn());
      intervalId = setInterval(() => subscribers.forEach((fn) => fn()), 1000);
      isStarting = false;
    }, delay);
  };
  align();
}

function stopTicker() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  if (subscribers.size === 1) startTicker();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stopTicker();
  };
}

function diffToParts(target: number) {
  const now = Date.now();
  const total = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { total, days, hours, minutes, seconds };
}

export default function Countdown({ target }: Props) {
  const stamp = useMemo(() => (typeof target === 'string' ? new Date(target).getTime() : target.getTime()), [target]);
  const [parts, setParts] = useState(() => diffToParts(stamp));

  useEffect(() => {
    // update immediately when target changes
    setParts(diffToParts(stamp));
    const unsub = subscribe(() => setParts(diffToParts(stamp)));
    return unsub;
  }, [stamp]);

  return (
    <div className="timer countdown-timer" aria-live="polite">
      <div className="unit countdown-unit">
        <div className="h1 countdown-value">{parts.days}</div>
        <div className="subtle countdown-label">Days</div>
      </div>
      <div className="countdown-sep" aria-hidden>:</div>
      <div className="unit countdown-unit">
        <div className="h1 countdown-value">{parts.hours}</div>
        <div className="subtle countdown-label">Hours</div>
      </div>
      <div className="countdown-sep" aria-hidden>:</div>
      <div className="unit countdown-unit">
        <div className="h1 countdown-value">{parts.minutes}</div>
        <div className="subtle countdown-label">Minutes</div>
      </div>
      <div className="countdown-sep" aria-hidden>:</div>
      <div className="unit countdown-unit">
        <div className="h1 countdown-value">{parts.seconds}</div>
        <div className="subtle countdown-label">Seconds</div>
      </div>
    </div>
  );
}

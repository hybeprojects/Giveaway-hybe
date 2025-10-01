import { useEffect, useRef, useState } from 'react';

const BASE_KEY = 'live_entries_base';
const START_KEY = 'live_entries_start';

function getNumberEnv(name: string): number | null {
  try {
    // @ts-ignore
    const v = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name]) || null;
    if (v != null) {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
  } catch {}
  return null;
}

function getDateEnv(name: string): number | null {
  try {
    // @ts-ignore
    const v = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[name]) || null;
    if (v && typeof v === 'string') {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  } catch {}
  return null;
}

function initParams() {
  const envBase = getNumberEnv('VITE_ENTRIES_BASE');
  const envRate = getNumberEnv('VITE_ENTRIES_RATE');
  const envStart = getDateEnv('VITE_ENTRIES_START');

  let base = envBase ?? 120000;
  let rate = envRate ?? 0.15; // entries per second
  let start = envStart ?? Date.now();

  try {
    const lsBase = window.localStorage.getItem(BASE_KEY);
    const lsStart = window.localStorage.getItem(START_KEY);
    if (lsBase != null && Number.isFinite(Number(lsBase))) base = Number(lsBase);
    if (lsStart) {
      const t = Number(lsStart);
      if (Number.isFinite(t)) start = t;
    } else {
      window.localStorage.setItem(START_KEY, String(start));
    }
    if (envBase != null) window.localStorage.setItem(BASE_KEY, String(base));
    if (envStart != null) window.localStorage.setItem(START_KEY, String(start));
  } catch {}

  return { base, rate, start };
}

const params = initParams();
let lastValue = 0;

export function computeLiveEntries(now: number = Date.now()): number {
  const { base, rate, start } = params;
  const elapsed = Math.max(0, (now - start) / 1000);
  const value = Math.floor(base + rate * elapsed);
  if (value < lastValue) return lastValue;
  lastValue = value;
  return value;
}

export function useLiveEntriesCount(): number {
  const [n, setN] = useState<number>(() => computeLiveEntries());
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      setN(computeLiveEntries());
      raf.current = window.setTimeout(tick, 1000) as unknown as number;
    };
    raf.current = window.setTimeout(tick, 1000) as unknown as number;
    return () => { if (raf.current != null) window.clearTimeout(raf.current); };
  }, []);

  return n;
}

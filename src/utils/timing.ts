let cachedDeadline: Date | null = null;
const STORAGE_KEY = 'giveaway_deadline_iso';

function fromEnv(): Date | null {
  try {
    // Vite environment variable support
    // @ts-ignore
    const iso = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GIVEAWAY_DEADLINE;
    if (iso && typeof iso === 'string') {
      const d = new Date(iso);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {}
  try {
    const anyWin = window as any;
    if (anyWin && typeof anyWin.__APP_DEADLINE__ === 'string') {
      const d = new Date(anyWin.__APP_DEADLINE__);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {}
  return null;
}

export function getGiveawayDeadline(): Date {
  if (cachedDeadline) return cachedDeadline;

  const envDate = fromEnv();
  if (envDate) {
    cachedDeadline = envDate;
    return envDate;
  }

  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const d = new Date(stored);
      if (!isNaN(d.getTime())) {
        cachedDeadline = d;
        return d;
      }
    }
  } catch {}

  const d = new Date();
  d.setDate(d.getDate() + 10);
  try { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, d.toISOString()); } catch {}
  cachedDeadline = d;
  return d;
}

export function getGiveawayDeadlineStamp(): number {
  return getGiveawayDeadline().getTime();
}

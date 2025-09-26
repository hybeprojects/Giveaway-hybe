export function getNumber(key: string, fallback = 0): number { const v = localStorage.getItem(key); return v ? Number(v) : fallback; }
export function setNumber(key: string, value: number) { localStorage.setItem(key, String(value)); }
export function getString(key: string, fallback = ''): string { return localStorage.getItem(key) ?? fallback; }
export function setString(key: string, value: string) { localStorage.setItem(key, value); }

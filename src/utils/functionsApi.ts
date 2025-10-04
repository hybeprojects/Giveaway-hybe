export function getFunctionUrl(name: string): string {
  const env = (import.meta as any).env || {};
  const normalized = String(name).trim().replace(/^\/+|\/+$/g, '');
  const key = `VITE_FN_${normalized.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_URL`;
  const specific = env[key];
  if (specific && typeof specific === 'string' && specific.trim()) {
    return specific.trim();
  }
  const base = (env.VITE_FUNCTIONS_BASE_URL as string) || (env.VITE_FUNCTIONS_BASE as string) || '/.netlify/functions';
  const trimmedBase = String(base || '').trim().replace(/\/+$/g, '');
  if (!trimmedBase) return `/.netlify/functions/${normalized}`;
  // If base looks like absolute URL, join with a single slash
  if (/^https?:\/\//i.test(trimmedBase)) {
    return `${trimmedBase}/${normalized}`;
  }
  // Relative base path (e.g. '/.netlify/functions')
  return `${trimmedBase}/${normalized}`;
}

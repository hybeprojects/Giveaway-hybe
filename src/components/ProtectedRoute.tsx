import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

function decodeJwtPayload(t: string | null): any | null {
  if (!t) return null;
  try {
    const parts = t.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('local_session') : null;
  if (!token) return <Navigate to="/login" replace />;

  const payload = decodeJwtPayload(token);
  if (!payload) return <Navigate to="/login" replace />;

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : null;
  if (exp && now >= exp) {
    try { localStorage.removeItem('local_session'); } catch {}
    return <Navigate to="/login" replace />;
  }

  const { userId } = useParams();
  const sub = payload?.sub ? String(payload.sub) : null;
  if (userId && sub && decodeURIComponent(userId) !== sub) {
    return <Navigate to={`/dashboard/${encodeURIComponent(sub)}`} replace />;
  }

  return <>{children}</>;
}

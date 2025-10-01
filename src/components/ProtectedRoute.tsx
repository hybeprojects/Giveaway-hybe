import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('local_session') : null;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

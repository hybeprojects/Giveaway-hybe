import type React from 'react';
import { useEffect, useState } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [enter, setEnter] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setEnter(true)); return () => cancelAnimationFrame(id); }, []);
  return (
    <div className={`route-view${enter ? ' enter' : ''}`}>
      {children}
    </div>
  );
}

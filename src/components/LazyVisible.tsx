import type React from 'react';
import { useEffect, useRef, useState } from 'react';

export default function LazyVisible({ children, rootMargin = '200px 0px', once = true }: { children: React.ReactNode; rootMargin?: string; once?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible && once) return;

    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once && observer) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        });
      }, { root: null, rootMargin, threshold: 0.01 });
      observer.observe(el);
    } catch {
      setVisible(true);
    }

    return () => { if (observer) observer.disconnect(); };
  }, [rootMargin, once, visible]);

  return <div ref={ref}>{visible ? children : null}</div>;
}

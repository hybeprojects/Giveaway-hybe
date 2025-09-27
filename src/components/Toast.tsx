import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type Toast = { id: string; kind: ToastKind; message: string; timeout?: number };

type Ctx = {
  push: (kind: ToastKind, message: string, timeout?: number) => void;
  success: (message: string, timeout?: number) => void;
  error: (message: string, timeout?: number) => void;
  info: (message: string, timeout?: number) => void;
};

const ToastContext = createContext<Ctx | null>(null);

function useId() {
  const c = useRef(0);
  return () => `${Date.now()}_${c.current++}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const nextId = useId();

  const remove = useCallback((id: string) =>
    setItems((arr) => arr.filter((t) => t.id !== id)), []);

  const push = useCallback((kind: ToastKind, message: string, timeout = 4000) => {
    const id = nextId();
    setItems((arr) => [{ id, kind, message, timeout }, ...arr]);
    if (timeout > 0) setTimeout(() => remove(id), timeout);
  }, [nextId, remove]);

  const ctx = useMemo<Ctx>(() => ({
    push,
    success: (m, t) => push('success', m, t),
    error: (m, t) => push('error', m, t),
    info: (m, t) => push('info', m, t)
  }), [push]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {items.map((t) => (
          <div key={t.id} className={`toast-item ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
            <div className="toast-content">
              <span className="toast-dot" aria-hidden />
              <span className="toast-text">{t.message}</span>
              <button className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/hybe-theme.css';
import './styles/global.css';
import './styles/trust.css';
import './styles/countdown.css';
import './styles/responsive.css';

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light' || savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else {
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.setAttribute('data-theme', prefersLight ? 'light' : 'dark');
  // Keep in sync with system if user hasn't chosen explicitly
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  const apply = () => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', mq && mq.matches ? 'light' : 'dark');
    }
  };
  if (mq) {
    // addEventListener is modern; fall back to addListener for older browsers
    // @ts-ignore
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

import { BrowserRouter } from 'react-router-dom';

import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

// Opportunistically preconnect to Supabase if configured
(() => {
  try {
    const env = (import.meta as any).env || {};
    const url: string = env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.SUPABASE_DATABASE_URL || '';
    if (url) {
      const u = new URL(url);
      const mk = (rel: string) => {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = u.origin;
        if (rel === 'preconnect') link.crossOrigin = '';
        document.head.appendChild(link);
      };
      mk('preconnect');
      mk('dns-prefetch');
    }
  } catch {}
})();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

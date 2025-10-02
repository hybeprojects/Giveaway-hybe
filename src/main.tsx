import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/hybe-theme.css';
import './styles/global.css';
import './styles/trust.css';
import './styles/countdown.css';
import './styles/responsive.css';
import './styles/glassmorphic.css';

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

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const getCurrent = () => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'dark';
  const [theme, setTheme] = useState<'light' | 'dark'>(getCurrent());

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(getCurrent()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const onToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <button
      className="button-secondary"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={theme === 'light'}
      onClick={onToggle}
    >
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

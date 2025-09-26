export default function DarkModeToggle() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const alt = theme === 'dark' ? 'light' : 'dark';
  const onToggle = () => {
    document.documentElement.setAttribute('data-theme', alt);
    localStorage.setItem('theme', alt);
  };
  return (
    <button className="button-secondary" aria-label="Toggle theme" onClick={onToggle}>
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

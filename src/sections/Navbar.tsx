import DarkModeToggle from '../components/DarkModeToggle';

export default function Navbar() {
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <header className="sticky-nav">
      <div className="container navbar">
        <div className="brand-row">
          <img src="/icons/icon.svg" width="28" height="28" alt="HYBE"/>
          <strong>HYBE Giveaway</strong>
        </div>
        <nav className="nav-links">
          <button className="nav-link" onClick={() => go('prizes')}>Prizes</button>
          <button className="nav-link" onClick={() => go('vip')}>VIP</button>
          <button className="nav-link" onClick={() => go('enter')}>Enter</button>
          <button className="nav-link" onClick={() => go('updates')}>Updates</button>
          <a className="nav-link" href="/dashboard">Dashboard</a>
          <DarkModeToggle />
        </nav>
      </div>
    </header>
  );
}

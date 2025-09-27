export default function Navbar() {
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <header className="sticky-nav">
      <div className="container navbar">
        <div className="brand-row">
          <img src="/hybe-logo.svg" width="80" alt="HYBE" />
        </div>
        <nav className="nav-links">
          <button className="nav-button" onClick={() => go('prizes')}>Prizes</button>
          <button className="nav-button" onClick={() => go('vip')}>VIP Experience</button>
          <button className="nav-button" onClick={() => go('enter')}>Enter Now</button>
          <button className="nav-button" onClick={() => go('updates')}>Live Updates</button>
          <a className="nav-button" href="/dashboard">Dashboard</a>
        </nav>
      </div>
    </header>
  );
}

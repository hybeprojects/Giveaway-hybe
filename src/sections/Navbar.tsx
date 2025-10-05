import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScroll = (id: string) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const path = location.pathname;

  return (
    <header className={`sticky-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container navbar">
        <div className="brand-row">
          <img src="/hybe-logo.svg" width="80" alt="HYBE" decoding="async" />
        </div>
        <button className="hamburger-menu" aria-label="Toggle menu" aria-expanded={isMenuOpen} onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </button>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <button className="nav-button" onClick={() => handleScroll('prizes')}>Prizes</button>
          <button className="nav-button" onClick={() => handleScroll('vip')}>VIP Experience</button>
          <Link className={`nav-button${path === '/giveaway' ? ' active' : ''}`} to="/giveaway" onClick={() => setIsMenuOpen(false)}>Details</Link>
          <Link className={`nav-button${path === '/rules' ? ' active' : ''}`} to="/rules" onClick={() => setIsMenuOpen(false)}>Rules</Link>
          <button className="nav-button" onClick={() => handleScroll('enter')}>Enter Now</button>
          <Link className={`nav-button${path === '/entry' ? ' active' : ''}`} to="/entry" onClick={() => setIsMenuOpen(false)}>Entry Form</Link>
          <button className="nav-button" onClick={() => handleScroll('updates')}>Live Updates</button>
        </nav>
      </div>
    </header>
  );
}

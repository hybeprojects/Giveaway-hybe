import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <header className="sticky-nav">
      <div className="container navbar">
        <div className="brand-row">
          <img src="/hybe-logo.svg" width="80" alt="HYBE" decoding="async" />
        </div>
        <div className="hamburger-menu" onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <button className="nav-button" onClick={() => handleScroll('prizes')}>Prizes</button>
          <button className="nav-button" onClick={() => handleScroll('vip')}>VIP Experience</button>
          <button className="nav-button" onClick={() => handleScroll('enter')}>Enter Now</button>
          <Link className="nav-button" to="/entry" onClick={() => setIsMenuOpen(false)}>Entry Form</Link>
          <button className="nav-button" onClick={() => handleScroll('updates')}>Live Updates</button>
        </nav>
      </div>
    </header>
  );
}

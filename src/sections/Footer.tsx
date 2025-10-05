import { FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer-section" aria-label="Footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <img className="footer-logo" src="/hybe-logo.svg" width="100" alt="HYBE" loading="lazy" decoding="async" />
            <p className="copyright">© HYBE Corporation. All Rights Reserved.</p>
          </div>
          <div className="footer-links">
            <nav className="footer-nav">
              <Link className="footer-link" to="/giveaway">Giveaway Details</Link>
              <Link className="footer-link" to="/rules">Rules</Link>
              <a className="footer-link" href="https://www.hybecorp.com" target="_blank" rel="noopener noreferrer">HYBE Official</a>
              <a className="footer-link" href="https://weverse.io/" target="_blank" rel="noopener noreferrer">Weverse</a>
              <a className="footer-link" href="https://www.youtube.com/@HYBEOFFICIAL" target="_blank" rel="noopener noreferrer">YouTube</a>
            </nav>
            <div className="social-links">
              <a href="https://twitter.com/HYBEOFFICIALtwt" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-icon"><FaTwitter /></a>
              <a href="https://www.instagram.com/hybe_official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-icon"><FaInstagram /></a>
              <a href="https://www.facebook.com/HYBEOFFICIALfb" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-icon"><FaFacebook /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

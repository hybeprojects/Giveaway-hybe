import { FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer-section" aria-label="Footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/hybe-logo.svg" width="100" alt="HYBE" />
            <p className="copyright">© HYBE Corporation. All Rights Reserved.</p>
          </div>
          <div className="footer-links">
            <nav className="footer-nav">
              <a className="footer-link" href="#">Terms of Service</a>
              <a className="footer-link" href="#">Privacy Policy</a>
              <a className="footer-link" href="#">Contact Us</a>
            </nav>
            <div className="social-links">
              <a href="#" aria-label="Twitter" className="social-icon"><FaTwitter /></a>
              <a href="#" aria-label="Instagram" className="social-icon"><FaInstagram /></a>
              <a href="#" aria-label="Facebook" className="social-icon"><FaFacebook /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Footer() {
  return (
    <footer className="section footer" aria-label="Footer">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icons/icon.svg" width="24" height="24" alt="HYBE"/>
            <span>© HYBE Corp</span>
          </div>
          <nav className="button-row">
            <a className="nav-link" href="#">Terms & Conditions</a>
            <a className="nav-link" href="#">Privacy Policy</a>
            <a className="nav-link" href="#">Contact Support</a>
            <a className="nav-link" href="#">Press Inquiries</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

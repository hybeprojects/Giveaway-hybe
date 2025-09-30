import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Entry from './Entry';

export default function EnterPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setLoading(false), 700); return () => clearTimeout(id); }, []);

  return (
    <>
      <Navbar />
      {loading ? (
        <div className="loading-overlay" role="status" aria-live="polite" aria-label="Loading entry form">
          <div className="spinner-ring" />
          <div className="loading-text">Preparing your entry…</div>
        </div>
      ) : (
        <Entry />
      )}
      <Footer />
    </>
  );
}

import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Prizes from './sections/Prizes';
import VIPExperience from './sections/VIPExperience';
import Entry from './sections/Entry';
import Trust from './sections/Trust';
import LiveUpdates from './sections/LiveUpdates';
import Footer from './sections/Footer';
import Login from './sections/Login';
import Dashboard from './sections/Dashboard';
import PageTransition from './components/PageTransition';
import OnboardingModal from './components/OnboardingModal';
import EntryFormPage from './pages/EntryFormPage';

function Landing() {
  const [showOnboard, setShowOnboard] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const { state } = location;
    if (state?.scrollTo) {
      const el = document.getElementById(state.scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location]);

  return (
    <>
      <OnboardingModal isOpen={showOnboard} onClose={() => setShowOnboard(false)} />
      <Navbar />
      <Hero />
      <Prizes />
      <VIPExperience />
      <Entry />
      <Trust />
      <LiveUpdates />
      <Footer />
    </>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <Routes location={location}>
      <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
      <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
      <Route path="/entry" element={<PageTransition><EntryFormPage /></PageTransition>} />
      <Route path="*" element={<PageTransition><Landing /></PageTransition>} />
    </Routes>
  );
}

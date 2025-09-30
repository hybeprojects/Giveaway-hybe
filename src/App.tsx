import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import EnterPage from './sections/EnterPage';
import OnboardingModal from './components/OnboardingModal';

function Landing() {
  const [open, setOpen] = useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setOpen(true), 50);
    return () => clearTimeout(id);
  }, []);
  return (
    <>
      <OnboardingModal isOpen={open} onClose={() => setOpen(false)} />
      <Navbar />
      <Hero />
      <Prizes />
      <VIPExperience />
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
      <Route path="/enter" element={<PageTransition><EnterPage /></PageTransition>} />
      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
      <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
      <Route path="*" element={<PageTransition><Landing /></PageTransition>} />
    </Routes>
  );
}

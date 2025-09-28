import { Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
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
import SmtpTest from './sections/SmtpTest';
import PageTransition from './components/PageTransition';
import OnboardingModal from './components/OnboardingModal';

function Landing() {
  const [isModalOpen, setModalOpen] = useState(true);
  
  
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <OnboardingModal isOpen={isModalOpen} onClose={handleCloseModal} />
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
      <Route path="/smtp-test" element={<PageTransition><SmtpTest /></PageTransition>} />
      <Route path="*" element={<PageTransition><Landing /></PageTransition>} />
    </Routes>
  );
}
